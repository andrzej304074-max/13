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

/** Wielokrotny wybór: 0,5 pkt za każde pole A–D o poprawnym stanie zaznaczenia. */
export function scoreMulti(selected: number[], correct: number[]): number {
  let points = 0;
  for (let i = 0; i < OPTION_COUNT; i++) {
    if (selected.includes(i) === correct.includes(i)) points += 0.5;
  }
  return points;
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
  if (type === "single" && selected.length !== 1) return "Zaznacz dokładnie jedną odpowiedź.";
  return null;
}
