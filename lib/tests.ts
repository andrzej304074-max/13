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
import { sourceCaseSql, sourceWhereSql, type QSource } from "./question-source";

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
  const draw = JSON.stringify({ origin: filter.origin ?? null, section: filter.section ?? null, stage: filter.stage ?? null,
    sources: filter.sources ?? null, edFrom: filter.edFrom ?? null, edTo: filter.edTo ?? null, stages: filter.stages ?? null,
    topic: filter.topic ?? null, kind: filter.kind ?? null, theme: filter.theme ?? null });
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

/**
 * Odpowiedź na pytanie. Szybka ścieżka: test i (opcjonalnie) `guard` – np. limit pobrań – równolegle, potem zapis odpowiedzi,
 * kontrola kolejności (bez limitu), suma punktów i wynik testu w jednym zapytaniu (dawniej 5–6 podróży do bazy po kolei).
 * Puste zaznaczenie = odpowiedź za 0 pkt (pokazujemy poprawną); „Pomiń” z zapisem – tylko bez limitu.
 */
export async function answerQuestion(userId: string, id: string, questionId: unknown, selected: unknown, skip: unknown = false, guard?: Promise<unknown>) {
  const [t] = await Promise.all([loadTest(id, userId), ensureRescored(), guard]);
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
  if (!skipped) {
    const err = validateSelection(q.type, selected);
    if (err) throw new HttpError(400, err);
  }

  const sel = skipped ? [] : [...(selected as number[])].sort((a, b) => a - b);
  // bez zaznaczenia – 0 pkt (w wielokrotnym puste pola mogłyby inaczej dać punkt za „trafnie niezaznaczone”)
  const points = skipped || sel.length === 0 ? 0 : scoreAnswer(q.type, sel, q.correct);
  // bez limitu: pytanie musi być kolejne w teście (nie można wracać ani przeskakiwać)
  const pos = endless ? t.question_ids.indexOf(questionId) : -1;
  const { rows } = await query<{ ins: string; n: string; s: number }>(
    `WITH prev AS (SELECT COUNT(*) AS n, COALESCE(SUM(points), 0) AS s FROM answers WHERE test_id = $1),
          ins AS (INSERT INTO answers (test_id, question_id, selected, points, skipped)
                  SELECT $1, $2, $3, $4, $5 FROM prev WHERE $6::int < 0 OR prev.n = $6
                  ON CONFLICT DO NOTHING RETURNING points),
          upd AS (UPDATE tests SET score = (SELECT s FROM prev) + $4, max_score = ((SELECT n FROM prev) + 1) * $8
                  WHERE id = $1 AND $7 AND EXISTS (SELECT 1 FROM ins) RETURNING 1)
     SELECT (SELECT COUNT(*) FROM ins) AS ins, prev.n, prev.s FROM prev`,
    [id, questionId, sel, points, skipped, pos, endless, MAX_POINTS_PER_QUESTION],
  );
  const r = rows[0];
  if (Number(r.ins) === 0) {
    if (endless && Number(r.n) !== pos) throw new HttpError(409, "W trybie bez limitu nie można wracać ani przeskakiwać pytań.");
    throw new HttpError(409, "Na to pytanie już odpowiedziano.");
  }
  let answered = Number(r.n) + 1;
  // test 30/50: `prev` to stan sprzed zapisu – przy równoczesnym zapisie ostatnich odpowiedzi (dwie karty, ponowienie po błędzie
  // sieci) oba żądania widziałyby „jeszcze nie wszystkie”. Pod koniec testu liczymy więc odpowiedzi po zapisie
  // (bez limitu kolejność wymusza zapis po jednym, więc tam to niepotrzebne).
  if (!endless && answered < t.question_ids.length && answered >= t.question_ids.length - 3) {
    const { rows: c } = await query<{ n: string }>("SELECT COUNT(*) AS n FROM answers WHERE test_id = $1", [id]);
    answered = Math.max(answered, Number(c[0].n));
  }
  const totalScore = Number(r.s) + points;
  if (endless && answered >= t.question_ids.length) {
    // porcja się skończyła – dolosuj kolejne pytania z puli (bez już użytych); pusta pula kończy test
    const used = new Set(t.question_ids);
    const f = t.draw ?? {};
    const more = drawQuestions(t.type, Infinity, t.bank, f).filter((x) => !used.has(x.id)).slice(0, ENDLESS_CHUNK).map((x) => x.id);
    if (more.length) {
      await query("UPDATE tests SET question_ids = question_ids || $2::text[] WHERE id = $1", [id, more]);
      t.question_ids = [...t.question_ids, ...more];
    }
  }
  if (answered >= t.question_ids.length) await finishRow(id);
  const next = endless ? getQuestion(t.question_ids[answered] ?? "") : undefined;
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
  /**
   * Skuteczność według źródła pytania (Archiwum OWE, Pytania AI, Słownik) – ze wszystkich testów użytkownika,
   * także z zakładki „Wszystkie pytania”; liczone ze sprawdzonych i pominiętych pytań (dokładność 0–1 na pytanie).
   */
  bySource: Record<QSourceKey, SourceTotals>;
  /** Dokładność w kolejnych blokach po `blockSize` odpowiedzianych pytań (ostatni blok może być niepełny). */
  blockSize: number;
  blocks: { questions: number; percent: number }[];
}

