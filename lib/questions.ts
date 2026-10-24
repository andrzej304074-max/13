import { QUESTIONS } from "@/data/questions";
import { SLOWNIK_QUESTIONS, XL_QUESTIONS } from "@/data/slownik";
import { AI_QUESTIONS } from "@/data/ai";
import { metaOk, type MetaFilter } from "./question-meta";
import { sourceOf } from "./question-source";
import type { Bank, Origin, PublicQuestion, Question, QuestionType } from "./types";

// „mix” – jeden formularz „Pytania” (od Planu IV wszystkie nowe testy): źródła wybiera filtr `sources`.
// owe / slownik – banki starych testów (dolosowanie w trybie bez limitu); słownik obejmuje wtedy także Hasło XL.
const banks: Record<Bank, Question[]> = {
  owe: QUESTIONS, slownik: [...SLOWNIK_QUESTIONS, ...XL_QUESTIONS], ai: AI_QUESTIONS,
  mix: [...QUESTIONS, ...AI_QUESTIONS, ...SLOWNIK_QUESTIONS, ...XL_QUESTIONS],
};
const byId = new Map(banks.mix.map((q) => [q.id, q]));

/**
 * Filtr losowania: filtry formularza (MetaFilter – w tym filtry poszczególnych źródeł), etap i pola starych testów Słownika
 * (pochodzenie i dział – dla wszystkich pytań banku).
 */
export interface DrawFilter extends MetaFilter {
  origin?: Origin | null;
  section?: number | null;
  /** Pytania OWE jednokrotnego wyboru: tylko etap szkolny (`s`) albo okręgowy (`o`). */
  stage?: Stage | null;
  /** „Tylko moje błędy”: dozwolone pytania w tej kolejności (od najdawniejszego błędu) – bez losowania. */
  only?: string[] | null;
  /** Zapisany w teście znacznik „tylko moje błędy” (lista `only` liczona na nowo przy dolosowaniu). */
  mistakes?: boolean | null;
}

/** Etap zawodów OWE: szkolny i okręgowy (jednokrotny wybór), centralny (wielokrotny). */
export type Stage = "s" | "o";
export const STAGES: Stage[] = ["s", "o"];
export const isStage = (v: unknown): v is Stage => v === "s" || v === "o";
/** Etap z id pytania (`owe23-s-01` → `s`); null dla pytań centralnych i słownikowych. */
export function stageOf(id: string): Stage | null {
  const m = /^owe\d+-([so])-/.exec(id);
  return m ? (m[1] as Stage) : null;
}
/** Wzorzec SQL (~) dla id pytań danego etapu. */
export const stageRegex = (s: Stage) => `^owe[0-9]+-${s}-`;

export function getQuestion(id: string): Question | undefined {
  return byId.get(id);
}

const hasMeta = (f: MetaFilter) => !!(f.sources?.length || f.edFrom || f.edTo || f.stages?.length || f.topic || f.kind || (f.theme && f.theme !== "all"));

/** Filtry jednego źródła: rodzaj i dział Słownika, rodzaj Hasła XL (pytania innych źródeł przechodzą bez zmian). */
function subOk(q: Question, f: DrawFilter): boolean {
  if (!f.slOrigin && !f.slSection && !f.xlOrigin) return true;
  const s = sourceOf(q.id);
  if (s === "slownik") return (!f.slOrigin || q.origin === f.slOrigin) && (!f.slSection || q.section === f.slSection);
  if (s === "xl") return !f.xlOrigin || q.origin === f.xlOrigin;
  return true;
}

function pool(bank: Bank, type: QuestionType, f: DrawFilter = {}): Question[] {
  const meta = hasMeta(f);
  if (f.only) {
    const rank = new Map(f.only.map((id, i) => [id, i]));
    return banks[bank].filter((q) => rank.has(q.id) && q.type === type && subOk(q, f) && (!meta || metaOk(q.id, f)))
      .sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  }
  return banks[bank].filter(
    (q) => q.type === type && subOk(q, f) && (!f.origin || q.origin === f.origin) && (!f.section || q.section === f.section) && (!f.stage || stageOf(q.id) === f.stage)
      && (!meta || metaOk(q.id, f)),
  );
}

export function countByType(type: QuestionType, bank: Bank = "owe", f: DrawFilter = {}): number {
  return pool(bank, type, f).length;
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
  if (f.only) return p.slice(0, count);
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p.slice(0, count);
}

export function toPublic(q: Question): PublicQuestion {
  return { id: q.id, type: q.type, edition: q.edition, question: q.question, options: q.options };
}
