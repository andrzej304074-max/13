"use client";

import { useEffect, useState } from "react";
import { PreviewBanner } from "@/app/components/preview-banner";
import { LoadError } from "@/app/components/load-error";
import { Why } from "@/app/components/why";
import { api, fmtPct, viewedUser, withUser } from "@/lib/client";
import { usePrefSync } from "@/lib/prefs-client";
import type { Ranking, WorldStats } from "@/lib/world";
import {
  isMetric, isPeriod, isWorldSource, METRIC_LABEL, metricHasSource, MIN_USERS, PERIOD_LABEL, SOURCE_LABEL,
  WORLD_METRICS, WORLD_PERIODS, WORLD_SOURCES, type WorldMetric, type WorldPeriod, type WorldSource,
} from "@/lib/world-core";

const UNIT: Record<WorldMetric, (v: number) => string> = {
  xp: (v) => `${v.toLocaleString("pl-PL")} XP`,
  skutecznosc: (v) => fmtPct(v),
  aktywnosc: (v) => `${v.toLocaleString("pl-PL")}`,
  seria: (v) => `${v} ${v === 1 ? "dzień" : "dni"}`,
};
const METRIC_HINT: Record<WorldMetric, string> = {
  xp: "XP zdobyte w wybranym okresie (wspólne XP celu dziennego).",
  skutecznosc: "Odsetek poprawnych odpowiedzi – liczony od 10 odpowiedzi w okresie (zadania i eseje: średni wynik punktowy).",
  aktywnosc: "Liczba odpowiedzi w testach i kursie, ocen fiszek, podejść do zadań i esejów.",
  seria: "Bieżąca seria dni z osiągniętym celem dziennym.",
};

