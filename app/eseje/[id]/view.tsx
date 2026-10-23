"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingPage } from "@/app/components/loading-page";
import { LoadError } from "@/app/components/load-error";
import { QuestionScratch } from "@/app/components/notes/question-scratch";
import { api, fmtPoints, withUser } from "@/lib/client";
import type { OpenMeta } from "@/lib/otwarte";
import { PROGNOZA_LABEL, type EssayHints, type PublicEssay, type SchemaSection } from "@/lib/otwarte-core";

type Checked = { score: number; max: number; topic: string; schema: SchemaSection[]; hints?: EssayHints | null };
const HINTS: [keyof EssayHints, string][] = [["s", "Plan tego eseju"], ["d", "Dane, które warto przywołać (ze źródłami)"], ["b", "Typowe błędy"]];
const TIMES = [0, 30, 45, 60];

/** Ogólna struktura eseju olimpijskiego – rama, w którą wstawia się punkty ze schematu odpowiedzi z klucza. */
const STRUCTURE: { title: string; text: string }[] = [
  { title: "1. Wstęp (ok. 1/10 tekstu)", text: "Osadź temat w kontekście (dlaczego ważny teraz, w Polsce i na świecie), zdefiniuj kluczowe pojęcia z tematu i zapowiedz tezę oraz plan pracy." },
  { title: "2. Część teoretyczna", text: "Przejdź po punktach z klucza (lista poniżej). Każdy punkt: definicja → mechanizm (przyczyna → skutek) → teoria lub szkoła ekonomii, która go opisuje (z nazwiskiem) → krótki przykład. Pokaż spory w teorii, a nie tylko jedno stanowisko." },
  { title: "3. Część praktyczna", text: "Odnieś teorię do praktyki: dane i fakty (Polska, UE, świat – z przybliżonymi wielkościami i latami), działania państwa i instytucji, ocena ich skuteczności, przykłady krajów." },
  { title: "4. Zakończenie", text: "Odpowiedz wprost na pytanie z tematu, zbierz wnioski i dodaj własną, uargumentowaną ocenę (co działa, czego unikać, co dalej)." },
];
const TIPS = [
  "Jury punktuje treść według schematu z klucza – brak punktu ze schematu kosztuje więcej niż słabszy styl.",
  "Pisz akapitami z nagłówkami części (teoretyczna / praktyczna) – łatwiej sprawdzić kompletność.",
  "Używaj pojęć ekonomicznych precyzyjnie i podawaj nazwiska (np. Ricardo, List, Keynes, Friedman).",
  "Unikaj ogólników bez danych i opinii bez argumentu; każdą ocenę uzasadnij mechanizmem albo faktem.",
  "Plan czasu: ok. 5 min na plan w brudnopisie, większość na rozwinięcie, 3–5 min na sprawdzenie, czy każdy punkt planu jest w tekście.",
];

