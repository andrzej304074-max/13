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
      expect(q.id).toMatch(/^xl-TC?-[0-9a-f]{10}$/);
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

describe("źródło Hasło XL (Plan IV)", () => {
  it("400 ręcznych i 254 skryptowych pytań o hasło XL to osobne źródło, Pytania AI i Słownik bez nich", async () => {
    const { SLOWNIK_QUESTIONS, XL_QUESTIONS } = await import("@/data/slownik");
    const { AI_QUESTIONS } = await import("@/data/ai");
    const { sourceOf } = await import("@/lib/question-source");
    expect(XL_QUESTIONS.filter((q) => q.origin === "manual").length).toBe(400);
    expect(XL_QUESTIONS.filter((q) => q.origin === "auto").length).toBe(254);
    expect(XL_QUESTIONS.every((q) => sourceOf(q.id) === "xl")).toBe(true);
    expect(SLOWNIK_QUESTIONS.every((q) => sourceOf(q.id) === "slownik")).toBe(true);
    expect(AI_QUESTIONS.length).toBe(464);
    expect(AI_QUESTIONS.every((q) => sourceOf(q.id) === "ai")).toBe(true);
    // stare pytania działu 15 (sprzed Planu II) zostają w Słowniku
    expect(SLOWNIK_QUESTIONS.filter((q) => q.section === 15).length).toBe(198);
  });
  it("filtry każdego źródła zawężają tylko to źródło", async () => {
    const { countByType } = await import("@/lib/questions");
    const all = (f = {}) => countByType("single", "mix", f) + countByType("multi", "mix", f);
    const xl = (f = {}) => all({ sources: ["xl"], ...f });
    expect(xl({ xlOrigin: "manual" })).toBe(400);
    expect(xl({ xlOrigin: "auto" })).toBe(254);
    // filtr Słownika nie zmienia liczby pytań Hasła XL ani OWE
    expect(xl({ slOrigin: "manual", slSection: 3 })).toBe(654);
    const owe = all({ sources: ["owe"] });
    expect(all({ sources: ["owe"], slOrigin: "auto", xlOrigin: "auto" })).toBe(owe);
    // filtr OWE (edycje) nie zawęża Słownika
    const sl = all({ sources: ["slownik"] });
    expect(all({ sources: ["slownik"], edFrom: 30, edTo: 31 })).toBe(sl);
    expect(all({ sources: ["slownik"], slOrigin: "manual" })).toBeLessThan(sl);
    // suma źródeł = całość
    expect(all({ sources: ["owe"] }) + all({ sources: ["ai"] }) + sl + xl()).toBe(all());
  });
  it("hasło przewodnie obejmuje całe źródło XL", async () => {
    const { questionMeta } = await import("@/lib/question-meta");
    const { XL_QUESTIONS } = await import("@/data/slownik");
    expect(XL_QUESTIONS.every((q) => questionMeta(q.id)?.th === 1 && questionMeta(q.id)?.src === "xl")).toBe(true);
  });
});
