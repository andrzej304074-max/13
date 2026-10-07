import { QUESTIONS } from "@/data/questions";
import { SLOWNIK_QUESTIONS } from "@/data/slownik";
import type { Bank, Origin, PublicQuestion, Question, QuestionType } from "./types";

const banks: Record<Bank, Question[]> = { owe: QUESTIONS, slownik: SLOWNIK_QUESTIONS };
const byId = new Map([...QUESTIONS, ...SLOWNIK_QUESTIONS].map((q) => [q.id, q]));

/** Zawężenie puli pytań słownikowych: pochodzenie (null – oba) i dział słownika (null – wszystkie). */
export interface DrawFilter {
  origin?: Origin | null;
  section?: number | null;
}

export function getQuestion(id: string): Question | undefined {
  return byId.get(id);
}

function pool(bank: Bank, type: QuestionType, f: DrawFilter = {}): Question[] {
  return banks[bank].filter(
    (q) => q.type === type && (!f.origin || q.origin === f.origin) && (!f.section || q.section === f.section),
  );
}

export function countByType(type: QuestionType, bank: Bank = "owe"): number {
  return pool(bank, type).length;
}

/** Liczby pytań słownikowych wg klucza `typ|pochodzenie|dział` – do podpowiedzi w formularzu. */
export function slownikCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const q of SLOWNIK_QUESTIONS) {
    const key = `${q.type}|${q.origin}|${q.section}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/** Losuje do `count` różnych pytań danego typu (Fisher–Yates). */
export function drawQuestions(type: QuestionType, count: number, bank: Bank = "owe", f: DrawFilter = {}): Question[] {
  const p = pool(bank, type, f);
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p.slice(0, count);
}

export function toPublic(q: Question): PublicQuestion {
  return { id: q.id, type: q.type, edition: q.edition, question: q.question, options: q.options };
}
