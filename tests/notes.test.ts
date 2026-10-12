import { describe, expect, it } from "vitest";
import { displayTitle, NoteError, refHref, sanitizeHighlight, sanitizeInk, sanitizeRef, segments, simplify, strokeNear } from "@/lib/notes-core";

describe("rysunek w notatkach", () => {
  it("upraszcza punkty leżące na prostej, zostawia końce i załamania", () => {
    const line = [0, 0, 50, 10, 0, 50, 20, 0, 50, 30, 0, 50];
    expect(simplify(line)).toEqual([0, 0, 50, 30, 0, 50]);
    const corner = [0, 0, 50, 10, 0, 50, 10, 10, 50];
    expect(simplify(corner)).toEqual(corner);
  });

  it("zachowuje wyraźną zmianę nacisku (grubości)", () => {
    expect(simplify([0, 0, 10, 10, 0, 80, 20, 0, 10]).length).toBe(9);
  });

  it("gumka trafia w środek prostej kreski (między punktami)", () => {
    const p = simplify([0, 0, 50, 50, 0, 50, 100, 0, 50]);
    expect(p.length).toBe(6);
    expect(strokeNear(p, 50, 10, 14)).toBe(true);
    expect(strokeNear(p, 50, 30, 14)).toBe(false);
    expect(strokeNear([5, 5, 50], 8, 9, 6)).toBe(true);
  });

  it("normalizuje rysunek: zaokrągla, przycina do płótna, liczy wysokość", () => {
    const ink = sanitizeInk({ h: 0, s: [{ c: 1, w: 2, p: [10.4, 20.6, 50, 2000, 700, 120] }] });
    expect(ink.s[0].p).toEqual([10, 21, 50, 1000, 700, 100]);
    expect(ink.h).toBe(740);
    expect(sanitizeInk(null)).toEqual({ h: 0, s: [] });
  });

  it("odrzuca zły format", () => {
    expect(() => sanitizeInk({ s: [{ c: 9, w: 0, p: [1, 2, 3] }] })).not.toThrow(); // kolor przycięty do palety
    expect(() => sanitizeInk({ s: [{ c: 0, w: 0, p: [1, 2] }] })).toThrow(NoteError);
    expect(() => sanitizeInk({ s: "x" })).toThrow(NoteError);
    expect(() => sanitizeInk({ s: [{ c: 0, w: 0, p: [1, "a", 3] }] })).toThrow(NoteError);
  });

  it("odrzuca zbyt duży rysunek", () => {
    const big = Array.from({ length: 100 }, () => ({ c: 0, w: 0, p: Array.from({ length: 3 * 900 }, (_, i) => i % 3 === 2 ? 50 : i % 1000) }));
    expect(() => sanitizeInk({ s: big })).toThrow(/za duży/);
  });
});

describe("odnośniki i tytuły", () => {
  it("przyjmuje tylko znane rodzaje odnośników", () => {
    expect(sanitizeRef("owe:owe39-s-01")).toBe("owe:owe39-s-01");
    expect(sanitizeRef("lekcja:mikro-rynek-1:2")).toBe("lekcja:mikro-rynek-1:2");
    expect(sanitizeRef("")).toBeNull();
    expect(() => sanitizeRef("javascript:alert(1)")).toThrow(NoteError);
    expect(() => sanitizeRef("owe:a b")).toThrow(NoteError);
  });

  it("linkuje lekcje i artykuły, pytania testów bez linku", () => {
    expect(refHref("lekcja:mikro-rynek-1:2")).toEqual({ href: "/nauka/lekcja/mikro-rynek-1?sub=2", label: "Lekcja" });
    expect(refHref("artykul:mikro-rynek:mikro-rynek-1")?.href).toBe("/nauka/podrecznik/mikro-rynek/mikro-rynek-1");
    expect(refHref("owe:x")).toBeNull();
  });

  it("tytuł z treści, gdy brak własnego", () => {
    expect(displayTitle({ title: "", body: "\n  Elastyczność popytu\nreszta" })).toBe("Elastyczność popytu");
    expect(displayTitle({ title: " Mój ", body: "x" })).toBe("Mój");
    expect(displayTitle({ title: "", body: "", ink: { h: 10, s: [{ c: 0, w: 0, p: [1, 1, 1] }] } })).toBe("Bez tytułu (rysunek)");
  });
});

describe("podkreślenia", () => {
  it("waliduje zakres i kolor", () => {
    expect(sanitizeHighlight({ article: "mikro-rynek:mikro-rynek-1", block: 2, start: 5, end: 9, color: "g" }))
      .toEqual({ article: "mikro-rynek:mikro-rynek-1", block: 2, start: 5, end: 9, color: "g" });
    expect(sanitizeHighlight({ article: "a", block: 0, start: 0, end: 1, color: "zly" }).color).toBe("y");
    expect(() => sanitizeHighlight({ article: "a", block: 0, start: 5, end: 5 })).toThrow(NoteError);
  });

  it("dzieli tekst na rozłączne odcinki, późniejsze podkreślenie wygrywa", () => {
    const s = segments(10, [{ start: 2, end: 6, color: "y", id: "1" }, { start: 4, end: 8, color: "g", id: "2" }]);
    expect(s).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4, h: { color: "y", id: "1" } },
      { start: 4, end: 8, h: { color: "g", id: "2" } },
      { start: 8, end: 10 },
    ]);
  });
});
