"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PreviewBanner } from "@/app/components/preview-banner";
import { StarButton, StarFilterSeg, type StarFilter } from "@/app/components/star";
import { api, withUser, useViewedUser } from "@/lib/client";
import { displayTitle, refHref, type NoteKind } from "@/lib/notes-core";
import type { NoteRow, NoteSummary } from "@/lib/notes";

const TEXT: Record<NoteKind, { title: string; lead: string; add: string; empty: string; emoji: string }> = {
  note: {
    title: "Notatki", emoji: "🗒️", add: "+ Nowa notatka",
    lead: "Twoje notatki – tekst z klawiatury i pismo odręczne (rysik, palec, mysz). Zapisują się same. Szybki dostęp z każdej strony: przycisk 🗒️ w nagłówku.",
    empty: "Nie masz jeszcze notatek. Zacznij od „Nowa notatka” albo przycisku 🗒️ w nagłówku – działa na każdej stronie.",
  },
  scratch: {
    title: "Brudnopisy", emoji: "✏️", add: "+ Nowy brudnopis",
    lead: "Brudnopisy z pytań testów i lekcji (przycisk „✏️ Brudnopis” pod „Sprawdź”) – zapisują się same, jeden na pytanie lub pod-lekcję.",
    empty: "Brak brudnopisów. Otwórz „✏️ Brudnopis” pod dowolnym pytaniem w teście albo w lekcji – obliczenia zapiszą się tutaj.",
  },
};

export const fmtDate = (s: string) => new Date(s).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Lista notatek albo brudnopisów: wyszukiwanie, filtr gwiazdek, gwiazdka na karcie. */
export function NotesList({ kind }: { kind: NoteKind }) {
  const t = TEXT[kind];
  const router = useRouter();
  const [q, setQ] = useState("");
  const [gw, setGw] = useState<StarFilter>("");
  const [rows, setRows] = useState<NoteSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = useViewedUser();
  const userQ = preview ? `?user=${preview}` : "";

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const g = p.get("gw");
    if (g === "1" || g === "0") setGw(g);
    setQ(p.get("q") ?? "");
  }, []);

  useEffect(() => {
    let alive = true;
    const h = setTimeout(() => {
      const p = new URLSearchParams({ rodzaj: kind });
      if (gw) p.set("gw", gw);
      if (q.trim()) p.set("q", q.trim());
      api<NoteSummary[]>(withUser(`/api/notatki?${p}`)).then((r) => alive && setRows(r)).catch((e) => alive && setError(e.message));
    }, q ? 250 : 0);
    return () => { alive = false; clearTimeout(h); };
  }, [kind, gw, q]);

  const create = async () => {
    setBusy(true);
    try {
      const n = await api<NoteRow>("/api/notatki", { method: "POST", body: JSON.stringify({ kind }) });
      router.push(`/notatki/${n.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const star = async (n: NoteSummary) => {
    setRows((r) => r && r.map((x) => (x.id === n.id ? { ...x, starred: !x.starred } : x)));
    try {
      await api(`/api/notatki/${n.id}`, { method: "PATCH", body: JSON.stringify({ starred: !n.starred }) });
    } catch (e) {
      setRows((r) => r && r.map((x) => (x.id === n.id ? { ...x, starred: n.starred } : x)));
      setError((e as Error).message);
    }
  };

  return (
    <div className="stack wide">
      <PreviewBanner />
      <div className="page-head row">
        <div style={{ flex: "1 1 320px" }}>
          <h1>{t.emoji} {t.title}</h1>
          <p className="muted">{t.lead}</p>
        </div>
        {!preview && <button className="btn" onClick={create} disabled={busy} data-testid="note-new">{t.add}</button>}
      </div>
      <div className="notes-toolbar">
        <input className="select" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj w tytule i treści…" aria-label="Szukaj" />
        <StarFilterSeg value={gw} onChange={setGw} />
      </div>
      {error && <p className="error">{error}</p>}
      {!rows ? (
        <div className="notes-grid">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}</div>
      ) : rows.length === 0 ? (
        <div className="empty-state"><span aria-hidden>{q || gw ? "🔍" : t.emoji}</span><p>{q || gw ? "Nic nie pasuje do filtrów." : t.empty}</p></div>
      ) : (
        <div className="notes-grid" data-testid="notes-grid">
          {rows.map((n) => {
            const src = refHref(n.ref);
            return (
              <article key={n.id} className="note-card" data-testid="note-card">
                <Link href={`/notatki/${n.id}${userQ}`} className="note-card-link">
                  <h2 className="note-card-title">{displayTitle({ title: n.title, body: n.excerpt }, kind === "scratch" ? "Brudnopis" : "Bez tytułu")}</h2>
                  {n.context && <p className="note-card-ctx">{n.context}</p>}
                  {n.excerpt && n.title.trim() && <p className="note-card-excerpt">{n.excerpt}</p>}
                  <p className="note-card-meta">
                    {fmtDate(n.updated_at)}{n.strokes > 0 && <> · ✍️ rysunek</>}
                  </p>
                </Link>
                <div className="note-card-side">
                  <StarButton on={n.starred} onToggle={() => star(n)} label="notatkę do ulubionych" disabled={!!preview} />
                  {src && <Link className="small" href={src.href} title="Przejdź do miejsca, z którego pochodzi">{src.label} →</Link>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
