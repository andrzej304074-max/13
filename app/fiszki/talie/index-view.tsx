"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SkeletonRows } from "@/app/components/loading-page";
import { PreviewBanner } from "@/app/components/preview-banner";
import { api, viewedUser, withUser } from "@/lib/client";
import type { Deck, DeckSummary } from "@/lib/decks";
import { cardsLabel } from "@/lib/decks-core";
import { OwnCards } from "./own-cards";

/** Lista własnych talii fiszek: nowa talia, karta talii z podglądem haseł, „Ucz się”. */
export function DecksIndex() {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    setPreview(!!viewedUser());
    api<DeckSummary[]>(withUser("/api/talie")).then(setDecks).catch((e) => setError(e.message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const d = await api<Deck>("/api/talie", { method: "POST", body: JSON.stringify({ name: name || "Nowa talia" }) });
      router.push(`/fiszki/talie/${d.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <PreviewBanner />
      <h1>🗂️ Moje talie</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Własne zestawy fiszek: wyszukaj hasła, dodaj je do talii i ułóż karty w dowolnej kolejności (przeciągnij za ⠿). Potem ucz się talii jak zwykłych fiszek.
      </p>
      {!preview && (
        <form className="deck-new" onSubmit={create}>
          <input className="select" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa nowej talii, np. Przed etapem okręgowym" maxLength={60} aria-label="Nazwa nowej talii" data-testid="deck-name-new" />
          <button className="btn" disabled={busy} data-testid="deck-create">＋ Nowa talia</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      {!decks ? <SkeletonRows rows={3} height={96} label="Ładowanie talii" /> : decks.length === 0 ? (
        <div className="empty-state"><span aria-hidden>🗂️</span><p>Nie masz jeszcze talii. Nadaj nazwę i utwórz pierwszą – albo dodawaj hasła przyciskiem „＋ Do talii” na fiszkach.</p></div>
      ) : (
        <div className="deck-grid">
          {decks.map((d) => (
            <div className="card deck-card" key={d.id} data-testid="deck-card">
              <Link href={withUser(`/fiszki/talie/${d.id}`)} className="deck-card-link">
                <strong>{d.name}</strong>
                <span className="muted">{cardsLabel(d.count)}</span>
                {d.preview.length > 0 && <span className="deck-preview">{d.preview.join(" · ")}{d.count > d.preview.length ? " …" : ""}</span>}
              </Link>
              <div className="row">
                <Link className="btn small" href={withUser(`/fiszki?talia=${d.id}`)} aria-disabled={!d.count} tabIndex={d.count ? undefined : -1}
                  style={d.count ? undefined : { pointerEvents: "none", opacity: 0.5 }}>▶ Ucz się</Link>
                <Link className="btn small secondary" href={withUser(`/fiszki/talie/${d.id}`)}>{preview ? "Zobacz" : "Edytuj"}</Link>
              </div>
            </div>
          ))}
        </div>
      )}
      <OwnCards />
    </div>
  );
}
