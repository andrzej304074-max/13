"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrefSync } from "@/lib/prefs-client";
import { Donut, StackBars } from "@/app/components/stack-bars";
import { fmtPct } from "@/lib/client";
import { useData } from "@/lib/data-client";
import {
  DEFAULT_FILTER, DEFAULT_REPEAT, ROMAN, STAGES, coverage, filterFromParams, filterRecs, filterToParams, stageMatrix, themeShares,
  type ItemMeta, type MatrixCol, type OweFilter, type OweRec, type RepeatOpts, type RepeatWindow, type Stage,
} from "@/lib/owe-stats";
import { OweFilterFields } from "../filters";
import { ThemeShareCard } from "../theme-card";
import { PageSkeleton } from "../table";
import { LoadError } from "@/app/components/load-error";

interface Data {
  recs: OweRec[];
  meta: Record<string, ItemMeta>;
  topics: { id: string; title: string; emoji: string }[];
  kinds: { id: string; title: string }[];
}
type Measure = "items" | "questions";

const WINDOWS: { id: RepeatWindow; label: string }[] = [
  { id: "all", label: "wszystkie wcześniejsze (od XXI)" },
  { id: 5, label: "ostatnie 5 edycji" },
  { id: 3, label: "ostatnie 3 edycje" },
];
const STAGE_NAME: Record<Stage, string> = { s: "szkolny", o: "okręgowy", c: "centralny" };
const COL_NAME: Record<MatrixCol, string> = { s: "ze szkolnych", o: "z okręgowych", c: "z centralnych", all: "ze wszystkich" };
const COL_SHORT: Record<MatrixCol, string> = { s: "← szk.", o: "← okr.", c: "← centr.", all: "← wsz." };
const STAGE_SHORT: Record<Stage, string> = { s: "szk.", o: "okr.", c: "centr." };
const LIMIT = 40;
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const stagesLabel = (st: Stage[]) => (st.length === 3 ? "wszystkich etapów" : st.map((s) => STAGE_NAME[s]).join(" + "));

function repeatFromParams(p: URLSearchParams): RepeatOpts {
  const o = p.get("okno");
  const z = (p.get("zetap") ?? "").split("").filter((s): s is Stage => s === "s" || s === "o" || s === "c");
  return { window: o === "3" ? 3 : o === "5" ? 5 : "all", from: z.length ? (["s", "o", "c"] as Stage[]).filter((s) => z.includes(s)) : ["s", "o", "c"], sameEdition: p.get("ta") === "1" };
}

export function CoverageLoader() {
  const { data, error } = useData<Data>("/api/dane/owe-stats");
  if (error) return <LoadError message={error} />;
  return data ? <CoverageView data={data} /> : <PageSkeleton title="Pokrycie olimpiad" />;
}

