"use client";

import dynamic from "next/dynamic";
import type { FigSpec } from "@/lib/nauka-types";

/** Rysunek hasła (kurs, fiszki, tabela pojęć, mapa) – komponent rysunków ładowany dopiero, gdy jest co pokazać. */
const BookFigure = dynamic(() => import("./book-figure").then((m) => m.BookFigure), {
  ssr: false, loading: () => <div className="skeleton" style={{ height: 200 }} />,
});

export function ItemFigure({ f, compact }: { f?: FigSpec | null; compact?: boolean }) {
  if (!f) return null;
  return <div className={`item-fig${compact ? " compact" : ""}`} data-testid="item-fig"><BookFigure fig={f} /></div>;
}
