import { AI_STATS, COURSE, OWE_STATS, SLOWNIK_STATS, XL_STATS } from "@/data/nauka";
import { query } from "./db";
import { aggregate, type MyAnswer, type MyFilter, type MyStats } from "./my-stats-core";
import type { ItemMeta } from "./owe-stats";
import { getQuestion } from "./questions";
import { ensureRescored } from "./rescore";
import { SLOWNIK_QUESTIONS } from "@/data/slownik";
import { sourceWhereSql, type QSource } from "./question-source";

/**
 * Odpowiedzi użytkownika na pytania z danego źródła (kolejność wg czasu), z dokładnością 0–1 – ze wszystkich testów,
 * także mieszanych „Wszystkie pytania” (źródło po pochodzeniu pytania, nie po zakładce testu).
 */
export async function loadAnswers(userId: string, src: QSource | null): Promise<MyAnswer[]> {
  await ensureRescored();
  const { rows } = await query<{ q: string; acc: number; at: Date }>(
    `SELECT a.question_id AS q,
       CASE WHEN a.skipped THEN 0 WHEN t.type = 'single' THEN (a.points = 2)::int ELSE a.points / 2 END AS acc,
       a.answered_at AS at
     FROM answers a JOIN tests t ON t.id = a.test_id
     WHERE t.user_id = $1${src ? ` AND ${sourceWhereSql("a.question_id", src)}` : ""}
     ORDER BY a.answered_at, a.test_id, a.question_id`,
    [userId],
  );
  return rows.map((r) => ({ q: r.q, acc: Number(r.acc), at: r.at.getTime() }));
}

export function itemMeta(): Record<string, ItemMeta> {
  const meta: Record<string, ItemMeta> = {};
  for (const [id, it] of Object.entries(COURSE.items)) if (it.kind !== "zrozumienie") meta[id] = { title: it.t, kind: it.kind, topic: it.topic };
  return meta;
}

/** Działy słownika (numer → nazwa) z opisów pytań („Słownik · dz. 1. Mikroekonomia · …”). */
const SECTIONS = (() => {
  const m = new Map<number, string>();
  for (const q of SLOWNIK_QUESTIONS) {
    const x = /dz\. (\d+)\. ([^·]+)/.exec(q.edition);
    if (x && q.section) m.set(q.section, x[2].trim());
  }
  return [...m].sort((a, b) => a[0] - b[0]).map(([id, name]) => ({ id, name }));
})();

/** Bez ostatnich odpowiedzi przy pojęciach – te (z treścią pytań) pobiera dopiero rozwinięcie pojęcia (`getMyItemAnswers`). */
export interface MyStatsPayload extends Omit<MyStats, "itemAnswers"> {
  names: { topics: Record<string, string>; units: Record<string, string>; items: Record<string, ItemMeta>; kinds: { id: string; title: string }[]; sections: { id: number; name: string }[] };
}

export interface MyItemAnswers {
  answers: MyStats["itemAnswers"][string];
  questions: Record<string, { edition: string; question: string }>;
}

const recsFor = (bank: QSource) => (bank === "owe" ? OWE_STATS : bank === "ai" ? AI_STATS : bank === "xl" ? XL_STATS : SLOWNIK_STATS);

/** Ostatnie odpowiedzi na pytania o jedno pojęcie (te same filtry co tabela) z treścią pytań. */
export async function getMyItemAnswers(userId: string, bank: QSource, f: MyFilter, item: string): Promise<MyItemAnswers> {
  const s = aggregate(await loadAnswers(userId, bank), recsFor(bank), itemMeta(), f);
  const answers = s.itemAnswers[item] ?? [];
  const questions: MyItemAnswers["questions"] = {};
  for (const a of answers) {
    const q = getQuestion(a.q);
    if (q) questions[a.q] = { edition: q.edition, question: q.question };
  }
  return { answers, questions };
}

export async function getMyStats(userId: string, bank: QSource, f: MyFilter): Promise<MyStatsPayload> {
  const meta = itemMeta();
  const { itemAnswers: _skip, ...s } = aggregate(await loadAnswers(userId, bank), recsFor(bank), meta, f);
  const items: Record<string, ItemMeta> = {};
  for (const r of s.items) items[r.id] = meta[r.id];
  return {
    ...s,
    names: {
      topics: Object.fromEntries(COURSE.topics.map((t) => [t.id, `${t.emoji} ${t.title.replace(/^Temat przewodni: /, "")}`])),
      units: Object.fromEntries(COURSE.units.map((u) => [u.id, u.title])),
      items,
      kinds: COURSE.kinds.filter((k) => k.id !== "zrozumienie"),
      sections: SECTIONS,
    },
  };
}
