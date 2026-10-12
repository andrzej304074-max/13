import type { MyAnswer } from "./my-stats-core";

export interface Mastery { c: number; t: number; last: number }

/**
 * Opanowanie hasła: ćwiczenia w Nauce, odpowiedzi testowe (pytanie rozliczane na każde swoje pojęcie)
 * i samoocena fiszek – sumowane jako poprawne/wszystkie.
 */
export function combineMastery(
  learn: { item: string; c: number; t: number; last: number }[],
  tests: MyAnswer[],
  recItems: Map<string, string[]>,
  flash: { item: string; c: number; t: number; last: number }[],
): Record<string, Mastery> {
  const m: Record<string, Mastery> = {};
  const add = (i: string, c: number, t: number, last: number) => {
    const e = (m[i] ??= { c: 0, t: 0, last: 0 });
    e.c += c; e.t += t; e.last = Math.max(e.last, last);
  };
  for (const r of learn) add(r.item, r.c, r.t, r.last);
  for (const r of flash) add(r.item, r.c, r.t, r.last);
  for (const a of tests) for (const i of recItems.get(a.q) ?? []) add(i, a.acc, 1, a.at);
  for (const e of Object.values(m)) e.c = Math.round(e.c * 100) / 100;
  return m;
}
