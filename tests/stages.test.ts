import { describe, expect, it } from "vitest";
import { countByType, drawQuestions, isStage, stageOf } from "@/lib/questions";

describe("etap zawodów w testach OWE", () => {
  it("rozpoznaje etap z id pytania", () => {
    expect(stageOf("owe23-s-01")).toBe("s");
    expect(stageOf("owe31-o-12")).toBe("o");
    expect(stageOf("owe31-c-12")).toBeNull();
    expect(stageOf("sl-1-a-3")).toBeNull();
    expect(isStage("s") && isStage("o") && !isStage("c") && !isStage(null)).toBe(true);
  });
  it("losuje tylko pytania wybranego etapu", () => {
    for (const st of ["s", "o"] as const) {
      const qs = drawQuestions("single", 50, "owe", { stage: st });
      expect(qs).toHaveLength(50);
      expect(qs.every((q) => stageOf(q.id) === st)).toBe(true);
    }
  });
  it("oba etapy razem dają całą pulę jednokrotnego wyboru", () => {
    const s = countByType("single", "owe", { stage: "s" }), o = countByType("single", "owe", { stage: "o" });
    expect(s).toBeGreaterThan(100);
    expect(o).toBeGreaterThan(100);
    expect(s + o).toBe(countByType("single"));
  });
});
