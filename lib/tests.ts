import { query } from "./db";
import { drawQuestions, getQuestion, toPublic } from "./questions";
import { durationMinutes, MAX_POINTS_PER_QUESTION, scoreAnswer, validateSelection, type TestSize } from "./scoring";
import type { AnswerFeedback, QuestionType, TestState } from "./types";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface TestRow {
  id: string;
  type: QuestionType;
  question_ids: string[];
  started_at: Date;
  deadline: Date;
  finished_at: Date | null;
  score: number;
  max_score: number;
}

interface AnswerRow {
  question_id: string;
  selected: number[];
  points: number;
}

/** Pozwala na drobne opóźnienie sieci przy odpowiedzi wysłanej tuż przed końcem czasu. */
const GRACE_MS = 5_000;

export async function createTest(type: QuestionType, count: TestSize): Promise<TestState> {
  const drawn = drawQuestions(type, count);
  if (drawn.length === 0) throw new HttpError(400, "Brak pytań tego typu w bazie.");
  const { rows } = await query<TestRow>(
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
    "SELECT question_id, selected, points FROM answers WHERE test_id = $1 ORDER BY answered_at",
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
  };
}

function toState(t: TestRow, answers: AnswerRow[]): TestState {
  const solutions = t.finished_at
    ? Object.fromEntries(t.question_ids.map((qid) => [qid, getQuestion(qid)?.correct ?? []]))
    : null;
  return {
    id: t.id,
    type: t.type,
    questions: t.question_ids.map(getQuestion).filter((q) => q !== undefined).map(toPublic),
    answers: answers.map(feedback),
    startedAt: t.started_at.toISOString(),
    deadline: t.deadline.toISOString(),
    finishedAt: t.finished_at ? t.finished_at.toISOString() : null,
    score: answers.reduce((s, a) => s + a.points, 0),
    maxScore: t.max_score,
    solutions,
  };
}

export async function getTest(id: string): Promise<TestState> {
  let t = await loadTest(id);
  if (!t.finished_at && t.deadline.getTime() <= Date.now()) t = await finishRow(id);
  return toState(t, await loadAnswers(id));
}

export async function answerQuestion(id: string, questionId: unknown, selected: unknown) {
  const t = await loadTest(id);
  if (t.finished_at) throw new HttpError(409, "Test został już zakończony.");
  if (t.deadline.getTime() + GRACE_MS < Date.now()) {
    await finishRow(id);
    throw new HttpError(409, "Czas na test minął.");
  }
  if (typeof questionId !== "string" || !t.question_ids.includes(questionId)) {
    throw new HttpError(400, "To pytanie nie należy do testu.");
  }
  const q = getQuestion(questionId);
  if (!q) throw new HttpError(400, "Nieznane pytanie.");
  const err = validateSelection(q.type, selected);
  if (err) throw new HttpError(400, err);

  const sel = [...(selected as number[])].sort((a, b) => a - b);
  const points = scoreAnswer(q.type, sel, q.correct);
  const inserted = await query(
    `INSERT INTO answers (test_id, question_id, selected, points)
     VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
    [id, questionId, sel, points],
  );
  if (inserted.rowCount === 0) throw new HttpError(409, "Na to pytanie już odpowiedziano.");

  const answers = await loadAnswers(id);
  const totalScore = answers.reduce((s, a) => s + a.points, 0);
  if (answers.length >= t.question_ids.length) await finishRow(id);
  return { ...feedback({ question_id: questionId, selected: sel, points }), totalScore };
}

async function finishRow(id: string): Promise<TestRow> {
  const { rows } = await query<TestRow>(
    `UPDATE tests SET
       finished_at = COALESCE(finished_at, LEAST(now(), deadline + interval '5 seconds')),
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

export interface Stats {
  overall: { score: number; maxScore: number; percent: number; tests: number };
  byType: Record<QuestionType, { score: number; maxScore: number; percent: number; tests: number }>;
  history: { id: string; type: QuestionType; finishedAt: string; score: number; maxScore: number; percent: number }[];
}

const pct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 1000) / 10 : 0);

export async function getStats(): Promise<Stats> {
  // Domknij testy, którym minął czas (np. ktoś zamknął kartę).
  await query(
    `UPDATE tests t SET finished_at = t.deadline,
       score = (SELECT COALESCE(SUM(points), 0) FROM answers a WHERE a.test_id = t.id)
     WHERE finished_at IS NULL AND deadline < now() - interval '5 seconds'`,
  );
  const { rows: agg } = await query<{ type: QuestionType; score: number; max_score: number; tests: string }>(
    `SELECT type, SUM(score) AS score, SUM(max_score) AS max_score, COUNT(*) AS tests
     FROM tests WHERE finished_at IS NOT NULL GROUP BY type`,
  );
  const { rows: hist } = await query<TestRow>(
    `SELECT * FROM (SELECT * FROM tests WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 100) h
     ORDER BY finished_at ASC`,
  );

  const empty = () => ({ score: 0, maxScore: 0, percent: 0, tests: 0 });
  const byType = { single: empty(), multi: empty() };
  for (const r of agg) {
    byType[r.type] = { score: r.score, maxScore: r.max_score, percent: pct(r.score, r.max_score), tests: Number(r.tests) };
  }
  const score = byType.single.score + byType.multi.score;
  const maxScore = byType.single.maxScore + byType.multi.maxScore;
  return {
    overall: { score, maxScore, percent: pct(score, maxScore), tests: byType.single.tests + byType.multi.tests },
    byType,
    history: hist.map((t) => ({
      id: t.id,
      type: t.type,
      finishedAt: (t.finished_at as Date).toISOString(),
      score: t.score,
      maxScore: t.max_score,
      percent: pct(t.score, t.max_score),
    })),
  };
}
