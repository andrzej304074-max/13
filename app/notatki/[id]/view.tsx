"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PreviewBanner } from "@/app/components/preview-banner";
import { StarButton } from "@/app/components/star";
import { api, withUser, useViewedUser } from "@/lib/client";
import { refHref } from "@/lib/notes-core";
import type { NoteRow } from "@/lib/notes";
import { fmtDate } from "../list";
import { LoadError } from "@/app/components/load-error";

const NoteEditor = dynamic(() => import("@/app/components/notes/editor").then((m) => m.NoteEditor), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 420 }} />,
});

/** Pojedyncza notatka lub brudnopis: edytor, gwiazdka, usuwanie, link do źródła. */
export function NoteView({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState<NoteRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  // błąd gwiazdki / usuwania – pod nagłówkiem, edytor zostaje
  const [actionError, setActionError] = useState<string | null>(null);
  const preview = useViewedUser();
  const userQ = preview ? `?user=${preview}` : "";

  useEffect(() => {
    api<NoteRow>(withUser(`/api/notatki/${id}`)).then(setNote).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <LoadError message={error}><Link className="btn secondary" href={`/notatki${userQ}`}>← Notatki</Link></LoadError>;
  if (!note) return <div className="stack"><div className="skeleton" style={{ height: 34, width: "40%" }} /><div className="skeleton" style={{ height: 420 }} /></div>;

  const back = note.kind === "scratch" ? `/notatki/brudnopisy${userQ}` : `/notatki${userQ}`;
  const src = refHref(note.ref);
  const star = async () => {
    const on = !note.starred;
    setNote({ ...note, starred: on });
    await api(`/api/notatki/${note.id}`, { method: "PATCH", body: JSON.stringify({ starred: on }) }).catch((e) => { setNote({ ...note }); setActionError(e.message); });
  };
  const remove = async () => {
    if (!confirm(note.kind === "scratch" ? "Usunąć ten brudnopis?" : "Usunąć tę notatkę?")) return;
    await api(`/api/notatki/${note.id}`, { method: "DELETE" }).then(() => router.push(back)).catch((e) => setActionError(e.message));
  };

  return (
    <div className="stack note-page">
      <PreviewBanner />
      <div className="row note-page-head">
        <Link href={back} className="muted">← {note.kind === "scratch" ? "Brudnopisy" : "Notatki"}</Link>
        <span className="spacer" />
        <StarButton on={note.starred} onToggle={star} label="do ulubionych" disabled={!!preview} />
        {!preview && <button className="btn small danger" onClick={remove} data-testid="note-delete">Usuń</button>}
      </div>
      {actionError && <p className="error" role="alert" style={{ margin: 0 }}>{actionError}</p>}
      {(note.context || src) && (
        <p className="note-src">
          {note.context}{src && <> · <Link href={src.href}>{src.label} →</Link></>}
        </p>
      )}
      <NoteEditor note={note} kind={note.kind} refKey={note.ref} readOnly={!!preview} onSaved={(n) => setNote((o) => (o ? { ...o, updated_at: n.updated_at } : o))} />
      <p className="muted small">Utworzono {fmtDate(note.created_at)} · zmieniono {fmtDate(note.updated_at)}</p>
    </div>
  );
}
