"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { RunResult, TtsStatus } from "@/lib/tts";

const n = (x: number) => x.toLocaleString("pl-PL");
const mb = (b: number) => `${(b / 1024 / 1024).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} MB`;
const usd = (chars: number) => `${((chars / 1e6) * 16).toLocaleString("pl-PL", { maximumFractionDigits: 0 })} USD`;
const STOP: Record<string, string> = { czas: "skończył się czas porcji", budżet: "wyczerpany budżet (dzienny albo miesięczny)", "limit Azure": "limit zapytań Azure", błąd: "błąd" };

/** Karta „Głosy z chmury” – nagrania Podręcznika, haseł i pytań głosem Azure (lib/tts.ts). */
export function TtsCard() {
  const [s, setS] = useState<TtsStatus | null>(null);
  const [busy, setBusy] = useState<"one" | "all" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState("");
  const stopAll = useRef(false);
  useEffect(() => {
    api<TtsStatus>("/api/admin/tts").then((v) => { setS(v); setLimit(String(v.monthly)); }).catch((e) => setError(e.message));
  }, []);

  /** Jedna porcja (ok. 50 s); zwraca wynik albo null przy błędzie. */
  async function batch(): Promise<RunResult | null> {
    try {
      const r = await api<{ run: RunResult; status: TtsStatus }>("/api/admin/tts", { method: "POST" });
      setS(r.status);
      return r.run;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }

  const describe = (recorded: number, chars: number, stopped: string | null) =>
    `Nagrano ${n(recorded)} tekstów (${n(chars)} znaków)${stopped ? ` – zatrzymano: ${STOP[stopped] ?? stopped}` : ""}.`;

  async function runNow() {
    setBusy("one"); setMsg(null); setError(null);
    const r = await batch();
    if (r) setMsg(describe(r.recorded, r.chars, r.stopped) + (r.removed ? ` Usunięto ${r.removed} nieaktualnych.` : ""));
    setBusy(null);
  }

  /** „Nagraj wszystko”: porcje jedna po drugiej, dopóki są braki (tryb szybki – warstwa S0). */
  async function runAll() {
    setBusy("all"); setMsg(null); setError(null);
    stopAll.current = false;
    let recorded = 0, chars = 0, idle = 0;
    for (;;) {
      const r = await batch();
      if (!r) break;
      recorded += r.recorded; chars += r.chars;
      setMsg(`Nagrywanie… ${describe(recorded, chars, null)}`);
      if (stopAll.current) { setMsg(`Zatrzymano. ${describe(recorded, chars, null)}`); break; }
      if (r.stopped === "budżet" || r.stopped === "błąd") { setMsg(describe(recorded, chars, r.stopped)); break; }
      if (r.recorded === 0 && r.stopped !== "limit Azure") {
        // nic do nagrania (komplet) albo chwilowo nic nie weszło – dwie puste porcje z rzędu kończą
        if (++idle >= 2 || !r.stopped) { setMsg(`Gotowe. ${describe(recorded, chars, null)}`); break; }
      } else idle = 0;
      if (r.stopped === "limit Azure") await new Promise((res) => setTimeout(res, 5000));
    }
    setBusy(null);
  }

  async function save(body: Record<string, unknown>) {
    // przełącznik od razu (odpowiedź serwera i tak nadpisze stan)
    if (typeof body.fast === "boolean") setS((v) => v && { ...v, fast: body.fast as boolean });
    try { setS(await api<TtsStatus>("/api/admin/tts", { method: "PUT", body: JSON.stringify(body) })); } catch (e) { setError((e as Error).message); }
  }

  async function changeVoice(voice: string) {
    if (!s || voice === s.voice) return;
    if (!confirm("Zmiana głosu oznacza nagranie wszystkiego od nowa. Do tego czasu grają nagrania poprzednim głosem. Zmienić?")) return;
    await save({ voice });
  }

  if (error && !s) return <div className="card"><p className="error" style={{ margin: 0 }}>{error}</p></div>;
  if (!s) return <div className="skeleton" style={{ height: 160 }} />;
  const pct = s.paragraphs.total ? (s.paragraphs.done / s.paragraphs.total) * 100 : 0;
  const usedPct = s.monthly ? (s.used / s.monthly) * 100 : 0;
  const left = s.paragraphs.chars - s.paragraphs.charsDone;
  return (
    <div className="card stack" data-testid="tts-card">
      <p className="muted" style={{ margin: 0 }}>
        Akapity Podręcznika, hasła i pytania są nagrywane głosem neuronowym Azure – porcjami w tle (codziennie, w limicie znaków na miesiąc)
        i na bieżąco, gdy ktoś słucha (wtedy czytanie trwa też po wyłączeniu ekranu telefonu; limit {n(s.userDaily)} znaków dziennie na konto).
        Nienagrane teksty czyta głos przeglądarki. Po zmianie treści nagrywane są tylko zmienione teksty.
      </p>
      {!s.configured && (
        <p className="error" style={{ margin: 0 }} data-testid="tts-missing">
          Brak konfiguracji w Vercel: {s.missing.join(", ")} – instrukcja w README („Głosy z chmury”).
        </p>
      )}
      <div className="row" style={{ alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <span className="big" data-testid="tts-progress">{n(s.paragraphs.done)} / {n(s.paragraphs.total)}</span>
        <span className="muted">tekstów · gotowe artykuły: {s.articles.done} / {s.articles.total} · {mb(s.bytes)}</span>
      </div>
      <div className="goal-bar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Nagrane teksty">
        <div style={{ width: `${Math.max(0.5, pct)}%` }} />
      </div>
      <table className="db-tables" data-testid="tts-groups">
        <thead><tr><th>Treść</th><th>Nagrane</th><th>Zostało znaków</th><th>Koszt na S0</th></tr></thead>
        <tbody>
          {s.groups.map((g) => (
            <tr key={g.id} data-group={g.id}>
              <td>{g.label}</td><td>{n(g.done)} / {n(g.total)}</td><td>{n(g.chars - g.charsDone)}</td><td>{usd(g.chars - g.charsDone)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted" style={{ margin: 0 }}>
        Zużycie w {s.month}: {n(s.used)} z {n(s.monthly)} znaków ({usedPct.toLocaleString("pl-PL", { maximumFractionDigits: 0 })}%),
        w tym nagrane na bieżąco przy słuchaniu: <span data-testid="tts-live">{n(s.live)}</span> · {s.fast ? "do limitu miesiąca" : "porcja w tle dziś"} jeszcze ok. {n(s.allowanceNow)} ·
        do nagrania zostało {n(left)} znaków (na S0 ok. {usd(left)})
        {s.lastRun ? ` · ostatnia porcja: ${new Date(s.lastRun).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}` : ""}
      </p>
      {s.lastError && <p className="error small" style={{ margin: 0 }}>Ostatni błąd: {s.lastError}</p>}
      <div className="row" style={{ flexWrap: "wrap", gap: 12, alignItems: "end" }}>
        <label className="field" style={{ margin: 0 }}>
          <span>Głos</span>
          <select className="select" value={s.voice} onChange={(e) => changeVoice(e.target.value)} data-testid="tts-voice">
            {s.voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </label>
        <label className="field" style={{ margin: 0 }}>
          <span>Limit znaków na miesiąc</span>
          <input type="number" inputMode="numeric" min={0} step={10000} value={limit} onChange={(e) => setLimit(e.target.value)}
            onBlur={() => limit !== String(s.monthly) && save({ monthly: limit === "" ? null : Number(limit) })} data-testid="tts-limit" style={{ width: 150 }} />
        </label>
        <label className="check" style={{ marginBottom: 10 }}>
          <input type="checkbox" checked={s.fast} onChange={(e) => save({ fast: e.target.checked })} data-testid="tts-fast" />
          Tryb szybki (warstwa S0)
        </label>
      </div>
      {s.fast && (
        <p className="muted small" style={{ margin: 0 }} data-testid="tts-fast-note">
          Tryb szybki: 8 nagrań naraz, bez rozkładania na dni – tylko przy warstwie <b>S0</b> w Azure (na F0 Azure odrzuci nadmiar zapytań).
          Po nagraniu wróć w Azure na Free F0, wyłącz tryb szybki i przywróć limit 450 000.
        </p>
      )}
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <span className="spacer" />
        {busy === "all"
          ? <button className="btn small danger" onClick={() => { stopAll.current = true; }} data-testid="tts-stop">⏹ Zatrzymaj po tej porcji</button>
          : <>
            <button className="btn small secondary" onClick={runNow} disabled={!!busy || !s.configured} data-testid="tts-run">
              {busy === "one" ? "Nagrywanie… (do 1 min)" : "🎙️ Nagraj porcję teraz"}
            </button>
            {s.fast && <button className="btn small" onClick={runAll} disabled={!!busy || !s.configured} data-testid="tts-run-all">⏩ Nagraj wszystko</button>}
          </>}
      </div>
      {msg && <p className="muted" role="status" style={{ margin: 0 }} data-testid="tts-msg">{msg}</p>}
      {error && <p className="error small" style={{ margin: 0 }}>{error}</p>}
    </div>
  );
}
