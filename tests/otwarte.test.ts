import { describe, expect, it } from "vitest";
import { COURSE } from "@/data/nauka";
import { SETS } from "@/data/otwarte";
import { isCorrect, parseNum, publicEssay, publicTask, scoreEssay, scoreTask, validateSet, type Essay, type Task } from "@/lib/otwarte-core";

describe("liczby w odpowiedziach", () => {
  it("polski zapis, procent, spacje, minus", () => {
    expect(parseNum("21,88")).toBe(21.88);
    expect(parseNum(" 1 234,5 ")).toBe(1234.5);
    expect(parseNum("21.88%")).toBe(21.88);
    expect(parseNum("−3")).toBe(-3);
    expect(parseNum("abc")).toBeNull();
    expect(parseNum("")).toBeNull();
  });
  it("tolerancja i ułamek zamiast procentu", () => {
    const a = { label: "ROA", value: 21.875, tol: 0.06, unit: "%" };
    expect(isCorrect(a, "21,88")).toBe(true);
    expect(isCorrect(a, "21,9")).toBe(true);
    expect(isCorrect(a, "0,21875")).toBe(true);
    expect(isCorrect(a, "22")).toBe(false);
    expect(isCorrect({ label: "x", value: 165 }, "165")).toBe(true);
    expect(isCorrect({ label: "x", value: 165 }, "166")).toBe(false);
  });
});

const task: Task = {
  id: "t", title: "T", pts: 10, topic: "mikro", intro: [],
  parts: [
    { label: "a", pts: 4, prompt: "", answers: [{ label: "x", value: 2 }, { label: "y", value: 3 }], solution: [{ t: "p", x: "." }] },
    { label: "b", pts: 6, prompt: "", answers: [], solution: [{ t: "p", x: "." }] },
  ],
};
describe("punktacja zadania", () => {
  it("liczbowa proporcjonalnie, opisowa z samooceny", () => {
    const r = scoreTask(task, { answers: { a: ["2", "4"] }, self: { b: 0.5 } });
    expect(r.parts.map((p) => p.pts)).toEqual([2, 3]);
    expect(r.score).toBe(5);
    expect(r.max).toBe(10);
  });
  it("wersja publiczna bez wyników i rozwiązań", () => {
    const p = publicTask(task);
    expect(JSON.stringify(p)).not.toContain('"value"');
    expect(JSON.stringify(p)).not.toContain("solution");
  });
});

describe("punktacja eseju", () => {
  const e: Essay = { id: "e", kind: "ogolne", pts: 25, topic: "polityka", topics: [{ title: "Temat eseju testowego", schema: [
    { title: "Część teoretyczna", pts: 15, points: ["a", "b", "c"] },
    { title: "Część praktyczna", pts: 10, points: ["d", "e"] },
  ] }] };
  it("proporcjonalnie do odhaczonych punktów", () => {
    expect(scoreEssay(e, 0, [[true, true, false], [true, false]]).score).toBe(15);
    expect(scoreEssay(e, 0, []).score).toBe(0);
  });
  it("wersja publiczna bez schematu", () => {
    expect(JSON.stringify(publicEssay(e))).not.toContain("Część teoretyczna");
  });
});

describe("dane zadań i esejów z kluczy", () => {
  const topics = COURSE.topics.map((t) => t.id);
  it("każdy zestaw poprawny (sumy punktów, schematy, rozwiązania)", () => {
    const errs = SETS.flatMap((s) => validateSet(s, topics));
    expect(errs).toEqual([]);
  });
  it("unikalne identyfikatory", () => {
    const ids = SETS.flatMap((s) => [...s.essays.map((e) => e.id), ...(s.task ? [s.task.id] : [])]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("odpowiedzi z klucza przechodzą własne sprawdzenie", () => {
    for (const s of SETS) for (const p of s.task?.parts ?? []) for (const a of p.answers) {
      expect(isCorrect(a, String(a.value).replace(".", ","))).toBe(true);
    }
  });
});
