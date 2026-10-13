import { query } from "./db";
import { drawQuestions, getQuestion, stageRegex, toPublic, type DrawFilter, type Stage } from "./questions";
import {
  correctUnits,
  durationMinutes,
  MAX_POINTS_PER_QUESTION,
  scoreAnswer,
  BLOCK_SIZES,
  DEFAULT_BLOCK_SIZE,
  UNITS_PER_QUESTION,
  validateSelection,
  type TestSize,
} from "./scoring";
import type { AnswerFeedback, Bank, QuestionType, TestMode, TestState } from "./types";
import { ensureRescored } from "./rescore";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface TestRow {
  id: string;
  bank: Bank;
  type: QuestionType;
  mode: TestMode;
  question_ids: string[];
  started_at: Date;
  deadline: Date | null;
  finished_at: Date | null;
  score: number;
  max_score: number;
  /** Test „bez limitu”: filtr losowania kolejnych porcji pytań. */
  draw: DrawFilter | null;
}

interface AnswerRow {
  question_id: string;
  selected: number[];
  points: number;
  skipped: boolean;
}

/** Test „bez limitu”: ile pytań losujemy naraz (cała pula to ponad 1000 id – ok. 17 KB na wiersz testu). */
const ENDLESS_CHUNK = 100;

/** Pozwala na drobne opóźnienie sieci przy odpowiedzi wysłanej tuż przed końcem czasu. */
const GRACE_MS = 5_000;

export async function createTest(
  userId: string,
  type: QuestionType,
  count: TestSize | "endless",
  bank: Bank = "owe",
  filter: DrawFilter = {},
): Promise<TestState> {
  const endless = count === "endless";
  // „bez limitu”: zapisujemy porcję wylosowanych pytań (+ filtr), kolejne porcje dolosowuje answerQuestion
  const drawn = drawQuestions(type, endless ? ENDLESS_CHUNK : count, bank, filter);
  if (drawn.length === 0) throw new HttpError(400, "Brak pytań tego typu w bazie.");
  // filtr losowania zapamiętany przy teście (bez limitu – do dolosowania; etap – do historii)
  const draw = JSON.stringify({ origin: filter.origin ?? null, section: filter.section ?? null, stage: filter.stage ?? null });
  const { rows } = endless
    ? await query<TestRow>(
        `INSERT INTO tests (bank, type, mode, question_ids, deadline, max_score, user_id, draw)
         VALUES ($1, $2, 'endless', $3, NULL, 0, $4, $5) RETURNING *`,
        [bank, type, drawn.map((q) => q.id), userId, draw],
      )
    : await query<TestRow>(
        `INSERT INTO tests (bank, type, question_ids, deadline, max_score, user_id, draw)
         VALUES ($1, $2, $3, now() + make_interval(mins => $4), $5, $6, $7)
         RETURNING *`,
        [bank, type, drawn.map((q) => q.id), durationMinutes(count), drawn.length * MAX_POINTS_PER_QUESTION, userId, draw],
      );
  return toState(rows[0], []);
}

/** `userId` – właściciel testu; null tylko przy podglądzie przez admina (dowolny test). */
async function loadTest(id: string, userId: string | null): Promise<TestRow> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Nie znaleziono testu.");
  const { rows } = await query<TestRow>("SELECT * FROM tests WHERE id = $1 AND ($2::uuid IS NULL OR user_id = $2)", [id, userId]);
  if (!rows[0]) throw new HttpError(404, "Nie znaleziono testu.");
  return rows[0];
}

async function loadAnswers(id: string): Promise<AnswerRow[]> {
  await ensureRescored();
  const { rows } = await query<AnswerRow>(
    "SELECT question_id, selected, points, skipped FROM answers WHERE test_id = $1 ORDER BY answered_at",
    [id],
  );
  return rows;
}

function feedback(a: AnswerRow): AnswerFeedback {
  const q = getQuestion(a.question_id);
  return {
    questionId: a.question_id,
    selected: a.selected,
    correct: q?.correct ?? [],
    points: a.points,
    explanation: q?.explanation ?? "",
    skipped: a.skipped,
  };
}

