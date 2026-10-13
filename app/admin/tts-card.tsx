"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { RunResult, TtsStatus } from "@/lib/tts";

const n = (x: number) => x.toLocaleString("pl-PL");
const mb = (b: number) => `${(b / 1024 / 1024).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} MB`;
const STOP: Record<string, string> = { czas: "skończył się czas porcji", budżet: "wyczerpany budżet na dziś", "limit Azure": "limit zapytań Azure", błąd: "błąd" };

/** Karta „Głosy z chmury” – nagrania Podręcznika głosem Azure (lib/tts.ts). */
export function TtsCard() {
  const [s, setS] = useState<TtsStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<TtsStatus>("/api/admin/tts").then(setS).catch((e) => setError(e.message)); }, []);

  async function runNow() {
    setBusy(true); setMsg(null); setError(null);
    try {
      const r = await api<{ run: RunResult; status: TtsStatus }>("/api/admin/tts", { method: "POST" });
      setS(r.status);
      setMsg(`Nagrano ${r.run.recorded} akapitów (${n(r.run.chars)} znaków)${r.run.removed ? `, usunięto ${r.run.removed} nieaktualnych` : ""}` +
        `${r.run.stopped ? ` – zatrzymano: ${STOP[r.run.stopped] ?? r.run.stopped}` : ""}.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function changeVoice(voice: string) {
    if (!s || voice === s.voice) return;
    if (!confirm("Zmiana głosu oznacza nagranie całego Podręcznika od nowa (kolejne miesiące darmowego limitu). Do tego czasu grają nagrania poprzednim głosem. Zmienić?")) return;
    try { setS(await api<TtsStatus>("/api/admin/tts", { method: "PUT", body: JSON.stringify({ voice }) })); } catch (e) { setError((e as Error).message); }
  }

  if (error && !s) return <div className="card"><p className="error" style={{ margin: 0 }}>{error}</p></div>;
  if (!s) return <div className="skeleton" style={{ height: 160 }} />;
  const pct = s.paragraphs.total ? (s.paragraphs.done / s.paragraphs.total) * 100 : 0;
  const usedPct = (s.used / s.monthly) * 100;
  return (
    <div className="card stack" data-testid="tts-card">
      <p className="muted" style={{ margin: 0 }}>
        Akapity Podręcznika są nagrywane głosem neuronowym Azure porcjami w tle (codziennie, w darmowym limicie znaków na miesiąc).
        Akapity jeszcze nienagrane czyta głos przeglądarki. Po zmianie treści artykułu nagrywane są tylko zmienione akapity.
      </p>
      {!s.configured && (
        <p className="error" style={{ margin: 0 }} data-testid="tts-missing">
          Brak konfiguracji w Vercel: {s.missing.join(", ")} – instrukcja w README („Głosy z chmury”).
        </p>
      )}
      <div className="row" style={{ alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <span className="big" data-testid="tts-progress">{n(s.paragraphs.done)} / {n(s.paragraphs.total)}</span>
        <span className="muted">akapitów · gotowe artykuły: {s.articles.done} / {s.articles.total} · {mb(s.bytes)}</span>
      </div>
      <div className="goal-bar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Nagrane akapity">
        <div style={{ width: `${Math.max(0.5, pct)}%` }} />
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Zużycie w {s.month}: {n(s.used)} z {n(s.monthly)} znaków ({usedPct.toLocaleString("pl-PL", { maximumFractionDigits: 0 })}%) · dziś można jeszcze ok. {n(s.allowanceNow)} ·
        do nagrania zostało {n(s.paragraphs.chars - s.paragraphs.charsDone)} znaków
        {s.lastRun ? ` · ostatnia porcja: ${new Date(s.lastRun).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}` : ""}
      </p>
      {s.lastError && <p className="error small" style={{ margin: 0 }}>Ostatni błąd: {s.lastError}</p>}
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <label className="field" style={{ margin: 0 }}>
          <span>Głos</span>
          <select className="select" value={s.voice} onChange={(e) => changeVoice(e.target.value)} data-testid="tts-voice">
            {s.voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </label>
        <span className="spacer" />
        <button className="btn small secondary" onClick={runNow} disabled={busy || !s.configured} data-testid="tts-run">
          {busy ? "Nagrywanie… (do 1 min)" : "🎙️ Nagraj porcję teraz"}
        </button>
      </div>
      {msg && <p className="muted" role="status" style={{ margin: 0 }} data-testid="tts-msg">{msg}</p>}
      {error && <p className="error small" style={{ margin: 0 }}>{error}</p>}
    </div>
  );
}
