"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { BugReport } from "@/lib/bugs";
import { BUG_KINDS, BUG_LIMITS, type BugKind } from "@/lib/bugs-core";

/** Opis urządzenia dołączany do zgłoszenia: system, przeglądarka, tryb aplikacji, rozmiar ekranu. */
export function deviceInfo(): string {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "inny system";
  const br = /CriOS|Chrome\//.test(ua) && !/Edg\//.test(ua) ? "Chrome" : /Edg\//.test(ua) ? "Edge" : /Firefox|FxiOS/.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "przeglądarka";
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches ? " · aplikacja z ekranu głównego" : "";
  return `${os} · ${br}${standalone} · ekran ${window.innerWidth}×${window.innerHeight}`;
}

const KIND_HINT: Record<BugKind, string> = {
  merytoryczny: "błąd w treści: definicja, pytanie, odpowiedź, wyjaśnienie, wykres",
  techniczny: "aplikacja nie działa jak powinna: przycisk, wygląd, zapis, ładowanie",
};

/**
 * Formularz zgłoszenia: rodzaj (merytoryczny / techniczny), sekcja strony (gdy podano listę nagłówków), opis, strona, urządzenie.
 * Używany w wyskakującym panelu (`BugPopup`) i na pełnej stronie `/zgloszenia`.
 */
export function BugForm({ page: initialPage, sections, section: initialSection, compact, editablePage, onSent }: {
  page: string;
  /** Nagłówki bieżącej strony (bez „cała strona” – dodawana automatycznie). */
  sections?: string[];
  section?: string;
  compact?: boolean;
  editablePage?: boolean;
  onSent: (r: BugReport) => void;
}) {
  const [kind, setKind] = useState<BugKind | null>(null);
  const [text, setText] = useState("");
  const [page, setPage] = useState(initialPage);
  const [section, setSection] = useState(initialSection ?? "");
  const [device, setDevice] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setDevice(deviceInfo()), []);
  useEffect(() => setPage(initialPage), [initialPage]);
  useEffect(() => setSection(initialSection ?? ""), [initialSection]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !kind) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const r = await api<BugReport>("/api/zgloszenia", { method: "POST", body: JSON.stringify({ text, page, device, kind, section }) });
      onSent(r);
      setText("");
      setMsg("Dziękujemy! Zgłoszenie trafiło do administratorów – status zobaczysz w „Moich zgłoszeniach”.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={compact ? "stack bug-form compact" : "card stack bug-form"} onSubmit={send} data-testid="bug-form">
      <fieldset className="field bug-kind">
        <legend>Rodzaj błędu</legend>
        <div className="seg" role="radiogroup" aria-label="Rodzaj błędu">
          {BUG_KINDS.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? "active" : ""}
              onClick={() => setKind(k)} data-kind={k} data-testid={`bug-kind-${k}`}>
              {k === "merytoryczny" ? "📖 Merytoryczny" : "🛠️ Techniczny"}
            </button>
          ))}
        </div>
        <span className="muted small">{kind ? KIND_HINT[kind] : "Wybierz: błąd w treści czy w działaniu aplikacji?"}</span>
      </fieldset>
      {sections && (
        <label className="field"><span>Sekcja strony</span>
          <select className="select" value={section} onChange={(e) => setSection(e.target.value)} data-testid="bug-section">
            <option value="">cała strona</option>
            {sections.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      )}
      <label className="field"><span>Opis problemu</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={compact ? 4 : 6} maxLength={BUG_LIMITS.text} required minLength={5}
          placeholder={kind === "merytoryczny" ? "np. W definicji PKB brakuje… / poprawna odpowiedź to B, bo…" : "np. Po kliknięciu „Sprawdź” ekran zrobił się pusty…"}
          data-testid="bug-text" />
      </label>
      {editablePage ? (
        <label className="field"><span>Strona (opcjonalnie)</span>
          <input value={page} onChange={(e) => setPage(e.target.value)} maxLength={BUG_LIMITS.page} placeholder="/test/…" data-testid="bug-page" />
        </label>
      ) : page && <p className="muted small" style={{ margin: 0 }}>Strona: {page}</p>}
      <p className="muted small" style={{ margin: 0 }}>Urządzenie: {device || "…"}</p>
      {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
      {msg && <p className="ok-msg" role="status" style={{ margin: 0 }}>{msg}</p>}
      <div>
        <button className="btn" disabled={busy || !kind || text.trim().length < 5} data-testid="bug-send">{busy ? "Wysyłanie…" : "Wyślij zgłoszenie"}</button>
      </div>
    </form>
  );
}