function toState(t: TestRow, answers: AnswerRow[]): TestState {
  const endless = t.mode === "endless";
  // W trybie „bez limitu” wysyłamy tylko pytania już odpowiedziane i bieżące, nie całą pulę.
  const visibleIds = endless
    ? t.question_ids.slice(0, answers.length + (t.finished_at ? 0 : 1))
    : t.question_ids;
  const solutions = t.finished_at
    ? Object.fromEntries(visibleIds.map((qid) => [qid, getQuestion(qid)?.correct ?? []]))
    : null;
  return {
    id: t.id,
    bank: t.bank,
    type: t.type,
    mode: t.mode,
    questions: visibleIds.map(getQuestion).filter((q) => q !== undefined).map(toPublic),
    answers: answers.map(feedback),
    startedAt: t.started_at.toISOString(),
    deadline: t.deadline ? t.deadline.toISOString() : null,
    finishedAt: t.finished_at ? t.finished_at.toISOString() : null,
    score: answers.reduce((s, a) => s + a.points, 0),
    maxScore: endless ? answers.length * MAX_POINTS_PER_QUESTION : t.max_score,
    correct: answers.reduce((s, a) => s + correctUnits(t.type, a.points, a.skipped), 0),
    total: (endless ? answers.length : t.question_ids.length) * UNITS_PER_QUESTION[t.type],
    solutions,
  };
}

const expired = (t: TestRow) => t.deadline !== null && t.deadline.getTime() <= Date.now();

export async function getTest(id: string, viewer: { id: string; isAdmin: boolean }): Promise<TestState> {
  let t = await loadTest(id, viewer.isAdmin ? null : viewer.id);
  if (!t.finished_at && expired(t)) t = await finishRow(id);
  return toState(t, await loadAnswers(id));
}

