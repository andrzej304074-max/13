"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Panel ładowany dopiero przy pierwszym otwarciu – przycisk w nagłówku nic nie kosztuje. */
const QuickPanel = dynamic(() => import("./quick-panel").then((m) => m.QuickPanel), { ssr: false });

const KEY = "owe:quickNotes";
export interface QuickState { open: boolean; min: boolean; noteId: string | null }
const CLOSED: QuickState = { open: false, min: false, noteId: null };

/**
 * Szybkie notatki z każdej strony: przycisk 🗒️ w nagłówku otwiera panel (z boku na komputerze, od dołu na telefonie).
 * Panel żyje w układzie strony, więc przejścia między stronami go nie zamykają; zminimalizowany zachowuje treść.
 */
export function QuickNotes() {
  const [s, setS] = useState<QuickState>(CLOSED);
  useEffect(() => {
    try {
      const v = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
      if (v && typeof v.open === "boolean") setS({ open: v.open, min: !!v.min, noteId: typeof v.noteId === "string" ? v.noteId : null });
    } catch {}
  }, []);
  const update = useCallback((patch: Partial<QuickState>) => {
    setS((o) => {
      const n = { ...o, ...patch };
      try { sessionStorage.setItem(KEY, JSON.stringify(n)); } catch {}
      return n;
    });
  }, []);
  // „Do notatki” z Podręcznika (i inne miejsca) otwiera panel z gotową notatką
  useEffect(() => {
    const h = (e: Event) => {
      const id = (e as CustomEvent<{ noteId?: string }>).detail?.noteId;
      if (typeof id === "string") update({ open: true, min: false, noteId: id });
    };
    window.addEventListener("owe:quick-note", h);
    return () => window.removeEventListener("owe:quick-note", h);
  }, [update]);
  const click = () => (!s.open ? update({ open: true, min: false }) : s.min ? update({ min: false }) : update({ min: true }));
  const label = !s.open ? "Otwórz szybkie notatki" : s.min ? "Przywróć notatkę" : "Zminimalizuj notatki";
  return (
    <>
      <button type="button" className={`qn-btn${s.open ? " on" : ""}${s.min ? " min" : ""}`} onClick={click} aria-label={label} title={label}
        aria-expanded={s.open && !s.min} data-testid="qn-btn">
        <span aria-hidden>🗒️</span><span className="qn-lbl">{s.open && s.min ? "Notatka" : "Notatki"}</span>
        {s.open && s.min && <i className="qn-dot" aria-hidden />}
      </button>
      {/* portal do <body>: nagłówek ma backdrop-filter, który byłby blokiem zawierającym dla position: fixed panelu */}
      {s.open && createPortal(<QuickPanel state={s} update={update} close={() => update(CLOSED)} />, document.body)}
    </>
  );
}
