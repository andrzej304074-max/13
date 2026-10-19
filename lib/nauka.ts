import { isUuid } from "./api";
import { query, withTx } from "./db";
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

/**
 * Nowa sesja. `cid` – identyfikator nadany przez przeglądarkę: ponowione zapytanie (zgubiona odpowiedź, brak sieci)
 * zwraca tę samą sesję zamiast zakładać kolejną.
 */
export async function startSession(userId: string, lessonId: string, sub: number, cid: unknown = null) {
  const clientId = isUuid(cid) ? cid : null;
  const insert = (cols: string, vals: string, params: unknown[]) => query<{ id: string; level: number }>(
    `INSERT INTO learn_sessions (${cols}, user_id, client_id) VALUES (${vals}, $${params.length + 1}, $${params.length + 2})
     ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL DO UPDATE SET client_id = EXCLUDED.client_id
     RETURNING id, level`, [...params, userId, clientId]);
  if (lessonId === "powtorka") {
    const { rows } = await insert("topic, unit, lesson, sub, kind", "'powtorka', 'powtorka', 'powtorka', 3, 'mix'", []);
    return { id: rows[0].id, level: 0 };
  }
  const lesson = getLesson(lessonId);
  if (!lesson) throw new HttpError(404, "Nie ma takiej lekcji.");
  if (![1, 2, 3, 4].includes(sub)) throw new HttpError(400, "Pod-lekcja musi mieć numer 1–4.");
  const level = (await lessonLevels(userId, [lessonId]))[lessonId] ?? 0;
  const { rows } = await insert("topic, unit, lesson, sub, kind, level", "$1, $2, $3, $4, $5, $6",
    [lesson.topic, lesson.unit, lesson.id, sub, lesson.kind, level]);
  return { id: rows[0].id, level: rows[0].level };
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

export async function finishSession(userId: string, id: string, rawAnswers: unknown): Promise<FinishResult> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Nie ma takiej sesji.");
  const answers = parseAnswers(rawAnswers);
  const correct = answers.filter((a) => a.correct).length;
  const xp = computeXp(answers.map((a) => a.correct));
  // zakończenie sesji i jej odpowiedzi razem – przerwane połączenie nie zostawia sesji „zakończonej” bez odpowiedzi
  const { lesson, level: levelBefore, duration_ms } = await withTx(async (q) => {
    const { rows } = await q<{ lesson: string; level: number; duration_ms: number }>(
      `UPDATE learn_sessions SET finished_at = now(), correct = $2, total = $3, xp = $4,
         duration_ms = LEAST(EXTRACT(EPOCH FROM now() - started_at) * 1000, ${MAX_DURATION_MS})::int
       WHERE id = $1 AND user_id = $5 AND finished_at IS NULL RETURNING lesson, level, duration_ms`,
      [id, correct, answers.length, xp, userId],
    );
    if (rows.length === 0) {
      // 409 tylko dla własnej, już zakończonej sesji (poprzedni zapis doszedł); nieznana albo cudza – 404
      const { rowCount } = await q("SELECT 1 FROM learn_sessions WHERE id = $1 AND user_id = $2", [id, userId]);
      throw rowCount ? new HttpError(409, "Sesja została już zakończona.") : new HttpError(404, "Nie ma takiej sesji.");
    }
    await q(
      `INSERT INTO learn_answers (session_id, seq, item_id, item_kind, exercise, correct, ms)
       SELECT $1, s.seq, s.item, s.kind, s.ex, s.ok, s.ms
       FROM unnest($2::text[], $3::text[], $4::text[], $5::bool[], $6::int[]) WITH ORDINALITY
         AS s(item, kind, ex, ok, ms, seq)`,
      [id, answers.map((a) => a.item), answers.map((a) => a.itemKind), answers.map((a) => a.exercise),
        answers.map((a) => a.correct), answers.map((a) => a.ms)],
    );
    return rows[0];
  });
  const level = lesson === "powtorka" ? 0 : (await lessonLevels(userId, [lesson]))[lesson] ?? 0;
  return { xp, correct, total: answers.length, percent: pct(correct, answers.length), durationMs: duration_ms, level, levelBefore };
}

/* ---------- postęp ---------- */

interface SubRow { lesson: string; sub: number; passes: string; best: number; sessions: string; last: Date }

