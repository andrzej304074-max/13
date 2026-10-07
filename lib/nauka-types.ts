import type { Question } from "./types";

/** Rodzaj treści hasła w kursie. */
export type ItemKind = "pojecie" | "wzor" | "osoba" | "instytucja" | "data" | "przepis";

export interface CourseItem {
  id: string;
  /** Pełny tytuł hasła, skrócony tytuł (bez nawiasów), definicja, wzór, przykład, uwaga. */
  t: string;
  s: string;
  d: string;
  w?: string | null;
  p?: string | null;
  u?: string | null;
  kind: ItemKind;
  topic: string;
  sec: number;
  /** Nazwy alternatywne (z nawiasów w tytule) i słowa kluczowe. */
  al: string[];
  k: string[];
  /** Definicja z zamaskowaną nazwą hasła („…”) – do ćwiczeń „które to pojęcie?”. */
  m: string;
}

export interface CourseLesson {
  id: string;
  unit: string;
  topic: string;
  kind: ItemKind;
  no: number;
  title: string;
  items: string[];
  questions: string[];
}

export interface CourseUnit {
  id: string;
  topic: string;
  kind: ItemKind;
  title: string;
  lessons: string[];
  count: number;
}

export interface CourseTopic {
  id: string;
  title: string;
  emoji: string;
  color: string;
}

export interface Course {
  topics: CourseTopic[];
  kinds: { id: ItemKind; title: string }[];
  units: CourseUnit[];
  lessons: Record<string, CourseLesson>;
  items: Record<string, CourseItem>;
}

/** Pod-lekcje: 1 Poznaj, 2 Ćwicz, 3 Utrwal, 4 Sprawdzian. */
export const SUBLESSONS = [
  { no: 1, title: "Poznaj", hint: "fiszki i rozpoznawanie" },
  { no: 2, title: "Ćwicz", hint: "pary, luki, prawda/fałsz" },
  { no: 3, title: "Utrwal", hint: "wpisywanie, kolejność, wzory" },
  { no: 4, title: "Sprawdzian", hint: "pytania olimpijskie i słownikowe" },
] as const;

export const MAX_LEVEL = 5;
/** Skuteczność pod-lekcji (0–1), od której liczy się ona do korony. */
export const PASS_ACCURACY = 0.8;

/** Dane lekcji wysyłane do odtwarzacza ćwiczeń. */
export interface LessonPayload {
  lesson: CourseLesson;
  unitTitle: string;
  topic: CourseTopic;
  sub: number;
  items: CourseItem[];
  /** Hasła pomocnicze do dystraktorów (ten sam dział i rodzaj w temacie). */
  pool: CourseItem[];
  questions: Question[];
  /** true dla powtórki najsłabszych haseł (bez zapisu do konkretnej lekcji). */
  review?: boolean;
}

export type ExerciseType =
  | "fiszka"
  | "wybor"
  | "pary"
  | "luka"
  | "prawda-falsz"
  | "wpisz"
  | "kolejnosc"
  | "wzor"
  | "pytanie";

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  fiszka: "Fiszki",
  wybor: "Wybór pojęcia/definicji",
  pary: "Łączenie par",
  luka: "Uzupełnianie luk",
  "prawda-falsz": "Prawda czy fałsz",
  wpisz: "Wpisywanie odpowiedzi",
  kolejnosc: "Układanie kolejności",
  wzor: "Wzory",
  pytanie: "Pytania testowe",
};

export interface AnswerLog {
  item: string;
  itemKind: ItemKind;
  exercise: ExerciseType;
  correct: boolean;
  ms: number;
}
