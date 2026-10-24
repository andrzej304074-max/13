import { query } from "./db";
import { HttpError } from "./tests";
import { sourceWhereSql } from "./question-source";
import { computeStreak, todayWarsaw, weekOf } from "./xp-core";
import {
  distribution, metricHasSource, MIN_ANSWERS, RANK_TOP, validRankName,
  type WorldDist, type WorldMetric, type WorldPeriod, type WorldSource,
} from "./world-core";

/**
 * Statystyki „świata”: wartości miary dla wszystkich aktywnych kont (jedno zapytanie), w pamięci serwera przez 5 minut
 * (każda instancja liczy najwyżej raz na 5 min na kombinację filtrów). Do przeglądarki trafia tylko rozkład i Twój wynik –
 * nigdy wyniki innych osób z identyfikatorami.
 */

const TTL = 5 * 60_000;
const cache = new Map<string, { at: number; p: Promise<Map<string, number>> }>();

const since = (col: string, p: WorldPeriod) => (p === "all" ? "TRUE" : `${col} >= now() - interval '${p === "7d" ? 7 : 30} days'`);
const sinceDay = (p: WorldPeriod) => (p === "all" ? "TRUE" : `day > (now() AT TIME ZONE 'Europe/Warsaw')::date - ${p === "7d" ? 7 : 30}`);
const ACTIVE = "JOIN users us ON us.id = x.u AND us.activated_at IS NOT NULL";
/** Dokładność odpowiedzi w teście 0–1 (jak w statystykach testów). */
const ACC = "CASE WHEN a.skipped THEN 0 WHEN t.type = 'single' THEN (a.points = 2)::int ELSE a.points / 2 END";
const TEST_XP = "CASE WHEN a.skipped OR cardinality(a.selected) = 0 THEN 0 WHEN a.points >= 2 THEN 10 WHEN a.points > 0 THEN 5 ELSE 2 END";

function testsWhere(src: WorldSource, p: WorldPeriod) {
  const s = src === "owe" || src === "ai" || src === "slownik" ? ` AND ${sourceWhereSql("a.question_id", src)}` : "";
  return `t.user_id IS NOT NULL AND ${since("a.answered_at", p)}${s}`;
}

/** SQL zwracające (u, v) – wartość miary dla każdego konta z aktywnością. */
function sqlFor(m: WorldMetric, src: WorldSource, p: WorldPeriod): string {
  const tests = src === "testy" || src === "owe" || src === "ai" || src === "slownik";
  if (m === "xp") {
    if (src === "owe" || src === "ai" || src === "slownik") {
      return `SELECT t.user_id AS u, SUM(${TEST_XP}) AS v FROM answers a JOIN tests t ON t.id = a.test_id WHERE ${testsWhere(src, p)} GROUP BY 1`;
    }
    const col = src === "lacznie" ? "xp" : src === "kurs" ? "COALESCE((by->>'kurs')::int, 0) + COALESCE((by->>'czytanie')::int, 0)" : `COALESCE((by->>'${src}')::int, 0)`;
    return `SELECT user_id AS u, SUM(${col}) AS v FROM xp_days WHERE ${sinceDay(p)} GROUP BY 1 HAVING SUM(${col}) > 0`;
  }
  const testAcc = (s: WorldSource) =>
    `SELECT t.user_id AS u, ${ACC} AS acc FROM answers a JOIN tests t ON t.id = a.test_id WHERE ${testsWhere(s, p)}`;
  const kursAcc = `SELECT ls.user_id AS u, la.correct::int AS acc FROM learn_answers la JOIN learn_sessions ls ON ls.id = la.session_id
    WHERE ls.user_id IS NOT NULL AND ${since("la.answered_at", p)}`;
  const fiszki = `SELECT user_id AS u, known::int AS acc FROM flash_ratings WHERE ${since("at", p)}`;
  const open = (k: string) => `SELECT user_id AS u, score / NULLIF(max, 0) AS acc FROM open_attempts WHERE kind = '${k}' AND ${since("created_at", p)}`;
  const rows = tests ? testAcc(src) : src === "kurs" ? kursAcc : src === "fiszki" ? fiszki : src === "zadania" ? open("zadanie") : src === "eseje" ? open("esej")
    : `${testAcc("testy")} UNION ALL ${kursAcc}`;
  if (m === "skutecznosc") {
    const min = src === "zadania" || src === "eseje" ? 1 : MIN_ANSWERS;
    return `SELECT u, AVG(acc) * 100 AS v FROM (${rows}) r GROUP BY 1 HAVING COUNT(*) >= ${min}`;
  }
  // aktywność: liczba odpowiedzi / ocen / podejść (łącznie – wszystkie razem)
  const all = src === "lacznie" ? `${testAcc("testy")} UNION ALL ${kursAcc} UNION ALL ${fiszki} UNION ALL ${open("zadanie")} UNION ALL ${open("esej")}` : rows;
  return `SELECT u, COUNT(*) AS v FROM (${all}) r GROUP BY 1`;
}

