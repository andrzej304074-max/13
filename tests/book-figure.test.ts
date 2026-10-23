import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import book from "@/data/nauka/podrecznik.json";
import { BookFigure, type FigSpec } from "@/app/components/book-figure";

type B = { fig?: FigSpec };
const units = (book as unknown as { units: Record<string, { intro: { blocks: B[] } | null; chapters: { lesson: string; blocks: B[]; ch?: string }[] }> }).units;
const figs = Object.values(units).flatMap((u) => [...(u.intro?.blocks ?? []), ...u.chapters.flatMap((c) => c.blocks)]).filter((b) => b.fig).map((b) => b.fig!);

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
    ];
    for (const f of kinds) expect(renderToStaticMarkup(createElement(BookFigure, { fig: f })), JSON.stringify(f)).toMatch(/<(path|rect) [^>]*(d="M|width=")/);
  });
  it("każda sekcja ma datę ostatniej zmiany tekstu (ukrywanie nieaktualnych podkreśleń)", () => {
    for (const u of Object.values(units)) for (const c of u.chapters) expect(c.ch, c.lesson).toMatch(/^\d{4}-\d\d-\d\dT/);
  });
});
