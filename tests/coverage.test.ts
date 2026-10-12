import { describe, expect, it } from "vitest";
import { OWE_STATS, SLOWNIK_STATS } from "@/data/nauka";
import { combineMastery } from "@/lib/mastery-core";
import { aggregate, DEFAULT_MY_FILTER, myFilterFromParams, myFilterToParams, type MyAnswer } from "@/lib/my-stats-core";
import { oweStatsData } from "@/lib/owe-stats-data";
import { coverage, DEFAULT_FILTER, level, type ItemMeta, type OweFilter, type OweRec } from "@/lib/owe-stats";

const meta: Record<string, ItemMeta> = {
  a: { title: "A", kind: "pojecie", topic: "mikro" },
  b: { title: "B", kind: "pojecie", topic: "mikro" },
  c: { title: "C", kind: "osoba", topic: "makro" },
};
const R = (id: string, ed: number, items: string[], t: "single" | "multi" = "single"): OweRec =>
  ({ id, t, ed, st: "s", topic: "mikro", unit: "u", items });
const recs = [R("q1", 21, ["a"]), R("q2", 22, ["a", "b"]), R("q3", 23, ["c"]), R("q4", 26, ["b"]), R("q5", 26, ["a", "c"])];
const F = (o: Partial<OweFilter>): OweFilter => ({ ...DEFAULT_FILTER, ...o });

describe("pokrycie olimpiad", () => {
  it("pierwsza edycja to same nowe pojęcia, kolejne liczą powtórki", () => {
    const c = coverage(recs, F({}), meta);
    expect(c.rows.map((r) => [r.ed, r.repeat, r.fresh])).toEqual([[21, 0, 1], [22, 1, 1], [23, 0, 1], [26, 3, 0]]);
    expect(c.total).toMatchObject({ items: 7, repeat: 4, fresh: 3, questions: 5, qRepeat: 2 });
    expect(c.repeated.find((r) => r.id === "a")).toMatchObject({ earlier: 2, editions: [21, 22] });
    expect(c.fresh.map((x) => x.id + x.ed)).toEqual(["a21", "b22", "c23"]);
  });
  it("okno 3 edycji: pojęcie sprzed 4 lat jest nowe", () => {
    const c = coverage(recs, F({ edFrom: 26, edTo: 26 }), meta, 3);
    expect(c.rows[0]).toMatchObject({ ed: 26, repeat: 1, fresh: 2 }); // c (XXIII) tak, a i b (XXI–XXII) nie
  });
  it("filtr działu i rodzaju zawęża pojęcia", () => {
    expect(coverage(recs, F({ kind: "osoba" }), meta).total).toMatchObject({ items: 2, repeat: 1 });
    expect(coverage(recs, F({ topic: "mikro" }), meta).rows.map((r) => r.ed)).toEqual([21, 22, 26]);
  });
  it("prawdziwe dane: każda edycja ma pojęcia, XXI w 100% nowe, suma = powtórki + nowe", () => {
    const D = oweStatsData();
    const c = coverage(OWE_STATS, DEFAULT_FILTER, D.meta);
    expect(c.rows.length).toBe(19);
    expect(c.rows[0]).toMatchObject({ ed: 21, repeat: 0 });
    for (const r of c.rows) expect(r.repeat + r.fresh).toBe(r.items);
    expect(c.rows[18].pct).toBeGreaterThan(30);
  });
});

describe("moje statystyki i opanowanie", () => {
  const now = Date.UTC(2026, 9, 12);
  const day = 86400000;
  const ans: MyAnswer[] = [
    { q: "q1", acc: 1, at: now - 60 * day },
    { q: "q2", acc: 0, at: now - 40 * day },
    { q: "q5", acc: 0.5, at: now - 2 * day },
    { q: "zz", acc: 1, at: now - day }, // pytanie spoza bazy – pomijane
  ];
  it("agreguje działy, zagadnienia i pojęcia z dokładnością pytań", () => {
    const s = aggregate(ans, recs, meta, DEFAULT_MY_FILTER, now);
    expect(s.total).toMatchObject({ answers: 3, percent: 50 });
    const a = s.items.find((r) => r.id === "a")!;
    expect(a).toMatchObject({ answers: 3, percent: 50, recent: 50 });
    expect(s.items[0].percent).toBeLessThanOrEqual(s.items[s.items.length - 1].percent); // najsłabsze najpierw
    expect(s.itemAnswers.a[0].q).toBe("q5");
  });
  it("okres 30 dni i typ pytań", () => {
    expect(aggregate(ans, recs, meta, { ...DEFAULT_MY_FILTER, range: "30d" }, now).total.answers).toBe(1);
    expect(aggregate(ans, recs, meta, { ...DEFAULT_MY_FILTER, type: "multi" }, now).total.answers).toBe(0);
  });
  it("filtry ↔ adres", () => {
    const f = { ...DEFAULT_MY_FILTER, type: "single" as const, range: "7d" as const, topic: "mikro", stages: ["c" as const], edFrom: 30, origin: "m" as const, sec: 3 };
    expect(myFilterFromParams(new URLSearchParams(myFilterToParams(f)))).toEqual(f);
    expect(myFilterToParams(DEFAULT_MY_FILTER)).toBe("");
  });
  it("progi kolorów", () => {
    expect([level(4, 5), level(3, 5), level(2, 5), level(1, 1)]).toEqual(["good", "mid", "weak", "none"]);
  });
  it("opanowanie łączy naukę, testy (pytanie → każde pojęcie) i fiszki", () => {
    const m = combineMastery([{ item: "a", c: 3, t: 4, last: 1 }], ans, new Map(recs.map((r) => [r.id, r.items])), [{ item: "c", c: 0, t: 1, last: 5 }]);
    expect(m.a).toMatchObject({ c: 4.5, t: 7 });
    expect(m.c).toMatchObject({ c: 0.5, t: 2 });
  });
  it("pytania słownikowe: 4686 rekordów, każdy z działem i zagadnieniem", () => {
    expect(SLOWNIK_STATS.length).toBe(4686);
    expect(SLOWNIK_STATS.every((r) => r.topic && r.unit)).toBe(true);
    expect(SLOWNIK_STATS.filter((r) => r.items.length).length).toBeGreaterThan(4600);
  });
});
