"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddToDeck } from "@/app/fiszki/add-to-deck";
import { PageSkeleton } from "@/app/pojecia/table";
import { viewedUser } from "@/lib/client";
import { useData } from "@/lib/data-client";
import type { Haslo } from "@/lib/data-server";
import { normalize } from "@/lib/nauka-logic";
import { useStars } from "@/lib/stars-client";
import { MindMap, type MapNode, type MapRing } from "./mind-map";
import { SpeakButton } from "@/app/components/speech/speak";
import { hasloSpeech } from "@/lib/speech-catalog";

type Topic = { id: string; title: string; emoji: string; color: string };
type Kind = { id: string; title: string };
type Edge = [string, number, number, number];
interface MapaData { n: Record<string, Edge[]>; l: Record<string, [string, string]> }
const KIND_ONE: Record<string, string> = { pojecie: "pojęcie", wzor: "wzór", osoba: "osoba", instytucja: "instytucja", data: "data", przepis: "przepis" };
const LIST_STEP = 60;

/** Powody powiązania z maski bitowej (tools/nauka/build_mapa.py). */
export function reasonText(mask: number, owe: number): string {
  const r: string[] = [];
  if (mask & 1) {
    const few = owe % 10 >= 2 && owe % 10 <= 4 && (owe % 100 < 12 || owe % 100 > 14);
    r.push(owe === 1 ? "wspólne pytanie OWE" : `${owe} ${few ? "wspólne pytania" : "wspólnych pytań"} OWE`);
  }
  if (mask & 2) r.push("ten sam akapit Podręcznika");
  if (mask & 4) r.push("wymienione w opisie");
  if (mask & 8) r.push("ta sama lekcja");
  return r.join(" · ");
}

export function MindMapLoader() {
  const hasla = useData<{ rows: Haslo[]; topics: Topic[]; kinds: Kind[] }>("/api/dane/hasla");
  const mapa = useData<MapaData>("/api/dane/mapa");
  const err = hasla.error ?? mapa.error;
  if (err) return <p className="error">{err}</p>;
  if (!hasla.data || !mapa.data) return <PageSkeleton title="Mapa myśli" />;
  return <MindMapPage rows={hasla.data.rows} topics={hasla.data.topics} kinds={hasla.data.kinds} mapa={mapa.data} />;
}

