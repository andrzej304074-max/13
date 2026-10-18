"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chart } from "@/app/components/chart";
import { PreviewBanner } from "@/app/components/preview-banner";
import { api, fmtPct, fmtPoints, withUser } from "@/lib/client";
import { BLOCK_SIZES, DEFAULT_BLOCK_SIZE } from "@/lib/scoring";
import type { Stats } from "@/lib/tests";
import type { Stage } from "@/lib/questions";
import { LoadingPage } from "@/app/components/loading-page";
import { LoadError } from "@/app/components/load-error";
import { OpenStats } from "./open-stats";

const BLOCK_KEY = "owe:blockSize";
const TYPE_KEY = "owe:statsType";
const BANK_KEY = "owe:statsBank";
const STAGE_KEY = "owe:statsStage";
const STAGE_LABEL: Record<Stage, string> = { s: "szkolny", o: "okręgowy" };
const STAGE_GEN: Record<Stage, string> = { s: "szkolnego", o: "okręgowego" };

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
  const [stage, setStage] = useState<Stage | null>(null);

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
      const s = localStorage.getItem(STAGE_KEY);
      if (s === "s" || s === "o") setStage(s);
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
    const stageParam = bank === "owe" && filter === "single" && stage ? `&stage=${stage}` : "";
    api<Stats>(withUser(`/api/stats?bank=${bank}&block=${blockSize}${typeParam}${stageParam}`)).then(setStats).catch((e) => setError(e.message));
  }, [blockSize, filter, bank, stage]);

  function chooseStage(s: Stage | null) {
    setStage(s);
    try {
      localStorage.setItem(STAGE_KEY, s ?? "");
    } catch {}
  }

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

  if (error) return <LoadError message={error} />;
  if (!stats) return <LoadingPage />;

  const { overall, byType, byStage, history, blocks } = stats;
  const size = stats.blockSize;
  const st = stats.stage;
  const main = st ? byStage[st] : filter === "all" ? overall : byType[filter];
  const showStages = bank === "owe" && filter !== "multi";
  const unitLabel = filter === "multi" ? "pkt" : filter === "single" ? "poprawnych pytań" : "poprawnych";
  return (
    <div className="stack">
      <PreviewBanner />
      <h1>Statystyki</h1>
      <p className="muted" style={{ marginTop: -8 }}>Wyniki Twoich testów. Skuteczność według działów i pojęć: <Link href={`/stats/dzialy?bank=${bank}`}>Działy i pojęcia →</Link></p>
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
      <p className="muted">{bank === "slownik" ? "Pytania ze słownika pojęć – statystyki liczone osobno od pytań z olimpiad. " : ""}Procent poprawnych odpowiedzi ze wszystkich testów wszystkich użytkowników – w wielokrotnym wyborze – zdobyte punkty
        z maks. 2 na pytanie (4 trafne pola A–D – 2 pkt, 3 trafne – 1 pkt, mniej – 0). W testach 30/50 pytań liczą się wszystkie pytania testu, w trybie „bez limitu” tylko sprawdzone
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
      {bank === "owe" && filter === "single" && (
        <div className="seg" role="group" aria-label="Etap zawodów" data-testid="stats-stage">
          {([[null, "Oba etapy"], ["s", "Szkolny"], ["o", "Okręgowy"]] as const).map(([v, l]) => (
            <button key={v ?? "both"} className={stage === v ? "active" : ""} aria-pressed={stage === v} onClick={() => chooseStage(v)} data-stage={v ?? ""}>{l}</button>
          ))}
        </div>
      )}
      <div className="card">
        <div className="big">{fmtPct(main.percent)}</div>
        <p className="muted" style={{ margin: 0 }}>
          {filter !== "all" && `${TYPE_LABEL[filter]} · `}{st && `etap ${STAGE_LABEL[st]} · `}
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
                {TYPE_LABEL[t]} ·{" "}
                {t === "single" && <>{byType[t].correct}/{byType[t].total} pytań · </>}
                {fmtPoints(byType[t].score)}/{fmtPoints(byType[t].maxScore)} pkt · {testsLabel(byType[t].tests)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showStages && (byStage.s.total > 0 || byStage.o.total > 0) && <>
        <h3 style={{ margin: "8px 0 0" }}>Jednokrotny wybór wg etapu</h3>
        <div className="stat-grid" data-testid="stage-stats">
          {(["s", "o"] as const).map((s) => (
            <div className={`stat${st === s ? " active" : ""}`} key={s} data-stage={s}>
              <div className="value">{byStage[s].total ? fmtPct(byStage[s].percent) : "–"}</div>
              <div className="label">
                etap {STAGE_LABEL[s]} · {byStage[s].correct}/{byStage[s].total} pytań · {fmtPoints(byStage[s].score)}/{fmtPoints(byStage[s].maxScore)} pkt · {testsLabel(byStage[s].tests)}
              </div>
            </div>
          ))}
        </div>
        <p className="muted small" style={{ margin: 0 }}>Liczone z pytań każdego etapu – także w testach „oba etapy”. Pytania bez odpowiedzi w teście 30/50 liczą się jako błędne.</p>
      </>}

      {bank === "owe" && <OpenStats />}

      <h2>Postęp (% kolejnych testów{st ? ` – tylko pytania etapu ${STAGE_GEN[st]}` : ""})</h2>
      {history.length === 0 ? (
        <div className="empty-state"><span aria-hidden>📈</span><p>Brak zakończonych testów. Rozwiąż pierwszy test, a tu pojawi się wykres postępu.</p><Link href="/" className="btn">Rozpocznij test</Link></div>
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
                    <td>{TYPE_LABEL[h.type]}{h.drawStage ? ` · etap ${STAGE_LABEL[h.drawStage]}` : ""}{h.mode === "endless" ? " · bez limitu" : ""}</td>
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
        <div className="empty-state"><span aria-hidden>📝</span><p>Brak odpowiedzi w tym zakresie.</p></div>
      ) : (
        <div className="card">
          <p className="muted" style={{ margin: "0 0 8px", fontSize: "0.85rem" }}>
            Każda kropka to {size} kolejnych sprawdzonych lub pominiętych pytań
            {filter === "all" ? " (wszystkie testy, oba typy)" : ` (tylko ${filter === "single" ? "jednokrotny" : "wielokrotny"} wybór${st ? `, etap ${STAGE_LABEL[st]}` : ""})`}. W wielokrotnym
            wyborze dokładność pytania to punkty / 2 (4 trafne pola – 100%, 3 trafne – 50%, mniej – 0%). Pusta kropka – blok jeszcze niepełny.
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
