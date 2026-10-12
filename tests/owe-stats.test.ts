import { describe, expect, it } from "vitest";
import { OWE_STATS } from "@/data/nauka";
import { oweStatsData } from "@/lib/owe-stats-data";
import { DEFAULT_FILTER, filterFromParams, filterRecs, filterToParams, itemCounts, topicShares, unitCounts, type OweFilter } from "@/lib/owe-stats";

const D = oweStatsData();
const names = Object.fromEntries(D.topics.map((t) => [t.id, t.title]));
const F = (o: Partial<OweFilter>): OweFilter => ({ ...DEFAULT_FILTER, ...o });

describe("statystyki OWE", () => {
  it("cała baza: 1147 jednokrotnego i 509 wielokrotnego wyboru", () => {
    expect(OWE_STATS.length).toBe(1656);
    expect(filterRecs(OWE_STATS, F({ type: "single" }), D.meta).length).toBe(1147);
    expect(filterRecs(OWE_STATS, F({ type: "multi" }), D.meta).length).toBe(509);
    expect(filterRecs(OWE_STATS, F({ stages: ["c"] }), D.meta).length).toBe(509);
  });
  it("udziały działów sumują się do 100% i są posortowane", () => {
    const rows = topicShares(OWE_STATS, names, "desc");
    expect(Math.abs(rows.reduce((s, r) => s + r.pct, 0) - 100)).toBeLessThan(0.5);
    expect(rows.reduce((s, r) => s + r.n, 0)).toBe(1656);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].n).toBeGreaterThanOrEqual(rows[i].n);
    const asc = topicShares(OWE_STATS, names, "asc");
    expect(asc[0].n).toBeLessThanOrEqual(asc[asc.length - 1].n);
  });
  it("pojęcie: razem = jednokrotny + wielokrotny; filtr rodzaju i działu", () => {
    const rows = itemCounts(OWE_STATS, F({}), D.meta);
    for (const r of rows) expect(r.n).toBe(r.single + r.multi);
    const os = itemCounts(OWE_STATS, F({ kind: "osoba" }), D.meta);
    expect(os.length).toBeGreaterThan(0);
    expect(os.every((r) => r.kind === "osoba")).toBe(true);
    const mikro = itemCounts(OWE_STATS, F({ topic: "mikro" }), D.meta);
    expect(mikro.every((r) => r.topic === "mikro")).toBe(true);
    expect(unitCounts(OWE_STATS, F({ topic: "mikro" }), D.units).every((r) => r.topic === "mikro")).toBe(true);
  });
  it("filtry ↔ adres", () => {
    const f = F({ type: "multi", stages: ["c"], edFrom: 30, edTo: 39, topic: "makro", kind: "wzor", order: "asc" });
    expect(filterFromParams(new URLSearchParams(filterToParams(f)))).toEqual(f);
    expect(filterToParams(DEFAULT_FILTER)).toBe("");
  });
});
