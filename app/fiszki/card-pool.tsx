"use client";

import { useEffect, useMemo, useState } from "react";
import { StarFilterSeg, type StarFilter } from "@/app/components/star";
import { api, withUser } from "@/lib/client";
import { loadData } from "@/lib/data-client";
import type { Haslo } from "@/lib/data-server";
import { normalize } from "@/lib/nauka-logic";
import type { OwnCard } from "@/lib/own-cards";

/**
 * Pula kart do wyszukiwania (edytor talii, fiszka w notatce): hasła kursu + własne fiszki konta
 * oraz wspólny pasek filtrów (źródło, dział, rodzaj, gwiazdka, tylko z pytań OWE).
 */

export type PoolCard = Haslo & { own?: boolean };
type Topic = { id: string; title: string; emoji: string };
type Kind = { id: string; title: string };
export type Source = "" | "kurs" | "moje";
export interface CardFilter { src: Source; topic: string; kind: string; owe: boolean; gw: StarFilter }
export const NO_FILTER: CardFilter = { src: "", topic: "", kind: "", owe: false, gw: "" };

export const ownToPool = (c: OwnCard): PoolCard => ({ id: c.id, t: c.t, d: c.d, w: c.w, kind: c.kind, topic: c.topic, n: 0, own: true });

/** Pula kart; `enabled = false` – nic nie pobiera (np. notatka bez fiszek, dopóki nie otworzysz wyszukiwarki). */
export function useCardPool(enabled = true) {
  const [hasla, setHasla] = useState<{ rows: Haslo[]; topics: Topic[]; kinds: Kind[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [own, setOwn] = useState<OwnCard[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let on = true;
    loadData<{ rows: Haslo[]; topics: Topic[]; kinds: Kind[] }>("/api/dane/hasla").then((v) => on && setHasla(v)).catch((e) => on && setError(e.message));
    api<OwnCard[]>(withUser("/api/fiszki/moje")).then((v) => on && setOwn(v)).catch(() => on && setOwn([]));
    return () => { on = false; };
  }, [enabled]);
  const rows = useMemo<PoolCard[] | null>(() => (hasla && own ? [...own.map(ownToPool), ...hasla.rows] : null), [hasla, own]);
  const topicName = useMemo(
    () => Object.fromEntries((hasla?.topics ?? []).map((t) => [t.id, `${t.emoji} ${t.title.replace(/^Temat przewodni: /, "")}`])), [hasla]);
  return { rows, topics: hasla?.topics ?? [], kinds: hasla?.kinds ?? [], topicName, error };
}

/** Wyszukiwanie: najpierw tytuły zaczynające się od frazy, potem zawierające ją, potem trafienia w definicji. */
export function searchCards(rows: PoolCard[], q: string, f: CardFilter, stars: Set<string>, limit = 30): PoolCard[] {
  const n = normalize(q);
  const base = rows.filter((r) => (!f.src || (f.src === "moje" ? !!r.own : !r.own)) && (!f.topic || r.topic === f.topic) && (!f.kind || r.kind === f.kind)
    && (!f.owe || r.n > 0) && (!f.gw || stars.has(r.id) === (f.gw === "1")));
  if (!n) return base.slice(0, limit);
  const a: PoolCard[] = [], b: PoolCard[] = [], c: PoolCard[] = [];
  for (const r of base) {
    const t = normalize(r.t);
    if (t.startsWith(n)) a.push(r);
    else if (t.includes(n)) b.push(r);
    else if (n.length >= 4 && normalize(r.d).includes(n)) c.push(r);
    if (a.length >= limit) break;
  }
  return [...a, ...b, ...c].slice(0, limit);
}

/** Pasek filtrów kart. */
export function CardFilters({ value, onChange, topics, kinds, topicName, ownCount }: {
  value: CardFilter; onChange: (f: CardFilter) => void; topics: Topic[]; kinds: Kind[]; topicName: Record<string, string>; ownCount: number;
}) {
  const set = (p: Partial<CardFilter>) => onChange({ ...value, ...p });
  return (
    <div className="stack card-filters" style={{ gap: 8 }} data-testid="card-filters">
      <div className="filter-grid">
        <label className="filters">Źródło
          <select className="select" value={value.src} onChange={(e) => set({ src: e.target.value as Source })} data-testid="filter-src">
            <option value="">wszystkie</option>
            <option value="kurs">z kursu</option>
            <option value="moje">✍️ moje fiszki ({ownCount})</option>
          </select>
        </label>
        <label className="filters">Dział
          <select className="select" value={value.topic} onChange={(e) => set({ topic: e.target.value })}>
            <option value="">wszystkie</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{topicName[t.id]}</option>)}
          </select>
        </label>
        <label className="filters">Rodzaj
          <select className="select" value={value.kind} onChange={(e) => set({ kind: e.target.value })}>
            <option value="">wszystkie</option>
            {kinds.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
          </select>
        </label>
      </div>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <StarFilterSeg value={value.gw} onChange={(gw) => set({ gw })} />
        <label className="check"><input type="checkbox" checked={value.owe} onChange={(e) => set({ owe: e.target.checked })} /> tylko z pytań OWE</label>
      </div>
    </div>
  );
}
