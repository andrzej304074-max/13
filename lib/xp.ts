import { query } from "./db";
import { HttpError } from "./tests";
import { computeStreak, DEFAULT_GOAL, isGoal, shiftDay, todayWarsaw, XP_SOURCES, type StreakInfo, type XpSource } from "./xp-core";

const TODAY = "(now() AT TIME ZONE 'Europe/Warsaw')::date";

/**
 * Dolicza XP do dzisiejszego dnia użytkownika – jedno zapytanie. `cap` – dzienny limit źródła (np. fiszki): dolicza się
 * tylko tyle, ile do limitu zostało. Błąd zapisu XP nie psuje właściwej akcji (odpowiedzi, oceny) – jest tylko logowany.
 */
export async function addXp(userId: string, src: XpSource, xp: number, cap: number | null = null): Promise<void> {
  if (!(xp > 0)) return;
  try {
    await query(
      `WITH cur AS (SELECT COALESCE((by->>$2)::int, 0) AS v FROM xp_days WHERE user_id = $1 AND day = ${TODAY}),
            amt AS (SELECT CASE WHEN $4::int IS NULL THEN $3::int ELSE GREATEST(0, LEAST($3::int, $4::int - COALESCE((SELECT v FROM cur), 0))) END AS a)
       INSERT INTO xp_days (user_id, day, xp, by, goal)
       SELECT $1, ${TODAY}, amt.a, jsonb_build_object($2::text, amt.a), u.daily_goal FROM amt, users u WHERE u.id = $1 AND amt.a > 0
       ON CONFLICT (user_id, day) DO UPDATE SET
         xp = xp_days.xp + EXCLUDED.xp,
         by = xp_days.by || jsonb_build_object($2::text, COALESCE((xp_days.by->>$2)::int, 0) + EXCLUDED.xp),
         goal = EXCLUDED.goal`,
      [userId, src, Math.round(xp), cap],
    );
  } catch (e) {
    console.error("addXp", e);
  }
}

export interface XpSummary extends StreakInfo {
  goal: number;
  today: { xp: number; by: Partial<Record<XpSource, number>> };
  /** Ostatnie 7 dni (od najstarszego). */
  week: { day: string; xp: number; goal: number; met: boolean; frozen: boolean }[];
  total: number;
}

export async function getXpSummary(userId: string): Promise<XpSummary> {
  const [{ rows }, { rows: u }] = await Promise.all([
    query<{ day: string; xp: number; goal: number; by: Record<string, number> }>(
      "SELECT to_char(day, 'YYYY-MM-DD') AS day, xp, goal, by FROM xp_days WHERE user_id = $1 ORDER BY day", [userId]),
    query<{ daily_goal: number }>("SELECT daily_goal FROM users WHERE id = $1", [userId]),
  ]);
  const goal = u[0]?.daily_goal ?? DEFAULT_GOAL;
  const today = todayWarsaw();
  const s = computeStreak(rows, today);
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const t = byDay.get(today);
  const by: Partial<Record<XpSource, number>> = {};
  for (const k of XP_SOURCES) if (t?.by?.[k]) by[k] = Number(t.by[k]);
  const frozen = new Set(s.frozen);
  return {
    ...s,
    goal,
    today: { xp: t?.xp ?? 0, by },
    week: Array.from({ length: 7 }, (_, i) => {
      const day = shiftDay(today, i - 6);
      const r = byDay.get(day);
      const g = day === today ? goal : r?.goal ?? goal;
      return { day, xp: r?.xp ?? 0, goal: g, met: !!r && r.xp >= g, frozen: frozen.has(day) };
    }),
    total: rows.reduce((a, r) => a + r.xp, 0),
  };
}

/** Zmiana celu dziennego – od dziś (dzisiejszy wpis dostaje nowy cel, przeszłe dni zachowują swój). */
export async function setDailyGoal(userId: string, goal: unknown): Promise<XpSummary> {
  if (!isGoal(goal)) throw new HttpError(400, "Nieprawidłowy cel dzienny.");
  await query("UPDATE users SET daily_goal = $2 WHERE id = $1", [userId, goal]);
  await query(`UPDATE xp_days SET goal = $2 WHERE user_id = $1 AND day = ${TODAY}`, [userId, goal]);
  return getXpSummary(userId);
}