/** Esej: temat (do wyboru) → licznik czasu (opcjonalnie) → brudnopis → wzorcowa struktura i schemat z klucza → samoocena. */
export function EssayView({ id }: { id: string }) {
  const [data, setData] = useState<{ meta: OpenMeta; essay: PublicEssay } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<number | null>(null);
  const [minutes, setMinutes] = useState(0);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [res, setRes] = useState<Checked | null>(null);
  const [checks, setChecks] = useState<boolean[][]>([]);
  const [saved, setSaved] = useState<{ score: number; max: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    api<{ meta: OpenMeta; essay: PublicEssay }>(`/api/otwarte/${id}`).then((d) => { setData(d); if (d.essay.topics.length === 1) setTopic(0); }).catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    if (!endAt || res) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endAt, res]);
  if (error) return <LoadError message={error}><Link className="btn secondary" href="/eseje">← Eseje</Link></LoadError>;
  if (!data) return <LoadingPage />;
  const { meta, essay } = data;
  const left = endAt ? Math.max(0, endAt - now) : null;

  async function finish() {
    if (topic === null) return;
    setMsg(null);
    try {
      const r = await api<Checked>(`/api/otwarte/${id}/sprawdz`, { method: "POST", body: JSON.stringify({ topic }) });
      setRes(r);
      setChecks(r.schema.map((s) => s.points.map(() => false)));
      setTimeout(() => document.querySelector(".essay-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) { setMsg((e as Error).message); }
  }
  async function save() {
    try {
      const r = await api<Checked>(`/api/otwarte/${id}/sprawdz`, { method: "POST", body: JSON.stringify({ topic, checks, zapisz: true }) });
      setSaved({ score: r.score, max: r.max });
    } catch (e) { setMsg((e as Error).message); }
  }
  const toggle = (i: number, k: number) => setChecks((c) => c.map((row, a) => (a === i ? row.map((v, b) => (b === k ? !v : v)) : row)));

  return (
    <div className="stack essay">
      <nav className="muted small"><Link href="/eseje">← Eseje</Link></nav>
      <h1>{essay.kind === "sponsor" ? "Pytanie do wyboru (sponsor)" : "Pytanie opisowe o charakterze ogólnym"}</h1>
      <p className="muted" style={{ marginTop: -8 }}>{meta.src === "prognoza" ? <span className="open-src" data-testid="src-label">{PROGNOZA_LABEL}</span> : <>OWE {meta.edRoman}</>} ({meta.year}) · etap {meta.stageName} · {essay.pts} pkt · hasło edycji: „{meta.theme}”</p>

      {essay.own && meta.src === "prognoza" && <p className="card open-own" role="note" data-testid="own-note">Temat przygotowany w aplikacji jako prognoza na XL edycję OWE (2026/2027) – nie pochodzi z arkusza olimpiady. Schemat odpowiedzi, plan i dane opracowano w aplikacji jako materiał do ćwiczeń.</p>}
      {essay.own && meta.src !== "prognoza" && <p className="card open-own" role="note" data-testid="own-note">Oficjalny klucz zawiera tylko treść tego zestawu – schemat odpowiedzi opracowano w aplikacji. Traktuj je jako przykładowe, nie jako wzorzec jury.</p>}
      {essay.topics.length > 1 && <p style={{ margin: 0 }}><strong>Wybierz jeden temat:</strong></p>}
      <div className="essay-topics" role={essay.topics.length > 1 ? "radiogroup" : undefined}>
        {essay.topics.map((t, i) => (
          <button key={i} type="button" className={`card essay-topic${topic === i ? " on" : ""}`} disabled={!!res || essay.topics.length === 1}
            aria-pressed={topic === i} onClick={() => setTopic(i)} data-testid="essay-topic">
            {essay.topics.length > 1 && <span className="essay-topic-n">{i + 1}.</span>}<span>{t.title}</span>
          </button>
        ))}
      </div>

      {topic !== null && !res && (
        <div className="card row essay-timer" style={{ flexWrap: "wrap", gap: 8 }}>
          {left === null ? <>
            <span className="muted small">Licznik czasu (opcjonalnie):</span>
            {TIMES.slice(1).map((m) => <button key={m} type="button" className={`btn small${minutes === m ? "" : " secondary"}`} onClick={() => setMinutes(m)}>{m} min</button>)}
            <button type="button" className="btn small" disabled={!minutes} onClick={() => { setEndAt(Date.now() + minutes * 60000); setNow(Date.now()); }}>▶ Start</button>
          </> : (
            <span className={`timer${left < 300000 ? " low" : ""}`} data-testid="essay-time">⏱ {Math.floor(left / 60000)}:{String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}{left === 0 ? " – czas minął" : ""}</span>
          )}
        </div>
      )}

      {topic !== null && <QuestionScratch refKey={`esej:${id}:${topic}`} />}

      {msg && <p className="error" role="alert">{msg}</p>}
      {topic !== null && !res && (
        <div className="row"><button className="btn" onClick={finish} data-testid="essay-finish">Zakończ i pokaż wzorzec</button></div>
      )}

      {res && (
        <div className="stack essay-result" data-testid="essay-result">
          <h2>Jak powinna wyglądać struktura eseju</h2>
          <ol className="card essay-structure">
            {STRUCTURE.map((s) => <li key={s.title}><strong>{s.title}</strong><span>{s.text}</span></li>)}
          </ol>
          {res.schema.length ? <>
            <h2>{meta.src === "prognoza" ? "Schemat odpowiedzi – samoocena" : "Schemat odpowiedzi z klucza – samoocena"}</h2>
            <p className="muted" style={{ margin: 0 }}>Odhacz punkty, które są w Twoim eseju (omówione, nie tylko wspomniane). Punkty części liczymy proporcjonalnie do odhaczonych.</p>
            {res.schema.map((sec, i) => (
              <fieldset key={i} className="card essay-section" data-testid="essay-section">
                <legend><strong>{sec.title}</strong>{sec.pts !== null && <span className="muted"> ({sec.pts} pkt)</span>}</legend>
                {sec.points.map((pt, k) => (
                  <label key={k} className={`check essay-point${pt.startsWith("  ") ? " sub" : ""}`}>
                    <input type="checkbox" checked={!!checks[i]?.[k]} disabled={!!saved} onChange={() => toggle(i, k)} data-testid="essay-check" />
                    <span>{pt.trim()}</span>
                  </label>
                ))}
              </fieldset>
            ))}
            {!saved ? <div className="row"><button className="btn" onClick={save} data-testid="essay-save">Zapisz samoocenę</button></div> : (
              <div className="card"><div className="big" data-testid="essay-score">{fmtPoints(saved.score)} / {saved.max} pkt</div>
                <p className="muted" style={{ margin: 0 }}>Wynik szacunkowy według samooceny – zapisany w statystykach.</p></div>
            )}
          </> : <p className="muted card" style={{ margin: 0 }}>Klucz nie zawiera schematu odpowiedzi do tego tematu – porównaj esej z ogólną strukturą powyżej.</p>}
          {res.hints && HINTS.filter(([k]) => res.hints![k]?.length).map(([k, title]) => (
            <section key={k} className="stack" data-testid={`essay-hints-${k}`}>
              <h2>{title}</h2>
              <ul className="card olymp-list">{res.hints![k]!.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
          ))}
          <h2>Wskazówki</h2>
          <ul className="card olymp-list">{TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
          <div className="row"><Link className="btn secondary" href={withUser("/eseje")}>Inne eseje</Link></div>
        </div>
      )}
    </div>
  );
}
