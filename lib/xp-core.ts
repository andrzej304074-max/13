/**
 * Wspólny cel dzienny i seria dla całej aplikacji (bez bazy – używane na serwerze i w testach).
 * XP dnia zbierają wszystkie aktywności; dzień liczy się do serii, gdy XP ≥ cel obowiązujący tego dnia.
 * Jedno „zamrożenie” na tydzień (pon.–niedz.): pierwszy dzień tygodnia bez celu nie przerywa serii (ale też jej nie zwiększa).
 */

export const XP_SOURCES = ["kurs", "testy", "fiszki", "zadania", "eseje", "czytanie"] as const;
export type XpSource = (typeof XP_SOURCES)[number];
export const XP_SOURCE_LABEL: Record<XpSource, string> = {
  kurs: "Kurs", testy: "Testy", fiszki: "Fiszki", zadania: "Zadania", eseje: "Eseje", czytanie: "Podręcznik",
};

export const DAILY_GOALS = [
  { xp: 50, label: "Luźno" },
  { xp: 100, label: "Normalnie" },
  { xp: 200, label: "Poważnie" },
  { xp: 300, label: "Intensywnie" },
] as const;
export const DEFAULT_GOAL = 100;
export const isGoal = (v: unknown): v is number => DAILY_GOALS.some((g) => g.xp === v);

/** XP za sprawdzone pytanie testu (pominięte i bez zaznaczenia – 0). Punkty: 0–2 (jednokrotny 0/2, wielokrotny 0/1/2). */
export function testXp(points: number, skipped: boolean, empty: boolean): number {
  if (skipped || empty) return 0;
  return points >= 2 ? 10 : points > 0 ? 5 : 2;
}
export const FLASH_XP = 2;
/** Fiszki: najwyżej tyle XP dziennie (ocenianie bez czytania nie nabija celu). */
export const FLASH_DAILY_CAP = 100;
export const OPEN_XP = { zadanie: 30, esej: 50 } as const;

export interface XpDay { day: string; xp: number; goal: number }

/** Data RRRR-MM-DD przesunięta o n dni. */
export function shiftDay(d: string, n: number): string {
  const t = new Date(`${d}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}
/** Poniedziałek tygodnia danego dnia (klucz tygodnia zamrożeń). */
export function weekOf(d: string): string {
  const t = new Date(`${d}T12:00:00Z`);
  return shiftDay(d, -((t.getUTCDay() + 6) % 7));
}
/** Dzisiejsza data w strefie Europe/Warsaw. */
export function todayWarsaw(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export interface StreakInfo {
  /** Bieżąca seria (dni z osiągniętym celem). */
  streak: number;
  /** Najdłuższa seria w historii. */
  record: number;
  /** Czy dzisiejszy cel już osiągnięty. */
  todayMet: boolean;
  /** Dni uratowane zamrożeniem w bieżącej serii (RRRR-MM-DD). */
  frozen: string[];
  /** Czy zamrożenie z bieżącego tygodnia jest jeszcze dostępne. */
  freezeLeft: boolean;
}

/**
 * Seria liczona od dziś wstecz. Dziś bez celu nie przerywa serii (dzień jeszcze trwa). Dzień bez celu przerywa ją,
 * chyba że w jego tygodniu nie zużyto jeszcze zamrożenia – wtedy zamrożenie się zużywa. Zamrożenie ratuje tylko dzień
 * między dniami z celem (nie wydłuża serii w przeszłość poza pierwszy dzień z celem).
 */
export function computeStreak(days: XpDay[], today: string): StreakInfo {
  const met = new Map(days.map((d) => [d.day, d.xp >= d.goal && d.xp > 0]));
  const todayMet = met.get(today) === true;
  const walk = (from: string, stopBefore: string | null) => {
    let n = 0;
    const used = new Set<string>();
    const frozen: string[] = [];
    let d = from;
    let pending: string[] = [];
    for (let guard = 0; guard < 4000; guard++) {
      if (stopBefore && d < stopBefore) break;
      if (met.get(d)) {
        n++;
        frozen.push(...pending);
        pending = [];
      } else {
        const w = weekOf(d);
        if (used.has(w)) break;
        used.add(w);
        pending.push(d);
      }
      d = shiftDay(d, -1);
    }
    return { n, frozen };
  };
  const first = days.length ? days.reduce((m, d) => (d.day < m ? d.day : m), days[0].day) : today;
  const cur = walk(todayMet ? today : shiftDay(today, -1), first);
  // zamrożenie dostępne, jeśli w tym tygodniu żaden dzień serii nie został nim uratowany
  const thisWeek = weekOf(today);
  const freezeLeft = !cur.frozen.some((d) => weekOf(d) === thisWeek);
  // rekord: najdłuższa seria kończąca się w dowolnym dniu z celem
  let record = cur.n;
  for (const d of days) {
    if (!met.get(d.day) || met.get(shiftDay(d.day, 1))) continue;
    record = Math.max(record, walk(d.day, first).n);
  }
  return { streak: cur.n, record, todayMet, frozen: cur.frozen, freezeLeft };
}