function MindMapPage({ rows, topics, kinds, mapa }: { rows: Haslo[]; topics: Topic[]; kinds: Kind[]; mapa: MapaData }) {
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const colors = useMemo(() => Object.fromEntries(topics.map((t) => [t.id, t.color])), [topics]);
  const topicName = useMemo(() => Object.fromEntries(topics.map((t) => [t.id, `${t.emoji} ${t.title.replace(/^Temat przewodni: /, "")}`])), [topics]);
  const { stars } = useStars("fiszka");
  const [center, setCenter] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [deep, setDeep] = useState(false);
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState("");
  const [owe, setOwe] = useState(false);
  const [starred, setStarred] = useState(false);
  const [q, setQ] = useState("");
  const [sugOpen, setSugOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [limit, setLimit] = useState(LIST_STEP);
  const [preview, setPreview] = useState(false);
  // filtry rozwinięte na komputerze, zwinięte na telefonie (mapa od razu widoczna)
  const [filtersOpen, setFiltersOpen] = useState(true);
  useEffect(() => { if (window.innerWidth < 640) setFiltersOpen(false); }, []);
  const mapTop = useRef<HTMLDivElement>(null);

  // ?q=<id> – udostępnialny adres; domyślnie hasło z największą liczbą pytań OWE
  useEffect(() => {
    setPreview(!!viewedUser());
    const p = new URLSearchParams(window.location.search);
    const id = p.get("q");
    if (id && byId.has(id)) setCenter(id);
    else setCenter([...rows].sort((a, b) => b.n - a.n)[0]?.id ?? null);
    if (p.get("dzial")) setTopic(p.get("dzial")!);
    if (p.get("rodzaj")) setKind(p.get("rodzaj")!);
  }, [byId, rows]);
  useEffect(() => {
    if (!center) return;
    const p = new URLSearchParams(window.location.search);
    p.set("q", center);
    if (topic) p.set("dzial", topic); else p.delete("dzial");
    if (kind) p.set("rodzaj", kind); else p.delete("rodzaj");
    window.history.replaceState(null, "", `/pojecia/mapa?${p}`);
  }, [center, topic, kind]);

  const pass = useCallback((r: Haslo | undefined) => !!r && (!topic || r.topic === topic) && (!kind || r.kind === kind) && (!owe || r.n > 0) && (!starred || stars.has(r.id)),
    [topic, kind, owe, starred, stars]);

  const pick = useCallback((id: string, scroll = false) => {
    setCenter((c) => {
      if (c && c !== id) setHistory((h) => [...h.slice(-30), c]);
      return id;
    });
    setSugOpen(false);
    setQ("");
    if (scroll) mapTop.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, []);
  const back = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setCenter(prev);
  };

  const neighbors = useMemo(() => (center ? (mapa.n[center] ?? []).filter(([id]) => pass(byId.get(id))) : []), [center, mapa, pass, byId]);
  const node = (id: string, w: number, mask: number, o: number): MapNode => {
    const r = byId.get(id)!;
    return { id, t: r.t, topic: r.topic, w, reason: reasonText(mask, o) };
  };
  const ring: MapRing[] = useMemo(() => {
    const top = neighbors.slice(0, count);
    const shown = new Set([center, ...top.map(([id]) => id)]);
    return top.map(([id, w, m, o]) => {
      const children: MapNode[] = [];
      if (deep) {
        for (const [cid, cw, cm, co] of mapa.n[id] ?? []) {
          if (children.length >= (count > 10 ? 2 : 3)) break;
          if (shown.has(cid) || !pass(byId.get(cid))) continue;
          shown.add(cid);
          children.push(node(cid, cw, cm, co));
        }
      }
      return { node: node(id, w, m, o), children };
    });
  }, [neighbors, count, deep, center, mapa, pass, byId]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = useMemo(() => {
    const n = normalize(q);
    if (!n) return [];
    const a: Haslo[] = [], b: Haslo[] = [];
    for (const r of rows) {
      if (!pass(r)) continue;
      const t = normalize(r.t);
      if (t.startsWith(n)) a.push(r); else if (t.includes(n)) b.push(r);
      if (a.length >= 8) break;
    }
    return [...a, ...b].slice(0, 8);
  }, [q, rows, pass]);
  const list = useMemo(() => rows.filter(pass), [rows, pass]);
  useEffect(() => setLimit(LIST_STEP), [topic, kind, owe, starred]);

  if (!center) return <PageSkeleton title="Mapa myśli" />;
  const c = byId.get(center)!;
  const chapter = mapa.l[center];

  return (
    <div className="stack wide mm-page">
      <h1>🧠 Mapa myśli</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Wpisz pojęcie albo wybierz je z listy – wokół pojawią się hasła z nim powiązane: wspólne pytania OWE, ten sam akapit Podręcznika,
        wzmianka w definicji. Grubsza linia – silniejsze powiązanie. Kliknij hasło, żeby przenieść je do środka.
      </p>

      <div className="mm-search">
        <div className="mm-combo">
          <input className="select" type="search" value={q} placeholder="Wpisz pojęcie, np. inflacja, Keynes, popyt…" aria-label="Szukaj pojęcia"
            role="combobox" aria-expanded={sugOpen && suggestions.length > 0} aria-controls="mm-sug" autoComplete="off" data-testid="mm-search"
            onChange={(e) => { setQ(e.target.value); setSugOpen(true); }} onFocus={() => setSugOpen(true)}
            onKeyDown={(e) => { if (e.key === "Enter" && suggestions[0]) { e.preventDefault(); pick(suggestions[0].id); } if (e.key === "Escape") setSugOpen(false); }} />
          {sugOpen && suggestions.length > 0 && (
            <ul className="mm-sug" id="mm-sug" role="listbox">
              {suggestions.map((s) => (
                <li key={s.id} role="option" aria-selected={false}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s.id)}>
                    <strong>{s.t}</strong><span className="muted">{KIND_ONE[s.kind] ?? s.kind} · {topicName[s.topic]}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="btn secondary" onClick={() => setListOpen(!listOpen)} aria-expanded={listOpen} data-testid="mm-list-toggle">📋 {listOpen ? "Ukryj listę" : "Wybierz z listy"}</button>
      </div>

      <details className="card filters-card" open={filtersOpen} onToggle={(e) => setFiltersOpen((e.target as HTMLDetailsElement).open)}>
        <summary>Filtry i układ · {neighbors.length} powiązanych</summary>
        <div className="stack" style={{ marginTop: 12 }}>
          <div className="filter-grid">
            <label className="filters">Temat
              <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)} data-testid="mm-topic">
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
            <label className="filters">Liczba powiązań: {count}
              <input type="range" min={6} max={16} value={count} onChange={(e) => setCount(Number(e.target.value))} aria-label="Liczba powiązanych pojęć" />
            </label>
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: "8px 18px" }}>
            <label className="check"><input type="checkbox" checked={owe} onChange={(e) => setOwe(e.target.checked)} /> tylko hasła z pytań OWE</label>
            {!preview && <label className="check"><input type="checkbox" checked={starred} onChange={(e) => setStarred(e.target.checked)} /> tylko fiszki z gwiazdką</label>}
            <label className="check"><input type="checkbox" checked={deep} onChange={(e) => setDeep(e.target.checked)} data-testid="mm-deep" /> 2 poziomy</label>
          </div>
        </div>
      </details>

      {listOpen && (
        <div className="card mm-list" data-testid="mm-list">
          <p className="muted" style={{ margin: "0 0 8px" }}>{list.length} haseł dla wybranych filtrów</p>
          <ul>
            {list.slice(0, limit).map((r) => (
              <li key={r.id}><button type="button" className={r.id === center ? "on" : ""} onClick={() => { pick(r.id, true); }}>
                <span>{r.t}</span><span className="muted">{KIND_ONE[r.kind] ?? r.kind}{r.n > 0 ? ` · OWE ${r.n}×` : ""}</span></button></li>
            ))}
          </ul>
          {list.length > limit && <button className="btn small secondary" onClick={() => setLimit(limit + LIST_STEP * 2)}>Pokaż więcej ({list.length - limit})</button>}
          {list.length === 0 && <p className="muted">Nic nie pasuje do filtrów.</p>}
        </div>
      )}

      <div ref={mapTop} className="mm-toolbar row">
        <button className="btn small secondary" onClick={back} disabled={!history.length} data-testid="mm-back">← Wstecz</button>
        <span className="muted mm-path">{history.length ? `${byId.get(history[history.length - 1])?.t ?? ""} → ` : ""}<strong>{c.t}</strong></span>
      </div>
      {ring.length === 0 ? (
        <div className="empty-state"><span aria-hidden>🕸️</span><p>Brak powiązanych haseł{topic || kind || owe || starred ? " dla wybranych filtrów – zmień filtry" : ""}.</p></div>
      ) : (
        <MindMap center={{ id: c.id, t: c.t, topic: c.topic, w: 0, reason: "" }} ring={ring} colors={colors} onPick={(id) => pick(id)} prevId={history[history.length - 1]} />
      )}

      <div className="mm-bottom">
        <section className="card mm-card" aria-label="Wybrane pojęcie" data-testid="mm-card">
          <div className="concept-tags"><span className="tag">{KIND_ONE[c.kind] ?? c.kind}</span><span className="tag">{topicName[c.topic]}</span>{c.n > 0 && <span className="tag owe">OWE: {c.n}×</span>}</div>
          <h2>{c.t}</h2>
          <p className="concept-def">{c.d}</p>
          {c.w && <pre className="formula">{c.w}</pre>}
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <Link className="btn small secondary" href={`/pojecia?q=${encodeURIComponent(c.t)}`}>🔎 W tabeli pojęć</Link>
            {chapter && <Link className="btn small secondary" href={`/nauka/podrecznik/${chapter[0]}/${chapter[1]}`}>📖 W Podręczniku</Link>}
            {!preview && <AddToDeck item={c.id} title={c.t} />}
            <SpeakButton group={`mapa:${c.id}`} label="Czytaj" continuous={false} items={() => [hasloSpeech(c)]} />
          </div>
        </section>
        <section className="card mm-links" aria-label="Powiązane pojęcia">
          <div className="row"><h2>Powiązane ({neighbors.length})</h2><span className="spacer" />
            {neighbors.length > 0 && <SpeakButton group={`mapa-lista:${c.id}`} label="Czytaj listę" compact
              items={() => neighbors.map(([id]) => hasloSpeech(byId.get(id)!))} />}
          </div>
          <ol>
            {neighbors.map(([id, w, m, o]) => {
              const r = byId.get(id)!;
              return (
                <li key={id}>
                  <button type="button" onClick={() => pick(id, true)} data-testid="mm-link">
                    <i style={{ background: colors[r.topic] }} aria-hidden />
                    <span className="mm-link-main"><strong>{r.t}</strong><span className="muted">{reasonText(m, o)}</span></span>
                    <span className="mm-w" title="Siła powiązania">{w}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
