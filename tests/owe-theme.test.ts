import { describe, expect, it } from "vitest";
import theme from "@/data/olimpiada/theme.json";
import overrides from "@/data/olimpiada/theme-overrides.json";
import { OWE_STATS } from "@/data/nauka";
import { SETS } from "@/data/otwarte";
import {
  DEFAULT_FILTER, coverage, filterFromParams, filterRecs, filterToParams, openStats, themeShares, type OpenRec,
} from "@/lib/owe-stats";
import { oweStatsData } from "@/lib/owe-stats-data";
import { DEFAULT_MY_FILTER, myFilterFromParams, myFilterToParams } from "@/lib/my-stats-core";

const meta = oweStatsData().meta;

describe("klasyfikacja hasła przewodniego", () => {
  it("theme.json wskazuje tylko istniejące pytania, eseje i zadania", () => {
    const q = new Set(OWE_STATS.map((r) => r.id));
    for (const id of theme.questions) expect(q.has(id), id).toBe(true);
    const open = new Set(SETS.flatMap((s) => [...s.essays.map((e) => e.id), ...(s.task ? [s.task.id] : [])]));
    for (const id of theme.open) expect(open.has(id), id).toBe(true);
    for (const id of Object.keys(overrides)) expect(q.has(id) || open.has(id), id).toBe(true);
  });
  it("pytania z theme.json mają pole th, pozostałe nie", () => {
    const set = new Set(theme.questions);
    expect(OWE_STATS.filter((r) => r.th === 1).length).toBe(set.size);
    for (const r of OWE_STATS) expect(r.th === 1).toBe(set.has(r.id));
  });
  it("ręczne poprawki są uwzględnione", () => {
    for (const [id, v] of Object.entries(overrides)) {
      if (id.startsWith("owe-")) expect(theme.open.includes(id)).toBe(v);
      else expect(theme.questions.includes(id)).toBe(v);
    }
  });
});

describe("filtr hasła przewodniego", () => {
  it("„z hasła” + „bez hasła” = wszystkie", () => {
    const all = filterRecs(OWE_STATS, DEFAULT_FILTER, meta);
    const yes = filterRecs(OWE_STATS, { ...DEFAULT_FILTER, theme: "yes" }, meta);
    const no = filterRecs(OWE_STATS, { ...DEFAULT_FILTER, theme: "no" }, meta);
    expect(yes.length + no.length).toBe(all.length);
    expect(yes.every((r) => r.th === 1)).toBe(true);
    expect(no.some((r) => r.th === 1)).toBe(false);
    expect(yes.length).toBe(theme.questions.length);
  });
  it("parametr adresu haslo=tak|nie", () => {
    const f = filterFromParams(new URLSearchParams("haslo=tak&od=30"));
    expect(f.theme).toBe("yes");
    expect(filterToParams(f)).toContain("haslo=tak");
    expect(filterFromParams(new URLSearchParams("haslo=nie")).theme).toBe("no");
    expect(filterFromParams(new URLSearchParams("haslo=xyz")).theme).toBe("all");
    expect(filterToParams(DEFAULT_FILTER)).toBe("");
  });
  it("udział pytań z hasła na edycję sumuje się do całości", () => {
    const s = themeShares(filterRecs(OWE_STATS, DEFAULT_FILTER, meta));
    expect(s.rows.length).toBe(19);
    expect(s.total.th).toBe(theme.questions.length);
    expect(s.rows.reduce((a, r) => a + r.n, 0)).toBe(s.total.n);
    for (const r of s.rows) expect(r.pct).toBeCloseTo((r.th / r.n) * 100, 0);
  });
  it("pokrycie: filtr hasła zawęża tylko badane pytania", () => {
    const all = coverage(OWE_STATS, DEFAULT_FILTER, meta);
    const yes = coverage(OWE_STATS, { ...DEFAULT_FILTER, theme: "yes" }, meta);
    expect(yes.total.questions).toBeLessThan(all.total.questions);
    expect(yes.total.questions).toBeGreaterThan(0);
  });
  it("moje statystyki: parametr haslo", () => {
    expect(myFilterFromParams(new URLSearchParams("haslo=nie")).theme).toBe("no");
    expect(myFilterToParams({ ...DEFAULT_MY_FILTER, theme: "yes" })).toBe("haslo=tak");
  });
});

describe("eseje i zadania – statystyki osobno od testów", () => {
  const open: OpenRec[] = oweStatsData().open;
  it("komplet esejów i zadań, liczba z hasła zgodna z theme.json", () => {
    const s = openStats(open, DEFAULT_FILTER);
    expect(s.total.n).toBe(open.length);
    expect(s.total.essays + s.total.tasks).toBe(s.total.n);
    expect(s.total.th).toBe(theme.open.length);
    expect(s.eds.reduce((a, r) => a + r.n, 0)).toBe(s.total.n);
    expect(s.topics.reduce((a, r) => a + r.n, 0)).toBe(s.total.n);
  });
  it("filtry etapu, edycji i hasła", () => {
    const s = openStats(open, { ...DEFAULT_FILTER, stages: ["c"], edFrom: 35, edTo: 39, theme: "yes" });
    expect(s.list.every((o) => o.st === "c" && o.ed >= 35 && o.th)).toBe(true);
    expect(s.total.pct).toBe(100);
  });
});
