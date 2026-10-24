"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError, fmtPct, lastTest, rememberTest } from "@/lib/client";
import { usePrefSync } from "@/lib/prefs-client";
import { ROMAN } from "@/lib/owe-stats";
import type { OweStage, SubOrigin } from "@/lib/question-meta";
import { isSource, SOURCE_IDS, SOURCES, type QSource } from "@/lib/question-source";
import type { Stats } from "@/lib/tests";
import type { QuestionType, TestState } from "@/lib/types";

const TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: "single", label: "Jednokrotny wybór", hint: "1 poprawna odpowiedź · +2 / −1 pkt" },
  { value: "multi", label: "Wielokrotny wybór", hint: "4 trafne pola A–D – 2 pkt · 3 trafne – 1 pkt · mniej – 0" },
];
const SIZES: { value: number | "endless"; label: string; hint: string }[] = [
  { value: 30, label: "30 pytań", hint: "40 minut" },
  { value: 50, label: "50 pytań", hint: "60 minut" },
  { value: "endless", label: "Bez limitu", hint: "bez limitu czasu · bez cofania · liczą się tylko rozwiązane" },
];
const SL_ORIGINS: { value: SubOrigin | null; label: string; hint: string }[] = [
  { value: null, label: "oba rodzaje", hint: "ręcznie pisane i automatyczne" },
  { value: "manual", label: "ręcznie pisane", hint: "zadania w stylu OWE: obliczenia, skutki, osoby" },
  { value: "auto", label: "automatyczne", hint: "definicja ↔ pojęcie, wzory, daty" },
];
const XL_ORIGINS: { value: SubOrigin | null; label: string; hint: string }[] = [
  { value: null, label: "wszystkie", hint: "pisane ręcznie i skryptem" },
  { value: "manual", label: "pisane ręcznie", hint: "400 pytań w stylu OWE o demografii i gospodarce" },
  { value: "auto", label: "ze skryptu", hint: "254 pytania układane algorytmem z haseł tematu" },
];
const STAGES: { id: OweStage; label: string }[] = [
  { id: "s", label: "szkolny" },
  { id: "o", label: "okręgowy" },
  { id: "c", label: "centralny" },
];
const EDS = Array.from({ length: 19 }, (_, i) => 21 + i);

/** Ustawienia formularza „Pytania” (zapamiętywane na koncie). */
export interface StartPrefs {
  type: QuestionType;
  count: number | "endless";
  sources: QSource[];
  /** Archiwum OWE: zakres edycji i etapy. */
  edFrom: number;
  edTo: number;
  stages: OweStage[];
  /** Wspólne: dział kursu, rodzaj haseł, hasło przewodnie. */
  topic: string | null;
  kind: string | null;
  theme: "all" | "yes" | "no";
  /** Słownik: ręcznie pisane / automatyczne i dział słownika. */
  slOrigin: SubOrigin | null;
  slSection: number | null;
  /** Hasło XL: pisane ręcznie / ze skryptu. */
  xlOrigin: SubOrigin | null;
  /** Tylko pytania, na które ostatnio odpowiedziano źle (ostatnie 90 dni) – nie zapamiętywane. */
  mistakes: boolean;
}
export const DEFAULT_PREFS: StartPrefs = {
  type: "single", count: 30, sources: [...SOURCE_IDS], edFrom: 21, edTo: 39, stages: ["s", "o", "c"],
  topic: null, kind: null, theme: "all", slOrigin: null, slSection: null, xlOrigin: null, mistakes: false,
};

type Pair = { single: number; multi: number };
interface Counts extends Pair { bySource: Record<QSource, Pair> | null }

export interface StartOptions {
  topics: { id: string; name: string }[];
  kinds: { id: string; title: string }[];
  sections: { no: number; title: string }[];
}

/**
 * Testy → Pytania: jeden formularz dla wszystkich źródeł (Archiwum OWE, Pytania AI, Słownik, Hasło XL) z filtrami
 * każdego źródła i filtrami wspólnymi. `?zrodlo=<id>` – tylko to źródło (link z dawnych zakładek), `?bledy=1` – „Tylko moje błędy”.
 */
