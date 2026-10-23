import { describe, expect, it } from "vitest";
import manual from "@/data/slownik/manual.json";
import themeAuto from "@/data/slownik/theme_auto.json";
import { drawQuestions } from "@/lib/questions";
import { questionMeta, THEME_SECTION } from "@/lib/question-meta";
import type { Question } from "@/lib/types";

const M = manual as Question[];
const T = themeAuto as Question[];

describe("hasło XL w Słowniku", () => {
  it("dział hasła: ponad 500 pytań ręcznych (w tym 400 nowych), ok. 15% wielokrotnego wyboru", () => {
    const sec = M.filter((q) => q.section === THEME_SECTION);
    expect(sec.length).toBeGreaterThanOrEqual(500);
    const multi = sec.filter((q) => q.type === "multi").length / sec.length;
    expect(multi).toBeGreaterThan(0.1);
    expect(multi).toBeLessThan(0.25);
  });
  it("pytania algorytmiczne: poprawny format i dział hasła", () => {
    expect(T.length).toBeGreaterThan(150);
    for (const q of T) {
      expect(q.id).toMatch(/^sl-TC?-[0-9a-f]{10}$/);
      expect(q.section).toBe(THEME_SECTION);
      expect(new Set(q.options).size, q.id).toBe(4);
      if (q.type === "single") expect(q.correct).toHaveLength(1);
      for (const c of q.correct) expect(c >= 0 && c < 4).toBe(true);
    }
  });
  it("filtr „tylko z hasła” w Słowniku obejmuje cały dział hasła", () => {
    const th = new Set(drawQuestions("single", Infinity, "slownik", { theme: "yes" }).map((q) => q.id));
    for (const q of [...M, ...T].filter((x) => x.section === THEME_SECTION && x.type === "single")) {
      expect(th.has(q.id), q.id).toBe(true);
      expect(questionMeta(q.id)?.th).toBe(1);
    }
  });
});
