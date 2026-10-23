"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError, fmtPct, lastTest, rememberTest } from "@/lib/client";
import { usePrefSync } from "@/lib/prefs-client";
import { RandomOpenButton } from "./zadania/random-open";
import { ROMAN } from "@/lib/owe-stats";
import type { OweStage } from "@/lib/question-meta";
import { SOURCES, type QSource } from "@/lib/question-source";
import type { Stats } from "@/lib/tests";
import type { Origin, QuestionType, TestState } from "@/lib/types";

const TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: "single", label: "Jednokrotny wybór", hint: "1 poprawna odpowiedź · +2 / −1 pkt" },
  { value: "multi", label: "Wielokrotny wybór", hint: "4 trafne pola A–D – 2 pkt · 3 trafne – 1 pkt · mniej – 0" },
];
const SIZES: { value: number | "endless"; label: string; hint: string }[] = [
  { value: 30, label: "30 pytań", hint: "40 minut" },
  { value: 50, label: "50 pytań", hint: "60 minut" },
  { value: "endless", label: "Bez limitu", hint: "bez limitu czasu · bez cofania · liczą się tylko rozwiązane" },
];
const ORIGINS: { value: Origin | null; label: string; hint: string }[] = [
  { value: null, label: "Oba rodzaje", hint: "ręczne i automatyczne" },
  { value: "manual", label: "Ręcznie pisane", hint: "zadania w stylu OWE: obliczenia, skutki, osoby" },
  { value: "auto", label: "Automatyczne", hint: "definicja ↔ pojęcie, wzory, daty" },
];
const STAGES: { id: OweStage; label: string }[] = [
  { id: "s", label: "szkolny" },
  { id: "o", label: "okręgowy" },
  { id: "c", label: "centralny" },
];
const EDS = Array.from({ length: 19 }, (_, i) => 21 + i);

export type StartBank = "owe" | "slownik" | "mix";

/** Ustawienia formularza (zapamiętywane na koncie – osobno dla każdej zakładki). */
export interface StartPrefs {
  type: QuestionType;
  count: number | "endless";
  sources: QSource[];
  edFrom: number;
  edTo: number;
  stages: OweStage[];
  topic: string | null;
  kind: string | null;
  theme: "all" | "yes" | "no";
  origin: Origin | null;
  section: number | null;
}
export const DEFAULT_PREFS: StartPrefs = {
  type: "single", count: 30, sources: ["owe", "ai", "slownik"], edFrom: 21, edTo: 39, stages: ["s", "o", "c"],
  topic: null, kind: null, theme: "all", origin: null, section: null,
};

interface Counts { single: number; multi: number; bySource: Record<QSource, { single: number; multi: number }> | null }

export interface StartOptions {
  topics: { id: string; name: string }[];
  kinds: { id: string; title: string }[];
  /** Tylko Słownik: działy słownika. */
  sections?: { no: number; title: string }[];
}

const TITLE: Record<StartBank, string> = { owe: "Nowy test", slownik: "Test ze słownika pojęć", mix: "Wszystkie pytania" };

