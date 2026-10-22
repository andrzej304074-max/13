import { describe, expect, it } from "vitest";
import { AI_QUESTIONS } from "@/data/ai";
import { AI_STATS } from "@/data/nauka";
import { getQuestion } from "@/lib/questions";

describe("Pytania AI (sprawdzone)", () => {
  it("bank: 4 odpowiedzi, klucz i wyjaśnienie przy każdym pytaniu, unikalne id", () => {
    expect(AI_QUESTIONS.length).toBeGreaterThan(400);
    expect(new Set(AI_QUESTIONS.map((q) => q.id)).size).toBe(AI_QUESTIONS.length);
    for (const q of AI_QUESTIONS) {
      expect(q.id).toMatch(/^ai-[0-9a-f]{8}$/);
      expect(q.options).toHaveLength(4);
      expect(q.correct.length, q.id).toBe(q.type === "single" ? 1 : q.correct.length);
      expect(q.explanation.length, q.id).toBeGreaterThan(10);
      expect(q.origin).toBe("ai");
      // bez śladów eksportu: znaczników źródła, doklejonego tekstu, błędów kodowania
      for (const t of [q.question, ...q.options]) expect(t, q.id).not.toMatch(/🤖|📜|💡|rozbij to na etapy|stopieo|ośd\b/);
    }
  });
  it("brak powtórzeń treści w banku", () => {
    const norm = (s: string) => s.toLowerCase().replace(/\W+/g, " ").trim();
    expect(new Set(AI_QUESTIONS.map((q) => norm(q.question))).size).toBe(AI_QUESTIONS.length);
  });
  it("pytania dostępne przez getQuestion i opisane w statystykach", () => {
    expect(getQuestion(AI_QUESTIONS[0].id)?.question).toBe(AI_QUESTIONS[0].question);
    expect(AI_STATS.map((r) => r.id).sort()).toEqual(AI_QUESTIONS.map((q) => q.id).sort());
    // demografia = hasło przewodnie XL edycji
    for (const r of AI_STATS) expect(r.th === 1, r.id).toBe(r.dz === "Demografia");
    expect(AI_STATS.filter((r) => r.items.length > 0).length / AI_STATS.length).toBeGreaterThan(0.6);
  });
  it("przykładowe klucze (sprawdzone ręcznie)", () => {
    const find = (s: string) => AI_QUESTIONS.find((q) => q.question.includes(s))!;
    const ans = (s: string) => { const q = find(s); return q.options[q.correct[0]]; };
    expect(ans("stopa rezerw obowiązkowych nakładana na banki komercyjne wynosi 10%")).toBe("10,0");
    expect(ans("drugiego przejścia demograficznego' przypisuje")).toMatch(/Lesthaeghe/);
    expect(ans("Stolpera–Samuelsona")).toMatch(/realnych płac/);
  });
});
