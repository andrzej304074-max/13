export type QuestionType = "single" | "multi";

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
}

export interface TestState {
  id: string;
  type: QuestionType;
  questions: PublicQuestion[];
  answers: AnswerFeedback[];
  startedAt: string;
  deadline: string;
  finishedAt: string | null;
  score: number;
  maxScore: number;
  /** Poprawne odpowiedzi na wszystkie pytania — dostępne dopiero po zakończeniu testu. */
  solutions: Record<string, number[]> | null;
}
