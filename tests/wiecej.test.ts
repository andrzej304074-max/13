import { describe, expect, it } from "vitest";
import course from "@/data/nauka/course.json";
import wiecej from "@/data/nauka/wiecej.json";
import book from "@/data/nauka/podrecznik.json";

type Item = { id: string; kind: string; t: string; d: string };
const items = Object.values((course as unknown as { items: Record<string, Item> }).items).filter((i) => i.kind !== "zrozumienie");
const more = wiecej as unknown as Record<string, { x: string; ex: string; ch?: [string, string] }>;
const units = (book as unknown as { units: Record<string, { chapters: { lesson: string }[] }> }).units;

describe("„Więcej” przy hasłach", () => {
  it("każde hasło kursu ma wyjaśnienie i przykład", () => {
    const missing = items.filter((i) => !more[i.id]).map((i) => i.t);
    expect(missing).toEqual([]);
    expect(Object.keys(more).length).toBe(items.length);
  });
  it("teksty mają rozsądną długość i nie powtarzają definicji", () => {
    for (const i of items) {
      const m = more[i.id];
      expect(m.x.length, i.t).toBeGreaterThanOrEqual(80);
      expect(m.x.length, i.t).toBeLessThanOrEqual(900);
      expect(m.ex.length, i.t).toBeGreaterThanOrEqual(25);
      const d = i.d.trim().replace(/\.$/, "").toLowerCase();
      if (d) expect(m.x.toLowerCase().includes(d), i.t).toBe(false);
    }
  });
  it("przykład do wzoru zawiera liczby", () => {
    for (const i of items.filter((i) => i.kind === "wzor")) expect(more[i.id].ex, i.t).toMatch(/\d/);
  });
  it("odnośnik do Podręcznika wskazuje istniejący rozdział", () => {
    const linked = Object.values(more).filter((m) => m.ch);
    expect(linked.length).toBeGreaterThan(items.length / 2);
    for (const m of linked) {
      const [u, lesson] = m.ch!;
      expect(units[u]?.chapters.some((c) => c.lesson === lesson), `${u}/${lesson}`).toBe(true);
    }
  });
});