export default function HomeClient({ bank = "owe", counts: initial, options }: {
  bank?: StartBank;
  counts: { single: number; multi: number };
  options: StartOptions;
}) {
  const router = useRouter();
  const [p, setP] = useState<StartPrefs>(DEFAULT_PREFS);
  const set = (o: Partial<StartPrefs>) => setP((x) => ({ ...x, ...o }));
  // ustawienia formularza zapamiętane na koncie (osobno dla każdej zakładki)
  usePrefSync(`testy-${bank}`, JSON.stringify(p), (v) => { try { setP({ ...DEFAULT_PREFS, ...JSON.parse(v) }); } catch {} });
  const [counts, setCounts] = useState<Counts>({ ...initial, bySource: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);

  useEffect(() => {
    api<Stats>(`/api/stats?bank=${bank}`).then(setStats).catch(() => {});
    const id = lastTest();
    if (id) {
      api<TestState>(`/api/tests/${id}`)
        .then((t) => (t.finishedAt ? rememberTest(null) : t.bank === bank && setResumeId(t.id)))
        .catch(() => rememberTest(null));
    }
  }, [bank]);

  const oweOn = bank === "owe" || (bank === "mix" && p.sources.includes("owe"));
  const body = () => ({
    bank,
    ...(bank === "mix" ? { sources: p.sources } : {}),
    ...(oweOn ? { edFrom: p.edFrom, edTo: p.edTo, stages: p.stages } : {}),
    topic: p.topic, kind: p.kind, theme: p.theme,
    ...(bank === "slownik" ? { origin: p.origin, section: p.section } : {}),
  });
  const filterKey = JSON.stringify(body());
  // liczby pytań dla bieżących filtrów (z serwera – bez pobierania treści pytań)
  // Odpowiedź dla starszych filtrów (wolniejsza) nie nadpisuje nowszej. Odrzucone filtry (np. zapisany dział, którego już nie ma)
  // wracają do domyślnych – inaczej „Rozpocznij test” byłby aktywny dla nieaktualnych liczb.
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      api<Counts>("/api/tests/pula", { method: "POST", body: filterKey })
        .then((c) => { if (live) setCounts(c); })
        .catch((e) => {
          if (!live || !(e instanceof ApiError) || e.status !== 400) return;
          setCounts({ single: 0, multi: 0, bySource: null });
          setP((x) => (x.topic || x.kind || x.section ? { ...x, topic: null, kind: null, section: null } : x));
        });
    }, 200);
    return () => { live = false; clearTimeout(t); };
  }, [filterKey]);

  const available = counts[p.type];
  async function start() {
    setBusy(true);
    setError(null);
    try {
      const test = await api<TestState>("/api/tests", { method: "POST", body: JSON.stringify({ ...body(), type: p.type, count: p.count }) });
      rememberTest(test.id);
      router.push(`/test/${test.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  const toggle = <T,>(list: T[], v: T, all: T[]) => {
    const n = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    return n.length ? all.filter((x) => n.includes(x)) : list;
  };
  const filtered = p.topic || p.kind || p.theme !== "all" || (oweOn && (p.edFrom > 21 || p.edTo < 39 || p.stages.length < 3));

  return (
    <div className="stack">
      <h1>{TITLE[bank]}</h1>
      {bank === "slownik" && (
        <p className="muted" style={{ marginTop: 0 }}>
          Pytania ułożone na podstawie słownika pojęć OWE (docs/slownik-owe.pdf). Wyniki liczą się do osobnych statystyk.
        </p>
      )}
      {bank === "mix" && (
        <p className="muted" style={{ marginTop: 0 }}>
          Jeden test z wybranych źródeł: prawdziwych pytań olimpijskich, sprawdzonych pytań AI i pytań ze słownika. Przy każdym pytaniu widać jego źródło.
        </p>
      )}
      {resumeId && (
        <div className="card row">
          <span>Masz niedokończony test.</span>
          <span className="spacer" />
          <Link className="btn secondary" href={`/test/${resumeId}`}>Kontynuuj</Link>
        </div>
      )}
      {bank === "owe" && (
        <div className="card row" style={{ flexWrap: "wrap", gap: 8 }} data-testid="random-open">
          <span>Zadania i eseje z kluczy OWE (zakres edycji i etapy z filtrów):</span>
          <span className="spacer" />
          <RandomOpenButton kind="zadanie" edFrom={p.edFrom} edTo={p.edTo} stages={p.stages} />
          <RandomOpenButton kind="esej" edFrom={p.edFrom} edTo={p.edTo} stages={p.stages} />
        </div>
      )}
      {bank === "mix" && <>
        <h2>Źródła pytań</h2>
        <div className="choices three" data-testid="sources">
          {SOURCES.map((s) => {
            const on = p.sources.includes(s.id);
            const n = counts.bySource?.[s.id];
            return (
              <button key={s.id} className={`choice ${on ? "active" : ""}`} aria-pressed={on} data-source={s.id}
                onClick={() => set({ sources: toggle(p.sources, s.id, SOURCES.map((x) => x.id)) })}>
                <strong>{on ? "✓ " : ""}{s.icon} {s.label}</strong>
                <small>{s.hint}</small>
                {n && <small>{n[p.type]} pytań</small>}
              </button>
            );
          })}
        </div>
      </>}
      {bank === "slownik" && options.sections && <>
        <h2>Rodzaj pytań</h2>
        <div className="choices three">
          {ORIGINS.map((o) => (
            <button key={o.label} className={`choice ${p.origin === o.value ? "active" : ""}`} onClick={() => set({ origin: o.value })}>
              <strong>{o.label}</strong>
              <small>{o.hint}</small>
            </button>
          ))}
        </div>
        <h2>Dział słownika</h2>
        <select className="select" aria-label="Dział słownika" value={p.section ?? ""}
          onChange={(e) => set({ section: e.target.value ? Number(e.target.value) : null })}>
          <option value="">Wszystkie działy (losowo z całego słownika)</option>
          {options.sections.map((s) => <option key={s.no} value={s.no}>{s.no}. {s.title}</option>)}
        </select>
      </>}
      <details className="card filters-card" open={!!filtered} data-testid="test-filters">
        <summary><strong>Filtry</strong>{filtered ? <span className="muted"> · zawężone</span> : <span className="muted"> · wszystkie pytania</span>}</summary>
        <div className="stack" style={{ marginTop: 10 }}>
          <div className="filter-grid">
            {oweOn && <>
              <label className="filters">Edycje od
                <select className="select" value={p.edFrom} data-testid="ed-from" onChange={(e) => set({ edFrom: Math.min(Number(e.target.value), p.edTo) })}>
                  {EDS.map((n) => <option key={n} value={n}>{ROMAN[n]} OWE</option>)}
                </select>
              </label>
              <label className="filters">do
                <select className="select" value={p.edTo} data-testid="ed-to" onChange={(e) => set({ edTo: Math.max(Number(e.target.value), p.edFrom) })}>
                  {EDS.map((n) => <option key={n} value={n}>{ROMAN[n]} OWE</option>)}
                </select>
              </label>
            </>}
            <label className="filters">Dział
              <select className="select" value={p.topic ?? ""} data-testid="topic" onChange={(e) => set({ topic: e.target.value || null })}>
                <option value="">wszystkie</option>
                {options.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="filters" title="Pytania, w których trzeba coś policzyć, należą do „wzorów”, nie do „pojęć”.">Rodzaj haseł
              <select className="select" value={p.kind ?? ""} data-testid="kind" onChange={(e) => set({ kind: e.target.value || null })}>
                <option value="">wszystkie</option>
                {options.kinds.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
              </select>
            </label>
            <label className="filters">Hasło przewodnie
              <select className="select" value={p.theme} data-testid="theme" onChange={(e) => set({ theme: e.target.value as StartPrefs["theme"] })}>
                <option value="all">wszystkie pytania</option>
                <option value="yes">tylko z hasła edycji</option>
                <option value="no">bez hasła edycji</option>
              </select>
            </label>
          </div>
          {oweOn && (
            <div>
              <div className="filter-label">Etap zawodów{bank === "mix" ? " (Archiwum OWE)" : ""}</div>
              <div className="chips" data-testid="stages">
                {STAGES.map((s) => (
                  <button key={s.id} className={`chip ${p.stages.includes(s.id) ? "selected" : ""}`} aria-pressed={p.stages.includes(s.id)} data-stage={s.id}
                    onClick={() => set({ stages: toggle(p.stages, s.id, STAGES.map((x) => x.id)) })}>
                    {p.stages.includes(s.id) ? "✓ " : ""}{s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            Hasło przewodnie: pytania Archiwum o hasło swojej edycji; w pytaniach AI i Słownika – demografia (hasło XL edycji).
            {bank === "mix" ? " Zakres edycji i etap dotyczą tylko Archiwum OWE." : ""}
          </p>
          {filtered && <button className="btn secondary" style={{ justifySelf: "start" }} onClick={() => set({ topic: null, kind: null, theme: "all", edFrom: 21, edTo: 39, stages: ["s", "o", "c"] })}>Wyczyść filtry</button>}
        </div>
      </details>
      <h2>Typ pytań</h2>
      <div className="choices">
        {TYPES.map((t) => (
          <button key={t.value} className={`choice ${p.type === t.value ? "active" : ""}`} onClick={() => set({ type: t.value })} data-type={t.value}>
            <strong>{t.label}</strong>
            <small>{t.hint}</small>
            <small data-testid={`count-${t.value}`}>{counts[t.value] > 0 ? `${counts[t.value]} pytań` : "brak pytań dla tych filtrów"}</small>
          </button>
        ))}
      </div>
      <h2>Liczba pytań</h2>
      <div className="choices three">
        {SIZES.map((s) => (
          <button key={s.value} className={`choice ${p.count === s.value ? "active" : ""}`} onClick={() => set({ count: s.value })}>
            <strong>{s.label}</strong>
            <small>{s.hint}</small>
          </button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 24 }}>
        <button className="btn" onClick={start} disabled={busy || available === 0} data-testid="start">{busy ? "Losowanie…" : "Rozpocznij test"}</button>
        {typeof p.count === "number" && available > 0 && available < p.count && <span className="muted">wylosujemy {available} – tyle jest pytań dla tych filtrów</span>}
        {error && <span className="error">{error}</span>}
      </div>
      {stats && stats.overall.tests > 0 && (
        <>
          <h2>Wasz postęp</h2>
          <div className="stat-grid">
            <div className="stat"><div className="value">{fmtPct(stats.overall.percent)}</div><div className="label">łącznie</div></div>
            <div className="stat"><div className="value">{fmtPct(stats.byType.single.percent)}</div><div className="label">jednokrotny</div></div>
            <div className="stat"><div className="value">{fmtPct(stats.byType.multi.percent)}</div><div className="label">wielokrotny</div></div>
          </div>
          <Link href={`/stats?bank=${bank}`} className="muted">Pełne statystyki →</Link>
        </>
      )}
    </div>
  );
}