export function CoverageView({ data }: { data: Data }) {
  const [f, setF] = useState<OweFilter | null>(null);
  const [rep, setRep] = useState<RepeatOpts>(DEFAULT_REPEAT);
  const [measure, setMeasure] = useState<Measure>("items");
  const [more, setMore] = useState({ rep: false, fresh: false });
  // filtry rozwinięte na komputerze, zwinięte na telefonie (wynik widać od razu)
  const [filtersOpen, setFiltersOpen] = useState(true);
  useEffect(() => setFiltersOpen(window.matchMedia("(min-width: 641px)").matches), []);

  const [explicit] = useState(() => typeof window !== "undefined" && window.location.search.length > 1);
  const fromQs = (qs: string) => {
    const p = new URLSearchParams(qs);
    setRep(repeatFromParams(p));
    setMeasure(p.get("miara") === "pytania" ? "questions" : "items");
    setF(filterFromParams(p));
  };
  useEffect(() => fromQs(window.location.search), []);
  const qs = useMemo(() => {
    if (!f) return null;
    const p = new URLSearchParams(filterToParams(f));
    if (rep.window !== "all") p.set("okno", String(rep.window));
    if (rep.from.length < 3) p.set("zetap", rep.from.join(""));
    if (rep.sameEdition) p.set("ta", "1");
    if (measure === "questions") p.set("miara", "pytania");
    return p.toString();
  }, [f, rep, measure]);
  useEffect(() => {
    if (qs !== null) window.history.replaceState(null, "", `/pojecia/pokrycie${qs ? `?${qs}` : ""}`);
  }, [qs]);
  usePrefSync("pojecia-pokrycie", qs, fromQs, { load: explicit });

  const topicName = useMemo(() => Object.fromEntries(data.topics.map((t) => [t.id, `${t.emoji} ${t.title.replace(/^Temat przewodni: /, "")}`])), [data.topics]);
  const cov = useMemo(() => (f ? coverage(data.recs, f, data.meta, rep) : null), [f, rep, data]);
  // wykres i tabela zawsze dla wszystkich edycji – wybrany zakres jest podświetlony
  const covAll = useMemo(() => (f ? coverage(data.recs, { ...f, edFrom: 21, edTo: 39 }, data.meta, rep) : null), [f, rep, data]);
  const matrix = useMemo(() => (f ? stageMatrix(data.recs, f, data.meta, rep) : null), [f, rep, data]);
  // udział pytań z hasła przewodniego (wszystkie edycje, bez filtra hasła)
  const shares = useMemo(() => (f ? themeShares(filterRecs(data.recs, { ...f, theme: "all", edFrom: 21, edTo: 39 }, data.meta)) : null), [f, data]);
  if (!f || !cov || !covAll || !matrix || !shares) return <PageSkeleton title="Pokrycie olimpiad" />;

  const set = (o: Partial<OweFilter>) => setF({ ...f, ...o });
  const setR = (o: Partial<RepeatOpts>) => setRep({ ...rep, ...o });
  const toggleFrom = (s: Stage) => {
    const st = rep.from.includes(s) ? rep.from.filter((x) => x !== s) : [...rep.from, s];
    if (st.length) setR({ from: (["s", "o", "c"] as Stage[]).filter((x) => st.includes(x)) });
  };
  const t = cov.total;
  const Q = measure === "questions";
  const [a, b] = Q ? [t.qRepeat, t.questions - t.qRepeat] : [t.repeat, t.fresh];
  const share = Q ? pctOf(t.qRepeat, t.questions) : t.pct;
  const range = f.edFrom === f.edTo ? `${ROMAN[f.edFrom]} OWE` : `${ROMAN[f.edFrom]}–${ROMAN[f.edTo]} OWE`;
  const isDefault = !filterToParams(f) && rep.window === "all" && rep.from.length === 3 && !rep.sameEdition;
  const what = Q ? "pytań w całości o powtarzane pojęcia" : "pojęć to powtórki";

  return (
    <div className="stack wide">
      <header className="page-head">
        <h1>Pokrycie olimpiad</h1>
        <p className="muted">
          Jaka część pytań lub pojęć olimpiady powtarza się z wcześniejszych lat. Wybierz osobno, <strong>które pytania badasz</strong> (np. etap szkolny)
          i <strong>z czego liczysz powtórki</strong> (np. etapy szkolne i okręgowe wszystkich wcześniejszych edycji). XXI OWE to początek danych.
          Filtr hasła przewodniego zawęża badane pytania (np. tylko pytania o hasło swojej edycji); powtórki liczą się ze wszystkich wcześniejszych pytań.
        </p>
      </header>

      <details className="card filters-card" open={filtersOpen} onToggle={(e) => setFiltersOpen((e.target as HTMLDetailsElement).open)}>
        <summary>Filtry · etap {stagesLabel(f.stages)} ← {stagesLabel(rep.from)}</summary>
        <div className="filter-cols">
          <div className="stack">
            <div className="filter-group">Badane pytania</div>
            <OweFilterFields f={f} set={set} stageLabel="Etap badanych pytań" topics={data.topics.map((x) => ({ id: x.id, name: topicName[x.id] }))} kinds={data.kinds} />
          </div>
          <div className="stack">
            <div className="filter-group">Powtórki liczone z</div>
            <div>
              <div className="filter-label">Etapów</div>
              <div className="chips" data-testid="from-stages">
                {STAGES.map((s) => (
                  <button key={s.id} className={`chip ${rep.from.includes(s.id) ? "selected" : ""}`} onClick={() => toggleFrom(s.id)} aria-pressed={rep.from.includes(s.id)}>
                    {rep.from.includes(s.id) ? "✓ " : ""}{s.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="filters">Edycji
              <select className="select" value={String(rep.window)} onChange={(e) => setR({ window: e.target.value === "all" ? "all" : (Number(e.target.value) as 3 | 5) })}>
                {WINDOWS.map((w) => <option key={w.id} value={String(w.id)}>{w.label}</option>)}
              </select>
            </label>
            <label className="check"><input type="checkbox" checked={rep.sameEdition} onChange={(e) => setR({ sameEdition: e.target.checked })} />
              także wcześniejsze etapy tej samej edycji (szkolny → okręgowy → centralny)</label>
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <div className="seg" role="group" aria-label="Miara">
            <button className={!Q ? "active" : ""} aria-pressed={!Q} onClick={() => setMeasure("items")}>Pojęcia</button>
            <button className={Q ? "active" : ""} aria-pressed={Q} onClick={() => setMeasure("questions")}>Pytania</button>
          </div>
          <span className="spacer" />
          {!isDefault && <button className="btn small secondary" onClick={() => { setF(DEFAULT_FILTER); setRep(DEFAULT_REPEAT); }}>Wyczyść filtry</button>}
        </div>
      </details>

      <section className="card stack" data-testid="cov-summary">
        <h2 className="card-title">{range}: etap {stagesLabel(f.stages)} – powtórki z {stagesLabel(rep.from)}</h2>
        <div className="cov-summary">
          <Donut a={a} b={b} center={fmtPct(share)} ariaLabel={`${fmtPct(share)} ${what}`} />
          <div className="stack" style={{ marginTop: 0 }}>
            <div className="legend"><span><i className="a" />powtórki</span><span><i className="b" />nowe</span></div>
            <div><strong data-testid="cov-share">{fmtPct(share)}</strong> {what}</div>
            <div className="muted">
              Pojęcia: <strong data-testid="cov-repeat">{t.repeat}</strong> powtórek i <strong data-testid="cov-fresh">{t.fresh}</strong> nowych{f.edFrom !== f.edTo ? " (suma po edycjach)" : ""} ·
              Pytania: <strong data-testid="cov-qrepeat">{t.qRepeat}</strong> z {t.questions} w całości o powtórki
            </div>
          </div>
        </div>
      </section>

      <section className="card stack" data-testid="cov-matrix">
        <h2 className="card-title">Wszystkie pary etapów ({range})</h2>
        <p className="muted small">% {Q ? "pytań w całości powtórkowych" : "pojęć-powtórek"}: wiersz – etap badanych pytań, kolumna – z jakich etapów wcześniejszych {rep.sameEdition ? "edycji i etapów tej samej edycji" : "edycji"}. Kliknij komórkę, aby ustawić te filtry.</p>
        <div className="table-wrap">
          <table className="stat-table matrix">
            <thead><tr><th><span className="lbl-long">Pytania z etapu</span><span className="lbl-short">Etap</span></th>{(["s", "o", "c", "all"] as MatrixCol[]).map((c) => <th key={c} className="num"><span className="lbl-long">{COL_NAME[c]}</span><span className="lbl-short">{COL_SHORT[c]}</span></th>)}</tr></thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.st}>
                  <th scope="row"><span className="lbl-long">{STAGE_NAME[row.st]}</span><span className="lbl-short">{STAGE_SHORT[row.st]}</span></th>
                  {row.cells.map((c) => {
                    const on = f.stages.length === 1 && f.stages[0] === row.st && (c.col === "all" ? rep.from.length === 3 : rep.from.length === 1 && rep.from[0] === c.col);
                    return (
                      <td key={c.col} className={`num cell ${on ? "on" : ""}`}>
                        <button onClick={() => { set({ stages: [row.st] }); setR({ from: c.col === "all" ? ["s", "o", "c"] : [c.col] }); }} data-testid={`m-${row.st}-${c.col}`}>
                          <strong>{fmtPct(Q ? c.qPct : c.pct)}</strong>
                          <small>{Q ? `${c.qRepeat}/${c.questions}` : `${c.repeat}/${c.items}`}</small>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card stack" data-testid="cov-chart">
        <h2 className="card-title">Edycja po edycji</h2>
        <div className="legend"><span><i className="a" />powtórki</span><span><i className="b" />nowe</span><span className="muted">· kliknij słupek, aby wybrać edycję</span></div>
        <StackBars
          ariaLabel={`Odsetek powtórek (${Q ? "pytania" : "pojęcia"}) w kolejnych edycjach`}
          bars={covAll.rows.map((r) => Q
            ? { label: ROMAN[r.ed], a: r.qRepeat, b: r.questions - r.qRepeat, tip: `${ROMAN[r.ed]} OWE: ${r.qRepeat} z ${r.questions} pytań w całości o powtórki (${fmtPct(pctOf(r.qRepeat, r.questions))})` }
            : { label: ROMAN[r.ed], a: r.repeat, b: r.fresh, tip: `${ROMAN[r.ed]} OWE: ${r.repeat} powtórek (${fmtPct(r.pct)}), ${r.fresh} nowych z ${r.items} pojęć` })}
          picked={(i) => covAll.rows[i].ed >= f.edFrom && covAll.rows[i].ed <= f.edTo}
          onPick={(i) => { const ed = covAll.rows[i].ed; set(f.edFrom === ed && f.edTo === ed ? { edFrom: 21, edTo: 39 } : { edFrom: ed, edTo: ed }); }}
        />
        <div className="table-wrap">
          <table className="stat-table" data-testid="cov-table">
            <thead><tr><th>Edycja</th><th className="num">Pojęcia: powt./wsz.</th><th className="num">%</th><th className="num">Pytania: powt./wsz.</th><th className="num">%</th></tr></thead>
            <tbody>
              {covAll.rows.map((r) => (
                <tr key={r.ed} className={r.ed >= f.edFrom && r.ed <= f.edTo ? "" : "muted"}>
                  <td>{ROMAN[r.ed]} OWE</td>
                  <td className="num">{r.repeat}/{r.items}</td><td className="num">{!Q ? <strong>{fmtPct(r.pct)}</strong> : fmtPct(r.pct)}</td>
                  <td className="num">{r.qRepeat}/{r.questions}</td><td className="num">{Q ? <strong>{fmtPct(pctOf(r.qRepeat, r.questions))}</strong> : fmtPct(pctOf(r.qRepeat, r.questions))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stack" style={{ marginTop: 0 }}>
        <h2 className="card-title">Pytania z hasła przewodniego edycji</h2>
        <ThemeShareCard shares={shares} edFrom={f.edFrom} edTo={f.edTo}
          pick={(ed) => set(f.edFrom === ed && f.edTo === ed ? { edFrom: 21, edTo: 39 } : { edFrom: ed, edTo: ed })} />
      </section>

      <div className="two-col">
        <section className="card table-wrap">
          <h2 className="card-title">Najczęściej powtarzane pojęcia</h2>
          <table className="stat-table">
            <thead><tr><th>Pojęcie</th><th className="num">Wcześn. edycji</th></tr></thead>
            <tbody>
              {cov.repeated.slice(0, more.rep ? undefined : LIMIT).map((r) => (
                <tr key={r.id}>
                  <td>{data.meta[r.id]?.title}<div className="muted q-meta">{!f.topic && `${topicName[data.meta[r.id]?.topic]} · `}{r.editions.map((e) => ROMAN[e]).join(", ")}</div></td>
                  <td className="num"><strong>{r.earlier}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
          {cov.repeated.length === 0 && <p className="muted">Brak powtórek.</p>}
          {!more.rep && cov.repeated.length > LIMIT && <button className="btn small secondary" style={{ marginTop: 10 }} onClick={() => setMore({ ...more, rep: true })}>Pokaż wszystkie ({cov.repeated.length})</button>}
        </section>
        <section className="card table-wrap">
          <h2 className="card-title">Nowe pojęcia</h2>
          <table className="stat-table">
            <thead><tr><th>Pojęcie</th><th>Edycja</th></tr></thead>
            <tbody>
              {cov.fresh.slice(0, more.fresh ? undefined : LIMIT).map((r) => (
                <tr key={r.id + r.ed}>
                  <td>{data.meta[r.id]?.title}{!f.topic && <div className="muted q-meta">{topicName[data.meta[r.id]?.topic]}</div>}</td>
                  <td>{ROMAN[r.ed]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cov.fresh.length === 0 && <p className="muted">Brak nowych pojęć.</p>}
          {!more.fresh && cov.fresh.length > LIMIT && <button className="btn small secondary" style={{ marginTop: 10 }} onClick={() => setMore({ ...more, fresh: true })}>Pokaż wszystkie ({cov.fresh.length})</button>}
        </section>
      </div>
    </div>
  );
}
