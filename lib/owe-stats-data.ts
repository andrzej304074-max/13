import { COURSE, OWE_STATS } from "@/data/nauka";
import type { ItemMeta } from "./owe-stats";

/** Dane statystyk OWE po stronie serwera: rekordy pytań i opisy haseł, działów, zagadnień. */
export function oweStatsData() {
  const used = new Set(OWE_STATS.flatMap((r) => r.items));
  const meta: Record<string, ItemMeta> = {};
  for (const id of used) {
    const it = COURSE.items[id];
    if (it) meta[id] = { title: it.t, kind: it.kind, topic: it.topic };
  }
  const usedTopics = new Set(OWE_STATS.map((r) => r.topic));
  return {
    recs: OWE_STATS,
    meta,
    topics: COURSE.topics.filter((t) => usedTopics.has(t.id)).map(({ id, title, emoji }) => ({ id, title, emoji })),
    units: Object.fromEntries(COURSE.units.map((u) => [u.id, { title: u.title, topic: u.topic }])),
    kinds: COURSE.kinds.filter((k) => k.id !== "zrozumienie"),
  };
}

/** Liczba pytań OWE (wszystkie edycje i etapy) dla każdego hasła – do tabeli pojęć. */
export function oweCountByItem(): Record<string, number> {
  const c: Record<string, number> = {};
  for (const r of OWE_STATS) for (const i of r.items) c[i] = (c[i] ?? 0) + 1;
  return c;
}