export function WorldView() {
  const [m, setM] = useState<WorldMetric>("xp");
  const [src, setSrc] = useState<WorldSource>("lacznie");
  const [p, setP] = useState<WorldPeriod>("30d");
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<WorldStats | null>(null);
  const [rank, setRank] = useState<Ranking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const a = q.get("miara"), b = q.get("zrodlo"), c = q.get("okres");
    if (isMetric(a)) setM(a);
    if (isWorldSource(b)) setSrc(b);
    if (isPeriod(c)) setP(c);
    setReady(true);
    api<Ranking>(withUser("/api/ranking")).then(setRank).catch(() => {});
  }, []);
  const [explicit] = useState(() => typeof window !== "undefined" && /[?&](miara|zrodlo|okres)=/.test(window.location.search));
  const qs = new URLSearchParams({ miara: m, zrodlo: src, okres: p }).toString();
  usePrefSync("stats-swiat", ready ? qs : null, (v) => {
    const q = new URLSearchParams(v);
    const a = q.get("miara"), b = q.get("zrodlo"), c = q.get("okres");
    if (isMetric(a)) setM(a);
    if (isWorldSource(b)) setSrc(b);
    if (isPeriod(c)) setP(c);
  }, { load: explicit, save: !!viewedUser() });
  useEffect(() => {
    if (!ready) return;
    const u = viewedUser();
    window.history.replaceState(null, "", `/stats/swiat?${qs}${u ? `&user=${u}` : ""}`);
    let live = true;
    setData(null);
    api<WorldStats>(withUser(`/api/swiat?${qs}`)).then((d) => { if (live) setData(d); }).catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [qs, ready]);

  if (error) return <LoadError message={error} />;
  const fmt = UNIT[m];
  const maxBin = data?.dist ? Math.max(1, ...data.dist.bins.map((b) => b.n)) : 1;

  return (
    <div className="stack wide">
      <PreviewBanner />
      <header className="page-head"><h1>Na tle innych</h1></header>
      <p className="muted" style={{ marginTop: -8 }}>Twój wynik na tle wszystkich uczących się – anonimowo. Wyniki innych widać tylko jako rozkład,
        bez nazw; ranking z pseudonimami – tylko dla osób, które same się do niego zapiszą.</p>

      <div className="card stack filters-card">
        <div className="seg" role="group" aria-label="Miara" data-testid="world-metric" style={{ flexWrap: "wrap" }}>
          {WORLD_METRICS.map((x) => <button key={x} className={x === m ? "active" : ""} aria-pressed={x === m} onClick={() => setM(x)} data-metric={x}>{METRIC_LABEL[x]}</button>)}
        </div>
        {metricHasSource(m) && (
          <div className="filter-grid">
            <label className="filters">Źródło
              <select className="select" value={src} onChange={(e) => setSrc(e.target.value as WorldSource)} data-testid="world-source">
                {WORLD_SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
              </select>
            </label>
            <div className="filters">Okres
              <div className="seg" role="group" aria-label="Okres">
                {WORLD_PERIODS.map((x) => <button key={x} className={x === p ? "active" : ""} aria-pressed={x === p} onClick={() => setP(x)} data-period={x}>{PERIOD_LABEL[x]}</button>)}
              </div>
            </div>
          </div>
        )}
        <p className="muted small" style={{ margin: 0 }}>{METRIC_HINT[m]}</p>
      </div>

      {!data ? <div className="skeleton" style={{ height: 220 }} /> : (
        <div className="card stack" data-testid="world-card">
          <div className="world-head">
            <div>
              <div className="muted small">Twój wynik</div>
              <div className="world-me" data-testid="world-me">{data.me === null ? "–" : fmt(data.me)}</div>
            </div>
            <div className="world-better" data-testid="world-better">
              {data.me === null ? <span className="muted">Brak Twojej aktywności w tej mierze i okresie.</span>
                : data.better === null ? <span className="muted">Za mało osób, by pokazać porównanie (potrzeba co najmniej {MIN_USERS}).</span>
                : <><strong>Lepiej niż {data.better}%</strong> <span className="muted">pozostałych osób</span></>}
            </div>
          </div>
          {data.dist ? (
            <>
              <div className="world-hist" role="img" aria-label={`Rozkład wyników ${data.n} osób`} data-testid="world-hist">
                {data.dist.bins.map((b, i) => (
                  <div key={i} className={`world-bin${b.me ? " me" : ""}`} title={`${fmt(b.from)} – ${fmt(b.to)}: ${b.n} ${b.n === 1 ? "osoba" : "osób"}${b.me ? " (Ty)" : ""}`}>
                    <div className="world-bar"><div style={{ height: `${(b.n / maxBin) * 100}%` }} /></div>
                    <small>{b.from.toLocaleString("pl-PL")}</small>
                  </div>
                ))}
              </div>
              <p className="muted small" style={{ margin: 0 }}>Osób: {data.n} · średnia {fmt(data.dist.mean)} · mediana {fmt(data.dist.median)} · Twój przedział jest wyróżniony.</p>
            </>
          ) : <p className="muted" style={{ margin: 0 }}>Osób z aktywnością: {data.n}.</p>}
          <Why>
            Liczymy wszystkie aktywne konta, które w wybranym okresie miały aktywność w tej mierze (osoby bez aktywności nie zaniżają
            średniej). „Lepiej niż X%” – jaki odsetek pozostałych osób ma wynik niższy niż Ty. Rozkład pokazujemy dopiero od {MIN_USERS} osób,
            żeby nie dało się odgadnąć cudzych wyników. Dane odświeżają się co kilka minut.
          </Why>
        </div>
      )}

      <RankingCard rank={rank} setRank={setRank} />
    </div>
  );
}

function RankingCard({ rank, setRank }: { rank: Ranking | null; setRank: (r: Ranking) => void }) {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (rank?.me.name) setName(rank.me.name); }, [rank?.me.name]);
  if (!rank) return null;
  const preview = !!viewedUser();
  async function save(on: boolean) {
    setBusy(true);
    setMsg(null);
    try { setRank(await api<Ranking>("/api/ranking", { method: "PUT", body: JSON.stringify({ on, name }) })); }
    catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="card stack" data-testid="ranking">
      <h2 style={{ margin: 0 }}>🏆 Ranking tygodnia (XP)</h2>
      <p className="muted small" style={{ margin: 0 }}>Od poniedziałku {rank.week}. Tylko osoby zapisane pod pseudonimem – bez e-maili i nazw kont.</p>
      {rank.top.length === 0 ? <p className="muted">Nikt jeszcze się nie zapisał.</p> : (
        <ol className="rank-list">
          {rank.top.map((r) => (
            <li key={r.name} className={r.me ? "me" : ""}><span className="rank-place">{r.place}.</span> <span className="rank-name">{r.name}</span><span className="rank-xp">{r.xp} XP</span></li>
          ))}
        </ol>
      )}
      {rank.me.on && rank.me.place && <p style={{ margin: 0 }}>Twoje miejsce: <strong>{rank.me.place}</strong> · {rank.me.xp} XP w tym tygodniu</p>}
      {!preview && (
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <input className="select" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pseudonim (3–20 znaków)" maxLength={20}
            aria-label="Pseudonim w rankingu" data-testid="rank-name" style={{ maxWidth: 240 }} />
          <button className="btn" disabled={busy} onClick={() => save(true)} data-testid="rank-join">{rank.me.on ? "Zmień pseudonim" : "Zapisz się do rankingu"}</button>
          {rank.me.on && <button className="btn secondary" disabled={busy} onClick={() => save(false)} data-testid="rank-leave">Wypisz się</button>}
        </div>
      )}
      {msg && <p className="error" style={{ margin: 0 }}>{msg}</p>}
    </div>
  );
}
