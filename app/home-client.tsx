"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, fmtPct, lastTest, rememberTest } from "@/lib/client";
import type { Stats } from "@/lib/tests";
import type { QuestionType, TestState } from "@/lib/types";

const TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: "single", label: "Jednokrotny wybór", hint: "1 poprawna odpowiedź · +2 / −1 pkt" },
  { value: "multi", label: "Wielokrotny wybór", hint: "0,5 pkt za każde trafne pole · max 2 pkt" },
];
const SIZES = [
  { value: 30, label: "30 pytań", hint: "40 minut" },
  { value: 50, label: "50 pytań", hint: "60 minut" },
];

export default function HomeClient({ counts }: { counts: Record<QuestionType, number> }) {
  const router = useRouter();
  const [type, setType] = useState<QuestionType>(counts.single > 0 || counts.multi === 0 ? "single" : "multi");
  const [count, setCount] = useState(30);
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

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const test = await api<TestState>("/api/tests", { method: "POST", body: JSON.stringify({ type, count }) });
      rememberTest(test.id);
      router.push(`/test/${test.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <h1>Nowy test</h1>
      {resumeId && (
        <div className="card row">
          <span>Masz niedokończony test.</span>
          <span className="spacer" />
          <Link className="btn secondary" href={`/test/${resumeId}`}>Kontynuuj</Link>
        </div>
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
      <div className="choices">
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
          <Link href="/stats" className="muted">Pełne statystyki →</Link>
        </>
      )}
    </div>
  );
}
