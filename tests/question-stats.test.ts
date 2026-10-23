import { describe, expect, it } from "vitest";
import { analyse } from "@/lib/question-stats-core";

const base = { id: "q", src: "owe" as const, topic: null, type: "single" as const, question: "?", reports: 0 };
describe("statystyki pytań (admin)", () => {
  it("podejrzany klucz: błędna opcja częściej niż poprawna", () => {
    const r = analyse({ ...base, n: 20, pct: 25, picks: [5, 12, 2, 1], correct: [0] });
    expect(r.topWrong).toEqual({ opt: 1, pct: 60 });
    expect(r.flags).toContain("klucz");
  });
  it("za trudne / za łatwe tylko od 10 odpowiedzi", () => {
    expect(analyse({ ...base, n: 9, pct: 5, picks: [0, 9, 0, 0], correct: [0] }).flags).toEqual([]);
    expect(analyse({ ...base, n: 10, pct: 10, picks: [1, 3, 3, 3], correct: [0] }).flags).toEqual(expect.arrayContaining(["trudne", "klucz"]));
    expect(analyse({ ...base, n: 40, pct: 97.5, picks: [39, 1, 0, 0], correct: [0] }).flags).toEqual(["latwe"]);
  });
  it("wielokrotny wybór: porównanie z najrzadziej wybieraną poprawną opcją", () => {
    const r = analyse({ ...base, type: "multi", n: 10, pct: 60, picks: [10, 3, 6, 0], correct: [0, 1] });
    expect(r.topWrong?.opt).toBe(2);
    expect(r.flags).toContain("klucz");
    expect(analyse({ ...base, type: "multi", n: 10, pct: 80, picks: [10, 9, 2, 0], correct: [0, 1] }).flags).not.toContain("klucz");
  });
});
