import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import book from "@/data/nauka/podrecznik.json";
import { BookFigure, type FigSpec } from "@/app/components/book-figure";

type B = { fig?: FigSpec };
const units = (book as unknown as { units: Record<string, { intro: { blocks: B[] } | null; chapters: { lesson: string; blocks: B[]; ch?: string }[] }> }).units;
const figs = Object.values(units).flatMap((u) => [...(u.intro?.blocks ?? []), ...u.chapters.flatMap((c) => c.blocks)]).filter((b) => b.fig).map((b) => b.fig!);

/** Rysunki dodane w H5 (nowe rodzaje i wykresy z danych). */
export const NEW_KINDS: FigSpec[] = [
  { k: "nadwyzka" }, { k: "podatek" }, { k: "cena", o: { typ: "max" } }, { k: "cena", o: { typ: "min" } }, { k: "elastycznosc" },
  { k: "obojetnosc" }, { k: "oligopol" }, { k: "krzywaj" }, { k: "beveridge", o: { przesun: "1" } }, { k: "cykl" },
  { k: "procent" }, { k: "portfel" }, { k: "sml" }, { k: "opcja" }, { k: "opcja", o: { typ: "straddle" } }, { k: "stawki" }, { k: "clo" },
  { k: "bep" }, { k: "npv" }, { k: "wacc" }, { k: "zycie" }, { k: "produkt" }, { k: "maslow" }, { k: "okun" }, { k: "uczenie" },
  { k: "cyklzycia" }, { k: "macierz", o: { preset: "wiezien" } },
  { k: "dochodowosc" }, { k: "solow" }, { k: "keynes", o: { wzrost: "1" } }, { k: "engel" }, { k: "konkurencja" }, { k: "lrac" },
  ...["dzietnosc", "obciazenie", "inflacja", "bezrobocie", "dlug", "pkb", "dlugosc-zycia"].map((id) => ({ k: "seria", o: { id } })),
  { k: "piramida", o: { dane: "pl" } },
];

describe("rysunki Podręcznika", () => {
  it("są w artykułach i każdy się rysuje (SVG z treścią, podpis)", () => {
    expect(figs.length).toBeGreaterThanOrEqual(20);
    for (const f of figs) {
      const html = renderToStaticMarkup(createElement(BookFigure, { fig: f }));
      expect(html, f.k).toMatch(/<svg[^>]*role="img"/);
      expect(html, f.k).toMatch(/<(path|line|rect)/);
      if (f.cap) expect(html).toContain("<figcaption>");
    }
  });
  it("wszystkie rodzaje rysunków stałych mają kształt", () => {
    const kinds: FigSpec[] = [
      { k: "koszty" }, { k: "phillips", o: { dlugi: "1" } }, { k: "laffer" }, { k: "lorenz" }, { k: "kmp", o: { punkty: "1" } }, { k: "monopol" },
      { k: "przejscie" }, { k: "blake" }, ...["progresywna", "ustabilizowana", "regresywna"].map((typ) => ({ k: "piramida", o: { typ } })),
      ...["bcg", "ansoff", "ge", "swot"].map((preset) => ({ k: "macierz", o: { preset } })),
      ...NEW_KINDS,
    ];
    for (const f of kinds) expect(renderToStaticMarkup(createElement(BookFigure, { fig: f })), JSON.stringify(f)).toMatch(/<(path|rect) [^>]*(d="M|width=")/);
  });
  it("każda sekcja ma datę ostatniej zmiany tekstu (ukrywanie nieaktualnych podkreśleń)", () => {
    for (const u of Object.values(units)) for (const c of u.chapters) expect(c.ch, c.lesson).toMatch(/^\d{4}-\d\d-\d\dT/);
  });
});

describe("wykresy z danych", () => {
  it("mają źródło (adres API), datę pobrania i liczby", async () => {
    const { SERIES, PYRAMID_PL } = await import("@/data/wykresy");
    for (const s of Object.values(SERIES)) {
      expect(s.urls.length, s.id).toBeGreaterThan(0);
      expect(s.urls.every((u) => u.startsWith("https://ec.europa.eu/eurostat/api/")), s.id).toBe(true);
      expect(s.fetched).toMatch(/^\d{4}-\d\d-\d\d$/);
      for (const l of s.lines) expect(l.points.length, `${s.id} ${l.name}`).toBeGreaterThan(5);
    }
    expect(PYRAMID_PL.men.reduce((a, b) => a + b, 0) + PYRAMID_PL.women.reduce((a, b) => a + b, 0)).toBeGreaterThan(30);
    const html = renderToStaticMarkup(createElement(BookFigure, { fig: { k: "seria", o: { id: "dzietnosc" } } }));
    expect(html).toContain("Źródło:");
  });
});

describe("rysunki przy hasłach (figures.json)", () => {
  it("każde hasło istnieje, a każdy rysunek się rysuje", async () => {
    const figures = (await import("@/data/nauka/figures.json")).default as Record<string, FigSpec>;
    const { COURSE } = await import("@/data/nauka");
    expect(Object.keys(figures).length).toBeGreaterThanOrEqual(150);
    const seen = new Set<string>();
    for (const [id, f] of Object.entries(figures)) {
      expect(COURSE.items[id], id).toBeTruthy();
      expect(COURSE.items[id].f).toEqual(f);
      const key = JSON.stringify([f.k, f.o]);
      if (seen.has(key)) continue;
      seen.add(key);
      expect(renderToStaticMarkup(createElement(BookFigure, { fig: f })), key).toMatch(/<svg[^>]*role="img"/);
    }
  });
});
