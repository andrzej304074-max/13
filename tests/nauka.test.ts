import { describe, expect, it } from "vitest";
import { COURSE, lessonPayload } from "@/lib/nauka-course";
import { buildExercises, checkNumber, checkTyped, computeXp, exerciseKind, fuzzyEqual, normalize } from "@/lib/nauka-logic";

const item = (t: string) => Object.values(COURSE.items).find((i) => i.t === t)!;

describe("wpisywanie odpowiedzi", () => {
  it("ignoruje polskie znaki i wielkość liter", () => expect(normalize("Elastyczność  POPYTU")).toBe("elastycznosc popytu"));
  it("toleruje literówki", () => expect(fuzzyEqual("elastycznosc popytu", "Elastyczność popytu")).toBe(true));
  it("odrzuca inne słowo", () => expect(fuzzyEqual("podaż", "popyt")).toBe(false));
  it("osoba – wystarczy nazwisko", () => expect(checkTyped("akerlof", item("Akerlof George"))).toBe(true));
  it("data – tylko dokładny rok", () => {
    const d = item("1694 – założenie Banku Anglii");
    expect(checkTyped("1694", d)).toBe(true);
    expect(checkTyped("1695", d)).toBe(false);
  });
});

describe("XP", () => {
  it("10 za poprawną, bonus za combo, ukończenie i brak błędów", () => {
    expect(computeXp([true, true, true, true, true])).toBe(50 + 5 + 10 + 10);
    expect(computeXp([true, false, true])).toBe(20 + 10);
  });
});

describe("generator ćwiczeń", () => {
  const lessons = Object.values(COURSE.lessons);
  it("każda pod-lekcja każdej lekcji ma ćwiczenia z poprawną odpowiedzią wśród opcji", () => {
    const empty: string[] = [];
    for (const l of lessons) {
      for (const sub of [1, 2, 3, 4]) {
        for (const level of [0, 3]) {
          const ex = buildExercises(lessonPayload(l.id, sub)!, { level }).filter((e) => e.type !== "intro");
          if (ex.length < 3) empty.push(`${l.id}/${sub}/${level}: ${ex.length}`);
          for (const e of ex) {
            if (e.type === "wybor" || e.type === "wzor") {
              expect(e.options[e.correct]).toBeDefined();
              expect(new Set(e.options.map(normalize)).size).toBe(e.options.length);
            }
            if (e.type === "luka") expect(e.options).toContain(e.answer);
          }
        }
      }
    }
    expect(empty).toEqual([]);
  }, 120_000);
});

describe("odpowiedzi liczbowe", () => {
  it("przecinek, spacje tysięcy i jednostka", () => {
    expect(checkNumber("1 234,5 zł", 1234.5, 0.01)).toBe(true);
    expect(checkNumber("11,11%", 11.11, 0.05)).toBe(true);
    expect(checkNumber("−3", -3, 0)).toBe(true);
  });
  it("tolerancja zaokrąglenia", () => {
    expect(checkNumber("11,1", 11.11, 0.05)).toBe(true);
    expect(checkNumber("11", 11.11, 0.05)).toBe(false);
    expect(checkNumber("abc", 1, 1)).toBe(false);
  });
});

describe("lekcje Zrozumienie", () => {
  const zl = Object.values(COURSE.lessons).filter((l) => l.type === "zrozum");
  it("istnieją i każda pod-lekcja ma wymaganą liczbę ćwiczeń z poprawnymi kluczami", () => {
    expect(zl.length).toBeGreaterThan(0);
    for (const l of zl) {
      for (const sub of [1, 2, 3, 4]) {
        const ex = buildExercises(lessonPayload(l.id, sub)!);
        const graded = ex.filter((e) => exerciseKind(e) !== null);
        expect(graded.length, `${l.id}/${sub}`).toBeGreaterThanOrEqual(sub === 1 ? 2 : 6);
        if (sub === 1) expect(ex.filter((e) => e.type === "karta").length).toBeGreaterThanOrEqual(4);
        for (const e of ex) {
          if (e.type === "pytanie") expect(e.question.correct.every((i) => e.question.options[i] !== undefined)).toBe(true);
          if (e.type === "wykres") expect(e.options[e.correct]).toBeDefined();
          if (e.type === "luka") expect(e.options).toContain(e.answer);
        }
      }
    }
  }, 120_000);
});