async function subRows(userId: string, lessonIds: string[] | null) {
  const { rows } = await query<SubRow>(
    // sesja „artykuł” (przeczytany rozdział Podręcznika zamiast Poznaj) zalicza pod-lekcję jak wynik 100%
    `SELECT lesson, sub, COUNT(*) FILTER (WHERE mode = 'artykul' OR correct >= total * ${PASS_ACCURACY}) AS passes,
       MAX(CASE WHEN mode = 'artykul' THEN 1 ELSE correct::float / NULLIF(total, 0) END) AS best, COUNT(*) AS sessions, MAX(finished_at) AS last
     FROM learn_sessions
     WHERE user_id = $2 AND finished_at IS NOT NULL AND (total > 0 OR mode = 'artykul') AND lesson <> 'powtorka' AND ($1::text[] IS NULL OR lesson = ANY($1))
     GROUP BY lesson, sub`,
    [lessonIds, userId],
  );
  return rows;
}

/** Korony lekcji: ile razy zaliczono (≥ 80%) każdą z 4 pod-lekcji – minimum po pod-lekcjach, najwyżej 5. */
function levelsFrom(rows: SubRow[]) {
  const passes: Record<string, number[]> = {};
  for (const r of rows) (passes[r.lesson] ??= [0, 0, 0, 0])[r.sub - 1] = Number(r.passes);
  return Object.fromEntries(Object.entries(passes).map(([l, p]) => [l, Math.min(MAX_LEVEL, ...p)]));
}

async function lessonLevels(userId: string, lessonIds: string[]): Promise<Record<string, number>> {
  return levelsFrom(await subRows(userId, lessonIds));
}

