import { describe, expect, it } from "vitest";
import { correctUnits, durationMinutes, multiHits, scoreMulti, scoreSingle, validateSelection } from "@/lib/scoring";
import { rescoreRows } from "@/lib/rescore";

describe("scoreSingle", () => {
  it("daje 2 pkt za poprawną", () => expect(scoreSingle([2], [2])).toBe(2));
  it("odejmuje 1 pkt za błędną", () => expect(scoreSingle([1], [2])).toBe(-1));
  it("daje 0 pkt bez odpowiedzi", () => expect(scoreSingle([], [2])).toBe(0));
});

describe("scoreMulti – 4 trafne pola 2 pkt, 3 trafne 1 pkt, mniej 0", () => {
  it("4 trafne pola → 2 pkt", () => expect(scoreMulti([0, 2], [0, 2])).toBe(2));
  it("3 trafne pola (brak jednej poprawnej) → 1 pkt", () => expect(scoreMulti([0], [0, 2])).toBe(1));
  it("3 trafne pola (jedna zbędna) → 1 pkt", () => expect(scoreMulti([0, 1, 2], [0, 2])).toBe(1));
  it("2 trafne pola → 0 pkt", () => expect(scoreMulti([0, 1], [0, 2])).toBe(0));
  it("puste zaznaczenie przy 2 poprawnych → 0 pkt", () => expect(scoreMulti([], [0, 2])).toBe(0));
  it("0 trafnych → 0 pkt", () => expect(scoreMulti([1, 3], [0, 2])).toBe(0));
  it("pytanie bez poprawnych: nic nie zaznaczone → 2 pkt", () => expect(scoreMulti([], [])).toBe(2));
  it("pytanie bez poprawnych: jedno zaznaczone → 1 pkt", () => expect(scoreMulti([3], [])).toBe(1));
  it("multiHits liczy pola o poprawnym stanie", () => expect(multiHits([0, 1], [0, 2])).toBe(2));
});

describe("rescoreRows – przeliczenie starych odpowiedzi", () => {
  const rows = [
    { test_id: "t", question_id: "a", selected: [0, 2], points: 2, skipped: false },
    { test_id: "t", question_id: "b", selected: [0], points: 1.5, skipped: false },
    { test_id: "t", question_id: "c", selected: [0, 1], points: 1, skipped: false },
    { test_id: "t", question_id: "d", selected: [], points: 0, skipped: true },
    { test_id: "t", question_id: "x", selected: [0], points: 1.5, skipped: false },
  ];
  const correct: Record<string, number[]> = { a: [0, 2], b: [0, 2], c: [0, 2], d: [0, 2] };
  const out = rescoreRows(rows, (q) => correct[q]);
  it("zmienia tylko odpowiedzi o innej punktacji", () => expect(out.map((r) => [r.question_id, r.points])).toEqual([["b", 1], ["c", 0]]));
  it("pomija pytania spoza bazy", () => expect(out.some((r) => r.question_id === "x")).toBe(false));
});

describe("durationMinutes", () => {
  it("30 pytań → 40 min", () => expect(durationMinutes(30)).toBe(40));
  it("50 pytań → 60 min", () => expect(durationMinutes(50)).toBe(60));
});

describe("validateSelection", () => {
  it("odrzuca dwie odpowiedzi w jednokrotnym", () => expect(validateSelection("single", [0, 1])).not.toBeNull());
  it("odrzuca brak odpowiedzi w jednokrotnym", () => expect(validateSelection("single", [])).not.toBeNull());
  it("akceptuje wiele w wielokrotnym", () => expect(validateSelection("multi", [0, 1, 3])).toBeNull());
  it("odrzuca indeks spoza zakresu", () => expect(validateSelection("multi", [4])).not.toBeNull());
  it("odrzuca duplikaty", () => expect(validateSelection("multi", [1, 1])).not.toBeNull());
});

describe("correctUnits", () => {
  it("jednokrotny: 1 za poprawną", () => expect(correctUnits("single", 2)).toBe(1));
  it("jednokrotny: 0 za błędną", () => expect(correctUnits("single", -1)).toBe(0));
  it("wielokrotny: zdobyte punkty", () => expect(correctUnits("multi", 1)).toBe(1));
  it("pominięte: 0", () => expect(correctUnits("multi", 0, true)).toBe(0));
});
