import { describe, expect, it } from "vitest";
import { computeStreak, shiftDay, testXp, todayWarsaw, weekOf, type XpDay } from "@/lib/xp-core";

// 2026-10-23 to piątek; tydzień zamrożeń: 2026-10-19 (pn) – 2026-10-25 (nd)
const T = "2026-10-23";
const day = (offset: number, xp: number, goal = 100): XpDay => ({ day: shiftDay(T, offset), xp, goal });

describe("wspólny cel dzienny i seria", () => {
  it("tydzień i data w strefie Warszawy", () => {
    expect(weekOf(T)).toBe("2026-10-19");
    expect(weekOf("2026-10-19")).toBe("2026-10-19");
    expect(weekOf("2026-10-25")).toBe("2026-10-19");
    // 23:30 UTC 23.10 to już 24.10 w Warszawie (CEST, +2)
    expect(todayWarsaw(new Date("2026-10-23T23:30:00Z"))).toBe("2026-10-24");
  });
  it("dziś bez celu nie przerywa serii; dzień z celem liczy się dopiero po osiągnięciu celu", () => {
    const s = computeStreak([day(-2, 120), day(-1, 100), day(0, 40)], T);
    expect(s).toMatchObject({ streak: 2, todayMet: false });
    expect(computeStreak([day(-2, 120), day(-1, 100), day(0, 100)], T)).toMatchObject({ streak: 3, todayMet: true });
    // cel z tamtego dnia: 60 XP przy celu 50 się liczy
    expect(computeStreak([day(-1, 60, 50)], T).streak).toBe(1);
  });
  it("jedno zamrożenie na tydzień ratuje pojedynczy dzień", () => {
    // śr bez celu (zamrożenie z tego tygodnia), czw i pt z celem, wt z celem
    const s = computeStreak([day(-3, 100), day(-2, 10), day(-1, 100), day(0, 100)], T);
    expect(s.streak).toBe(3);
    expect(s.frozen).toEqual([shiftDay(T, -2)]);
    expect(s.freezeLeft).toBe(false);
    // dwa dni bez celu w jednym tygodniu przerywają serię
    expect(computeStreak([day(-4, 100), day(-3, 0), day(-2, 0), day(-1, 100)], T).streak).toBe(1);
  });
  it("zamrożenia z różnych tygodni działają osobno; seria nie zaczyna się od zamrożenia", () => {
    // ndz 18.10 bez celu (tydzień 12.10), pn 19.10 bez celu (tydzień 19.10) – oba uratowane
    const s = computeStreak([day(-6, 100), day(-5, 0), day(-4, 0), day(-3, 100), day(-2, 100), day(-1, 100), day(0, 100)], T);
    expect(s.streak).toBe(5);
    expect(computeStreak([day(-1, 0)], T).streak).toBe(0);
  });
  it("rekord to najdłuższa seria w historii", () => {
    const old = [-30, -29, -28, -27, -26].map((o) => day(o, 200));
    const s = computeStreak([...old, day(-1, 100), day(0, 100)], T);
    expect(s.streak).toBe(2);
    expect(s.record).toBe(5);
  });
  it("XP za odpowiedź w teście", () => {
    expect(testXp(2, false, false)).toBe(10);
    expect(testXp(1, false, false)).toBe(5);
    expect(testXp(0, false, false)).toBe(2);
    expect(testXp(0, false, true)).toBe(0);
    expect(testXp(0, true, false)).toBe(0);
  });
});
