import { QUESTIONS } from "@/data/questions";
import type { PublicQuestion, Question, QuestionType } from "./types";

const questions = QUESTIONS;
const byId = new Map(questions.map((q) => [q.id, q]));

export function getQuestion(id: string): Question | undefined {
  return byId.get(id);
}

export function countByType(type: QuestionType): number {
  return questions.filter((q) => q.type === type).length;
}

/** Losuje do `count` różnych pytań danego typu (Fisher–Yates). */
export function drawQuestions(type: QuestionType, count: number): Question[] {
  const pool = questions.filter((q) => q.type === type);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function toPublic(q: Question): PublicQuestion {
  return { id: q.id, type: q.type, edition: q.edition, question: q.question, options: q.options };
}
