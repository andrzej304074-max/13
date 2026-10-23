/**
 * Zapisane filtry (na koncie, wspólne dla urządzeń): które strony je zapamiętują i jakie wartości są dozwolone.
 * Wartość to tekst: parametry adresu strony (`od=30&do=35&rodzaj=wzor`) albo JSON formularza testu.
 */

export const PREF_KEYS = [
  "testy-owe", "testy-mix", "testy-slownik",
  "zadania", "eseje",
  "pojecia-tabela", "pojecia-statystyki", "pojecia-pokrycie",
  "stats", "stats-dzialy", "stats-dzialy-slownik", "stats-dzialy-ai", "stats-swiat", "nauka-statystyki",
  "fiszki",
] as const;
export type PrefKey = (typeof PREF_KEYS)[number];

export const isPrefKey = (v: unknown): v is PrefKey => typeof v === "string" && (PREF_KEYS as readonly string[]).includes(v);

/** Maks. długość wartości (filtry to krótkie teksty). */
export const PREF_MAX = 2000;

export function validPrefValue(v: unknown): v is string {
  return typeof v === "string" && v.length <= PREF_MAX && !/[\u0000-\u001f]/.test(v);
}
