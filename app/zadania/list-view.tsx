"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrefSync } from "@/lib/prefs-client";
import { useEffect, useMemo, useState } from "react";
import { SkeletonRows } from "@/app/components/loading-page";
import { LoadError } from "@/app/components/load-error";
import { api, fmtPoints, viewedUser, withUser } from "@/lib/client";
import type { OpenKind, OpenMeta } from "@/lib/otwarte";

type Row = OpenMeta & { best: number | null; attempts: number };
const TOPIC: Record<string, string> = {
  mikro: "Mikroekonomia", makro: "Makroekonomia", polityka: "Polityka gospodarcza", finanse: "Podstawy finansów",
  firma: "Finanse przedsiębiorstw", zarzadzanie: "Zarządzanie", demografia: "Demografia",
};
const STAGES = [["", "wszystkie"], ["s", "szkolny"], ["o", "okręgowy"], ["c", "centralny"]] as const;

/** Lista zadań obliczeniowych albo esejów z poprzednich edycji: filtry edycji, etapu, działu i stanu. */
export function OpenList({ kind }: { kind: OpenKind }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState("");
  const [topic, setTopic] = useState("");
  const [ed, setEd] = useState("");
  const [state, setState] = useState<"" | "todo" | "done">("");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setStage(p.get("etap") ?? ""); setTopic(p.get("dzial") ?? ""); setEd(p.get("edycja") ?? ""); setState((p.get("stan") ?? "") as "" | "todo" | "done");
    api<Row[]>(withUser(`/api/otwarte?rodzaj=${kind}`)).then(setRows).catch((e) => setError(e.message));
  }, [kind]);
  const [explicit] = useState(() => typeof window !== "undefined" && window.location.search.length > 1);
  const qs = new URLSearchParams([...(stage ? [["etap", stage]] : []), ...(topic ? [["dzial", topic]] : []), ...(ed ? [["edycja", ed]] : []), ...(state ? [["stan", state]] : [])]).toString();
  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [qs]);
  // filtry zapamiętane na koncie (osobno zadania i eseje)
  usePrefSync(kind === "esej" ? "eseje" : "zadania", qs, (v) => {
    const p = new URLSearchParams(v);
    setStage(p.get("etap") ?? ""); setTopic(p.get("dzial") ?? ""); setEd(p.get("edycja") ?? ""); setState((p.get("stan") ?? "") as "" | "todo" | "done");
  }, { load: explicit, save: !!viewedUser() });
  const shown = useMemo(() => (rows ?? []).filter((r) => (!stage || r.stage === stage) && (!topic || r.topic === topic) && (!ed || String(r.ed) === ed)
    && (!state || (state === "done") === r.attempts > 0)), [rows, stage, topic, ed, state]);
  if (error) return <LoadError message={error} />;
  const eds = [...new Set((rows ?? []).map((r) => r.ed))].sort((a, b) => b - a);
  const topics = [...new Set((rows ?? []).map((r) => r.topic))];
  const done = (rows ?? []).filter((r) => r.attempts > 0).length;
  const base = kind === "zadanie" ? "/zadania" : "/eseje";
  return (
    <div className="stack">
      <h1>{kind === "zadanie" ? "🧮 Zadania z poprzednich lat" : "✍️ Eseje z poprzednich lat"}</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        {kind === "zadanie"
          ? "Zadania obliczeniowe z kluczy OWE: rozwiązujesz w brudnopisie, wpisujesz same wyniki – sprawdzamy każdy podpunkt i pokazujemy pełny tok obliczeń."
          : "Pytania opisowe (eseje) z kluczy OWE: piszesz w brudnopisie, potem widzisz przykładową strukturę eseju i punkty z klucza do samooceny."}
        {rows && ` Rozwiązane: ${done} z ${rows.length}.`}
      </p>
      <div className="card stack filters-card">
        <div className="seg" role="group" aria-label="Etap" style={{ flexWrap: "wrap" }}>
          {STAGES.map(([v, l]) => <button key={v || "all"} className={stage === v ? "active" : ""} aria-pressed={stage === v} onClick={() => setStage(v)} data-stage={v}>{l}</button>)}
        </div>
        <div className="filter-grid">
          <label className="filters">Edycja
            <select className="select" value={ed} onChange={(e) => setEd(e.target.value)} data-testid="open-ed">
              <option value="">wszystkie</option>
              {eds.map((e) => { const r = rows!.find((x) => x.ed === e)!; return <option key={e} value={e}>{r.edRoman} ({r.year})</option>; })}
            </select>
          </label>
          <label className="filters">Dział
            <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">wszystkie</option>
              {topics.map((t) => <option key={t} value={t}>{TOPIC[t] ?? t}</option>)}
            </select>
          </label>
          <label className="filters">Stan
            <select className="select" value={state} onChange={(e) => setState(e.target.value as "" | "todo" | "done")}>
              <option value="">wszystkie</option>
              <option value="todo">nierozwiązane</option>
              <option value="done">rozwiązane</option>
            </select>
          </label>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <p className="muted small" style={{ margin: 0 }} data-testid="open-count">Pokazano {shown.length} z {rows?.length ?? 0}</p>
          <span className="spacer" />
          <button className="btn secondary" disabled={!shown.length} data-testid="open-random"
            title="Losowo spośród pokazanych – najpierw te, których jeszcze nie rozwiązano"
            onClick={() => router.push(withUser(`${base}/${pickRandom(shown).id}`))}>
            🎲 Losuj {kind === "zadanie" ? "zadanie" : "esej"}
          </button>
        </div>
      </div>
      {!rows ? <SkeletonRows rows={4} height={72} label="Ładowanie" /> : shown.length === 0 ? (
        <div className="empty-state"><span aria-hidden>🔍</span><p>Brak pozycji dla wybranych filtrów.</p></div>
      ) : (
        <ul className="open-list" data-testid="open-list">
          {shown.map((r) => (
            <li key={r.id}>
              <Link href={withUser(`${base}/${r.id}`)} className="card open-item" data-testid="open-item">
                <span className="open-meta">OWE {r.edRoman} · {r.year} · etap {r.stageName} · {TOPIC[r.topic] ?? r.topic} · {r.pts} pkt{r.choose > 1 ? ` · ${r.choose} tematy do wyboru` : ""}</span>
                <strong className="open-title">{r.title}</strong>
                <span className={`open-state${r.attempts ? " done" : ""}`}>
                  {r.attempts ? `✓ najlepiej ${fmtPoints(r.best ?? 0)}/${r.pts} pkt · podejść: ${r.attempts}` : "nierozwiązane"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Losowa pozycja: spośród nierozwiązanych, a gdy wszystkie rozwiązane – spośród wszystkich. */
export function pickRandom<T extends { attempts: number }>(rows: T[]): T {
  const todo = rows.filter((r) => r.attempts === 0);
  const pool = todo.length ? todo : rows;
  return pool[Math.floor(Math.random() * pool.length)];
}