async function compute(m: WorldMetric, src: WorldSource, p: WorldPeriod): Promise<Map<string, number>> {
  if (m === "seria") {
    const { rows } = await query<{ u: string; day: string; xp: number; goal: number }>(
      `SELECT x.user_id AS u, to_char(x.day, 'YYYY-MM-DD') AS day, x.xp, x.goal FROM xp_days x
       JOIN users us ON us.id = x.user_id AND us.activated_at IS NOT NULL
       WHERE x.day > (now() AT TIME ZONE 'Europe/Warsaw')::date - 400`);
    const by = new Map<string, { day: string; xp: number; goal: number }[]>();
    for (const r of rows) (by.get(r.u) ?? by.set(r.u, []).get(r.u)!).push(r);
    const today = todayWarsaw();
    const out = new Map<string, number>();
    for (const [u, days] of by) {
      const s = computeStreak(days, today).streak;
      if (s > 0) out.set(u, s);
    }
    return out;
  }
  const { rows } = await query<{ u: string; v: string }>(`SELECT x.u, x.v FROM (${sqlFor(m, src, p)}) x ${ACTIVE}`);
  return new Map(rows.map((r) => [r.u, Number(r.v)]));
}

function values(m: WorldMetric, src: WorldSource, p: WorldPeriod) {
  const key = metricHasSource(m) ? `${m}|${src}|${p}` : m;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.p;
  const pr = compute(m, src, p);
  cache.set(key, { at: Date.now(), p: pr });
  pr.catch(() => cache.delete(key));
  return pr;
}

export interface WorldStats extends WorldDist { metric: WorldMetric; source: WorldSource; period: WorldPeriod }

export async function getWorld(userId: string, m: WorldMetric, src: WorldSource, p: WorldPeriod): Promise<WorldStats> {
  const vals = await values(m, src, p);
  const me = vals.get(userId) ?? null;
  return { metric: m, source: src, period: p, ...distribution(m, [...vals.values()], me) };
}

/* ---------- ranking tygodniowy (tylko zapisane osoby, pod pseudonimem) ---------- */

export interface Ranking {
  week: string;
  me: { on: boolean; name: string | null; place: number | null; xp: number };
  top: { place: number; name: string; xp: number; me: boolean }[];
}

export async function getRanking(userId: string): Promise<Ranking> {
  const week = weekOf(todayWarsaw());
  const [{ rows }, { rows: meRows }] = await Promise.all([
    query<{ id: string; name: string; xp: string }>(
      `SELECT us.id, us.rank_name AS name, COALESCE(SUM(x.xp), 0) AS xp
       FROM users us LEFT JOIN xp_days x ON x.user_id = us.id AND x.day >= $1::date
       WHERE us.rank_opt AND us.rank_name IS NOT NULL AND us.activated_at IS NOT NULL
       GROUP BY us.id, us.rank_name ORDER BY xp DESC, us.rank_name`, [week]),
    query<{ rank_opt: boolean; rank_name: string | null; xp: string }>(
      `SELECT us.rank_opt, us.rank_name, COALESCE((SELECT SUM(xp) FROM xp_days WHERE user_id = us.id AND day >= $2::date), 0) AS xp
       FROM users us WHERE us.id = $1`, [userId, week]),
  ]);
  // miejsca jak w sporcie: ten sam wynik – to samo miejsce
  let place = 0, prev = -1;
  const all = rows.map((r, i) => {
    const xp = Number(r.xp);
    if (xp !== prev) { place = i + 1; prev = xp; }
    return { place, name: r.name, xp, me: r.id === userId };
  });
  const mine = all.find((r) => r.me);
  const m = meRows[0];
  return {
    week,
    me: { on: !!m?.rank_opt, name: m?.rank_name ?? null, place: mine?.place ?? null, xp: Number(m?.xp ?? 0) },
    top: all.slice(0, RANK_TOP),
  };
}

/** Zapis do rankingu pod pseudonimem albo wypisanie (pseudonim zostaje zapamiętany). */
export async function setRanking(userId: string, on: unknown, name: unknown): Promise<Ranking> {
  if (on === true) {
    const err = validRankName(name);
    if (err) throw new HttpError(400, err);
    const nm = (name as string).trim().replace(/\s+/g, " ");
    // NOT EXISTS łapie zwykły konflikt, unikalny indeks – równoczesne zapisy tego samego pseudonimu
    const { rowCount } = await query(
      `UPDATE users SET rank_opt = true, rank_name = $2 WHERE id = $1
       AND NOT EXISTS (SELECT 1 FROM users o WHERE lower(o.rank_name) = lower($2) AND o.id <> $1)`, [userId, nm])
      .catch((e: { code?: string }) => { if (e.code === "23505") return { rowCount: 0 }; throw e; });
    if (!rowCount) throw new HttpError(409, "Ten pseudonim jest już zajęty.");
  } else {
    await query("UPDATE users SET rank_opt = false WHERE id = $1", [userId]);
  }
  return getRanking(userId);
}
