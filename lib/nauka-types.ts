import type { Question } from "./types";

/** Rodzaj treści hasła w kursie. */
export type ItemKind = "pojecie" | "wzor" | "osoba" | "instytucja" | "data" | "przepis" | "zrozumienie";

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
  /** "zrozum" – lekcja „Zrozumienie” z ręcznymi wyjaśnieniami i ćwiczeniami (treść w zrozum.json). */
  type?: "zrozum";
}

export interface CourseUnit {
  id: string;
  topic: string;
  kind: ItemKind;
  title: string;
  lessons: string[];
  count: number;
  /** Liczba lekcji „Zrozumienie” w dziale. */
  zcount?: number;
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

/** Pod-lekcje lekcji „Zrozumienie”. */
export const SUBLESSONS_Z = [
  { no: 1, title: "Wyjaśnienie", hint: "krok po kroku, z pytaniami sprawdzającymi" },
  { no: 2, title: "Mechanizmy", hint: "co się stanie, gdy…, łańcuchy, wykresy" },
  { no: 3, title: "Obliczenia", hint: "zadania liczbowe i przykłady" },
  { no: 4, title: "Zastosowanie", hint: "studia przypadków" },
] as const;

export function subsFor(lesson: Pick<CourseLesson, "type">) {
  return lesson.type === "zrozum" ? SUBLESSONS_Z : SUBLESSONS;
}

/* ---------- treść lekcji „Zrozumienie” (data/nauka/zrozum.json, tools/nauka/build_zrozum.py) ---------- */

export interface GraphSpec {
  /** Rodzaj wykresu (sd, adas, islm, praca, pieniadz, waluta, fundusze). */
  k: string;
  /** Przesunięcia krzywych: dodatnie – w prawo, ujemne – w lewo. */
  shift: Record<string, number>;
  x?: string;
  y?: string;
  names: Record<string, string>;
}

export type ZEx =
  | { t: "karta"; title: string; text: string; w?: string; p?: string; g?: GraphSpec }
  | { t: "wybor"; q: string; opts: string[]; ok: number; why: string; ctx?: string; stat: ExerciseType }
  | { t: "multi"; q: string; opts: string[]; ok: number[]; why: string; ctx?: string; stat: ExerciseType }
  | { t: "pf"; s: string; v: boolean; why: string; ctx?: string; stat: ExerciseType }
  | { t: "luka"; text: string; opts: string[]; ok: number; why: string; ctx?: string; stat?: ExerciseType }
  | { t: "lancuch"; q: string; steps: string[]; why?: string; ctx?: string; stat?: ExerciseType }
  | { t: "kategorie"; q: string; cats: string[]; items: [string, number][]; why?: string; ctx?: string; stat?: ExerciseType }
  | { t: "liczba"; q: string; a: number; tol: number; unit?: string; steps: string[]; ctx?: string; stat?: ExerciseType }
  | { t: "wykres"; q: string; g: GraphSpec; opts: string[]; ok: number; why: string; ctx?: string; stat?: ExerciseType };

export interface ZSource {
  n: string;
  u: string;
  d: string;
}

export interface ZContent {
  goal: string;
  /** Id haseł słownika, których dotyczy lekcja. */
  refs: string[];
  sources: ZSource[];
  /** Ćwiczenia czterech pod-lekcji. */
  subs: ZEx[][];
}

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
  /** Lekcja „Zrozumienie”: cel, źródła, powiązane hasła i ćwiczenia bieżącej pod-lekcji. */
  zrozum?: { goal: string; sources: ZSource[]; refs: CourseItem[]; exercises: ZEx[] };
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
  | "pytanie"
  | "sprawdzenie"
  | "mechanizm"
  | "lancuch"
  | "kategorie"
  | "liczba"
  | "wykres"
  | "przypadek";

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
  sprawdzenie: "Pytania sprawdzające",
  mechanizm: "Mechanizmy (co się stanie, gdy…)",
  lancuch: "Łańcuchy przyczyna → skutek",
  kategorie: "Sortowanie do kategorii",
  liczba: "Obliczenia i przykłady",
  wykres: "Wykresy",
  przypadek: "Studia przypadków",
};

export interface AnswerLog {
  item: string;
  itemKind: ItemKind;
  exercise: ExerciseType;
  correct: boolean;
  ms: number;
}
