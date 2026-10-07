"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, fmtPct, lastTest, rememberTest } from "@/lib/client";
import type { Stats } from "@/lib/tests";
import type { Bank, Origin, QuestionType, TestState } from "@/lib/types";

const TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: "single", label: "Jednokrotny wybór", hint: "1 poprawna odpowiedź · +2 / −1 pkt" },
  { value: "multi", label: "Wielokrotny wybór", hint: "0,5 pkt za każde trafne pole · max 2 pkt" },
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

export interface SlownikOptions {
  /** Liczby pytań wg klucza `typ|pochodzenie|dział`. */
  counts: Record<string, number>;
  sections: { no: number; title: string }[];
}

export default function HomeClient({
  counts: baseCounts,
  bank = "owe",
  slownik,
}: {
  counts: Record<QuestionType, number>;
  bank?: Bank;
  slownik?: SlownikOptions;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [section, setSection] = useState<number | null>(null);
  // W zakładce słownika liczba dostępnych pytań zależy od wybranego pochodzenia i działu.
  const counts: Record<QuestionType, number> = slownik
    ? {
        single: countSlownik(slownik.counts, "single", origin, section),
        multi: countSlownik(slownik.counts, "multi", origin, section),
      }
    : baseCounts;
  const [type, setType] = useState<QuestionType>(counts.single > 0 || counts.multi === 0 ? "single" : "multi");
  const [count, setCount] = useState<number | "endless">(30);
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

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const test = await api<TestState>("/api/tests", {
        method: "POST",
        body: JSON.stringify({ type, count, bank, origin, section }),
      });
      rememberTest(test.id);
      router.push(`/test/${test.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <h1>{slownik ? "Test ze słownika pojęć" : "Nowy test"}</h1>
      {slownik && (
        <p className="muted" style={{ marginTop: 0 }}>
          Pytania ułożone na podstawie słownika pojęć OWE (docs/slownik-owe.pdf). Wyniki liczą się do osobnych statystyk.
        </p>
      )}
      {resumeId && (
        <div className="card row">
          <span>Masz niedokończony test.</span>
          <span className="spacer" />
          <Link className="btn secondary" href={`/test/${resumeId}`}>Kontynuuj</Link>
        </div>
      )}
      {slownik && (
        <>
          <h2>Rodzaj pytań</h2>
          <div className="choices three">
            {ORIGINS.map((o) => (
              <button
                key={o.label}
                className={`choice ${origin === o.value ? "active" : ""}`}
                onClick={() => setOrigin(o.value)}
              >
                <strong>{o.label}</strong>
                <small>{o.hint}</small>
                <small>{countSlownik(slownik.counts, null, o.value, section)} pytań</small>
              </button>
            ))}
          </div>
          <h2>Dział słownika</h2>
          <select
            className="select"
            value={section ?? ""}
            onChange={(e) => setSection(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Wszystkie działy (losowo z całego słownika)</option>
            {slownik.sections.map((s) => (
              <option key={s.no} value={s.no}>
                {s.no}. {s.title} ({countSlownik(slownik.counts, null, origin, s.no)})
              </option>
            ))}
          </select>
        </>
      )}
      <h2>Typ pytań</h2>
      <div className="choices">
        {TYPES.map((t) => (
          <button
            key={t.value}
            className={`choice ${type === t.value ? "active" : ""}`}
            onClick={() => setType(t.value)}
            disabled={counts[t.value] === 0}
          >
            <strong>{t.label}</strong>
            <small>{t.hint}</small>
            <small>{counts[t.value] > 0 ? `${counts[t.value]} pytań w bazie` : "brak pytań w bazie"}</small>
          </button>
        ))}
      </div>
      <h2>Liczba pytań</h2>
      <div className="choices three">
        {SIZES.map((s) => (
          <button key={s.value} className={`choice ${count === s.value ? "active" : ""}`} onClick={() => setCount(s.value)}>
            <strong>{s.label}</strong>
            <small>{s.hint}</small>
          </button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 24 }}>
        <button className="btn" onClick={start} disabled={busy || counts[type] === 0}>{busy ? "Losowanie…" : "Rozpocznij test"}</button>
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

function countSlownik(
  counts: Record<string, number>,
  type: QuestionType | null,
  origin: Origin | null,
  section: number | null,
): number {
  let n = 0;
  for (const [key, v] of Object.entries(counts)) {
    const [t, o, sec] = key.split("|");
    if ((!type || t === type) && (!origin || o === origin) && (!section || Number(sec) === section)) n += v;
  }
  return n;
}
