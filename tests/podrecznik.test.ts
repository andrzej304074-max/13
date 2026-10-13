import { describe, expect, it } from "vitest";
import book from "@/data/nauka/podrecznik.json";
import { COURSE } from "@/lib/nauka-course";

type Run = { s: string; k?: string };
type Block = { t: string; r?: Run[]; items?: Run[][] };
const units = (book as unknown as { units: Record<string, { intro: { blocks: Block[] }; chapters: { lesson: string; blocks: Block[] }[] }> }).units;
const runs = (b: Block): Run[] => [...(b.r ?? []), ...(b.items ?? []).flat()];
const lessons = Object.values(COURSE.lessons) as { id: string; unit: string; items: string[]; extra?: string[] }[];

describe("Podręcznik", () => {
  it("każdy dział kursu ma przegląd", () => {
    expect(COURSE.units.length).toBe(88);
    for (const { id } of COURSE.units) expect(units[id]?.intro.blocks.length ?? 0, id).toBeGreaterThan(0);
  });

  it("każda lekcja (poza powtórkami -z) ma rozdział w swoim dziale", () => {
    for (const l of lessons.filter((l) => !/-z\d+$/.test(l.id))) {
      expect(units[l.unit]?.chapters.some((c) => c.lesson === l.id), l.id).toBe(true);
    }
  });

  it("odnośniki prowadzą do istniejących haseł, a hasła lekcji są w jej rozdziale", () => {
    for (const u of Object.values(units)) for (const c of u.chapters) {
      const keys = new Set(c.blocks.flatMap(runs).map((r) => r.k).filter(Boolean) as string[]);
      for (const k of keys) expect(COURSE.items[k as keyof typeof COURSE.items], k).toBeTruthy();
      const l = lessons.find((x) => x.id === c.lesson)!;
      for (const k of [...l.items, ...(l.extra ?? [])]) expect(keys.has(k), `${c.lesson}: ${k}`).toBe(true);
    }
  });
});