export default function HomeClient({ counts: initial, options }: { counts: Pair; options: StartOptions }) {
  const router = useRouter();
  const [p, setP] = useState<StartPrefs>(DEFAULT_PREFS);
  const set = (o: Partial<StartPrefs>) => setP((x) => ({ ...x, ...o }));
  // linki: „Powtórz błędy” (?bledy=1) i jedno źródło (?zrodlo=slownik – np. ze starego adresu /slownik)
  // (useSearchParams – przy przejściu linkiem adres w window.location zmienia się dopiero po pierwszym renderze)
  const search = useSearchParams();
  const mistakesLink = search.get("bledy") === "1";
  const z = search.get("zrodlo");
  const srcLink: QSource | null = isSource(z) ? z : null;
  const fromLinks = (x: StartPrefs): StartPrefs => ({ ...x, mistakes: mistakesLink, ...(srcLink ? { sources: [srcLink] } : {}) });
  useEffect(() => { if (mistakesLink || srcLink) setP(fromLinks); }, [mistakesLink, srcLink]); // eslint-disable-line react-hooks/exhaustive-deps
  // ustawienia na koncie; „Tylko moje błędy” nie jest zapamiętywane – włącza je link albo przycisk na czas tej wizyty
  usePrefSync("testy", JSON.stringify({ ...p, mistakes: false }), (v) => {
    try {
      const saved = { ...DEFAULT_PREFS, ...JSON.parse(v) } as StartPrefs;
      saved.sources = (saved.sources ?? []).filter(isSource);
      if (!saved.sources.length) saved.sources = [...SOURCE_IDS];
      setP(fromLinks(saved));
    } catch {}
  });
  const [counts, setCounts] = useState<Counts>({ ...initial, bySource: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);

  useEffect(() => {
    api<Stats>("/api/stats").then(setStats).catch(() => {});
    const id = lastTest();
    if (id) {
      api<TestState>(`/api/tests/${id}`)
        .then((t) => (t.finishedAt ? rememberTest(null) : setResumeId(t.id)))
        .catch(() => rememberTest(null));
    }
  }, []);

  const on = (s: QSource) => p.sources.includes(s);
  const body = () => ({
    sources: p.sources,
    ...(on("owe") ? { edFrom: p.edFrom, edTo: p.edTo, stages: p.stages } : {}),
    ...(on("slownik") ? { slOrigin: p.slOrigin, slSection: p.slSection } : {}),
    ...(on("xl") ? { xlOrigin: p.xlOrigin } : {}),
    topic: p.topic, kind: p.kind, theme: p.theme,
    ...(p.mistakes ? { mistakes: true } : {}),
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
          setP((x) => (x.topic || x.kind || x.slSection ? { ...x, topic: null, kind: null, slSection: null } : x));
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
  const filtered = p.topic || p.kind || p.theme !== "all";
  const srcFiltered = (on("owe") && (p.edFrom > 21 || p.edTo < 39 || p.stages.length < 3)) || (on("slownik") && (p.slOrigin || p.slSection))
    || (on("xl") && p.xlOrigin);

  return (
    <div className="stack">
      <h1>Pytania</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Jeden test z wybranych źródeł: prawdziwych pytań olimpijskich, Twoich pytań AI, pytań ze słownika pojęć i pytań o hasło XL
        edycji. Każde źródło ma swoje filtry; przy każdym pytaniu w teście widać, skąd pochodzi.
      </p>
      {resumeId && (
        <div className="card row">
          <span>Masz niedokończony test.</span>
          <span className="spacer" />
          <Link className="btn secondary" href={`/test/${resumeId}`}>Kontynuuj</Link>
        </div>
      )}
      <h2>Źródła pytań</h2>
      <div className="choices" data-testid="sources">
        {SOURCES.map((s) => {
          const n = counts.bySource?.[s.id];
          return (
            <button key={s.id} className={`choice ${on(s.id) ? "active" : ""}`} aria-pressed={on(s.id)} data-source={s.id}
              onClick={() => set({ sources: toggle(p.sources, s.id, SOURCE_IDS) })}>
              <strong>{on(s.id) ? "✓ " : ""}{s.icon} {s.label}</strong>
              <small>{s.hint}</small>
              {n && <small data-testid={`src-count-${s.id}`}>{n[p.type]} pytań{p.type === "multi" ? " wielokrotnego wyboru" : ""}</small>}
            </button>
          );
        })}
      </div>

      {(on("owe") || on("slownik") || on("xl")) && (
        <details className="card filters-card" open={!!srcFiltered} data-testid="source-filters">
          <summary><strong>Filtry źródeł</strong>{srcFiltered ? <span className="muted"> · zawężone</span> : <span className="muted"> · bez zawężeń</span>}</summary>
          <div className="stack" style={{ marginTop: 10 }}>
            {on("owe") && (
              <fieldset className="src-filter" data-testid="filters-owe">
                <legend>📜 Archiwum OWE</legend>
                <div className="filter-grid">
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
                </div>
                <div className="filter-label">Etap zawodów</div>
                <div className="chips" data-testid="stages">
                  {STAGES.map((s) => (
                    <button key={s.id} className={`chip ${p.stages.includes(s.id) ? "selected" : ""}`} aria-pressed={p.stages.includes(s.id)} data-stage={s.id}
                      onClick={() => set({ stages: toggle(p.stages, s.id, STAGES.map((x) => x.id)) })}>
                      {p.stages.includes(s.id) ? "✓ " : ""}{s.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {on("slownik") && (
              <fieldset className="src-filter" data-testid="filters-slownik">
                <legend>📘 Słownik</legend>
                <div className="filter-label">Rodzaj pytań</div>
                <div className="seg" role="group" aria-label="Rodzaj pytań Słownika" data-testid="sl-origin">
                  {SL_ORIGINS.map((o) => (
                    <button key={o.label} className={p.slOrigin === o.value ? "active" : ""} aria-pressed={p.slOrigin === o.value} title={o.hint}
                      data-origin={o.value ?? "all"} onClick={() => set({ slOrigin: o.value })}>{o.label}</button>
                  ))}
                </div>
                <label className="filters">Dział słownika
                  <select className="select" value={p.slSection ?? ""} data-testid="sl-section"
                    onChange={(e) => set({ slSection: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">wszystkie działy</option>
                    {options.sections.map((s) => <option key={s.no} value={s.no}>{s.no}. {s.title}</option>)}
                  </select>
                </label>
              </fieldset>
            )}
            {on("xl") && (
              <fieldset className="src-filter" data-testid="filters-xl">
                <legend>🎯 Hasło XL (własne)</legend>
                <div className="filter-label">Jak powstały</div>
                <div className="seg" role="group" aria-label="Rodzaj pytań o hasło XL" data-testid="xl-origin">
                  {XL_ORIGINS.map((o) => (
                    <button key={o.label} className={p.xlOrigin === o.value ? "active" : ""} aria-pressed={p.xlOrigin === o.value} title={o.hint}
                      data-origin={o.value ?? "all"} onClick={() => set({ xlOrigin: o.value })}>{o.label}</button>
                  ))}
                </div>
              </fieldset>
            )}
            <p className="muted small" style={{ margin: 0 }}>Filtry źródła zawężają tylko pytania z tego źródła.</p>
            {srcFiltered && <button className="btn secondary" style={{ justifySelf: "start" }}
              onClick={() => set({ edFrom: 21, edTo: 39, stages: ["s", "o", "c"], slOrigin: null, slSection: null, xlOrigin: null })}>Wyczyść filtry źródeł</button>}
          </div>
        </details>
      )}

      <details className="card filters-card" open={!!filtered} data-testid="test-filters">
        <summary><strong>Filtry wspólne</strong>{filtered ? <span className="muted"> · zawężone</span> : <span className="muted"> · wszystkie pytania</span>}</summary>
        <div className="stack" style={{ marginTop: 10 }}>
          <div className="filter-grid">
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
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            Hasło przewodnie: pytania Archiwum o hasło swojej edycji, całe źródło „Hasło XL”, a w Pytaniach AI i Słowniku – demografia.
          </p>
          {filtered && <button className="btn secondary" style={{ justifySelf: "start" }} onClick={() => set({ topic: null, kind: null, theme: "all" })}>Wyczyść filtry</button>}
        </div>
      </details>

      <button className={`choice mistakes-choice ${p.mistakes ? "active" : ""}`} aria-pressed={p.mistakes} data-testid="mistakes"
        onClick={() => set({ mistakes: !p.mistakes })}>
        <strong>{p.mistakes ? "✓ " : ""}🔁 Tylko moje błędy</strong>
        <small>pytania z wybranych źródeł i filtrów, na które ostatnio odpowiedziałeś źle lub częściowo (90 dni) – od najdawniejszego;
          poprawna odpowiedź usuwa pytanie z puli{p.mistakes ? ` · ${counts[p.type]} do powtórki` : ""}</small>
      </button>
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
          <h2>Twój postęp</h2>
          <div className="stat-grid">
            <div className="stat"><div className="value">{fmtPct(stats.overall.percent)}</div><div className="label">łącznie</div></div>
            <div className="stat"><div className="value">{fmtPct(stats.byType.single.percent)}</div><div className="label">jednokrotny</div></div>
            <div className="stat"><div className="value">{fmtPct(stats.byType.multi.percent)}</div><div className="label">wielokrotny</div></div>
          </div>
          <Link href="/stats" className="muted">Pełne statystyki →</Link>
        </>
      )}
    </div>
  );
}
