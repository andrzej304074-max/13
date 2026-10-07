/** Ustawienia nauki zapamiętywane w przeglądarce (cel dzienny, ostatnia lekcja). */

export const DAILY_GOALS = [
  { xp: 50, label: "Luźno" },
  { xp: 100, label: "Normalnie" },
  { xp: 200, label: "Poważnie" },
  { xp: 300, label: "Intensywnie" },
] as const;
export const DEFAULT_GOAL = 100;

const GOAL_KEY = "owe:naukaGoal";
const LAST_KEY = "owe:naukaLast";

export function loadGoal(): number {
  try {
    const v = Number(localStorage.getItem(GOAL_KEY));
    if (DAILY_GOALS.some((g) => g.xp === v)) return v;
  } catch {}
  return DEFAULT_GOAL;
}

export function saveGoal(xp: number) {
  try {
    localStorage.setItem(GOAL_KEY, String(xp));
  } catch {}
}

export function rememberLesson(lesson: string, sub: number) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ lesson, sub }));
  } catch {}
}

export function lastLesson(): { lesson: string; sub: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) ?? "null");
    return v && typeof v.lesson === "string" && Number.isInteger(v.sub) ? v : null;
  } catch {
    return null;
  }
}

/** 75 000 ms → „1 min 15 s”, 3 700 000 ms → „1 h 1 min”. */
export function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${s % 60} s`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}
