import { describe, expect, it } from "vitest";
import { countByType, drawQuestions } from "@/lib/questions";
import { metaOk, parseMetaFilter, questionMeta } from "@/lib/question-meta";

describe("Wszystkie pytania: źródła i filtry", () => {
  it("pula „mix” = suma źródeł", () => {
    const all = countByType("single", "mix");
    const parts = (["owe", "ai", "slownik", "xl"] as const).map((s) => countByType("single", "mix", { sources: [s] }));
    expect(parts.reduce((a, b) => a + b, 0)).toBe(all);
    expect(parts[1]).toBeGreaterThan(400);
  });
  it("zakres edycji i etapy zawężają tylko Archiwum OWE", () => {
    const f = { sources: ["owe", "ai"] as const, edFrom: 35, edTo: 37, stages: ["s" as const] };
    const qs = drawQuestions("single", Infinity, "mix", { ...f, sources: [...f.sources] });
    expect(qs.some((q) => q.id.startsWith("ai-"))).toBe(true);
    for (const q of qs.filter((x) => x.id.startsWith("owe"))) expect(q.id).toMatch(/^owe3[5-7]-s-/);
    expect(countByType("single", "owe", { edFrom: 39, edTo: 39, stages: ["o"] })).toBe(30);
  });
  it("dział, rodzaj haseł i hasło przewodnie", () => {
    const demo = drawQuestions("single", Infinity, "mix", { sources: ["ai"], theme: "yes" });
    expect(demo.length).toBeGreaterThan(80);
    for (const q of demo) expect(q.dzial).toBe("Demografia");
    const wz = drawQuestions("single", Infinity, "owe", { kind: "wzor" });
    expect(wz.every((q) => metaOk(q.id, { kind: "wzor" }))).toBe(true);
    expect(wz.length).toBeGreaterThan(100);
    const mikro = drawQuestions("single", Infinity, "slownik", { topic: "mikro" });
    for (const q of mikro.slice(0, 50)) {
      const m = questionMeta(q.id)!;
      expect(m.topic === "mikro" || m.items.length > 0, q.id).toBe(true);
    }
  });
  it("walidacja filtra z formularza", () => {
    expect(parseMetaFilter({ sources: ["ai", "owe"], edFrom: 30, edTo: 31, stages: ["c", "s"], topic: "makro", kind: "wzor", theme: "yes" }))
      .toEqual({ sources: ["owe", "ai"], edFrom: 30, edTo: 31, stages: ["s", "c"], topic: "makro", kind: "wzor", theme: "yes" });
    expect(() => parseMetaFilter({ sources: ["x"] })).toThrow();
    expect(() => parseMetaFilter({ edFrom: 39, edTo: 30 })).toThrow();
    expect(() => parseMetaFilter({ topic: "nieznany" })).toThrow();
    expect(parseMetaFilter({ unknown: 1 })).toEqual({});
  });
});
