"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, withUser, useViewedUser } from "@/lib/client";
import type { NoteRow } from "@/lib/notes";

/** Edytor ładowany dopiero po otwarciu brudnopisu – testy i lekcje nie pobierają jego kodu na zapas. */
const NoteEditor = dynamic(() => import("./editor").then((m) => m.NoteEditor), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 220 }} />,
});

const OPEN_KEY = "owe:scratchOpen";

/**
 * Brudnopis pod przyciskiem „Sprawdź”: jeden na pytanie testu (`owe:<id>`, `slownik:<id>`) albo na pod-lekcję
 * (`lekcja:<id>:<sub>`). Zapisuje się sam i trafia do Notatki → Brudnopisy. Otwarty zostaje otwarty przy kolejnych pytaniach.
 */
export function QuestionScratch({ refKey }: { refKey: string }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<{ ref: string; note: NoteRow | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preview = useViewedUser();

  useEffect(() => {
    try { setOpen(localStorage.getItem(OPEN_KEY) === "1"); } catch {}
  }, []);

  useEffect(() => {
    if (!open || loaded?.ref === refKey) return;
    let alive = true;
    setError(null);
    api<{ note: NoteRow | null }>(withUser(`/api/notatki/brudnopis?ref=${encodeURIComponent(refKey)}`))
      .then((r) => alive && setLoaded({ ref: refKey, note: r.note }))
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [open, refKey, loaded?.ref]);

  const toggle = () => {
    setOpen((o) => {
      try { localStorage.setItem(OPEN_KEY, o ? "0" : "1"); } catch {}
      return !o;
    });
  };

  return (
    <section className={`q-scratch${open ? " open" : ""}`} aria-label="Brudnopis">
      <div className="q-scratch-head">
        <button type="button" className="btn secondary small" onClick={toggle} aria-expanded={open} data-testid="scratch-toggle">
          ✏️ Brudnopis <span aria-hidden>{open ? "▴" : "▾"}</span>
        </button>
        {open && <Link href="/notatki/brudnopisy" className="small muted">Wszystkie brudnopisy →</Link>}
      </div>
      {open && (error ? <p className="error small">{error}</p>
        : loaded?.ref === refKey ? <NoteEditor key={refKey} note={loaded.note} kind="scratch" refKey={refKey} compact readOnly={!!preview}
            onSaved={(n) => setLoaded({ ref: refKey, note: n })} />
        : <div className="skeleton" style={{ height: 220 }} />)}
    </section>
  );
}
