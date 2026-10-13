"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoadingPage } from "@/app/components/loading-page";
import { PreviewBanner } from "@/app/components/preview-banner";
import { api, viewedUser, withUser } from "@/lib/client";
import { useStars } from "@/lib/stars-client";
import { StarButton } from "@/app/components/star";
import { CardFilters, NO_FILTER, searchCards, useCardPool, type CardFilter, type PoolCard } from "../../card-pool";
import type { Deck } from "@/lib/decks";
import { cardsLabel } from "@/lib/decks-core";
import { DeckBoard } from "../deck-board";
import { SpeakButton } from "@/app/components/speech/speak";
import { hasloSpeech } from "@/lib/speech-catalog";

const KIND_ONE: Record<string, string> = { pojecie: "pojęcie", wzor: "wzór", osoba: "osoba", instytucja: "instytucja", data: "data", przepis: "przepis" };
const RESULTS = 30;

/** Edytor talii: nazwa, wyszukiwarka haseł z filtrami (dodawanie kart) i karty do przeciągania. */
export function DeckEditor({ id }: { id: string }) {
  const router = useRouter();
  const pool = useCardPool();
  const { stars, toggle: toggleStar } = useStars("fiszka");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<CardFilter>(NO_FILTER);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const fly = useRef<{ id: string; from: DOMRect } | null>(null);

  useEffect(() => {
    setPreview(!!viewedUser());
    api<Deck>(withUser(`/api/talie/${id}`)).then((d) => { setDeck(d); setName(d.name); }).catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const byId = useMemo(() => new Map((pool.rows ?? []).map((r) => [r.id, r])), [pool.rows]);
  const inDeck = useMemo(() => new Set(deck?.items ?? []), [deck]);
  const results = useMemo(() => (pool.rows ? searchCards(pool.rows, q, filter, stars) : []), [pool.rows, q, filter, stars]);

  // zapis kolejności z opóźnieniem (seria przeciągnięć = jedno zapytanie)
  const orderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveOrder = useCallback((items: string[]) => {
    if (orderTimer.current) clearTimeout(orderTimer.current);
    orderTimer.current = setTimeout(() => {
      api<Deck>(`/api/talie/${id}/karty`, { method: "PUT", body: JSON.stringify({ items }) }).catch((e) => setError(e.message));
    }, 500);
  }, [id]);
  useEffect(() => () => { if (orderTimer.current) clearTimeout(orderTimer.current); }, []);

  const add = useCallback(async (item: string, from?: Element | null) => {
    if (!deck || inDeck.has(item) || preview) return;
    if (from) fly.current = { id: item, from: from.getBoundingClientRect() };
    setDeck((d) => d && { ...d, items: [...d.items, item] });
    try {
      const d = await api<Deck>(`/api/talie/${id}/karty`, { method: "POST", body: JSON.stringify({ item }) });
      setDeck((cur) => (cur && cur.items.length === d.items.length ? cur : d));
    } catch (e) {
      setError((e as Error).message);
      setDeck((d) => d && { ...d, items: d.items.filter((x) => x !== item) });
    }
  }, [deck, inDeck, id, preview]);

  const remove = useCallback(async (item: string) => {
    if (!deck) return;
    const before = deck.items;
    setDeck({ ...deck, items: before.filter((x) => x !== item) });
    try {
      await api(`/api/talie/${id}/karty`, { method: "DELETE", body: JSON.stringify({ item }) });
      setToast({
        text: `Usunięto „${byId.get(item)?.t ?? item}”.`,
        undo: async () => {
          setToast(null);
          setDeck((d) => d && { ...d, items: before });
          await api(`/api/talie/${id}/karty`, { method: "POST", body: JSON.stringify({ item }) });
          await api(`/api/talie/${id}/karty`, { method: "PUT", body: JSON.stringify({ items: before }) });
        },
      });
    } catch (e) {
      setError((e as Error).message);
      setDeck((d) => d && { ...d, items: before });
    }
  }, [deck, id, byId]);

  const reorder = useCallback((items: string[]) => {
    setDeck((d) => d && { ...d, items });
    saveOrder(items);
  }, [saveOrder]);

  async function rename() {
    if (!deck || preview || name.trim() === deck.name) return;
    try {
      await api(`/api/talie/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
      setDeck({ ...deck, name: name.trim() });
    } catch (e) {
      setError((e as Error).message);
      setName(deck.name);
    }
  }

  async function removeDeck() {
    if (!deck || !confirm(`Usunąć talię „${deck.name}”? Fiszki zostają w kursie, znika tylko ta talia.`)) return;
    try {
      await api(`/api/talie/${id}`, { method: "DELETE" });
      router.push("/fiszki/talie");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (error && !deck) return <div className="stack"><p className="error">{error}</p><Link href="/fiszki/talie">← Moje talie</Link></div>;
  if (!deck || !pool.rows) return <LoadingPage />;
  const topicName = pool.topicName;

  return (
    <div className="stack deck-editor">
      <PreviewBanner />
      <div className="row">
        <Link href={withUser("/fiszki/talie")}>← Moje talie</Link>
        <span className="spacer" />
        {!preview && <button className="btn small danger" onClick={removeDeck}>Usuń talię</button>}
      </div>
      <h1 className="sr-only">Talia: {name}</h1>
      <input className="deck-title" value={name} readOnly={preview} maxLength={60} aria-label="Nazwa talii" data-testid="deck-title"
        onChange={(e) => setName(e.target.value)} onBlur={rename} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
      <div className="row">
        <span className="muted" data-testid="deck-count">{cardsLabel(deck.items.length)}</span>
        <span className="spacer" />
        {deck.items.length > 0 && <SpeakButton group={`talia:${id}`} label="Czytaj talię" testid="speak-deck"
          items={() => deck.items.map((x) => byId.get(x)).filter((r): r is PoolCard => !!r).map((r) => hasloSpeech(r))} />}
        <Link className="btn" href={withUser(`/fiszki?talia=${id}`)} aria-disabled={!deck.items.length}
          style={deck.items.length ? undefined : { pointerEvents: "none", opacity: 0.5 }} data-testid="deck-learn">▶ Ucz się tej talii</Link>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="deck-layout">
        {!preview && (
          <section className="card deck-search" aria-label="Dodaj fiszki">
            <h2>Dodaj fiszki</h2>
            <input className="select" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off"
              placeholder="Szukaj hasła, np. elastyczność, Keynes, VAT…" aria-label="Szukaj hasła" data-testid="deck-search"
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const first = results.find((r) => !inDeck.has(r.id));
                if (first) add(first.id, document.querySelector(`[data-result="${first.id}"]`));
              }} />
            <CardFilters value={filter} onChange={setFilter} topics={pool.topics} kinds={pool.kinds} topicName={topicName}
              ownCount={pool.rows.filter((r) => r.own).length} />
            <ul className="deck-results" data-testid="deck-results">
              {results.length === 0 && <li className="muted">Nic nie pasuje – zmień frazę albo filtry.</li>}
              {results.map((r) => {
                const has = inDeck.has(r.id);
                return (
                  <li key={r.id} className="deck-result-row">
                    <button type="button" className={`deck-result${has ? " in" : ""}${r.own ? " own" : ""}`} data-result={r.id} disabled={has}
                      onClick={(e) => add(r.id, e.currentTarget)} title={has ? "Już w talii" : "Dodaj do talii"}>
                      <span className="deck-result-main"><strong>{r.own && <span className="own-mark" title="Moja fiszka">✍️ </span>}{r.t}</strong>
                        <span className="muted">{KIND_ONE[r.kind] ?? r.kind} · {topicName[r.topic]}{r.n > 0 ? ` · OWE ${r.n}×` : ""}</span></span>
                      <span className="deck-result-act" aria-hidden>{has ? "✓ w talii" : "＋"}</span>
                    </button>
                    <StarButton on={stars.has(r.id)} onToggle={() => toggleStar(r.id)} label="fiszkę do ulubionych" />
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <section className="deck-cards" aria-label="Karty w talii">
          <h2>Karty w talii</h2>
          {deck.items.length === 0 ? (
            <div className="empty-state"><span aria-hidden>🃏</span><p>{preview ? "Ta talia jest pusta." : "Talia jest pusta – wyszukaj hasło i dotknij ＋, a karta pojawi się tutaj."}</p></div>
          ) : (
            <DeckBoard items={deck.items} byId={byId} topicName={topicName} readOnly={preview} onReorder={reorder} onRemove={remove} fly={fly}
              stars={stars} onStar={toggleStar} />
          )}
        </section>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast.text}{toast.undo && <button className="linkbtn toast-undo" onClick={toast.undo}>Cofnij</button>}
        </div>
      )}
    </div>
  );
}
