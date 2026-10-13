"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { DeckSummary } from "@/lib/decks";
import { useAccess } from "@/app/components/access";

/** „＋ Do talii” na fiszce: lista talii z zaznaczeniem (dodaj / usuń kartę) i szybkie utworzenie nowej talii z tą kartą. */
function AddToDeckInner({ item, title }: { item: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [up, setUp] = useState(false);
  const [left, setLeft] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDecks(null);
    api<DeckSummary[]>(`/api/talie?item=${encodeURIComponent(item)}`).then(setDecks).catch((e) => setMsg(e.message));
    const close = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open, item]);

  async function toggle(d: DeckSummary) {
    setDecks((all) => all && all.map((x) => (x.id === d.id ? { ...x, has: !d.has, count: x.count + (d.has ? -1 : 1) } : x)));
    try {
      await api(`/api/talie/${d.id}/karty`, { method: d.has ? "DELETE" : "POST", body: JSON.stringify({ item }) });
      setMsg(d.has ? `Usunięto z „${d.name}”.` : `Dodano do „${d.name}”.`);
    } catch (e) {
      setMsg((e as Error).message);
      setDecks((all) => all && all.map((x) => (x.id === d.id ? d : x)));
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      const d = await api<{ id: string; name: string }>("/api/talie", { method: "POST", body: JSON.stringify({ name: name || "Nowa talia", items: [item] }) });
      setDecks((all) => [{ id: d.id, name: d.name, count: 1, preview: [title], updated_at: new Date().toISOString(), has: true }, ...(all ?? [])]);
      setName("");
      setMsg(`Utworzono „${d.name}” z tą kartą.`);
    } catch (err) {
      setMsg((err as Error).message);
    }
  }

  return (
    <div className="add-deck" ref={box} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="btn small secondary" aria-expanded={open} aria-haspopup="dialog" onClick={(e) => {
          // okienko tam, gdzie jest więcej miejsca (nad przyciskiem albo pod nim)
          const r = e.currentTarget.getBoundingClientRect();
          setUp(window.innerHeight - r.bottom < 340 && r.top > window.innerHeight - r.bottom);
          setLeft(r.left + r.width / 2 < window.innerWidth / 2);
          setOpen(!open); setMsg(null);
        }} data-testid="add-to-deck">＋ Do talii</button>
      {open && (
        <div className={`add-deck-pop${up ? " up" : ""}${left ? " left" : ""}`} role="dialog" aria-label={`Dodaj „${title}” do talii`}>
          <strong className="add-deck-head">Dodaj do talii</strong>
          {!decks ? <span className="muted">Ładowanie…</span> : decks.length === 0 ? <span className="muted">Nie masz jeszcze talii – utwórz pierwszą:</span> : (
            <ul>
              {decks.map((d) => (
                <li key={d.id}>
                  <label className="check"><input type="checkbox" checked={!!d.has} onChange={() => toggle(d)} /> {d.name} <span className="muted">({d.count})</span></label>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={create} className="add-deck-new">
            <input className="select" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nowa talia…" maxLength={60} aria-label="Nazwa nowej talii" />
            <button className="btn small">Utwórz</button>
          </form>
          {msg && <span className="muted add-deck-msg" role="status">{msg}</span>}
          <Link href="/fiszki/talie" className="add-deck-link">Moje talie →</Link>
        </div>
      )}
    </div>
  );
}

/** Ukryte, gdy administrator wyłączył sekcję „/fiszki/talie”. */
export function AddToDeck(props: { item: string; title: string }) {
  const { blocked } = useAccess();
  return blocked("/fiszki/talie") ? null : <AddToDeckInner {...props} />;
}

