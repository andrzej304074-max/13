"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PreviewBanner } from "@/app/components/preview-banner";
import { PageSkeleton } from "@/app/pojecia/table";
import { useData } from "@/lib/data-client";
import { api, fmtPct, viewedUser, withUser } from "@/lib/client";
import type { Mastery } from "@/lib/mastery-core";
import { LEVELS, level, type Level } from "@/lib/owe-stats";

export interface Card { id: string; t: string; d: string; w: string | null; kind: string; topic: string; n: number }
type Topic = { id: string; title: string; emoji: string };
type Kind = { id: string; title: string };
type Mode = "feed" | "classic";
type Order = "lessons" | "random" | "weak";

const KIND_ONE: Record<string, string> = { pojecie: "pojęcie", wzor: "wzór", osoba: "osoba", instytucja: "instytucja", data: "data", przepis: "przepis" };
const LV_RANK: Record<Level, number> = { weak: 0, mid: 1, none: 2, good: 3 };
const BATCH = 30;

/** Deterministyczne tasowanie (ziarno) – kolejność „losowo” nie zmienia się przy każdym renderze. */
function shuffle<T>(a: T[], seed: number): T[] {
  const r = [...a];
  let s = seed;
  for (let i = r.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function lvOf(m: Mastery | undefined): Level {
  return m ? level(m.c, m.t) : "none";
}

function LevelNote({ m }: { m: Mastery | undefined }) {
  const lv = lvOf(m);
  return <span className={`lv ${lv}`}>{m && m.t ? `${fmtPct(Math.round((m.c / m.t) * 1000) / 10)} z ${m.t} odp.` : "jeszcze nie sprawdzone"}</span>;
}

export function FlashcardsView({ cards, topics, kinds }: { cards: Card[]; topics: Topic[]; kinds: Kind[] }) {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("feed");
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState("");
  const [lv, setLv] = useState<Level | "">("");
  const [oweOnly, setOweOnly] = useState(false);
  const [order, setOrder] = useState<Order>("lessons");
  const [seed, setSeed] = useState(1);
  const [mastery, setMastery] = useState<Record<string, Mastery>>({});
  const [error, setError] = useState<string | null>(null);
  const preview = typeof window !== "undefined" && !!viewedUser();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setMode(p.get("tryb") === "klasyczne" ? "classic" : "feed");
    setTopic(p.get("dzial") ?? "");
    setKind(p.get("rodzaj") ?? "");
    const k = p.get("kolor");
    setLv(k === "good" || k === "mid" || k === "weak" || k === "none" ? k : "");
    setOweOnly(p.get("owe") === "1");
    const o = p.get("kolejnosc");
    setOrder(o === "random" || o === "weak" ? o : "lessons");
    setSeed(Math.floor(Math.random() * 1e9) + 1);
    api<Record<string, Mastery>>(withUser("/api/fiszki/opanowanie")).then(setMastery).catch((e) => setError(e.message)).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    const u = viewedUser();
    if (u) p.set("user", u);
    if (mode === "classic") p.set("tryb", "klasyczne");
    if (topic) p.set("dzial", topic);
    if (kind) p.set("rodzaj", kind);
    if (lv) p.set("kolor", lv);
    if (oweOnly) p.set("owe", "1");
    if (order !== "lessons") p.set("kolejnosc", order);
    window.history.replaceState(null, "", `/fiszki${p.size ? `?${p}` : ""}`);
  }, [ready, mode, topic, kind, lv, oweOnly, order]);

  // kolejność i filtr koloru liczone z opanowania z chwili wejścia/zmiany filtrów – ocena karty nie przestawia listy
  const snapshot = useRef(mastery);
  const [snapKey, setSnapKey] = useState(0);
  useEffect(() => { snapshot.current = mastery; setSnapKey((k) => k + 1); }, [topic, kind, lv, oweOnly, order, seed, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => {
    const m = snapshot.current;
    let r = cards.filter((c) => (!topic || c.topic === topic) && (!kind || c.kind === kind) && (!oweOnly || c.n > 0) && (!lv || lvOf(m[c.id]) === lv));
    if (order === "random") r = shuffle(r, seed);
    if (order === "weak") r = [...r].sort((a, b) => LV_RANK[lvOf(m[a.id])] - LV_RANK[lvOf(m[b.id])] || (m[a.id] ? m[a.id].c / m[a.id].t : 1) - (m[b.id] ? m[b.id].c / m[b.id].t : 1));
    return r;
  }, [cards, topic, kind, lv, oweOnly, order, seed, snapKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c: Record<Level, number> = { good: 0, mid: 0, weak: 0, none: 0 };
    for (const x of cards) if ((!topic || x.topic === topic) && (!kind || x.kind === kind) && (!oweOnly || x.n > 0)) c[lvOf(mastery[x.id])]++;
    return c;
  }, [cards, topic, kind, oweOnly, mastery]);

  const rate = useCallback(async (id: string, known: boolean) => {
    if (preview) return;
    setMastery((m) => ({ ...m, [id]: { c: (m[id]?.c ?? 0) + (known ? 1 : 0), t: (m[id]?.t ?? 0) + 1, last: Date.now() } }));
    await api("/api/fiszki/ocena", { method: "POST", body: JSON.stringify({ item: id, known }) }).catch((e) => setError(e.message));
  }, [preview]);

  const topicName = useMemo(() => Object.fromEntries(topics.map((t) => [t.id, `${t.emoji} ${t.title.replace(/^Temat przewodni: /, "")}`])), [topics]);
  if (!ready) return <p className="muted">Ładowanie…</p>;

  return (
    <div className="stack">
      <PreviewBanner />
      <h1>Fiszki</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Obwódka pokazuje, jak dobrze znasz hasło – według testów (OWE i słownik), ćwiczeń w Nauce i ocen fiszek:
        {" "}<span className="lv good">dobrze ≥ 80%</span> <span className="lv mid">średnio 50–79%</span> <span className="lv weak">słabo &lt; 50%</span> <span className="lv">nie sprawdzone</span>
      </p>
      {error && <p className="error">{error}</p>}
      <div className="seg" role="group" aria-label="Tryb fiszek">
        <button className={mode === "feed" ? "active" : ""} aria-pressed={mode === "feed"} onClick={() => setMode("feed")}>📱 Przewijanie</button>
        <button className={mode === "classic" ? "active" : ""} aria-pressed={mode === "classic"} onClick={() => setMode("classic")}>🃏 Klasyczne</button>
      </div>
      <details className="card filters-card" open={false}>
        <summary>Filtry · {list.length} z {cards.length} fiszek</summary>
        <div className="stack" style={{ marginTop: 12 }}>
          <div className="filter-grid">
            <label className="filters">Dział
              <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">wszystkie</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{topicName[t.id]}</option>)}
              </select>
            </label>
            <label className="filters">Rodzaj
              <select className="select" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="">wszystkie</option>
                {kinds.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
              </select>
            </label>
            <label className="filters">Kolejność
              <select className="select" value={order} onChange={(e) => setOrder(e.target.value as Order)}>
                <option value="lessons">jak w lekcjach</option>
                <option value="random">losowo</option>
                <option value="weak">najsłabsze najpierw</option>
              </select>
            </label>
          </div>
          <div>
            <div className="filter-label">Jak dobrze znam</div>
            <div className="chips">
              <button className={`chip ${!lv ? "selected" : ""}`} onClick={() => setLv("")}>Wszystkie</button>
              {LEVELS.map((l) => (
                <button key={l.id} className={`chip ${lv === l.id ? "selected" : ""}`} onClick={() => setLv(l.id)} data-testid={`lv-${l.id}`}>
                  <span className={`lv ${l.id}`}>{l.label} · {counts[l.id]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="row">
            <label className="check"><input type="checkbox" checked={oweOnly} onChange={(e) => setOweOnly(e.target.checked)} /> tylko hasła, o które pytano na OWE</label>
            <span className="spacer" />
            {order === "random" && <button className="btn small secondary" onClick={() => setSeed(seed + 1)}>🔀 Przetasuj</button>}
          </div>
        </div>
      </details>

      {list.length === 0 ? <p className="muted">Brak fiszek dla wybranych filtrów.</p>
        : mode === "feed" ? <Feed list={list} mastery={mastery} rate={rate} preview={preview} topicName={topicName} />
          : <Classic list={list} mastery={mastery} rate={rate} preview={preview} topicName={topicName} />}
    </div>
  );
}

type Props = { list: Card[]; mastery: Record<string, Mastery>; rate: (id: string, known: boolean) => void; preview: boolean; topicName: Record<string, string> };

function Face({ c, back, topicName, m }: { c: Card; back: boolean; topicName: Record<string, string>; m: Mastery | undefined }) {
  return back ? (
    <div className="fc-face">
      <div className="fc-title small">{c.t}</div>
      <p className="fc-def">{c.d}</p>
      {c.w && <pre className="formula">{c.w}</pre>}
      <LevelNote m={m} />
    </div>
  ) : (
    <div className="fc-face">
      <div className="concept-tags"><span className="tag">{KIND_ONE[c.kind] ?? c.kind}</span><span className="tag">{topicName[c.topic]}</span>{c.n > 0 && <span className="tag owe">OWE: {c.n}×</span>}</div>
      <div className="fc-title">{c.t}</div>
      <div className="muted fc-hint">Dotknij, aby zobaczyć definicję</div>
    </div>
  );
}

/** Pionowy feed jak w aplikacjach z krótkimi filmami: jedna karta na ekran, przewijanie z przyciąganiem. */
function Feed({ list, mastery, rate, preview, topicName }: Props) {
  const [shown, setShown] = useState(BATCH);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [rated, setRated] = useState<Record<string, boolean>>({});
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { setShown(BATCH); box.current?.scrollTo({ top: 0 }); }, [list]);
  useEffect(() => {
    const el = end.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setShown((n) => Math.min(list.length, n + BATCH)); }, { root: box.current, rootMargin: "200%" });
    io.observe(el);
    return () => io.disconnect();
  }, [list.length, shown]);
  return (
    <div className="feed" ref={box} data-testid="feed">
      {list.slice(0, shown).map((c, i) => {
        const m = mastery[c.id];
        return (
          <section className="reel" key={c.id} data-testid="reel">
            <button className={`fc fc-${lvOf(m)} ${flipped[c.id] ? "back" : ""}`} onClick={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))} aria-label={`Fiszka: ${c.t}`}>
              <Face c={c} back={!!flipped[c.id]} topicName={topicName} m={m} />
            </button>
            <div className="reel-bar">
              <span className="muted">{i + 1} / {list.length}</span>
              {!preview && (rated[c.id] ? <span className="muted">Zapisano ✓</span> : <>
                <button className="btn small secondary" onClick={() => { rate(c.id, false); setRated((r) => ({ ...r, [c.id]: true })); }}>✗ Nie znam</button>
                <button className="btn small" onClick={() => { rate(c.id, true); setRated((r) => ({ ...r, [c.id]: true })); }}>✓ Znam</button>
              </>)}
            </div>
          </section>
        );
      })}
      {shown < list.length && <div ref={end} className="reel-more muted">Ładowanie kolejnych…</div>}
      {shown >= list.length && <div className="reel-more muted">To już wszystkie fiszki ({list.length}).</div>}
    </div>
  );
}

/** Klasyczne fiszki: jedna karta, odwracanie, ocena „znam / nie znam” i przejście dalej. */
function Classic({ list, mastery, rate, preview, topicName }: Props) {
  const [i, setI] = useState(0);
  const [back, setBack] = useState(false);
  const [done, setDone] = useState({ known: 0, unknown: 0 });
  useEffect(() => { setI(0); setBack(false); }, [list]);
  const c = list[Math.min(i, list.length - 1)];
  const go = useCallback((d: number) => { setI((x) => Math.max(0, Math.min(list.length - 1, x + d))); setBack(false); }, [list.length]);
  const answer = useCallback((known: boolean) => {
    rate(c.id, known);
    setDone((s) => (known ? { ...s, known: s.known + 1 } : { ...s, unknown: s.unknown + 1 }));
    go(1);
  }, [c, rate, go]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,select,textarea")) return;
      if (e.key === " ") { e.preventDefault(); setBack((b) => !b); }
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [go]);
  const m = mastery[c.id];
  return (
    <div className="stack classic" data-testid="classic">
      <div className="row"><span className="muted" data-testid="classic-pos">{i + 1} / {list.length}</span><span className="spacer" />
        {!preview && <span className="muted">w tej sesji: ✓ {done.known} · ✗ {done.unknown}</span>}</div>
      <button className={`fc fc-big fc-${lvOf(m)} ${back ? "back" : ""}`} onClick={() => setBack(!back)} aria-label={`Fiszka: ${c.t}`} data-testid="classic-card">
        <Face c={c} back={back} topicName={topicName} m={m} />
      </button>
      <div className="classic-actions">
        <button className="btn secondary" onClick={() => go(-1)} disabled={i === 0} aria-label="Poprzednia">←</button>
        {preview ? <button className="btn" onClick={() => go(1)}>Dalej →</button> : <>
          <button className="btn secondary" onClick={() => answer(false)} data-testid="btn-unknown">✗ Nie znam</button>
          <button className="btn" onClick={() => answer(true)} data-testid="btn-known">✓ Znam</button>
        </>}
        <button className="btn secondary" onClick={() => go(1)} disabled={i >= list.length - 1} aria-label="Następna">→</button>
      </div>
      <p className="muted" style={{ fontSize: ".85rem", textAlign: "center" }}>Spacja – odwróć · strzałki – poprzednia/następna</p>
    </div>
  );
}

export function FlashcardsLoader() {
  const { data, error } = useData<{ rows: Card[]; topics: Topic[]; kinds: Kind[] }>("/api/dane/hasla");
  if (error) return <p className="error">{error}</p>;
  return data ? <FlashcardsView cards={data.rows} topics={data.topics} kinds={data.kinds} /> : <PageSkeleton title="Fiszki" />;
}
