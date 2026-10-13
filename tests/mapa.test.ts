import { describe, expect, it } from "vitest";
import mapa from "@/data/nauka/mapa.json";
import { COURSE } from "@/lib/nauka-course";
import { reasonText } from "@/app/pojecia/mapa/view";

const N = (mapa as unknown as { n: Record<string, [string, number, number, number][]> }).n;

describe("mapa myśli – dane", () => {
  it("każde hasło kursu (bez „Zrozumienia”) ma wpis", () => {
    for (const [id, it] of Object.entries(COURSE.items)) if (it.kind !== "zrozumienie") expect(N[id], id).toBeDefined();
  });
  it("powiązania: istniejące hasła, bez samopowiązań, malejąco wg wagi, ≤ 24", () => {
    for (const [id, list] of Object.entries(N)) {
      expect(list.length).toBeLessThanOrEqual(24);
      for (let i = 0; i < list.length; i++) {
        const [b, w, m] = list[i];
        expect(b).not.toBe(id);
        expect(COURSE.items[b as keyof typeof COURSE.items], b).toBeTruthy();
        expect(w).toBeGreaterThan(0);
        expect(m & 15).toBe(m);
        if (i) expect(w).toBeLessThanOrEqual(list[i - 1][1]);
      }
    }
  });
  it("powiązanie jest symetryczne (ta sama waga w obu kierunkach, gdy oba je pokazują)", () => {
    for (const [a, list] of Object.entries(N)) for (const [b, w] of list) {
      const back = N[b]?.find((x) => x[0] === a);
      if (back) expect(back[1]).toBe(w);
    }
  });
  it("prawie każde hasło ma powiązania", () => {
    const empty = Object.values(N).filter((l) => !l.length).length;
    expect(empty).toBeLessThan(10);
  });
  it("opis powodów", () => {
    expect(reasonText(1, 1)).toBe("wspólne pytanie OWE");
    expect(reasonText(1, 3)).toBe("3 wspólne pytania OWE");
    expect(reasonText(1 | 2, 5)).toBe("5 wspólnych pytań OWE · ten sam akapit Podręcznika");
    expect(reasonText(4 | 8, 0)).toBe("wymienione w opisie · ta sama lekcja");
  });
});
