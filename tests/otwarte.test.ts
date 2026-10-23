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
    const alt = { label: "p", value: 20.4, tol: 0.05, alt: [19.6] };
    expect(isCorrect(alt, "20,4")).toBe(true);
    expect(isCorrect(alt, "19,6")).toBe(true);
    expect(isCorrect(alt, "20")).toBe(false);
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
    expect(publicTask({ ...task, own: true }).own).toBe(true);
    expect(JSON.stringify(publicTask({ ...task, parts: [{ ...task.parts[0], answers: [{ label: "x", value: 1, alt: [2] }] }] }))).not.toContain('"alt"');
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

describe("Prognoza XL", () => {
  const topics = COURSE.topics.map((t) => t.id);
  const prog = SETS.filter((s) => s.src === "prognoza");
  it("50 zestawów XL edycji – jeden esej i jedno zadanie, wszystko oznaczone jako własne", () => {
    expect(prog.length).toBe(50);
    for (const s of prog) {
      expect(s.ed).toBe(40);
      expect(s.essays.length).toBe(1);
      expect(s.task?.own && s.essays[0].own).toBe(true);
      expect(s.essays[0].topics.length).toBe(s.stage === "s" ? 2 : 1);
    }
    expect(SETS.filter((s) => s.src !== "prognoza").every((s) => s.ed < 40)).toBe(true);
  });
  it("co najmniej 25 esejów i 25 zadań dotyczy hasła przewodniego, każdy temat ma podpowiedzi", () => {
    expect(prog.filter((s) => s.essays[0].th).length).toBeGreaterThanOrEqual(25);
    expect(prog.filter((s) => s.task?.th).length).toBeGreaterThanOrEqual(25);
    for (const s of prog) for (const t of s.essays[0].topics) expect(t.hints?.s?.length && t.hints?.b?.length && t.hints?.d?.length, t.title).toBeTruthy();
  });
  it("każdy wynik liczbowy ma wyrażenie, a wersja publiczna nie zdradza danych pośrednich", () => {
    for (const s of prog) {
      for (const p of s.task!.parts) for (const a of p.answers) expect(a.calc, `${s.set} ${p.label}`).toBeTruthy();
      const pub = JSON.stringify(publicTask(s.task!));
      expect(pub).not.toContain("calc");
      expect(pub).not.toContain('"lets"');
      expect(pub).not.toContain('"vars"');
    }
  });
  it("walidacja odrzuca zestaw prognozy bez oznaczenia jako własny lub ze złym identyfikatorem", () => {
    const s = prog[0];
    expect(validateSet({ ...s, set: "owe-40-szkolne" }, topics).length).toBeGreaterThan(0);
    expect(validateSet({ ...s, task: { ...s.task!, own: false } }, topics).length).toBeGreaterThan(0);
    expect(validateSet({ ...s, src: undefined }, topics).length).toBeGreaterThan(0);
  });
});
