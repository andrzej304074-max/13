"use client";

import Link from "next/link";
import { useState } from "react";
import { useData } from "@/lib/data-client";
import type { FigSpec } from "@/lib/nauka-types";
import { ItemFigure } from "./item-figure";

type More = Record<string, { x: string; ex: string; ch?: [string, string] }>;

function MoreBody({ id, f }: { id: string; f?: FigSpec | null }) {
  const { data, error } = useData<More>("/api/dane/wiecej");
  if (error) return <p className="error small" style={{ margin: 0 }}>{error}</p>;
  if (!data) return <div className="skeleton" style={{ height: 80 }} />;
  const m = data[id];
  if (!m) return <p className="muted small" style={{ margin: 0 }}>Rozwinięcia tego hasła jeszcze nie ma.</p>;
  return (
    <div className="more-body" data-testid="more-body">
      <p>{m.x}</p>
      <p className="more-ex"><strong>Przykład:</strong> {m.ex}</p>
      {f && <ItemFigure f={f} compact />}
      {m.ch && <Link className="more-link" href={`/nauka/podrecznik/${m.ch[0]}/${m.ch[1]}`} onClick={(e) => e.stopPropagation()}>📖 Czytaj w Podręczniku</Link>}
    </div>
  );
}

/**
 * „Więcej ▾” przy haśle (fiszki, kurs, tabela pojęć, mapa myśli): rozszerzone wyjaśnienie, przykład, rysunek (gdy nie ma go
 * już obok – `f`) i link do rozdziału Podręcznika. Dane pobierane dopiero po pierwszym rozwinięciu.
 */
export function MoreButton({ id, f }: { id: string; f?: FigSpec | null }) {
  const [open, setOpen] = useState(false);
  if (id.startsWith("u:")) return null; // własne fiszki konta – bez rozwinięcia
  return (
    <div className={`more${open ? " open" : ""}`} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="more-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)} data-testid="more-btn">
        {open ? "Mniej ▴" : "Więcej ▾"}
      </button>
      {open && <MoreBody id={id} f={f} />}
    </div>
  );
}
