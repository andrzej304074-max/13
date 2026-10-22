import type { QuestionType } from "./types";

export const OPTION_COUNT = 4;
export const MAX_POINTS_PER_QUESTION = 2;
export const ALLOWED_COUNTS = [30, 50] as const;
export type TestSize = (typeof ALLOWED_COUNTS)[number];
export const ENDLESS = "endless" as const;

/** Czas trwania testu w minutach: 30 pytań → 40 min, 50 pytań → 60 min. */
export function durationMinutes(count: TestSize): number {
  return count === 50 ? 60 : 40;
}

/** Jednokrotny wybór: +2 za poprawną, −1 za błędną, 0 bez odpowiedzi. */
export function scoreSingle(selected: number[], correct: number[]): number {
  if (selected.length === 0) return 0;
  return selected[0] === correct[0] ? 2 : -1;
}

/** Liczba pól A–D o poprawnym stanie (zaznaczone, gdy odpowiedź jest poprawna; puste, gdy błędna). */
export function multiHits(selected: number[], correct: number[]): number {
  let hits = 0;
  for (let i = 0; i < OPTION_COUNT; i++) if (selected.includes(i) === correct.includes(i)) hits++;
  return hits;
}

/** Wielokrotny wybór: 4 trafne pola – 2 pkt, 3 trafne – 1 pkt, mniej – 0. */
export function scoreMulti(selected: number[], correct: number[]): number {
  const hits = multiHits(selected, correct);
  return hits === OPTION_COUNT ? 2 : hits === OPTION_COUNT - 1 ? 1 : 0;
}

/** Dozwolone liczby pytań w jednym punkcie wykresu dokładności na stronie statystyk. */
export const BLOCK_SIZES = [10, 20, 25, 40, 50, 100, 150, 200] as const;
export const DEFAULT_BLOCK_SIZE = 100;

/** Jednostki do procentu poprawności: pytanie (jednokrotny) albo punkt (wielokrotny – maks. 2 na pytanie). */
export const UNITS_PER_QUESTION: Record<QuestionType, number> = { single: 1, multi: MAX_POINTS_PER_QUESTION };

/** Liczba poprawnych jednostek w odpowiedzi: 1/0 dla jednokrotnego, zdobyte punkty (0–2) dla wielokrotnego. */
export function correctUnits(type: QuestionType, points: number, skipped = false): number {
  if (skipped) return 0;
  return type === "single" ? (points === 2 ? 1 : 0) : Math.max(0, Math.round(points));
}

export function scoreAnswer(type: QuestionType, selected: number[], correct: number[]): number {
  return type === "single" ? scoreSingle(selected, correct) : scoreMulti(selected, correct);
}

/** Zwraca opis błędu albo null, gdy zaznaczenie jest poprawne składniowo. */
export function validateSelection(type: QuestionType, selected: unknown): string | null {
  if (!Array.isArray(selected)) return "Zaznaczenie musi być tablicą.";
  if (!selected.every((s) => Number.isInteger(s) && s >= 0 && s < OPTION_COUNT)) {
    return "Nieprawidłowy indeks odpowiedzi.";
  }
  if (new Set(selected).size !== selected.length) return "Powtórzona odpowiedź.";
  // puste zaznaczenie jest dozwolone – sprawdzenie bez odpowiedzi daje 0 pkt i pokazuje poprawną
  if (type === "single" && selected.length > 1) return "Zaznacz dokładnie jedną odpowiedź.";
  return null;
}
