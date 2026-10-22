import { describe, expect, it } from "vitest";
import { COURSE, OWE_STATS, SLOWNIK_STATS } from "@/data/nauka";
import { DEFAULT_FILTER, filterRecs, kindOk, type OweRec } from "@/lib/owe-stats";
import { oweStatsData } from "@/lib/owe-stats-data";

const meta = oweStatsData().meta;
const byId = new Map(OWE_STATS.map((r) => [r.id, r]));

describe("pytania obliczeniowe = wzór", () => {
  it("wykryte w Archiwum OWE i Słowniku", () => {
    expect(OWE_STATS.filter((r) => r.calc === 1).length).toBeGreaterThan(150);
    expect(SLOWNIK_STATS.filter((r) => r.calc === 1).length).toBeGreaterThan(150);
  });
  it("przykłady: obliczeniowe tak, faktograficzne nie", () => {
    // równanie popytu i podaży, mnożnik z równań autarkii, reguła 70, deflator
    for (const id of ["owe32-o-11", "owe34-c-25", "owe27-c-09", "owe26-s-11"]) expect(byId.get(id)?.calc, id).toBe(1);
    // stawki i terminy (liczby w odpowiedziach, ale bez liczenia)
    for (const id of ["owe21-s-28", "owe28-s-21", "owe29-o-16", "owe30-o-19", "owe36-s-16"]) expect(byId.get(id)?.calc, id).toBeUndefined();
  });
  it("przypisane do haseł-wzorów (większość)", () => {
    const calc = OWE_STATS.filter((r) => r.calc === 1);
    const withFormula = calc.filter((r) => r.items.some((i) => COURSE.items[i]?.kind === "wzor"));
    expect(withFormula.length / calc.length).toBeGreaterThan(0.75);
    expect(COURSE.items[byId.get("owe32-o-11")!.items[0]].t).toBe("Równowaga rynkowa – obliczanie");
  });
  it("filtr rodzaju: „wzory” obejmuje obliczeniowe, „pojęcia” je pomija", () => {
    const r = { items: [Object.keys(meta).find((i) => meta[i].kind === "pojecie")!], calc: 1 } as Pick<OweRec, "items" | "calc">;
    expect(kindOk(r, "wzor", meta)).toBe(true);
    expect(kindOk(r, "pojecie", meta)).toBe(false);
    expect(kindOk({ items: r.items }, "pojecie", meta)).toBe(true);
    const wz = filterRecs(OWE_STATS, { ...DEFAULT_FILTER, kind: "wzor" }, meta);
    const po = filterRecs(OWE_STATS, { ...DEFAULT_FILTER, kind: "pojecie" }, meta);
    for (const x of OWE_STATS.filter((q) => q.calc === 1)) expect(wz.includes(x) && !po.includes(x), x.id).toBe(true);
  });
});