export async function answerQuestion(userId: string, id: string, questionId: unknown, selected: unknown, skip: unknown = false) {
  const t = await loadTest(id, userId);
  const endless = t.mode === "endless";
  if (t.finished_at) throw new HttpError(409, "Test został już zakończony.");
  if (t.deadline && t.deadline.getTime() + GRACE_MS < Date.now()) {
    await finishRow(id);
    throw new HttpError(409, "Czas na test minął.");
  }
  if (typeof questionId !== "string" || !t.question_ids.includes(questionId)) {
    throw new HttpError(400, "To pytanie nie należy do testu.");
  }
  const q = getQuestion(questionId);
  if (!q) throw new HttpError(400, "Nieznane pytanie.");
  const skipped = skip === true;
  if (skipped && !endless) throw new HttpError(400, "Pomijanie z zapisem działa tylko w trybie bez limitu.");
  if (endless) {
    const { rows } = await query<{ n: string }>("SELECT COUNT(*) AS n FROM answers WHERE test_id = $1", [id]);
    if (t.question_ids[Number(rows[0].n)] !== questionId) {
      throw new HttpError(409, "W trybie bez limitu nie można wracać ani przeskakiwać pytań.");
    }
  }
  if (!skipped) {
    const err = validateSelection(q.type, selected);
    if (err) throw new HttpError(400, err);
  }

  const sel = skipped ? [] : [...(selected as number[])].sort((a, b) => a - b);
  const points = skipped ? 0 : scoreAnswer(q.type, sel, q.correct);
  const inserted = await query(
    `INSERT INTO answers (test_id, question_id, selected, points, skipped)
     VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
    [id, questionId, sel, points, skipped],
  );
  if (inserted.rowCount === 0) throw new HttpError(409, "Na to pytanie już odpowiedziano.");

  const answers = await loadAnswers(id);
  const totalScore = answers.reduce((s, a) => s + a.points, 0);
  if (endless) {
    // Wynik testu bez limitu liczy się do statystyk na bieżąco – tylko z odpowiedzianych/pominiętych pytań.
    await query("UPDATE tests SET score = $2, max_score = $3 WHERE id = $1", [
      id,
      totalScore,
      answers.length * MAX_POINTS_PER_QUESTION,
    ]);
  }
  if (endless && answers.length >= t.question_ids.length) {
    // porcja się skończyła – dolosuj kolejne pytania z puli (bez już użytych); pusta pula kończy test
    const used = new Set(t.question_ids);
    const f = t.draw ?? {};
    const more = drawQuestions(t.type, Infinity, t.bank, f).filter((x) => !used.has(x.id)).slice(0, ENDLESS_CHUNK).map((x) => x.id);
    if (more.length) {
      await query("UPDATE tests SET question_ids = question_ids || $2::text[] WHERE id = $1", [id, more]);
      t.question_ids = [...t.question_ids, ...more];
    }
  }
  if (answers.length >= t.question_ids.length) await finishRow(id);
  const next = endless ? getQuestion(t.question_ids[answers.length] ?? "") : undefined;
  return {
    ...feedback({ question_id: questionId, selected: sel, points, skipped }),
    totalScore,
    nextQuestion: next ? toPublic(next) : null,
  };
}

async function finishRow(id: string): Promise<TestRow> {
  const { rows } = await query<TestRow>(
    `UPDATE tests SET
       finished_at = COALESCE(finished_at, LEAST(now(), COALESCE(deadline + interval '5 seconds', now()))),
       score = (SELECT COALESCE(SUM(points), 0) FROM answers WHERE test_id = $1)
     WHERE id = $1 RETURNING *`,
    [id],
  );
  return rows[0];
}

export async function finishTest(userId: string, id: string): Promise<TestState> {
  await loadTest(id, userId);
  const t = await finishRow(id);
  return toState(t, await loadAnswers(id));
}

interface StatsTotals {
  score: number;
  maxScore: number;
  /** Poprawne jednostki / wszystkie jednostki (pytania w jednokrotnym, punkty w wielokrotnym – maks. 2 na pytanie). */
  correct: number;
  total: number;
  percent: number;
  tests: number;
}

export interface Stats {
  overall: StatsTotals;
  byType: Record<QuestionType, StatsTotals>;
  /** Pytania OWE jednokrotnego wyboru osobno dla etapu szkolnego i okręgowego (z id pytań, także z testów „oba etapy”). */
  byStage: Record<Stage, StatsTotals>;
  /** Etap, do którego zawężono historię i wykres (null – oba). */
  stage: Stage | null;
  history: {
    id: string;
    type: QuestionType;
    mode: TestMode;
    /** Etap wybrany przy losowaniu testu (null – oba albo test sprzed tej opcji). */
    drawStage: Stage | null;
    finishedAt: string;
    score: number;
    maxScore: number;
    correct: number;
    total: number;
    percent: number;
  }[];
  /** Dokładność w kolejnych blokach po `blockSize` odpowiedzianych pytań (ostatni blok może być niepełny). */
  blockSize: number;
  blocks: { questions: number; percent: number }[];
}

/** Testy liczone do statystyk: zakończone oraz rozpoczęte testy bez limitu z co najmniej jedną odpowiedzią. */
const COUNTED = "(t.finished_at IS NOT NULL OR (t.mode = 'endless' AND t.max_score > 0))";

const emptyTotals = (): StatsTotals => ({ score: 0, maxScore: 0, correct: 0, total: 0, percent: 0, tests: 0 });
const pct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 1000) / 10 : 0);

/**
 * @param bank – statystyki liczone osobno dla pytań olimpijskich i słownikowych.
 * @param typeFilter – gdy podany, historia testów i wykres dokładności obejmują tylko pytania tego typu
 *   (podsumowania `overall`/`byType` są zawsze liczone dla obu typów).
 */
export async function getStats(
  userId: string,
  requestedBlockSize: number = DEFAULT_BLOCK_SIZE,
  typeFilter: QuestionType | null = null,
  bank: Bank = "owe",
  stageFilter: Stage | null = null,
): Promise<Stats> {
  // etap ma sens tylko dla pytań OWE jednokrotnego wyboru
  const stage = bank === "owe" && typeFilter === "single" ? stageFilter : null;
  await ensureRescored();
  const blockSize = (BLOCK_SIZES as readonly number[]).includes(requestedBlockSize) ? requestedBlockSize : DEFAULT_BLOCK_SIZE;
  // Domknij testy, którym minął czas (np. ktoś zamknął kartę).
  await query(
    `UPDATE tests t SET finished_at = t.deadline,
       score = (SELECT COALESCE(SUM(points), 0) FROM answers a WHERE a.test_id = t.id)
     WHERE finished_at IS NULL AND deadline < now() - interval '5 seconds'`,
  );
  // Dla każdego liczonego testu: poprawne jednostki i liczba wszystkich jednostek (test 30/50 – całe pytania testu,
  // bez limitu – tylko sprawdzone i pominięte).
  // `st` – tylko pytania danego etapu w każdym teście (jednokrotny wybór; nieodpowiedziane w teście 30/50 liczą się jako błędne).
  // Wzorzec etapu pochodzi z zamkniętej listy (stageRegex), więc może trafić wprost do SQL.
  const perTest = (u: number, st: Stage | null = null) => {
    const re = st ? `'${stageRegex(st)}'` : "";
    const total = st
      ? `(CASE WHEN t.mode = 'endless' THEN COUNT(a.question_id) ELSE cardinality(ARRAY(SELECT x FROM unnest(t.question_ids) x WHERE x ~ ${re})) END)`
      : `(CASE WHEN t.mode = 'endless' THEN COUNT(a.question_id) ELSE cardinality(t.question_ids) END)
        * (CASE WHEN t.type = 'single' THEN 1 ELSE 2 END)`;
    return `
    SELECT t.id, t.type, t.mode, t.draw->>'stage' AS draw_stage, COALESCE(t.finished_at, t.started_at) AS at,
      ${st ? "COALESCE(SUM(a.points), 0)" : "t.score"} AS score, ${st ? `2 * ${total}` : "t.max_score"} AS max_score,
      COALESCE(SUM(CASE WHEN a.skipped THEN 0 WHEN t.type = 'single' THEN (a.points = 2)::int ELSE a.points END), 0)
        AS correct,
      ${total} AS total
    FROM tests t LEFT JOIN answers a ON a.test_id = t.id${st ? ` AND a.question_id ~ ${re}` : ""}
    WHERE ${COUNTED} AND t.bank = $1 AND t.user_id = $${u}${st ? " AND t.type = 'single'" : ""}
    GROUP BY t.id`;
  };
  type PerTest = { id: string; type: QuestionType; mode: TestMode; draw_stage: string | null; score: number; max_score: number; at: Date; correct: number; total: string };
  const { rows: agg } = await query<{ type: QuestionType; score: number; max_score: number; correct: number; total: string; tests: string }>(
    `SELECT type, SUM(score) AS score, SUM(max_score) AS max_score, SUM(correct) AS correct, SUM(total) AS total,
       COUNT(*) AS tests
     FROM (${perTest(2)}) p GROUP BY type`,
    [bank, userId],
  );
  const { rows: hist } = await query<PerTest>(
    `SELECT * FROM (SELECT * FROM (${perTest(3, stage)}) p WHERE ($2::text IS NULL OR type = $2)${stage ? " AND total > 0" : ""}
     ORDER BY at DESC LIMIT 100) h ORDER BY at ASC`,
    [bank, typeFilter, userId],
  );
  const byStage = { s: emptyTotals(), o: emptyTotals() };
  if (bank === "owe") {
    for (const st of ["s", "o"] as const) {
      const { rows } = await query<{ score: number | null; max_score: number | null; correct: string | null; total: string | null; tests: string }>(
        `SELECT SUM(score) AS score, SUM(max_score) AS max_score, SUM(correct) AS correct, SUM(total) AS total, COUNT(*) AS tests
         FROM (${perTest(2, st)}) p WHERE total > 0`,
        [bank, userId],
      );
      const r = rows[0], correct = Number(r?.correct ?? 0), total = Number(r?.total ?? 0);
      byStage[st] = { score: Number(r?.score ?? 0), maxScore: Number(r?.max_score ?? 0), correct, total, percent: pct(correct, total), tests: Number(r?.tests ?? 0) };
    }
  }

  // Każde sprawdzone/pominięte pytanie ma dokładność 0–1 (w wielokrotnym: punkty / 2), kolejność wg czasu odpowiedzi.
  const { rows: blockRows } = await query<{ questions: string; accuracy: number }>(
    `WITH q AS (
       SELECT CASE WHEN a.skipped THEN 0
                   WHEN t.type = 'single' THEN (a.points = 2)::int
                   ELSE a.points / 2 END AS accuracy,
              row_number() OVER (ORDER BY a.answered_at, a.test_id, a.question_id) - 1 AS rn
       FROM answers a JOIN tests t ON t.id = a.test_id
       WHERE t.bank = $2 AND ($1::text IS NULL OR t.type = $1) AND t.user_id = $3${stage ? ` AND a.question_id ~ '${stageRegex(stage)}'` : ""}
     )
     SELECT * FROM (
       SELECT rn / ${blockSize} AS block, COUNT(*) AS questions, AVG(accuracy) AS accuracy
       FROM q GROUP BY 1 ORDER BY 1 DESC LIMIT 100
     ) b ORDER BY block ASC`,
    [typeFilter, bank, userId],
  );

  const byType = { single: emptyTotals(), multi: emptyTotals() };
  for (const r of agg) {
    const correct = Number(r.correct), total = Number(r.total);
    byType[r.type] = {
      score: r.score,
      maxScore: r.max_score,
      correct,
      total,
      percent: pct(correct, total),
      tests: Number(r.tests),
    };
  }
  const sum = (k: "score" | "maxScore" | "correct" | "total" | "tests") => byType.single[k] + byType.multi[k];
  return {
    overall: {
      score: sum("score"),
      maxScore: sum("maxScore"),
      correct: sum("correct"),
      total: sum("total"),
      percent: pct(sum("correct"), sum("total")),
      tests: sum("tests"),
    },
    byType,
    byStage,
    stage,
    history: hist.map((t) => ({
      id: t.id,
      type: t.type,
      mode: t.mode,
      drawStage: t.draw_stage === "s" || t.draw_stage === "o" ? t.draw_stage : null,
      finishedAt: t.at.toISOString(),
      score: t.score,
      maxScore: t.max_score,
      correct: Number(t.correct),
      total: Number(t.total),
      percent: pct(Number(t.correct), Number(t.total)),
    })),
    blockSize,
    blocks: blockRows.map((b) => ({ questions: Number(b.questions), percent: Math.round(b.accuracy * 1000) / 10 })),
  };
}
