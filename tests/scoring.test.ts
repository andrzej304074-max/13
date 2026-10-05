import { describe, expect, it } from "vitest";
import { durationMinutes, scoreMulti, scoreSingle, validateSelection } from "@/lib/scoring";

describe("scoreSingle", () => {
  it("daje 2 pkt za poprawną", () => expect(scoreSingle([2], [2])).toBe(2));
  it("odejmuje 1 pkt za błędną", () => expect(scoreSingle([1], [2])).toBe(-1));
  it("daje 0 pkt bez odpowiedzi", () => expect(scoreSingle([], [2])).toBe(0));
});

describe("scoreMulti", () => {
  it("daje 2 pkt za idealne zaznaczenie", () => expect(scoreMulti([0, 2], [0, 2])).toBe(2));
  it("daje 0,5 pkt za każde trafne pole", () => expect(scoreMulti([0, 1], [0, 2])).toBe(1));
  it("puste zaznaczenie trafia niezaznaczone pola", () => expect(scoreMulti([], [0, 2])).toBe(1));
  it("daje 0 pkt za całkowicie odwrotne zaznaczenie", () => expect(scoreMulti([1, 3], [0, 2])).toBe(0));
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
