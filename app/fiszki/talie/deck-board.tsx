"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PoolCard } from "../card-pool";
import { StarButton } from "@/app/components/star";
import { moveItem } from "@/lib/decks-core";

const GAP = 8;
const EDGE = 72;

interface Drag { id: string; from: number; over: number; dy: number; h: number; startY: number; startScroll: number; tops: number[]; heights: number[]; lastY: number }

/**
 * Karty talii do przeciągania (mysz, palec, rysik – Pointer Events) za uchwyt ⠿: przeciągana karta jedzie za palcem,
 * pozostałe rozsuwają się animacją, przy krawędzi ekranu strona sama się przewija. Z klawiatury: fokus na uchwycie + ↑/↓.
 * Nowo dodana karta „wlatuje” z miejsca wyniku wyszukiwania (`fly`).
 */
export function DeckBoard({ items, byId, topicName, readOnly, onReorder, onRemove, fly, stars, onStar }: {
  items: string[]; byId: Map<string, PoolCard>; topicName: Record<string, string>; readOnly: boolean;
  stars: Set<string>; onStar: (id: string) => void;
  onReorder: (items: string[]) => void; onRemove: (id: string) => void;
  fly: React.MutableRefObject<{ id: string; from: DOMRect } | null>;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  dragRef.current = drag;
  const els = useRef(new Map<string, HTMLLIElement>());
  const focusId = useRef<string | null>(null);
  const raf = useRef<number | null>(null);

  // animacja „wlotu” nowej karty z wyniku wyszukiwania
  useLayoutEffect(() => {
    const f = fly.current;
    if (!f) return;
    const el = els.current.get(f.id);
    if (!el) return;
    fly.current = null;
    const to = el.getBoundingClientRect();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const dx = f.from.left - to.left, dy = f.from.top - to.top;
      el.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${Math.min(1, f.from.width / to.width)})`, opacity: 0.35 },
        { transform: "none", opacity: 1 },
      ], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    if (to.bottom > window.innerHeight - 80 || to.top < 80) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [items, fly]);

  // po przeniesieniu z klawiatury fokus zostaje na uchwycie tej samej karty
  useEffect(() => {
    if (!focusId.current) return;
    els.current.get(focusId.current)?.querySelector<HTMLButtonElement>(".deck-handle")?.focus();
    focusId.current = null;
  }, [items]);

  const update = (clientY: number) => {
    const d = dragRef.current;
    if (!d) return;
    const dy = clientY - d.startY + (window.scrollY - d.startScroll);
    const center = d.tops[d.from] + d.heights[d.from] / 2 + dy;
    // nowa pozycja = liczba pozostałych kart, których środek jest nad środkiem przeciąganej
    let over = 0;
    for (let i = 0; i < d.tops.length; i++) if (i !== d.from && center > d.tops[i] + d.heights[i] / 2) over++;
    setDrag({ ...d, dy, over, lastY: clientY });
  };

  const autoScroll = () => {
    const d = dragRef.current;
    if (!d) { raf.current = null; return; }
    const bar = document.querySelector("nav.bottom-bar")?.getBoundingClientRect().height ?? 0;
    const y = d.lastY;
    let v = 0;
    if (y < EDGE + 60) v = -Math.ceil((EDGE + 60 - y) / 6);
    else if (y > window.innerHeight - bar - EDGE) v = Math.ceil((y - (window.innerHeight - bar - EDGE)) / 6);
    if (v) { window.scrollBy(0, v); update(y); }
    raf.current = requestAnimationFrame(autoScroll);
  };

  const onDown = (e: React.PointerEvent<HTMLButtonElement>, id: string, i: number) => {
    if (readOnly || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rects = items.map((x) => els.current.get(x)!.getBoundingClientRect());
    const tops = rects.map((r) => r.top + window.scrollY), heights = rects.map((r) => r.height);
    const d: Drag = { id, from: i, over: i, dy: 0, h: heights[i], startY: e.clientY, startScroll: window.scrollY, tops, heights, lastY: e.clientY };
    dragRef.current = d;
    setDrag(d);
    if (raf.current === null) raf.current = requestAnimationFrame(autoScroll);
  };
  const onMove = (e: React.PointerEvent) => { if (dragRef.current) update(e.clientY); };
  const onUp = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setDrag(null);
    if (raf.current !== null) { cancelAnimationFrame(raf.current); raf.current = null; }
    if (d.over !== d.from) onReorder(moveItem(items, d.from, d.over));
  };
  useEffect(() => () => { if (raf.current !== null) cancelAnimationFrame(raf.current); }, []);

  const onKey = (e: React.KeyboardEvent, id: string, i: number) => {
    if (readOnly) return;
    const to = e.key === "ArrowUp" ? i - 1 : e.key === "ArrowDown" ? i + 1 : e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : null;
    if (to === null || to < 0 || to >= items.length || to === i) return;
    e.preventDefault();
    focusId.current = id;
    onReorder(moveItem(items, i, to));
  };

  const shift = (i: number): number => {
    if (!drag || i === drag.from) return 0;
    const h = drag.h + GAP;
    if (drag.from < drag.over && i > drag.from && i <= drag.over) return -h;
    if (drag.from > drag.over && i >= drag.over && i < drag.from) return h;
    return 0;
  };

  return (
    <ol className={`deck-board${drag ? " dragging" : ""}`} data-testid="deck-board">
      {items.map((id, i) => {
        const c = byId.get(id);
        const me = drag?.id === id;
        return (
          <li key={id} ref={(el) => { if (el) els.current.set(id, el); else els.current.delete(id); }}
            className={`deck-item${me ? " lifted" : ""}${c?.own ? " own" : ""}`} data-testid="deck-item" data-id={id}
            style={{ transform: me ? `translateY(${drag!.dy}px)` : shift(i) ? `translateY(${shift(i)}px)` : undefined }}>
            {!readOnly && (
              <button type="button" className="deck-handle" aria-label={`Przenieś: ${c?.t ?? id} (pozycja ${i + 1} z ${items.length}; strzałki ↑/↓)`}
                title="Przeciągnij, aby zmienić kolejność (albo strzałki ↑/↓)"
                onPointerDown={(e) => onDown(e, id, i)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
                onKeyDown={(e) => onKey(e, id, i)} data-testid="deck-handle">⠿</button>
            )}
            <span className="deck-no" aria-hidden>{i + 1}</span>
            <div className="deck-body">
              <strong>{c?.own && <span className="own-mark" title="Moja fiszka">✍️ </span>}{c?.t ?? id}</strong>
              {c && <span className="muted deck-meta">{topicName[c.topic]}{c.n > 0 ? ` · OWE ${c.n}×` : ""}</span>}
              {c && <span className="deck-def">{c.d}</span>}
            </div>
            <StarButton on={stars.has(id)} onToggle={() => onStar(id)} label="fiszkę do ulubionych" disabled={readOnly} />
            {!readOnly && <button type="button" className="deck-remove" onClick={() => onRemove(id)} aria-label={`Usuń z talii: ${c?.t ?? id}`} title="Usuń z talii">✕</button>}
          </li>
        );
      })}
    </ol>
  );
}
