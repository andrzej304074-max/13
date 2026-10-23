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
import { usePrefSync } from "@/lib/prefs-client";
import { viewedUser } from "@/lib/client";
import { Why } from "@/app/components/why";

const STAGE_LABEL: Record<Stage, string> = { s: "szkolny", o: "okręgowy" };
const STAGE_GEN: Record<Stage, string> = { s: "szkolnego", o: "okręgowego" };

type Bank = "owe" | "ai" | "slownik" | "mix";
const BANKS: { value: Bank; label: string }[] = [
  { value: "owe", label: "Archiwum OWE" },
  { value: "ai", label: "Pytania AI" },
  { value: "slownik", label: "Słownik" },
  { value: "mix", label: "Wszystkie pytania" },
];
const isBank = (v: string | null): v is Bank => v === "owe" || v === "ai" || v === "slownik" || v === "mix";
const BANK_NOTE: Record<Bank, string> = {
  owe: "Testy z zakładki Olimpiada – prawdziwe pytania z archiwum OWE.",
  ai: "Testy z samych pytań AI (sprawdzonych) – rozwiązywanych w zakładce „Wszystkie pytania” ze źródłem „Pytania AI”.",
  slownik: "Testy z zakładki Słownik – pytania o pojęcia, osoby, daty i wzory, w tym o haśle XL.",
  mix: "Testy z zakładki „Wszystkie pytania” z Archiwum OWE lub Słownika (także mieszane z Pytaniami AI; testy z samych pytań AI – w „Pytaniach AI”). Wynik każdego źródła osobno – w karcie „Według źródła pytań”.",
};
const SOURCE_LABEL = { owe: "Archiwum OWE", ai: "Pytania AI", slownik: "Słownik" } as const;

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

  // filtry zapamiętane na koncie (klucz „stats”); źródło z adresu (?bank=… – link z podsumowania testu) ma pierwszeństwo,
  // pozostałe filtry (typ, etap, blok) i tak wczytujemy z konta
  const [urlBank] = useState(() => {
    if (typeof window === "undefined") return null;
    const b = new URLSearchParams(window.location.search).get("bank");
    return isBank(b) ? b : null;
  });
  useEffect(() => {
    setBank(urlBank ?? "owe");
    setBlockSize(DEFAULT_BLOCK_SIZE);
  }, [urlBank]);
  const prefValue = bank && blockSize ? new URLSearchParams({ bank, typ: filter, ...(stage ? { etap: stage } : {}), blok: String(blockSize) }).toString() : null;
  usePrefSync("stats", prefValue, (v) => {
    const p = new URLSearchParams(v);
    const b = p.get("bank"), t = p.get("typ"), e = p.get("etap"), n = Number(p.get("blok"));
    if (isBank(b) && !urlBank) setBank(b);
    if (t === "single" || t === "multi" || t === "all") setFilter(t);
    setStage(e === "s" || e === "o" ? e : null);
    if ((BLOCK_SIZES as readonly number[]).includes(n)) setBlockSize(n);
  }, { save: !!viewedUser() });

  useEffect(() => {
    if (blockSize === null || bank === null) return;
    const typeParam = filter === "all" ? "" : `&type=${filter}`;
    const stageParam = bank === "owe" && filter === "single" && stage ? `&stage=${stage}` : "";
    // filtry z konta mogą zmienić się zaraz po pierwszym pobraniu – starsza, wolniejsza odpowiedź nie nadpisuje nowszej
    let live = true;
    api<Stats>(withUser(`/api/stats?bank=${bank}&block=${blockSize}${typeParam}${stageParam}`))
      .then((s) => { if (live) setStats(s); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [blockSize, filter, bank, stage]);

  const chooseStage = (s: Stage | null) => setStage(s);
  function chooseBank(b: Bank) {
    setBank(b);
    try {
      // źródło zapamiętuje konto – bez ?bank= w adresie (przy odświeżeniu nie przesłania zapisanego wyboru)
      const q = new URLSearchParams(window.location.search);
      q.delete("bank");
      window.history.replaceState(null, "", `/stats${q.size ? `?${q}` : ""}`);
    } catch {}
  }
  const chooseFilter = (f: Filter) => setFilter(f);
  const chooseBlock = (n: number) => setBlockSize(n);

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
      <div className="seg" role="group" aria-label="Źródło pytań" data-testid="stats-bank" style={{ flexWrap: "wrap" }}>
        {BANKS.map((b) => (
          <button
            key={b.value}
            className={b.value === bank ? "active" : ""}
            aria-pressed={b.value === bank}
            onClick={() => chooseBank(b.value)}
            data-bank={b.value}
          >
            {b.label}
          </button>
        ))}
      </div>
      <p className="muted">{BANK_NOTE[bank ?? "owe"]} Procent poprawnych odpowiedzi z Twoich testów – w wielokrotnym wyborze zdobyte punkty
        z maks. 2 na pytanie (4 trafne pola A–D – 2 pkt, 3 trafne – 1 pkt, mniej – 0).</p>
      <div className="seg" role="group" aria-label="Typ pytań">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={f.value === filter ? "active" : ""}
            aria-pressed={f.value === filter}
            data-type={f.value}
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
      <Why>
        Liczymy tylko Twoje testy z wybranej zakładki: zakończone oraz rozpoczęte testy „bez limitu” z co najmniej jedną odpowiedzią.
        W testach 30/50 pytań liczą się wszystkie pytania testu (bez odpowiedzi – jak błędne), w trybie „bez limitu” – tylko sprawdzone
        lub pominięte. Sprawdzenie bez zaznaczenia odpowiedzi daje 0 pkt. „Poprawne” w jednokrotnym wyborze to pytania za 2 pkt.
      </Why>
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

      <div className="row" style={{ gap: 8 }}>
        <h2 style={{ margin: 0 }}>Według źródła pytań</h2>
        <span className="spacer" />
        <Link className="btn small secondary" href="/testy/wszystkie?bledy=1" data-testid="retry-mistakes">🔁 Powtórz moje błędy</Link>
      </div>
      <div className="stat-grid" data-testid="source-stats">
        {(["owe", "ai", "slownik"] as const).map((k) => {
          const src = stats.bySource[k];
          return (
            <div className="stat" key={k} data-source={k}>
              <div className="value">{src.answers ? fmtPct(src.percent) : "–"}</div>
              <div className="label">
                {SOURCE_LABEL[k]} · {src.answers} {src.answers === 1 ? "odpowiedź" : "odpowiedzi"}
                {src.answers > 0 && <> · jedn. {src.byType.single.answers ? fmtPct(src.byType.single.percent) : "–"}, wielokr. {src.byType.multi.answers ? fmtPct(src.byType.multi.percent) : "–"}</>}
              </div>
            </div>
          );
        })}
      </div>
      <Why>
        Wszystkie Twoje testy naraz – także z zakładki „Wszystkie pytania”, gdzie w jednym teście mieszają się źródła. Każde pytanie
        przypisujemy do źródła po jego pochodzeniu (Archiwum OWE, Pytania AI, Słownik). Liczymy sprawdzone i pominięte pytania:
        jednokrotny wybór – trafione albo nie, wielokrotny – punkty / 2. Działy, rodzaje pojęć (np. wzory) i hasło XL – w zakładce
        <Link href={`/stats/dzialy?bank=${bank === "slownik" ? "slownik" : "owe"}`}> Działy i pojęcia</Link>.
      </Why>

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
