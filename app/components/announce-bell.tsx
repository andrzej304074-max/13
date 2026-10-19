"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Badge = { unread: number; pinned: { id: string; title: string; body: string } | null };

/** Wspólny stan licznika ogłoszeń (🔔 i pasek przypiętego ogłoszenia): jedno zapytanie na 60 s, odświeżane zdarzeniem „ann:changed”. */
let cache: { at: number; p: Promise<Badge> } | null = null;
const TTL = 60_000;
function load(force = false): Promise<Badge> {
  if (!force && cache && Date.now() - cache.at < TTL) return cache.p;
  const p = api<Badge>("/api/ogloszenia/licznik");
  cache = { at: Date.now(), p };
  p.catch(() => { cache = null; });
  return p;
}
/** Wywołaj po przeczytaniu, głosowaniu albo ukryciu ogłoszenia. */
export function annChanged() {
  cache = null;
  window.dispatchEvent(new Event("ann:changed"));
}

function useBadge(): Badge | null {
  const [b, setB] = useState<Badge | null>(null);
  const path = usePathname();
  useEffect(() => {
    let live = true;
    const get = (force = false) => load(force).then((x) => live && setB(x)).catch(() => {});
    get();
    const on = () => get(true);
    window.addEventListener("ann:changed", on);
    return () => { live = false; window.removeEventListener("ann:changed", on); };
  }, [path]);
  return b;
}

/** 🔔 w nagłówku: liczba nieprzeczytanych ogłoszeń i ankiet. */
export function AnnounceBell() {
  const b = useBadge();
  const n = b?.unread ?? 0;
  const label = n ? `Ogłoszenia – nieprzeczytane: ${n}` : "Ogłoszenia";
  return (
    <Link href="/ogloszenia" className="qn-btn ann-bell" aria-label={label} title={label} data-testid="ann-bell">
      <span aria-hidden>🔔</span>
      {n > 0 && <span className="ann-count" data-testid="ann-count">{n > 99 ? "99+" : n}</span>}
    </Link>
  );
}

/** Pasek przypiętego ogłoszenia nad treścią strony; „×” ukrywa go na stałe (ogłoszenie zostaje na liście). */
export function PinnedBar() {
  const b = useBadge();
  const path = usePathname();
  const [hidden, setHidden] = useState<string | null>(null);
  const p = b?.pinned;
  if (!p || hidden === p.id || path === "/ogloszenia") return null;
  async function close() {
    setHidden(p!.id);
    try { await api(`/api/ogloszenia/${p!.id}/ukryj`, { method: "POST" }); } catch { /* pasek wróci przy następnym odświeżeniu */ }
    annChanged();
  }
  return (
    <div className="ann-pinned" role="status" data-testid="ann-pinned">
      <span aria-hidden>📌</span>
      <Link href="/ogloszenia" className="ann-pinned-text"><strong>{p.title}</strong> <span className="muted">{p.body.split("\n")[0]}</span></Link>
      <button type="button" className="ann-pinned-x" onClick={close} aria-label="Ukryj ogłoszenie" data-testid="ann-pinned-x">×</button>
    </div>
  );
}
