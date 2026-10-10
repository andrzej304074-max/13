"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chart } from "@/app/components/chart";
import { PreviewBanner } from "@/app/components/preview-banner";
import { api, fmtPct, fmtPoints, withUser } from "@/lib/client";
import { BLOCK_SIZES, DEFAULT_BLOCK_SIZE } from "@/lib/scoring";
import type { Stats } from "@/lib/tests";

const BLOCK_KEY = "owe:blockSize";
const TYPE_KEY = "owe:statsType";
const BANK_KEY = "owe:statsBank";

type Bank = "owe" | "slownik";
const BANKS: { value: Bank; label: string }[] = [
  { value: "owe", label: "Pytania z olimpiad" },
  { value: "slownik", label: "Pytania ze słownika" },
];

type Filter = "all" | "single" | "multi";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Oba typy" },
  { value: "single", label: "Jednokrotny" },
  { value: "multi", label: "Wielokrotny" },
];

const TYPE_LABEL = { single: "jednokrotny", multi: "wielokrotny" } as const;

function testsLabel(n: number) {
  const tens = n % 100, ones = n % 10;
  const word = n === 1 ? "test" : ones >= 2 && ones <= 4 && (tens < 12 || tens > 14) ? "testy" : "testów";
  return `${n} ${word}`;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [blockSize, setBlockSize] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [bank, setBank] = useState<Bank | null>(null);

  // Wybrany rozmiar bloku zapamiętywany lokalnie w przeglądarce.
  useEffect(() => {
    let saved = DEFAULT_BLOCK_SIZE;
    try {
      const v = Number(localStorage.getItem(BLOCK_KEY));
      if ((BLOCK_SIZES as readonly number[]).includes(v)) saved = v;
    } catch {}
    try {
      const f = localStorage.getItem(TYPE_KEY);
      if (f === "single" || f === "multi") setFilter(f);
    } catch {}
    // Baza z adresu (?bank=slownik) ma pierwszeństwo przed ostatnio oglądaną.
    let b: Bank = "owe";
    const fromUrl = new URLSearchParams(window.location.search).get("bank");
    try {
      const v = fromUrl ?? localStorage.getItem(BANK_KEY);
      if (v === "slownik") b = "slownik";
    } catch {}
    setBank(b);
    setBlockSize(saved);
  }, []);

  useEffect(() => {
    if (blockSize === null || bank === null) return;
    const typeParam = filter === "all" ? "" : `&type=${filter}`;
    api<Stats>(withUser(`/api/stats?bank=${bank}&block=${blockSize}${typeParam}`)).then(setStats).catch((e) => setError(e.message));
  }, [blockSize, filter, bank]);

  function chooseBank(b: Bank) {
    setBank(b);
    try {
      localStorage.setItem(BANK_KEY, b);
      window.history.replaceState(null, "", `/stats?bank=${b}`);
    } catch {}
  }

  function chooseFilter(f: Filter) {
    setFilter(f);
    try {
      localStorage.setItem(TYPE_KEY, f);
    } catch {}
  }

  function chooseBlock(n: number) {
    setBlockSize(n);
    try {
      localStorage.setItem(BLOCK_KEY, String(n));
    } catch {}
  }

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="muted">Ładowanie…</p>;

  const { overall, byType, history, blocks } = stats;
  const size = stats.blockSize;
  const main = filter === "all" ? overall : byType[filter];
  const unitLabel = filter === "multi" ? "trafnych pól" : filter === "single" ? "poprawnych pytań" : "poprawnych";
  return (
    <div className="stack">
      <PreviewBanner />
      <h1>Statystyki</h1>
      <p className="muted" style={{ marginTop: -8 }}>Statystyki zakładki Nauka (lekcje, czas, ćwiczenia): <Link href="/nauka/statystyki">Statystyki nauki →</Link></p>
      <div className="seg" role="group" aria-label="Baza pytań">
        {BANKS.map((b) => (
          <button
            key={b.value}
            className={b.value === bank ? "active" : ""}
            aria-pressed={b.value === bank}
            onClick={() => chooseBank(b.value)}
          >
            {b.label}
          </button>
        ))}
      </div>
      <p className="muted">{bank === "slownik" ? "Pytania ze słownika pojęć – statystyki liczone osobno od pytań z olimpiad. " : ""}Procent poprawnych odpowiedzi ze wszystkich testów wszystkich użytkowników – w wielokrotnym wyborze liczy się każde
        trafne pole A–D. W testach 30/50 pytań liczą się wszystkie pytania testu, w trybie „bez limitu” tylko sprawdzone
        lub pominięte.</p>
      <div className="seg" role="group" aria-label="Typ pytań">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={f.value === filter ? "active" : ""}
            aria-pressed={f.value === filter}
            onClick={() => chooseFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="card">
        <div className="big">{fmtPct(main.percent)}</div>
        <p className="muted" style={{ margin: 0 }}>
          {filter !== "all" && `${TYPE_LABEL[filter]} · `}
          {main.correct} / {main.total} {unitLabel} · {fmtPoints(main.score)} / {fmtPoints(main.maxScore)} pkt ·{" "}
          {testsLabel(main.tests)}
        </p>
      </div>
      {filter === "all" && (
        <div className="stat-grid">
          {(["single", "multi"] as const).map((t) => (
            <div className="stat" key={t}>
              <div className="value">{fmtPct(byType[t].percent)}</div>
              <div className="label">
                {TYPE_LABEL[t]} · {byType[t].correct}/{byType[t].total} {t === "multi" ? "pól" : "pytań"} ·{" "}
                {fmtPoints(byType[t].score)}/{fmtPoints(byType[t].maxScore)} pkt · {testsLabel(byType[t].tests)}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2>Postęp (% kolejnych testów)</h2>
      {history.length === 0 ? (
        <p className="muted">Brak zakończonych testów.</p>
      ) : (
        <>
          <div className="card">
            <Chart
              points={history.map((h) => h.percent)}
              ariaLabel="Wynik procentowy kolejnych testów"
              label={(i) => `Test ${i + 1}: ${fmtPct(history[i].percent)}`}
            />
          </div>
          <div className="card">
            <div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Data</th><th>Typ</th><th>Poprawne</th><th>Punkty</th><th>%</th></tr></thead>
              <tbody>
                {[...history].reverse().map((h, i) => (
                  <tr key={h.id}>
                    <td>{history.length - i}</td>
                    <td>{new Date(h.finishedAt).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td>{TYPE_LABEL[h.type]}{h.mode === "endless" ? " · bez limitu" : ""}</td>
                    <td>{h.correct} / {h.total}</td>
                    <td>{fmtPoints(h.score)} / {fmtPoints(h.maxScore)}</td>
                    <td>{fmtPct(h.percent)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </>
      )}

      <h2>Postęp (dokładność co {size} pytań)</h2>
      <div className="seg" role="group" aria-label="Liczba pytań na kropkę">
        {BLOCK_SIZES.map((n) => (
          <button key={n} className={n === size ? "active" : ""} aria-pressed={n === size} onClick={() => chooseBlock(n)}>
            {n}
          </button>
        ))}
      </div>
      {blocks.length === 0 ? (
        <p className="muted">Brak odpowiedzi.</p>
      ) : (
        <div className="card">
          <p className="muted" style={{ margin: "0 0 8px", fontSize: "0.85rem" }}>
            Każda kropka to {size} kolejnych sprawdzonych lub pominiętych pytań
            {filter === "all" ? " (wszystkie testy, oba typy)" : ` (tylko ${filter === "single" ? "jednokrotny" : "wielokrotny"} wybór)`}. W wielokrotnym
            wyborze dokładność pytania to trafne pola / 4. Pusta kropka – blok jeszcze niepełny.
          </p>
          <Chart
            points={blocks.map((b) => b.percent)}
            ariaLabel={`Dokładność w blokach po ${size} pytań`}
            partialLast={blocks[blocks.length - 1].questions < size}
            label={(i) => {
              const done = blocks.slice(0, i).reduce((s, b) => s + b.questions, 0);
              return `Pytania ${done + 1}–${done + blocks[i].questions}: ${fmtPct(blocks[i].percent)}`;
            }}
          />
        </div>
      )}
    </div>
  );
}
