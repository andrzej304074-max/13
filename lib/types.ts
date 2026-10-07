export type QuestionType = "single" | "multi";

/** "timed" – 30/50 pytań z limitem czasu; "endless" – bez limitu pytań i czasu, bez cofania. */
export type TestMode = "timed" | "endless";

/** Baza pytań: "owe" – pytania z olimpiad, "slownik" – pytania ułożone na podstawie słownika pojęć (docs/slownik-owe.pdf). */
export type Bank = "owe" | "slownik";

/** Pochodzenie pytań słownikowych: generowane automatycznie z haseł albo pisane ręcznie. */
export type Origin = "auto" | "manual";

export interface Question {
  id: string;
  type: QuestionType;
  /** Edycja olimpiady, z której pochodzi pytanie, np. "LXVI (2022/2023)". */
  edition: string;
  question: string;
  /** Zawsze 4 opcje: A, B, C, D. */
  options: string[];
  /** Indeksy (0–3) poprawnych opcji. Dla "single" dokładnie jeden. */
  correct: number[];
  /** Wyjaśnienie poprawnej odpowiedzi wraz z definicją. */
  explanation: string;
  /** Tylko pytania słownikowe: numer działu słownika i pochodzenie pytania. */
  section?: number;
  origin?: Origin;
}

/** Pytanie wysyłane do klienta przed sprawdzeniem — bez odpowiedzi. */
export type PublicQuestion = Omit<Question, "correct" | "explanation">;

export interface AnswerFeedback {
  questionId: string;
  selected: number[];
  correct: number[];
  points: number;
  explanation: string;
  /** Pytanie pominięte w trybie „bez limitu” (0 pkt z 2 możliwych). */
  skipped: boolean;
}

export interface TestState {
  id: string;
  bank: Bank;
  type: QuestionType;
  mode: TestMode;
  questions: PublicQuestion[];
  answers: AnswerFeedback[];
  startedAt: string;
  /** null w trybie „bez limitu”. */
  deadline: string | null;
  finishedAt: string | null;
  score: number;
  maxScore: number;
  /** Poprawne jednostki (pytania w jednokrotnym, pola A–D w wielokrotnym) i ich łączna liczba – podstawa procentu. */
  correct: number;
  total: number;
  /** Poprawne odpowiedzi na wszystkie pytania — dostępne dopiero po zakończeniu testu. */
  solutions: Record<string, number[]> | null;
}
