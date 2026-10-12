"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { displayTitle } from "@/lib/notes-core";
import type { NoteRow, NoteSummary } from "@/lib/notes";
import { NoteEditor } from "./editor";
import type { QuickState } from "./quick-notes";

/** Zawartość szybkiego panelu: lista ostatnich notatek albo edytor wybranej (nowej). Zawsze własne notatki. */
export function QuickPanel({ state, update, close }: { state: QuickState; update: (p: Partial<QuickState>) => void; close: () => void }) {
  const [list, setList] = useState<NoteSummary[] | null>(null);
  const [note, setNote] = useState<NoteRow | null | "new">(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const noteRef = useRef(note);
  noteRef.current = note;
  // klucz edytora zmienia się tylko przy wyborze innej notatki – zapis nowej (nadanie id) nie przemontowuje edytora
  const [edKey, setEdKey] = useState(0);
  const editing = state.noteId !== null || note === "new";

  useEffect(() => {
    if (state.noteId) {
      const cur = noteRef.current;
      if (cur && cur !== "new" && cur.id === state.noteId) return;
      api<NoteRow>(`/api/notatki/${state.noteId}`).then((n) => { setEdKey((k) => k + 1); setNote(n); }).catch(() => update({ noteId: null }));
    } else if (note !== "new") {
      setNote(null);
      api<NoteSummary[]>("/api/notatki?rodzaj=note").then((r) => setList(r.slice(0, 30))).catch((e) => setError(e.message));
    }
  }, [state.noteId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc – zminimalizuj (gdy fokus w panelu)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && ref.current?.contains(document.activeElement)) update({ min: true }); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [update]);

  return (
    <div ref={ref} className={`quick-notes${state.min ? " is-min" : ""}`} role="dialog" aria-label="Szybkie notatki" aria-hidden={state.min} data-testid="qn-panel">
      <div className="qn-head">
        {editing ? (
          <button type="button" className="qn-icon" onClick={() => { setNote(null); update({ noteId: null }); }} title="Lista notatek" data-testid="qn-list">←</button>
        ) : <span className="qn-title">🗒️ Notatki</span>}
        <span className="spacer" />
        {editing && note && note !== "new" && <Link className="qn-icon" href={`/notatki/${note.id}`} title="Otwórz na całej stronie">⤢</Link>}
        <button type="button" className="qn-icon" onClick={() => update({ min: true })} title="Zminimalizuj (Esc)" data-testid="qn-min">▁</button>
        <button type="button" className="qn-icon" onClick={close} title="Zamknij" data-testid="qn-close">✕</button>
      </div>
      <div className="qn-body">
        {error && <p className="error small">{error}</p>}
        {editing ? (
          note === null ? <div className="skeleton" style={{ height: 260 }} />
            : <NoteEditor key={edKey} note={note === "new" ? null : note} kind="note" compact showTitle
                onSaved={(n) => { if (state.noteId !== n.id) update({ noteId: n.id }); setNote(n); }} />
        ) : (
          <>
            <button type="button" className="btn qn-new" onClick={() => { setEdKey((k) => k + 1); setNote("new"); }} data-testid="qn-new">+ Nowa notatka</button>
            {!list ? <div className="skeleton" style={{ height: 160 }} />
              : list.length === 0 ? <p className="muted small">Nie masz jeszcze notatek – zacznij od nowej. Panel zostaje otwarty, gdy przechodzisz między stronami.</p>
              : (
                <ul className="qn-list">
                  {list.map((n) => (
                    <li key={n.id}>
                      <button type="button" onClick={() => { setEdKey((k) => k + 1); update({ noteId: n.id }); }}>
                        <span className="qn-item-title">{n.starred && <span className="qn-star" aria-label="z gwiazdką">★ </span>}{displayTitle({ title: n.title, body: n.excerpt })}</span>
                        <span className="qn-item-meta">{new Date(n.updated_at).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            <Link href="/notatki" className="small">Wszystkie notatki i brudnopisy →</Link>
          </>
        )}
      </div>
    </div>
  );
}
