"use client";

import { useEffect, useState } from "react";
import { SkeletonRows } from "@/app/components/loading-page";
import { api } from "@/lib/client";
import type { BugReport } from "@/lib/bugs";
import { BUG_LIMITS, BUG_STATUS_LABEL } from "@/lib/bugs-core";

const fmt = (s: string) => new Date(s).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });

/** „🐞 Zgłoś błąd”: opis problemu + automatycznie strona, z której przyszedłeś, i urządzenie; lista moich zgłoszeń z odpowiedzią admina. */
export function BugsView() {
  const [text, setText] = useState("");
  const [page, setPage] = useState("");
  const [device, setDevice] = useState("");
  const [mine, setMine] = useState<BugReport[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("z") ?? "";
    setPage(from.startsWith("/") && !from.startsWith("/zgloszenia") ? from : "");
    const ua = navigator.userAgent;
    const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "inny system";
    const br = /CriOS|Chrome\//.test(ua) && !/Edg\//.test(ua) ? "Chrome" : /Edg\//.test(ua) ? "Edge" : /Firefox|FxiOS/.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "przeglądarka";
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches ? " · aplikacja z ekranu głównego" : "";
    setDevice(`${os} · ${br}${standalone} · ekran ${window.innerWidth}×${window.innerHeight}`);
    api<BugReport[]>("/api/zgloszenia").then(setMine).catch((e) => setError(e.message));
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const r = await api<BugReport>("/api/zgloszenia", { method: "POST", body: JSON.stringify({ text, page, device }) });
      setMine((m) => [r, ...(m ?? [])]);
      setText("");
      setMsg("Dziękujemy! Zgłoszenie trafiło do administratorów – status zobaczysz poniżej.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <h1>🐞 Zgłoś błąd</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Opisz, co się stało: co robiłeś, co powinno się stać, a co się stało. Do zgłoszenia dołączamy stronę i rodzaj urządzenia.
      </p>
      <form className="card stack" onSubmit={send} data-testid="bug-form">
        <label className="field"><span>Opis problemu</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} maxLength={BUG_LIMITS.text} required minLength={5}
            placeholder="np. W teście po kliknięciu „Sprawdź” ekran zrobił się pusty…" data-testid="bug-text" />
        </label>
        <label className="field"><span>Strona (opcjonalnie)</span>
          <input value={page} onChange={(e) => setPage(e.target.value)} maxLength={BUG_LIMITS.page} placeholder="/test/…" data-testid="bug-page" />
        </label>
        <p className="muted small" style={{ margin: 0 }}>Urządzenie: {device || "…"}</p>
        {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
        {msg && <p className="ok-msg" role="status" style={{ margin: 0 }}>{msg}</p>}
        <div><button className="btn" disabled={busy || text.trim().length < 5} data-testid="bug-send">{busy ? "Wysyłanie…" : "Wyślij zgłoszenie"}</button></div>
      </form>

      <h2>Moje zgłoszenia</h2>
      {!mine ? <SkeletonRows rows={2} height={64} label="Ładowanie zgłoszeń" /> : mine.length === 0 ? (
        <p className="muted">Nie masz jeszcze zgłoszeń.</p>
      ) : (
        <ul className="bug-list" data-testid="bug-mine">
          {mine.map((b) => (
            <li key={b.id} className="card bug-item">
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <span className={`tag bug-status ${b.status}`}>{BUG_STATUS_LABEL[b.status]}</span>
                <span className="muted small">{fmt(b.created_at)}{b.page ? ` · ${b.page}` : ""}</span>
              </div>
              <p className="bug-text">{b.text}</p>
              {b.note && <p className="bug-note"><strong>Odpowiedź administratora:</strong> {b.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
