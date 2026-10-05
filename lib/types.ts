export type QuestionType = "single" | "multi";

/** "timed" – 30/50 pytań z limitem czasu; "endless" – bez limitu pytań i czasu, bez cofania. */
export type TestMode = "timed" | "endless";

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
  /** Poprawne odpowiedzi na wszystkie pytania — dostępne dopiero po zakończeniu testu. */
  solutions: Record<string, number[]> | null;
}
