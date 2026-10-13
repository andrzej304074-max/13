"use client";

import { useMemo, useRef, useState } from "react";
import { CardFilters, NO_FILTER, searchCards, type CardFilter, type PoolCard } from "@/app/fiszki/card-pool";
import { useStars } from "@/lib/stars-client";
import { INK_W, NOTE_CARD_W, type NoteCard } from "@/lib/notes-core";

/**
 * Fiszki przypięte do kartki notatki: kwadraty nad tekstem i rysunkiem, przesuwane tylko uchwytem ⠿
 * (pisanie i rysowanie pod nimi działa normalnie). Dotknięcie karty odwraca ją na definicję.
 * Pozycje w jednostkach rysunku (szerokość kartki = INK_W), więc karta trzyma się tego samego miejsca przy każdej szerokości.
 */
export function NoteCards({ cards, byId, k, readOnly, onChange }: {
  cards: NoteCard[]; byId: Map<string, PoolCard>; k: number; readOnly: boolean; onChange: (cards: NoteCard[]) => void;
}) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const start = useRef<{ id: string; px: number; py: number; x: number; y: number } | null>(null);
  if (!k) return null;

  const onDown = (e: React.PointerEvent, c: NoteCard) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { id: c.id, px: e.clientX, py: e.clientY, x: c.x, y: c.y };
    setDrag({ id: c.id, dx: 0, dy: 0 });
  };
  const onMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    setDrag({ id: s.id, dx: (e.clientX - s.px) / k, dy: (e.clientY - s.py) / k });
  };
  const onUp = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    start.current = null;
    const dx = (e.clientX - s.px) / k, dy = (e.clientY - s.py) / k;
    setDrag(null);
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    const x = Math.round(Math.min(INK_W - NOTE_CARD_W, Math.max(0, s.x + dx)));
    const y = Math.round(Math.max(0, s.y + dy));
    onChange(cards.map((c) => (c.id === s.id ? { ...c, x, y } : c)));
  };
  const onKey = (e: React.KeyboardEvent, c: NoteCard) => {
    const d = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[e.key];
    if (!d || readOnly) return;
    e.preventDefault();
    onChange(cards.map((x) => (x.id === c.id ? { ...x, x: Math.min(INK_W - NOTE_CARD_W, Math.max(0, x.x + d[0])), y: Math.max(0, x.y + d[1]) } : x)));
  };

  return (
    <>
      {cards.map((c) => {
        const h = byId.get(c.id);
        const moving = drag?.id === c.id;
        const x = c.x + (moving ? drag.dx : 0), y = c.y + (moving ? drag.dy : 0);
        const back = !!flipped[c.id];
        return (
          <div key={c.id} className={`note-card${moving ? " moving" : ""}${h?.own ? " own" : ""}${back ? " back" : ""}`} data-testid="note-card" data-id={c.id}
            style={{ left: x * k, top: y * k, width: NOTE_CARD_W * k }}>
            <div className="note-card-bar">
              {!readOnly && (
                <button type="button" className="note-card-handle" aria-label={`Przesuń fiszkę: ${h?.t ?? c.id} (albo strzałki)`} title="Przeciągnij, aby przesunąć (albo strzałki)"
                  onPointerDown={(e) => onDown(e, c)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={(e) => onKey(e, c)}
                  data-testid="note-card-handle">⠿</button>
              )}
              <span className="note-card-kind">{h?.own ? "✍️ Moja fiszka" : "🗂️ Fiszka"}</span>
              {!readOnly && (
                <button type="button" className="note-card-x" onClick={() => onChange(cards.filter((x) => x.id !== c.id))}
                  aria-label={`Usuń fiszkę z kartki: ${h?.t ?? c.id}`} title="Usuń z kartki" data-testid="note-card-remove">✕</button>
              )}
            </div>
            <button type="button" className="note-card-body" onClick={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))}
              aria-label={back ? `Definicja: ${h?.t ?? ""}` : `Fiszka: ${h?.t ?? ""} – dotknij, aby zobaczyć definicję`}>
              {!h ? <span className="muted">(usunięta fiszka)</span> : back ? <>
                <strong>{h.t}</strong>
                <span>{h.d}</span>
                {h.w && <code>{h.w}</code>}
              </> : <>
                <strong className="note-card-title">{h.t}</strong>
                <span className="muted note-card-hint">dotknij – definicja</span>
              </>}
            </button>
          </div>
        );
      })}
    </>
  );
}

/** Wyszukiwarka fiszek do wstawienia na kartkę (hasła kursu i własne fiszki, wspólne filtry). */
export function CardPicker({ pool, onPick, onClose, already }: {
  pool: { rows: PoolCard[] | null; topics: { id: string; title: string; emoji: string }[]; kinds: { id: string; title: string }[]; topicName: Record<string, string> };
  onPick: (id: string) => void; onClose: () => void; already: Set<string>;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<CardFilter>(NO_FILTER);
  const { stars } = useStars("fiszka");
  const results = useMemo(() => (pool.rows ? searchCards(pool.rows, q, filter, stars, 20) : []), [pool.rows, q, filter, stars]);
  return (
    <div className="card stack note-card-picker" role="dialog" aria-label="Wstaw fiszkę na kartkę" data-testid="note-card-picker">
      <div className="row" style={{ gap: 8 }}>
        <input className="select" type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj hasła albo własnej fiszki…"
          aria-label="Szukaj fiszki" data-testid="note-card-search" style={{ flex: 1 }}
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); if (e.key === "Enter" && results[0]) { e.preventDefault(); onPick(results[0].id); } }} />
        <button type="button" className="btn small secondary" onClick={onClose}>Zamknij</button>
      </div>
      {pool.rows ? <>
        <details>
          <summary className="muted">Filtry</summary>
          <CardFilters value={filter} onChange={setFilter} topics={pool.topics} kinds={pool.kinds} topicName={pool.topicName} ownCount={pool.rows.filter((r) => r.own).length} />
        </details>
        <ul className="deck-results" data-testid="note-card-results">
          {results.length === 0 && <li className="muted">Nic nie pasuje.</li>}
          {results.map((r) => (
            <li key={r.id}>
              <button type="button" className={`deck-result${r.own ? " own" : ""}`} disabled={already.has(r.id)} onClick={() => onPick(r.id)}>
                <span className="deck-result-main"><strong>{r.own && "✍️ "}{r.t}</strong><span className="muted">{pool.topicName[r.topic]}</span></span>
                <span className="deck-result-act" aria-hidden>{already.has(r.id) ? "✓ na kartce" : "＋"}</span>
              </button>
            </li>
          ))}
        </ul>
      </> : <p className="muted">Ładowanie fiszek…</p>}
    </div>
  );
}
