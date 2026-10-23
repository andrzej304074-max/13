"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Formularz ładowany dopiero przy pierwszym otwarciu. */
const BugForm = dynamic(() => import("./bug-form").then((m) => m.BugForm), { ssr: false, loading: () => <div className="skeleton" style={{ height: 260 }} /> });

/** Otwiera okienko zgłoszenia z dowolnego miejsca: `window.dispatchEvent(new Event(BUG_EVENT))`. */
export const BUG_EVENT = "owe:bug-report";

const clip = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 120);

/**
 * Nagłówki bieżącej strony (h1–h3 w treści i elementy z `data-bug-section`) oraz ten, przy którym użytkownik jest
 * przewinięty – ostatni nagłówek powyżej ~1/3 wysokości okna (domyślna sekcja zgłoszenia).
 */
export function pageSections(): { list: string[]; current: string } {
  const els = [...document.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main [data-bug-section]")]
    .filter((e) => e.offsetParent !== null && !e.closest(".quick-notes"));
  const list: string[] = [];
  let current = "";
  for (const e of els) {
    const t = clip(e.dataset.bugSection ?? e.textContent ?? "");
    if (!t) continue;
    if (!list.includes(t)) list.push(t);
    if (e.getBoundingClientRect().top < window.innerHeight / 3) current = t;
  }
  return { list: list.slice(0, 60), current };
}

/**
 * Zgłoszenie błędu w wyskakującym panelu (jak szybkie notatki): rodzaj, sekcja strony podpowiedziana z miejsca przewinięcia,
 * opis; „Otwórz na pełnej stronie” przenosi do `/zgloszenia` z listą moich zgłoszeń.
 */
export function BugPopup() {
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState<{ page: string; list: string[]; current: string }>({ page: "", list: [], current: "" });
  const [sent, setSent] = useState(false);
  const path = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = () => {
      const s = pageSections();
      setCtx({ page: window.location.pathname + window.location.search, ...s });
      setSent(false);
      setOpen(true);
    };
    window.addEventListener(BUG_EVENT, h);
    return () => window.removeEventListener(BUG_EVENT, h);
  }, []);
  // przejście na inną stronę zamyka okienko (sekcje i adres dotyczyły poprzedniej)
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    ref.current?.querySelector<HTMLElement>("[data-kind]")?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  if (!open) return null;
  const full = `/zgloszenia?z=${encodeURIComponent(ctx.page)}${ctx.current ? `&s=${encodeURIComponent(ctx.current)}` : ""}`;
  return createPortal(
    <div ref={ref} className="quick-notes bug-popup" role="dialog" aria-label="Zgłoś błąd" data-testid="bug-popup">
      <div className="qn-head">
        <span className="qn-title">🐞 Zgłoś błąd</span>
        <span className="spacer" />
        <Link className="qn-icon" href={full} title="Otwórz na pełnej stronie" aria-label="Otwórz na pełnej stronie" data-testid="bug-full">⤢</Link>
        <button type="button" className="qn-icon" onClick={() => setOpen(false)} title="Zamknij (Esc)" aria-label="Zamknij" data-testid="bug-close">✕</button>
      </div>
      <div className="qn-body">
        <BugForm compact page={ctx.page} sections={ctx.list} section={ctx.current} onSent={() => setSent(true)} />
        {sent && <Link href="/zgloszenia" className="small" data-testid="bug-mine-link">Moje zgłoszenia i odpowiedzi →</Link>}
      </div>
    </div>,
    document.body,
  );
}