export interface LessonProgress {
  level: number;
  subs: Record<number, { best: number; passes: number; sessions: number; last: string }>;
  /** Pod-lekcje przerwane w trakcie (ostatnie 7 dni, bez późniejszego ukończenia): ćwiczenie / wszystkie. */
  partial?: Record<number, { pos: number; total: number; at: string }>;
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

export async function getSummary(userId: string): Promise<Summary> {
  const { rows } = await query<{ day: string; xp: string; n: string }>(
    `SELECT to_char(${DAY}, 'YYYY-MM-DD') AS day, SUM(xp) AS xp, COUNT(*) AS n
     FROM learn_sessions WHERE user_id = $1 AND finished_at IS NOT NULL GROUP BY 1 ORDER BY 1 DESC`,
    [userId],
  );
  // dzisiejsza data w strefie kursu – bez dodatkowego zapytania (en-CA daje format RRRR-MM-DD)
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
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

export async function getProgress(userId: string, topic: string | null = null): Promise<Progress> {
  const ids = topic ? Object.values(COURSE.lessons).filter((l) => l.topic === topic).map((l) => l.id) : null;
  // trzy niezależne zapytania równolegle
  const [rows, { rows: part }, summary] = await Promise.all([
    subRows(userId, ids),
    query<{ lesson: string; sub: number; progress: { pos: number; total: number }; started_at: Date }>(
      `SELECT DISTINCT ON (lesson, sub) lesson, sub, progress, started_at FROM learn_sessions
       WHERE user_id = $2 AND finished_at IS NULL AND progress IS NOT NULL AND started_at > now() - interval '7 days'
         AND ($1::text[] IS NULL OR lesson = ANY($1))
       ORDER BY lesson, sub, started_at DESC`, [ids, userId]),
    getSummary(userId),
  ]);
  const levels = levelsFrom(rows);
  const lessons: Record<string, LessonProgress> = {};
  for (const r of rows) {
    const lp = (lessons[r.lesson] ??= { level: levels[r.lesson] ?? 0, subs: {} });
    lp.subs[r.sub] = { best: pct(r.best, 1), passes: Number(r.passes), sessions: Number(r.sessions), last: r.last.toISOString() };
  }
  // pod-lekcje w trakcie: najnowsza nieukończona sesja z postępem, jeśli później nie było ukończonej
  for (const r of part) {
    const done = lessons[r.lesson]?.subs[r.sub];
    if (done && new Date(done.last) > r.started_at) continue;
    const lp = (lessons[r.lesson] ??= { level: levels[r.lesson] ?? 0, subs: {} });
    (lp.partial ??= {})[r.sub] = { pos: r.progress.pos, total: r.progress.total, at: r.started_at.toISOString() };
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
  return { summary, lessons, topics };
}

/** Postęp sesji w trakcie (po każdym ćwiczeniu) – tylko własna, nieukończona sesja. */
export async function saveSessionProgress(userId: string, id: string, body: Record<string, unknown>): Promise<{ ok: true }> {
  const pos = Number(body.pos), total = Number(body.total);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(pos) || !Number.isInteger(total) || pos < 0 || total < 1 || pos > total || total > 500) {
    throw new HttpError(400, "Nieprawidłowy postęp.");
  }
  await query("UPDATE learn_sessions SET progress = $3 WHERE id = $1 AND user_id = $2 AND finished_at IS NULL",
    [id, userId, JSON.stringify({ pos, total })]);
  return { ok: true };
}

/** Hasła z najniższą skutecznością (min. 2 odpowiedzi, ostatnie 60 dni) – do powtórki. */
export async function weakItems(userId: string, limit = 8): Promise<string[]> {
  const { rows } = await query<{ item_id: string }>(
    // lekcje „Zrozumienie” nie mają ćwiczeń generowanych z haseł – powtarza się je w samych lekcjach
    `SELECT a.item_id FROM learn_answers a JOIN learn_sessions s ON s.id = a.session_id
     WHERE s.user_id = $2 AND a.answered_at > now() - interval '60 days' AND a.item_kind <> 'zrozumienie'
     GROUP BY a.item_id HAVING COUNT(*) >= 2 AND AVG(a.correct::int) < 0.8
     ORDER BY AVG(a.correct::int), COUNT(*) DESC LIMIT $1`,
    [limit, userId],
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
  history: { id: string; lesson: string; sub: number; finishedAt: string; durationMs: number; correct: number; total: number; xp: number; mode: string }[];
  weakest: ({ id: string; title: string; kind: string; topic: string } & Totals)[];
}

/** Warunki na sesje (temat/dział/lekcja/pod-lekcja/okres) i dodatkowo na odpowiedzi (rodzaj hasła, typ ćwiczenia). */
function where(userId: string, f: StatsFilter) {
  const params: unknown[] = [userId];
  const s: string[] = ["s.finished_at IS NOT NULL", "s.user_id = $1"];
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

export async function getNaukaStats(userId: string, f: StatsFilter): Promise<NaukaStats> {
  const w = where(userId, f);
  const S = `FROM learn_sessions s WHERE ${w.sessions.sql}`;
  const A = `FROM learn_answers a JOIN learn_sessions s ON s.id = a.session_id WHERE ${w.answers.sql}`;
  const sessAgg = `COUNT(*) AS n, SUM(s.duration_ms) AS ms, SUM(s.xp) AS xp, SUM(s.correct) AS c, SUM(s.total) AS t`;
  const level = f.lesson || f.unit ? "lesson" : f.topic ? "unit" : "topic";
  const col = { topic: "s.topic", unit: "s.unit", lesson: "s.lesson" }[level];

  type SR = { n: string; ms: string | null; xp: string | null; c: string | null; t: string | null };
  type GS = { g: string; k: string | null };
  // Sumy, podział wg pod-lekcji i wg poziomu w jednym zapytaniu (GROUPING SETS) – mniej połączeń z bazą.
  // 5 zapytań = jedna tura przy puli 5 połączeń
  const [sessG, ansG, daily, hist, weak] = await Promise.all([
    query<SR & GS>(
      `SELECT CASE WHEN GROUPING(s.sub) = 0 THEN 'sub' WHEN GROUPING(${col}) = 0 THEN 'br' ELSE 'all' END AS g,
              COALESCE(s.sub::text, ${col}) AS k, ${sessAgg} ${S}
       GROUP BY GROUPING SETS ((), (s.sub), (${col}))`, w.sessions.params),
    query<{ c: string | null; t: string; ms: string | null } & GS>(
      `SELECT CASE WHEN GROUPING(a.exercise) = 0 THEN 'ex' WHEN GROUPING(a.item_kind) = 0 THEN 'kind'
                   WHEN GROUPING(${col}) = 0 THEN 'br' ELSE 'all' END AS g,
              COALESCE(a.exercise, a.item_kind, ${col}) AS k, SUM(a.correct::int) AS c, COUNT(*) AS t, AVG(a.ms) AS ms ${A}
       GROUP BY GROUPING SETS ((), (${col}), (a.item_kind), (a.exercise))`, w.answers.params),
    query<{ day: string; n: string; c: string; t: string; ms: string; xp: string }>(
      `SELECT to_char((s.finished_at AT TIME ZONE '${TZ}')::date, 'YYYY-MM-DD') AS day, COUNT(*) AS n, SUM(s.correct) AS c,
         SUM(s.total) AS t, SUM(s.duration_ms) AS ms, SUM(s.xp) AS xp ${S} GROUP BY 1 ORDER BY 1 DESC LIMIT 60`,
      w.sessions.params),
    query<{ id: string; lesson: string; sub: number; finished_at: Date; duration_ms: number; correct: number; total: number; xp: number; mode: string }>(
      `SELECT s.id, s.lesson, s.sub, s.finished_at, s.duration_ms, s.correct, s.total, s.xp, s.mode ${S} ORDER BY s.finished_at DESC LIMIT 30`,
      w.sessions.params),
    query<{ id: string; c: string; t: string }>(
      `SELECT a.item_id AS id, SUM(a.correct::int) AS c, COUNT(*) AS t ${A} GROUP BY 1
       HAVING COUNT(*) >= 2 AND AVG(a.correct::int) < 1 ORDER BY AVG(a.correct::int), COUNT(*) DESC LIMIT 15`,
      w.answers.params),
  ]);
  const pick = <T extends GS>(rows: T[], g: string) => rows.filter((r) => r.g === g);
  const sess = { rows: pick(sessG.rows, "all") };
  const bySub = { rows: pick(sessG.rows, "sub").map((r) => ({ ...r, sub: Number(r.k) })).sort((a, b) => a.sub - b.sub) };
  const brS = { rows: pick(sessG.rows, "br").map((r) => ({ ...r, id: r.k as string })) };
  const ans = { rows: pick(ansG.rows, "all") };
  const brA = { rows: pick(ansG.rows, "br").map((r) => ({ ...r, id: r.k as string })) };
  const byKind = { rows: pick(ansG.rows, "kind").map((r) => ({ ...r, id: r.k as string })) };
  const byEx = { rows: pick(ansG.rows, "ex").map((r) => ({ ...r, id: r.k as string })).sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0)) };

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
      correct: r.correct, total: r.total, xp: r.xp, mode: r.mode,
    })),
    weakest: weak.rows.flatMap((r) => {
      const it = getItem(r.id);
      return it ? [{ id: r.id, title: it.t, kind: it.kind, topic: it.topic, ...totals(Number(r.c), Number(r.t)) }] : [];
    }),
  };
}

