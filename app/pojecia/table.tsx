"use client";

import Link from "next/link";
import { usePrefSync } from "@/lib/prefs-client";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { StarButton, StarFilterSeg, type StarFilter } from "@/app/components/star";
import { viewedUser } from "@/lib/client";
import { useStars } from "@/lib/stars-client";
import { SpeakButton } from "@/app/components/speech/speak";
import { hasloSpeech } from "@/lib/speech-catalog";
import { useData } from "@/lib/data-client";
import type { Haslo } from "@/lib/data-server";
import { LoadError } from "@/app/components/load-error";

export interface Row {
  id: string;
  t: string;
  d: string;
  w: string | null;
  kind: string;
  topic: string;
  /** Liczba pytań OWE (XXI–XXXIX), w których pytano o hasło. */
  n: number;
}

type Topic = { id: string; title: string; emoji: string };
type Kind = { id: string; title: string };

const KIND_ONE: Record<string, string> = {
  pojecie: "pojęcie", wzor: "wzór", osoba: "osoba", instytucja: "instytucja", data: "data", przepis: "przepis",
};

const STEP = 100;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

export function ConceptTable({ rows, topics, kinds }: { rows: Row[]; topics: Topic[]; kinds: Kind[] }) {
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const [gw, setGw] = useState<StarFilter>("");
  const { stars, toggle } = useStars("fiszka");
  const [preview, setPreview] = useState(false);
  useEffect(() => setPreview(!!viewedUser()), []);
  const topicName = useMemo(() => Object.fromEntries(topics.map((t) => [t.id, `${t.emoji} ${t.title}`])), [topics]);

  // filtry zapamiętane w adresie (?dzial=mikro&rodzaj=osoba&q=elastyczność); dział i rodzaj także na koncie
  const [explicit] = useState(() => typeof window !== "undefined" && window.location.search.length > 1);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setTopic(p.get("dzial") ?? "");
    setKind(p.get("rodzaj") ?? "");
    setQ(p.get("q") ?? "");
    setParsed(true);
  }, []);
  // dopóki adres nie jest wczytany – null: inaczej filtry z linku wyglądałyby jak zmiana użytkownika i nadpisały zapisane
  const [parsed, setParsed] = useState(false);
  const prefQs = new URLSearchParams([...(topic ? [["dzial", topic]] : []), ...(kind ? [["rodzaj", kind]] : [])]).toString();
  usePrefSync("pojecia-tabela", parsed ? prefQs : null, (v) => { const p = new URLSearchParams(v); setTopic(p.get("dzial") ?? ""); setKind(p.get("rodzaj") ?? ""); },
    { load: explicit, save: preview });
  useEffect(() => {
    const p = new URLSearchParams();
    if (topic) p.set("dzial", topic);
    if (kind) p.set("rodzaj", kind);
    if (query.trim()) p.set("q", query.trim());
    window.history.replaceState(null, "", `/pojecia${p.size ? `?${p}` : ""}`);
  }, [topic, kind, query]);

  const index = useMemo(() => rows.map((r) => norm(`${r.t} ${r.d} ${r.w ?? ""}`)), [rows]);
  const shown = useMemo(() => {
    const nq = norm(query.trim());
    return rows.filter((r, i) => (!topic || r.topic === topic) && (!kind || r.kind === kind) && (!nq || index[i].includes(nq))
      && (!gw || stars.has(r.id) === (gw === "1")));
  }, [rows, index, topic, kind, query, gw, stars]);

  // renderowanie porcjami (1,7 tys. wierszy naraz blokuje telefon); kolejne porcje przy przewijaniu
  const [limit, setLimit] = useState(STEP);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => setLimit(STEP), [topic, kind, query, gw]);
  useEffect(() => {
    const el = end.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setLimit((n) => n + STEP); }, { rootMargin: "1200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [limit, shown.length]);

  return (
    <div className="stack wide">
      <h1>Tabela pojęć</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Wszystkie hasła z kursu Nauka w kolejności lekcji. „OWE: N×” – w ilu pytaniach z XXI–XXXIX OWE pytano o dane hasło.
      </p>

      <div className="card stack filters-card">
        <div>
          <div className="filter-label">Dział</div>
          <div className="chips">
            <button className={`chip ${!topic ? "selected" : ""}`} onClick={() => setTopic("")}>Wszystkie</button>
            {topics.map((t) => (
              <button key={t.id} className={`chip ${topic === t.id ? "selected" : ""}`} onClick={() => setTopic(t.id)}>
                {t.emoji} {t.title.replace(/^Temat przewodni: /, "")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="filter-label">Rodzaj</div>
          <div className="chips">
            <button className={`chip ${!kind ? "selected" : ""}`} onClick={() => setKind("")}>Wszystkie</button>
            {kinds.map((k) => (
              <button key={k.id} className={`chip ${kind === k.id ? "selected" : ""}`} onClick={() => setKind(k.id)}>{k.title}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="filter-label">Gwiazdka (wspólna z Fiszkami)</div>
          <StarFilterSeg value={gw} onChange={setGw} />
        </div>
        <label className="field">
          <span>Szukaj w nazwie i definicji</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="np. elastyczność, Keynes, VAT…" />
        </label>
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <p className="muted" style={{ margin: 0 }} data-testid="concept-count">Pokazano {shown.length} z {rows.length}</p>
          <span className="spacer" />
          {shown.length > 0 && <SpeakButton group="tabela" label={`Czytaj wszystkie (${shown.length})`} testid="speak-all" items={() => shown.map(itemOf)} />}
        </div>
      </div>

      <div className="concepts" role="table" aria-label="Tabela pojęć">
        <div className="concept-row head" role="row">
          <div role="columnheader">Pojęcie</div>
          <div role="columnheader">Definicja</div>
        </div>
        {shown.slice(0, limit).map((r) => (
          <div className="concept-row" role="row" key={r.id} id={`h-${r.id}`}>
            <div className="concept-name" role="cell">
              <div className="concept-head">
                <strong>{r.t}</strong>
                <StarButton on={stars.has(r.id)} onToggle={() => toggle(r.id)} label="fiszkę do ulubionych" disabled={preview} />
              </div>
              <div className="concept-tags">
                <span className="tag">{KIND_ONE[r.kind] ?? r.kind}</span>
                {!topic && <span className="tag">{topicName[r.topic]}</span>}
                {r.n > 0 && <span className="tag owe" title="Liczba pytań OWE o to hasło">OWE: {r.n}×</span>}
                <SpeakButton compact group={`haslo:${r.id}`} label={`Czytaj: ${r.t}`} continuous={false} items={() => [itemOf(r)]} />
                {/* mapa odsunięta od reszty, żeby nie trafić w nią przypadkiem */}
                <Link className="tag tag-link concept-map" href={`/pojecia/mapa?q=${r.id}`} title="Pojęcia powiązane – mapa myśli">🧠 mapa</Link>
              </div>
            </div>
            <div className="concept-def" role="cell">
              {r.d}
              {r.w && <pre className="formula" style={{ marginTop: 8 }}>{r.w}</pre>}
            </div>
          </div>
        ))}
        {shown.length === 0 && <div className="empty-state" style={{ margin: 16 }}><span aria-hidden>🔍</span><p>Brak haseł dla wybranych filtrów.</p></div>}
        {shown.length > limit && <div ref={end} className="muted" style={{ padding: 16 }}>Ładowanie kolejnych haseł…</div>}
      </div>
    </div>
  );
}

/** Dane haseł z pamięci podręcznej (/api/dane/hasla) – HTML strony nie zawiera 1,7 tys. definicji. */
export function ConceptTableLoader() {
  const { data, error } = useData<{ rows: Haslo[]; topics: Topic[]; kinds: Kind[] }>("/api/dane/hasla");
  if (error) return <LoadError message={error} />;
  if (!data) return <PageSkeleton title="Tabela pojęć" />;
  return <ConceptTable rows={data.rows} topics={data.topics} kinds={data.kinds} />;
}

export function PageSkeleton({ title, wide = true }: { title: string; wide?: boolean }) {
  return (
    <div className={wide ? "stack wide" : "stack"} aria-busy>
      <h1>{title}</h1>
      <div className="skeleton" style={{ height: 120 }} />
      <div className="skeleton" style={{ height: 320 }} />
    </div>
  );
}

/** Hasło do czytania na głos: nazwa, definicja i wzór. */
const itemOf = (r: Haslo) => hasloSpeech(r);
