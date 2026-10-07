import { query } from "./db";
import { HttpError } from "./tests";
import { COURSE, getItem, getLesson } from "./nauka-course";
import { computeXp } from "./nauka-logic";
import { EXERCISE_LABELS, MAX_LEVEL, PASS_ACCURACY, type AnswerLog, type ExerciseType, type ItemKind } from "./nauka-types";

/** Dni (serie, XP dzienne) liczone w polskiej strefie czasowej. */
const TZ = "Europe/Warsaw";
const DAY = `(finished_at AT TIME ZONE '${TZ}')::date`;
const MAX_DURATION_MS = 3 * 60 * 60 * 1000;
const MAX_ANSWERS = 200;

const pct = (c: number, t: number) => (t > 0 ? Math.round((c / t) * 1000) / 10 : 0);

/* ---------- sesje ---------- */

export async function startSession(lessonId: string, sub: number) {
  if (lessonId === "powtorka") {
    const { rows } = await query<{ id: string }>(
      `INSERT INTO learn_sessions (topic, unit, lesson, sub, kind) VALUES ('powtorka', 'powtorka', 'powtorka', 3, 'mix') RETURNING id`,
    );
    return { id: rows[0].id, level: 0 };
  }
  const lesson = getLesson(lessonId);
  if (!lesson) throw new HttpError(404, "Nie ma takiej lekcji.");
  if (![1, 2, 3, 4].includes(sub)) throw new HttpError(400, "Pod-lekcja musi mieć numer 1–4.");
  const level = (await lessonLevels([lessonId]))[lessonId] ?? 0;
  const { rows } = await query<{ id: string }>(
    `INSERT INTO learn_sessions (topic, unit, lesson, sub, kind, level) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [lesson.topic, lesson.unit, lesson.id, sub, lesson.kind, level],
  );
  return { id: rows[0].id, level };
}

function parseAnswers(raw: unknown): AnswerLog[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new HttpError(400, "Brak odpowiedzi.");
  if (raw.length > MAX_ANSWERS) throw new HttpError(400, "Za dużo odpowiedzi.");
  return raw.map((a) => {
    const r = a as Record<string, unknown>;
    const item = typeof r.item === "string" ? getItem(r.item) : undefined;
    if (!item) throw new HttpError(400, "Nieznane hasło.");
    if (typeof r.exercise !== "string" || !Object.hasOwn(EXERCISE_LABELS, r.exercise)) {
      throw new HttpError(400, "Nieznany typ ćwiczenia.");
    }
    if (typeof r.correct !== "boolean") throw new HttpError(400, "Brak wyniku odpowiedzi.");
    const ms = Number.isFinite(r.ms) ? Math.min(Math.max(Math.round(r.ms as number), 0), 600_000) : 0;
    return { item: item.id, itemKind: item.kind, exercise: r.exercise as ExerciseType, correct: r.correct, ms };
  });
}

export interface FinishResult {
  xp: number;
  correct: number;
  total: number;
  percent: number;
  durationMs: number;
  level: number;
  levelBefore: number;
}

export async function finishSession(id: string, rawAnswers: unknown): Promise<FinishResult> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Nie ma takiej sesji.");
  const answers = parseAnswers(rawAnswers);
  const correct = answers.filter((a) => a.correct).length;
  const xp = computeXp(answers.map((a) => a.correct));
  const { rows } = await query<{ lesson: string; level: number; duration_ms: number }>(
    `UPDATE learn_sessions SET finished_at = now(), correct = $2, total = $3, xp = $4,
       duration_ms = LEAST(EXTRACT(EPOCH FROM now() - started_at) * 1000, ${MAX_DURATION_MS})::int
     WHERE id = $1 AND finished_at IS NULL RETURNING lesson, level, duration_ms`,
    [id, correct, answers.length, xp],
  );
  if (rows.length === 0) throw new HttpError(409, "Sesja nie istnieje albo została już zakończona.");
  await query(
    `INSERT INTO learn_answers (session_id, seq, item_id, item_kind, exercise, correct, ms)
     SELECT $1, s.seq, s.item, s.kind, s.ex, s.ok, s.ms
     FROM unnest($2::text[], $3::text[], $4::text[], $5::bool[], $6::int[]) WITH ORDINALITY
       AS s(item, kind, ex, ok, ms, seq)`,
    [id, answers.map((a) => a.item), answers.map((a) => a.itemKind), answers.map((a) => a.exercise),
      answers.map((a) => a.correct), answers.map((a) => a.ms)],
  );
  const { lesson, level: levelBefore, duration_ms } = rows[0];
  const level = lesson === "powtorka" ? 0 : (await lessonLevels([lesson]))[lesson] ?? 0;
  return { xp, correct, total: answers.length, percent: pct(correct, answers.length), durationMs: duration_ms, level, levelBefore };
}

/* ---------- postęp ---------- */

interface SubRow { lesson: string; sub: number; passes: string; best: number; sessions: string; last: Date }

async function subRows(lessonIds: string[] | null) {
  const { rows } = await query<SubRow>(
    `SELECT lesson, sub, COUNT(*) FILTER (WHERE correct >= total * ${PASS_ACCURACY}) AS passes,
       MAX(correct::float / NULLIF(total, 0)) AS best, COUNT(*) AS sessions, MAX(finished_at) AS last
     FROM learn_sessions
     WHERE finished_at IS NOT NULL AND total > 0 AND lesson <> 'powtorka' AND ($1::text[] IS NULL OR lesson = ANY($1))
     GROUP BY lesson, sub`,
    [lessonIds],
  );
  return rows;
}

/** Korony lekcji: ile razy zaliczono (≥ 80%) każdą z 4 pod-lekcji – minimum po pod-lekcjach, najwyżej 5. */
function levelsFrom(rows: SubRow[]) {
  const passes: Record<string, number[]> = {};
  for (const r of rows) (passes[r.lesson] ??= [0, 0, 0, 0])[r.sub - 1] = Number(r.passes);
  return Object.fromEntries(Object.entries(passes).map(([l, p]) => [l, Math.min(MAX_LEVEL, ...p)]));
}

async function lessonLevels(lessonIds: string[]): Promise<Record<string, number>> {
  return levelsFrom(await subRows(lessonIds));
}

export interface LessonProgress {
  level: number;
  subs: Record<number, { best: number; passes: number; sessions: number; last: string }>;
}

export interface Summary {
  xpToday: number;
  xpTotal: number;
  streak: number;
  /** Czy dzisiejszy dzień już liczy się do serii. */
  todayDone: boolean;
  week: { day: string; xp: number }[];
  sessions: number;
}

export async function getSummary(): Promise<Summary> {
  const { rows } = await query<{ day: string; xp: string; n: string }>(
    `SELECT to_char(${DAY}, 'YYYY-MM-DD') AS day, SUM(xp) AS xp, COUNT(*) AS n
     FROM learn_sessions WHERE finished_at IS NOT NULL GROUP BY 1 ORDER BY 1 DESC`,
  );
  const { rows: today } = await query<{ d: string }>(`SELECT to_char((now() AT TIME ZONE '${TZ}')::date, 'YYYY-MM-DD') AS d`);
  const todayStr = today[0].d;
  const byDay = new Map(rows.map((r) => [r.day, Number(r.xp)]));
  const shift = (d: string, n: number) => {
    const t = new Date(`${d}T12:00:00Z`);
    t.setUTCDate(t.getUTCDate() + n);
    return t.toISOString().slice(0, 10);
  };
  // seria: kolejne dni z ukończoną sesją, licząc od dziś (albo od wczoraj, jeśli dziś jeszcze nic)
  let streak = 0;
  let d = byDay.has(todayStr) ? todayStr : shift(todayStr, -1);
  while (byDay.has(d)) {
    streak++;
    d = shift(d, -1);
  }
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = shift(todayStr, i - 6);
    return { day, xp: byDay.get(day) ?? 0 };
  });
  return {
    xpToday: byDay.get(todayStr) ?? 0,
    xpTotal: rows.reduce((s, r) => s + Number(r.xp), 0),
    streak,
    todayDone: byDay.has(todayStr),
    week,
    sessions: rows.reduce((s, r) => s + Number(r.n), 0),
  };
}

export interface Progress {
  summary: Summary;
  lessons: Record<string, LessonProgress>;
  /** Postęp tematów: lekcje z co najmniej jedną koroną / wszystkie, oraz lekcje rozpoczęte. */
  topics: Record<string, { lessons: number; crowned: number; started: number; crowns: number }>;
}

export async function getProgress(topic: string | null = null): Promise<Progress> {
  const ids = topic ? Object.values(COURSE.lessons).filter((l) => l.topic === topic).map((l) => l.id) : null;
  const rows = await subRows(ids);
  const levels = levelsFrom(rows);
  const lessons: Record<string, LessonProgress> = {};
  for (const r of rows) {
    const lp = (lessons[r.lesson] ??= { level: levels[r.lesson] ?? 0, subs: {} });
    lp.subs[r.sub] = { best: pct(r.best, 1), passes: Number(r.passes), sessions: Number(r.sessions), last: r.last.toISOString() };
  }
  const topics: Progress["topics"] = {};
  for (const t of COURSE.topics) topics[t.id] = { lessons: 0, crowned: 0, started: 0, crowns: 0 };
  for (const l of Object.values(COURSE.lessons)) {
    const tp = topics[l.topic];
    tp.lessons++;
    if (lessons[l.id]) tp.started++;
    if ((levels[l.id] ?? 0) > 0) tp.crowned++;
    tp.crowns += levels[l.id] ?? 0;
  }
  return { summary: await getSummary(), lessons, topics };
}

/** Hasła z najniższą skutecznością (min. 2 odpowiedzi, ostatnie 60 dni) – do powtórki. */
export async function weakItems(limit = 8): Promise<string[]> {
  const { rows } = await query<{ item_id: string }>(
    `SELECT item_id FROM learn_answers WHERE answered_at > now() - interval '60 days'
     GROUP BY item_id HAVING COUNT(*) >= 2 AND AVG(correct::int) < 0.8
     ORDER BY AVG(correct::int), COUNT(*) DESC LIMIT $1`,
    [limit],
  );
  return rows.map((r) => r.item_id).filter((id) => getItem(id));
}

/* ---------- statystyki nauki ---------- */

export type Range = "7d" | "30d" | "all";

export interface StatsFilter {
  topic?: string | null;
  unit?: string | null;
  lesson?: string | null;
  sub?: number | null;
  /** Rodzaj treści hasła (pojęcia, wzory, osoby…). */
  kind?: ItemKind | null;
  exercise?: ExerciseType | null;
  range?: Range;
}

interface Totals { answers: number; correct: number; percent: number }
interface SessionTotals { sessions: number; totalMs: number; avgMs: number; xp: number; percent: number }

export interface NaukaStats {
  answers: Totals;
  sessions: SessionTotals;
  bySub: ({ sub: number } & SessionTotals)[];
  /** Podział według tematu → działu → lekcji (zależnie od zawężenia). */
  breakdown: { level: "topic" | "unit" | "lesson"; rows: ({ id: string } & SessionTotals & { answers: number; correct: number })[] };
  byExercise: ({ id: string; avgMs: number } & Totals)[];
  byKind: ({ id: string } & Totals)[];
  daily: { day: string; sessions: number; percent: number; ms: number; xp: number }[];
  history: { id: string; lesson: string; sub: number; finishedAt: string; durationMs: number; correct: number; total: number; xp: number }[];
  weakest: ({ id: string; title: string; kind: string; topic: string } & Totals)[];
}

/** Warunki na sesje (temat/dział/lekcja/pod-lekcja/okres) i dodatkowo na odpowiedzi (rodzaj hasła, typ ćwiczenia). */
function where(f: StatsFilter) {
  const params: unknown[] = [];
  const s: string[] = ["s.finished_at IS NOT NULL"];
  const add = (sql: string, v: unknown) => {
    params.push(v);
    s.push(sql.replace("?", `$${params.length}`));
  };
  if (f.topic) add("s.topic = ?", f.topic);
  if (f.unit) add("s.unit = ?", f.unit);
  if (f.lesson) add("s.lesson = ?", f.lesson);
  if (f.sub) add("s.sub = ?", f.sub);
  if (f.range === "7d") s.push("s.finished_at > now() - interval '7 days'");
  if (f.range === "30d") s.push("s.finished_at > now() - interval '30 days'");
  const a = [...s];
  const aParams = [...params];
  const addA = (sql: string, v: unknown) => {
    aParams.push(v);
    a.push(sql.replace("?", `$${aParams.length}`));
  };
  if (f.kind) addA("a.item_kind = ?", f.kind);
  if (f.exercise) addA("a.exercise = ?", f.exercise);
  // sesje z odpowiedziami pasującymi do filtra rodzaju/ćwiczenia
  const sess = [...s];
  if (f.kind || f.exercise) {
    const cond = a.slice(s.length).join(" AND ");
    sess.push(`EXISTS (SELECT 1 FROM learn_answers a WHERE a.session_id = s.id AND ${cond})`);
  }
  return {
    sessions: { sql: sess.join(" AND "), params: f.kind || f.exercise ? aParams : params },
    answers: { sql: a.join(" AND "), params: aParams },
  };
}

const totals = (c: number, t: number): Totals => ({ answers: t, correct: c, percent: pct(c, t) });
const sessTotals = (r: { n: string; ms: string | null; xp: string | null; c: string | null; t: string | null }): SessionTotals => ({
  sessions: Number(r.n),
  totalMs: Number(r.ms ?? 0),
  avgMs: Number(r.n) ? Math.round(Number(r.ms ?? 0) / Number(r.n)) : 0,
  xp: Number(r.xp ?? 0),
  percent: pct(Number(r.c ?? 0), Number(r.t ?? 0)),
});

export async function getNaukaStats(f: StatsFilter): Promise<NaukaStats> {
  const w = where(f);
  const S = `FROM learn_sessions s WHERE ${w.sessions.sql}`;
  const A = `FROM learn_answers a JOIN learn_sessions s ON s.id = a.session_id WHERE ${w.answers.sql}`;
  const sessAgg = `COUNT(*) AS n, SUM(s.duration_ms) AS ms, SUM(s.xp) AS xp, SUM(s.correct) AS c, SUM(s.total) AS t`;
  const level = f.lesson || f.unit ? "lesson" : f.topic ? "unit" : "topic";
  const col = { topic: "s.topic", unit: "s.unit", lesson: "s.lesson" }[level];

  type SR = { n: string; ms: string | null; xp: string | null; c: string | null; t: string | null };
  const [ans, sess, bySub, brS, brA, byEx, byKind, daily, hist, weak] = await Promise.all([
    query<{ c: string; t: string }>(`SELECT SUM(a.correct::int) AS c, COUNT(*) AS t ${A}`, w.answers.params),
    query<SR>(`SELECT ${sessAgg} ${S}`, w.sessions.params),
    query<SR & { sub: number }>(`SELECT s.sub, ${sessAgg} ${S} GROUP BY s.sub ORDER BY s.sub`, w.sessions.params),
    query<SR & { id: string }>(`SELECT ${col} AS id, ${sessAgg} ${S} GROUP BY 1`, w.sessions.params),
    query<{ id: string; c: string; t: string }>(`SELECT ${col} AS id, SUM(a.correct::int) AS c, COUNT(*) AS t ${A} GROUP BY 1`, w.answers.params),
    query<{ id: string; c: string; t: string; ms: string }>(
      `SELECT a.exercise AS id, SUM(a.correct::int) AS c, COUNT(*) AS t, AVG(a.ms) AS ms ${A} GROUP BY 1 ORDER BY 1`, w.answers.params),
    query<{ id: string; c: string; t: string }>(`SELECT a.item_kind AS id, SUM(a.correct::int) AS c, COUNT(*) AS t ${A} GROUP BY 1`, w.answers.params),
    query<{ day: string; n: string; c: string; t: string; ms: string; xp: string }>(
      `SELECT to_char((s.finished_at AT TIME ZONE '${TZ}')::date, 'YYYY-MM-DD') AS day, COUNT(*) AS n, SUM(s.correct) AS c,
         SUM(s.total) AS t, SUM(s.duration_ms) AS ms, SUM(s.xp) AS xp ${S} GROUP BY 1 ORDER BY 1 DESC LIMIT 60`,
      w.sessions.params),
    query<{ id: string; lesson: string; sub: number; finished_at: Date; duration_ms: number; correct: number; total: number; xp: number }>(
      `SELECT s.id, s.lesson, s.sub, s.finished_at, s.duration_ms, s.correct, s.total, s.xp ${S} ORDER BY s.finished_at DESC LIMIT 30`,
      w.sessions.params),
    query<{ id: string; c: string; t: string }>(
      `SELECT a.item_id AS id, SUM(a.correct::int) AS c, COUNT(*) AS t ${A} GROUP BY 1
       HAVING COUNT(*) >= 2 AND AVG(a.correct::int) < 1 ORDER BY AVG(a.correct::int), COUNT(*) DESC LIMIT 15`,
      w.answers.params),
  ]);

  const ansBy = new Map(brA.rows.map((r) => [r.id, r]));
  return {
    answers: totals(Number(ans.rows[0].c ?? 0), Number(ans.rows[0].t)),
    sessions: sessTotals(sess.rows[0]),
    bySub: bySub.rows.map((r) => ({ sub: r.sub, ...sessTotals(r) })),
    breakdown: {
      level,
      rows: brS.rows.map((r) => {
        const a = ansBy.get(r.id);
        const c = Number(a?.c ?? 0), t = Number(a?.t ?? 0);
        // skuteczność wg odpowiedzi pasujących do filtrów (rodzaj, ćwiczenie)
        return { id: r.id, ...sessTotals(r), percent: pct(c, t), answers: t, correct: c };
      }),
    },
    byExercise: byEx.rows.map((r) => ({ id: r.id, ...totals(Number(r.c), Number(r.t)), avgMs: Math.round(Number(r.ms)) })),
    byKind: byKind.rows.map((r) => ({ id: r.id, ...totals(Number(r.c), Number(r.t)) })),
    daily: daily.rows.reverse().map((r) => ({
      day: r.day, sessions: Number(r.n), percent: pct(Number(r.c), Number(r.t)), ms: Number(r.ms), xp: Number(r.xp),
    })),
    history: hist.rows.map((r) => ({
      id: r.id, lesson: r.lesson, sub: r.sub, finishedAt: r.finished_at.toISOString(), durationMs: r.duration_ms,
      correct: r.correct, total: r.total, xp: r.xp,
    })),
    weakest: weak.rows.flatMap((r) => {
      const it = getItem(r.id);
      return it ? [{ id: r.id, title: it.t, kind: it.kind, topic: it.topic, ...totals(Number(r.c), Number(r.t)) }] : [];
    }),
  };
}
