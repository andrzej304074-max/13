import { query } from "./db";
import { drawQuestions, getQuestion, toPublic } from "./questions";
import {
  correctUnits,
  durationMinutes,
  MAX_POINTS_PER_QUESTION,
  scoreAnswer,
  UNITS_PER_QUESTION,
  validateSelection,
  type TestSize,
} from "./scoring";
import type { AnswerFeedback, QuestionType, TestMode, TestState } from "./types";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface TestRow {
  id: string;
  type: QuestionType;
  mode: TestMode;
  question_ids: string[];
  started_at: Date;
  deadline: Date | null;
  finished_at: Date | null;
  score: number;
  max_score: number;
}

interface AnswerRow {
  question_id: string;
  selected: number[];
  points: number;
  skipped: boolean;
}

/** Pozwala na drobne opóźnienie sieci przy odpowiedzi wysłanej tuż przed końcem czasu. */
const GRACE_MS = 5_000;

export async function createTest(type: QuestionType, count: TestSize | "endless"): Promise<TestState> {
  const endless = count === "endless";
  const drawn = drawQuestions(type, endless ? Infinity : count);
  if (drawn.length === 0) throw new HttpError(400, "Brak pytań tego typu w bazie.");
  const { rows } = endless
    ? await query<TestRow>(
        `INSERT INTO tests (type, mode, question_ids, deadline, max_score)
         VALUES ($1, 'endless', $2, NULL, 0) RETURNING *`,
        [type, drawn.map((q) => q.id)],
      )
    : await query<TestRow>(
        `INSERT INTO tests (type, question_ids, deadline, max_score)
         VALUES ($1, $2, now() + make_interval(mins => $3), $4)
         RETURNING *`,
        [type, drawn.map((q) => q.id), durationMinutes(count), drawn.length * MAX_POINTS_PER_QUESTION],
      );
  return toState(rows[0], []);
}

async function loadTest(id: string): Promise<TestRow> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Nie znaleziono testu.");
  const { rows } = await query<TestRow>("SELECT * FROM tests WHERE id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Nie znaleziono testu.");
  return rows[0];
}

async function loadAnswers(id: string): Promise<AnswerRow[]> {
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

export async function getTest(id: string): Promise<TestState> {
  let t = await loadTest(id);
  if (!t.finished_at && expired(t)) t = await finishRow(id);
  return toState(t, await loadAnswers(id));
}

export async function answerQuestion(id: string, questionId: unknown, selected: unknown, skip: unknown = false) {
  const t = await loadTest(id);
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

export async function finishTest(id: string): Promise<TestState> {
  await loadTest(id);
  const t = await finishRow(id);
  return toState(t, await loadAnswers(id));
}

interface StatsTotals {
  score: number;
  maxScore: number;
  /** Poprawne jednostki / wszystkie jednostki (pytania w jednokrotnym, pola A–D w wielokrotnym). */
  correct: number;
  total: number;
  percent: number;
  tests: number;
}

export interface Stats {
  overall: StatsTotals;
  byType: Record<QuestionType, StatsTotals>;
  history: {
    id: string;
    type: QuestionType;
    mode: TestMode;
    finishedAt: string;
    score: number;
    maxScore: number;
    correct: number;
    total: number;
    percent: number;
  }[];
}

/** Testy liczone do statystyk: zakończone oraz rozpoczęte testy bez limitu z co najmniej jedną odpowiedzią. */
const COUNTED = "(t.finished_at IS NOT NULL OR (t.mode = 'endless' AND t.max_score > 0))";

const pct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 1000) / 10 : 0);

export async function getStats(): Promise<Stats> {
  // Domknij testy, którym minął czas (np. ktoś zamknął kartę).
  await query(
    `UPDATE tests t SET finished_at = t.deadline,
       score = (SELECT COALESCE(SUM(points), 0) FROM answers a WHERE a.test_id = t.id)
     WHERE finished_at IS NULL AND deadline < now() - interval '5 seconds'`,
  );
  // Dla każdego liczonego testu: poprawne jednostki i liczba wszystkich jednostek (test 30/50 – całe pytania testu,
  // bez limitu – tylko sprawdzone i pominięte).
  const perTest = `
    SELECT t.id, t.type, t.mode, t.score, t.max_score, COALESCE(t.finished_at, t.started_at) AS at,
      COALESCE(SUM(CASE WHEN a.skipped THEN 0 WHEN t.type = 'single' THEN (a.points = 2)::int ELSE a.points * 2 END), 0)
        AS correct,
      (CASE WHEN t.mode = 'endless' THEN COUNT(a.question_id) ELSE cardinality(t.question_ids) END)
        * (CASE WHEN t.type = 'single' THEN 1 ELSE 4 END) AS total
    FROM tests t LEFT JOIN answers a ON a.test_id = t.id
    WHERE ${COUNTED}
    GROUP BY t.id`;
  type PerTest = { id: string; type: QuestionType; mode: TestMode; score: number; max_score: number; at: Date; correct: number; total: string };
  const { rows: agg } = await query<{ type: QuestionType; score: number; max_score: number; correct: number; total: string; tests: string }>(
    `SELECT type, SUM(score) AS score, SUM(max_score) AS max_score, SUM(correct) AS correct, SUM(total) AS total,
       COUNT(*) AS tests
     FROM (${perTest}) p GROUP BY type`,
  );
  const { rows: hist } = await query<PerTest>(
    `SELECT * FROM (${perTest} ORDER BY at DESC LIMIT 100) h ORDER BY at ASC`,
  );

  const empty = (): StatsTotals => ({ score: 0, maxScore: 0, correct: 0, total: 0, percent: 0, tests: 0 });
  const byType = { single: empty(), multi: empty() };
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
    history: hist.map((t) => ({
      id: t.id,
      type: t.type,
      mode: t.mode,
      finishedAt: t.at.toISOString(),
      score: t.score,
      maxScore: t.max_score,
      correct: Number(t.correct),
      total: Number(t.total),
      percent: pct(Number(t.correct), Number(t.total)),
    })),
  };
}
