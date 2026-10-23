import { describe, expect, it } from "vitest";
import { COURSE } from "@/data/nauka";
import { earlierTopicItems, lessonPayload, personalizeRepeats } from "@/lib/nauka-course";
import { buildExercises, MAX_REPEATS, rankRepeats, repeatLimit, type Exercise, type RepeatStat } from "@/lib/nauka-logic";
import type { LessonPayload } from "@/lib/nauka-types";

/** Prosty generator z ziarnem – powtarzalne losowanie w testach. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
const NOW = Date.parse("2026-10-19T12:00:00Z");
const lessons = Object.values(COURSE.lessons).filter((l) => l.type !== "zrozum");

/** Udział ćwiczeń o hasłach powtarzanych (pary i kolejność liczone jako ćwiczenia z nowych haseł). */
function share(p: LessonPayload, ex: Exercise[]) {
  const rep = new Set((p.repeat ?? []).map((i) => i.id));
  const taught = new Set([...p.items, ...(p.extra ?? [])].map((i) => i.id));
  const isRep = (e: Exercise) => "item" in e && rep.has(e.item.id) && !taught.has(e.item.id);
  const r = ex.filter(isRep).length;
  return { r, n: ex.length - r };
}

describe("powtórki w lekcjach – najwyżej 30%, do 5 haseł", () => {
  it("każda lekcja, „Ćwicz” i „Utrwal”, bez danych użytkownika", () => {
    let checked = 0;
    for (const l of lessons) {
      for (const sub of [2, 3]) {
        const p = lessonPayload(l.id, sub)!;
        for (const level of [0, 2]) {
          const ex = buildExercises(p, { level, rnd: seeded(l.id.length * 31 + sub + level) });
          const { r, n } = share(p, ex);
          expect(r * 10, `${l.id}/${sub}/poz.${level}: ${r} powtórek na ${n} nowych`).toBeLessThanOrEqual(3 * (r + n));
          expect(r).toBeLessThanOrEqual(MAX_REPEATS);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
  }, 180_000);

  it("najgorszy przypadek: wszystkie wcześniejsze hasła tematu słabe – nadal ≤ 30%", () => {
    for (const l of lessons) {
      const stats: Record<string, RepeatStat> = {};
      for (const id of earlierTopicItems(l.id)) stats[id] = { c: 0, t: 5, last: NOW };
      for (const sub of [2, 3]) {
        const p = personalizeRepeats(lessonPayload(l.id, sub)!, stats, NOW);
        const ex = buildExercises(p, { rnd: seeded(sub) });
        const { r, n } = share(p, ex);
        expect(r * 10, `${l.id}/${sub}`).toBeLessThanOrEqual(3 * (r + n));
        expect(p.repeat!.length).toBeLessThanOrEqual(MAX_REPEATS);
      }
    }
  }, 180_000);

  it("limit: 30% pod-lekcji, najwyżej 5", () => {
    expect([0, 2, 3, 7, 10, 14, 30].map(repeatLimit)).toEqual([0, 0, 1, 3, 4, 5, 5]);
    for (let fresh = 0; fresh < 40; fresh++) expect(repeatLimit(fresh) * 10).toBeLessThanOrEqual(3 * (fresh + repeatLimit(fresh)));
  });

  it("„Poznaj” i sprawdzian bez dodatkowych powtórek; powtórka słabych haseł bez zmian", () => {
    const l = lessons.find((x) => (x.review ?? []).length > 0)!;
    for (const sub of [1, 4]) {
      const p = lessonPayload(l.id, sub)!;
      expect(personalizeRepeats(p, {}, NOW)).toBe(p);
    }
  });
});

describe("dobór powtórek wg najsłabszych haseł", () => {
  const items = Object.values(COURSE.items).filter((i) => i.kind !== "zrozumienie").slice(0, 6);
  it("ranking: najniższa skuteczność pierwsza, stare odpowiedzi ważą mniej, bez danych na końcu", () => {
    const stats: Record<string, RepeatStat> = {
      [items[0].id]: { c: 9, t: 10, last: NOW }, // 10% błędów
      [items[1].id]: { c: 1, t: 10, last: NOW }, // 90% błędów
      [items[2].id]: { c: 2, t: 10, last: NOW - 200 * 86_400_000 }, // 80% błędów, ale dawno → 40%
      [items[3].id]: { c: 0, t: 1, last: NOW }, // za mało odpowiedzi
      [items[4].id]: { c: 5, t: 10, last: NOW }, // 50%
    };
    const r = rankRepeats(items.slice(0, 5), stats, NOW, seeded(1)).map((i) => i.id);
    expect(r.slice(0, 4)).toEqual([items[1].id, items[4].id, items[2].id, items[0].id]);
    expect(r[4]).toBe(items[3].id);
  });
  it("lekcja: słabe hasło użytkownika z wcześniejszej lekcji tematu trafia do powtórek jako pierwsze", () => {
    const l = lessons.find((x) => earlierTopicItems(x.id).length > 5)!;
    const weak = earlierTopicItems(l.id).at(-1)!;
    const p = personalizeRepeats(lessonPayload(l.id, 3)!, { [weak]: { c: 0, t: 4, last: NOW } }, NOW);
    expect(p.repeatRanked).toBe(true);
    expect(p.repeat![0].id).toBe(weak);
    const ex = buildExercises(p, { rnd: seeded(7) });
    expect(ex.some((e) => "item" in e && e.item.id === weak)).toBe(true);
  });
  it("dobre hasła (≥ 80%) z wcześniejszych lekcji nie są dokładane", () => {
    const l = lessons.find((x) => earlierTopicItems(x.id).length > 5 && !(x.review ?? []).length)!;
    const good = earlierTopicItems(l.id)[0];
    const p = personalizeRepeats(lessonPayload(l.id, 2)!, { [good]: { c: 9, t: 10, last: NOW } }, NOW);
    expect(p.repeat!.some((i) => i.id === good)).toBe(false);
  });
});