/* ---------- Podręcznik ---------- */

const READ_XP = 10;

/**
 * Przeczytany artykuł: zapis w article_reads; rozdział lekcji dodatkowo zalicza „Poznaj” (sesja w trybie „artykuł”,
 * najwyżej raz na 10 minut na lekcję, żeby odświeżanie strony nie nabijało koron).
 */
export async function markRead(userId: string, ref: unknown, ms: unknown): Promise<{ ok: true; credited: boolean; level?: number }> {
  if (typeof ref !== "string" || !ref) throw new HttpError(400, "Brak artykułu.");
  const lesson = getLesson(ref);
  const unit = COURSE.units.find((u) => u.id === ref);
  if (!unit && (!lesson || lesson.type === "zrozum")) throw new HttpError(404, "Nie ma takiego artykułu.");
  await query("INSERT INTO article_reads (user_id, ref) VALUES ($1, $2) ON CONFLICT (user_id, ref) DO UPDATE SET at = now()", [userId, ref]);
  if (!lesson) return { ok: true, credited: false };
  const dur = Number.isFinite(ms) ? Math.min(Math.max(Math.round(ms as number), 0), MAX_DURATION_MS) : 0;
  const { rows } = await query<{ id: string }>(
    `INSERT INTO learn_sessions (topic, unit, lesson, sub, kind, level, user_id, mode, finished_at, duration_ms, correct, total, xp)
     SELECT $1, $2, $3, 1, $4, 0, $5, 'artykul', now(), $6, 0, 0, $7
     WHERE NOT EXISTS (SELECT 1 FROM learn_sessions WHERE user_id = $5 AND lesson = $3 AND mode = 'artykul' AND finished_at > now() - interval '10 minutes')
     RETURNING id`,
    [lesson.topic, lesson.unit, lesson.id, lesson.kind, userId, dur, READ_XP],
  );
  const level = (await lessonLevels(userId, [lesson.id]))[lesson.id] ?? 0;
  return { ok: true, credited: rows.length > 0, level };
}

export async function readArticles(userId: string): Promise<Record<string, string>> {
  const { rows } = await query<{ ref: string; at: Date }>("SELECT ref, at FROM article_reads WHERE user_id = $1", [userId]);
  return Object.fromEntries(rows.map((r) => [r.ref, r.at.toISOString()]));
}