export type QSourceKey = QSource;
export interface SourceTotals { answers: number; percent: number; byType: Record<QuestionType, { answers: number; percent: number }> }
const emptySource = (): SourceTotals => ({ answers: 0, percent: 0, byType: { single: { answers: 0, percent: 0 }, multi: { answers: 0, percent: 0 } } });

/** Testy liczone do statystyk: zakończone oraz rozpoczęte testy bez limitu z co najmniej jedną odpowiedzią. */
const COUNTED = "(t.finished_at IS NOT NULL OR (t.mode = 'endless' AND t.max_score > 0))";

const emptyTotals = (): StatsTotals => ({ score: 0, maxScore: 0, correct: 0, total: 0, percent: 0, tests: 0 });
const pct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 1000) / 10 : 0);

/**
 * @param bank – zakładka testów: Olimpiada (owe), Słownik, „Wszystkie pytania” (mix); „ai” – testy z zakładki
 *   „Wszystkie pytania” złożone wyłącznie z Pytań AI (zapisywane jako mix), mix – pozostałe testy tej zakładki.
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
  const dbBank = bank === "ai" ? "mix" : bank;
  const onlyAi = `(SELECT 1 FROM unnest(t.question_ids) x WHERE NOT (${sourceWhereSql("x", "ai")}))`;
  const bankSql = (n: number) => `t.bank = $${n}${bank === "ai" ? ` AND NOT EXISTS ${onlyAi}` : bank === "mix" ? ` AND EXISTS ${onlyAi}` : ""}`;
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
    WHERE ${COUNTED} AND ${bankSql(1)} AND t.user_id = $${u}${st ? " AND t.type = 'single'" : ""}
    GROUP BY t.id`;
  };
  type PerTest = { id: string; type: QuestionType; mode: TestMode; draw_stage: string | null; score: number; max_score: number; at: Date; correct: number; total: string };
  type StageRow = { score: number | null; max_score: number | null; correct: string | null; total: string | null; tests: string };
  const stageQuery = (st: Stage) => query<StageRow>(
    `SELECT SUM(score) AS score, SUM(max_score) AS max_score, SUM(correct) AS correct, SUM(total) AS total, COUNT(*) AS tests
     FROM (${perTest(2, st)}) p WHERE total > 0`,
    [dbBank, userId],
  );
  // niezależne zapytania równolegle – jedna tura do bazy zamiast pięciu
  const [{ rows: agg }, { rows: hist }, stageRows, { rows: blockRows }, { rows: srcRows }] = await Promise.all([
    query<{ type: QuestionType; score: number; max_score: number; correct: number; total: string; tests: string }>(
      `SELECT type, SUM(score) AS score, SUM(max_score) AS max_score, SUM(correct) AS correct, SUM(total) AS total,
         COUNT(*) AS tests
       FROM (${perTest(2)}) p GROUP BY type`,
      [dbBank, userId],
    ),
    query<PerTest>(
      `SELECT * FROM (SELECT * FROM (${perTest(3, stage)}) p WHERE ($2::text IS NULL OR type = $2)${stage ? " AND total > 0" : ""}
       ORDER BY at DESC LIMIT 100) h ORDER BY at ASC`,
      [dbBank, typeFilter, userId],
    ),
    bank === "owe" ? Promise.all((["s", "o"] as const).map(stageQuery)) : Promise.resolve(null),
    // Każde sprawdzone/pominięte pytanie ma dokładność 0–1 (w wielokrotnym: punkty / 2), kolejność wg czasu odpowiedzi.
    query<{ questions: string; accuracy: number }>(
      `WITH q AS (
         SELECT CASE WHEN a.skipped THEN 0
                     WHEN t.type = 'single' THEN (a.points = 2)::int
                     ELSE a.points / 2 END AS accuracy,
                row_number() OVER (ORDER BY a.answered_at, a.test_id, a.question_id) - 1 AS rn
         FROM answers a JOIN tests t ON t.id = a.test_id
         WHERE ${bankSql(2)} AND ($1::text IS NULL OR t.type = $1) AND t.user_id = $3${stage ? ` AND a.question_id ~ '${stageRegex(stage)}'` : ""}
       )
       SELECT * FROM (
         SELECT rn / ${blockSize} AS block, COUNT(*) AS questions, AVG(accuracy) AS accuracy
         FROM q GROUP BY 1 ORDER BY 1 DESC LIMIT 100
       ) b ORDER BY block ASC`,
      [typeFilter, dbBank, userId],
    ),
    // źródło pytania z prefiksu id (sl- – Słownik, ai- – Pytania AI, reszta – Archiwum OWE), niezależnie od banku testu
    query<{ src: QSourceKey; type: QuestionType; n: string; acc: number }>(
      `SELECT ${sourceCaseSql("a.question_id")} AS src,
         t.type, COUNT(*) AS n,
         AVG(CASE WHEN a.skipped THEN 0 WHEN t.type = 'single' THEN (a.points = 2)::int ELSE a.points / 2 END) AS acc
       FROM answers a JOIN tests t ON t.id = a.test_id
       WHERE t.user_id = $1 GROUP BY 1, 2`,
      [userId],
    ),
  ]);
  const bySource: Record<QSourceKey, SourceTotals> = { owe: emptySource(), ai: emptySource(), slownik: emptySource() };
  for (const r of srcRows) {
    const s = bySource[r.src];
    if (!s) continue;
    const n = Number(r.n), acc = Number(r.acc);
    s.byType[r.type] = { answers: n, percent: Math.round(acc * 1000) / 10 };
  }
  for (const s of Object.values(bySource)) {
    const n = s.byType.single.answers + s.byType.multi.answers;
    s.answers = n;
    s.percent = n ? Math.round(((s.byType.single.percent * s.byType.single.answers + s.byType.multi.percent * s.byType.multi.answers) / n) * 10) / 10 : 0;
  }
  const byStage = { s: emptyTotals(), o: emptyTotals() };
  (["s", "o"] as const).forEach((st, i) => {
    const r = stageRows?.[i].rows[0];
    if (!r) return;
    const correct = Number(r.correct ?? 0), total = Number(r.total ?? 0);
    byStage[st] = { score: Number(r.score ?? 0), maxScore: Number(r.max_score ?? 0), correct, total, percent: pct(correct, total), tests: Number(r.tests ?? 0) };
  });

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
    bySource,
    blockSize,
    blocks: blockRows.map((b) => ({ questions: Number(b.questions), percent: Math.round(b.accuracy * 1000) / 10 })),
  };
}
