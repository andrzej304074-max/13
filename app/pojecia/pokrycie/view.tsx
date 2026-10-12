"use client";

import { useEffect, useMemo, useState } from "react";
import { Donut, StackBars } from "@/app/components/stack-bars";
import { ToTop } from "@/app/components/to-top";
import { fmtPct } from "@/lib/client";
import { DEFAULT_FILTER, ROMAN, coverage, filterFromParams, filterToParams, type ItemMeta, type OweFilter, type OweRec, type RepeatWindow } from "@/lib/owe-stats";
import { OweFilterFields } from "../filters";
import { PojeciaTabs } from "../tabs";

interface Data {
  recs: OweRec[];
  meta: Record<string, ItemMeta>;
  topics: { id: string; title: string; emoji: string }[];
  kinds: { id: string; title: string }[];
}

const WINDOWS: { id: RepeatWindow; label: string }[] = [
  { id: "all", label: "wszystkie wcześniejsze (od XXI)" },
  { id: 5, label: "ostatnie 5 edycji" },
  { id: 3, label: "ostatnie 3 edycje" },
];
const LIMIT = 40;

export function CoverageView({ data }: { data: Data }) {
  const [f, setF] = useState<OweFilter | null>(null);
  const [win, setWin] = useState<RepeatWindow>("all");
  const [more, setMore] = useState({ rep: false, fresh: false });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const o = p.get("okno");
    setWin(o === "3" ? 3 : o === "5" ? 5 : "all");
    // domyślnie ostatnia edycja na tle historii – wykres pokazuje jednak wszystkie edycje z zakresu
    setF(filterFromParams(p));
  }, []);
  useEffect(() => {
    if (!f) return;
    const p = new URLSearchParams(filterToParams(f));
    if (win !== "all") p.set("okno", String(win));
    window.history.replaceState(null, "", `/pojecia/pokrycie${p.size ? `?${p}` : ""}`);
  }, [f, win]);

  const topicName = useMemo(() => Object.fromEntries(data.topics.map((t) => [t.id, `${t.emoji} ${t.title.replace(/^Temat przewodni: /, "")}`])), [data.topics]);
  const cov = useMemo(() => (f ? coverage(data.recs, f, data.meta, win) : null), [f, win, data]);
  // wykres i tabela zawsze dla wszystkich edycji – wybrany zakres jest podświetlony
  const covAll = useMemo(() => (f ? coverage(data.recs, { ...f, edFrom: 21, edTo: 39 }, data.meta, win) : null), [f, win, data]);
  if (!f || !cov || !covAll) return <p className="muted">Ładowanie…</p>;
  const set = (o: Partial<OweFilter>) => setF({ ...f, ...o });
  const t = cov.total;
  const one = f.edFrom === f.edTo;
  const title = one ? `${ROMAN[f.edFrom]} OWE` : `${ROMAN[f.edFrom]}–${ROMAN[f.edTo]} OWE`;

  return (
    <div className="stack">
      <PojeciaTabs active="pokrycie" />
      <h1>Pokrycie olimpiad</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Jaka część pojęć danej olimpiady to <strong>powtórki</strong> – pojęcia, o które pytano już we wcześniejszych edycjach (od XXI OWE) –
        a jaka to pojęcia <strong>nowe</strong>. Kliknij słupek, by wybrać jedną edycję (ponowne kliknięcie wraca do wszystkich). XXI OWE to początek danych, więc wszystkie jej pojęcia liczą się jako nowe.
      </p>

      <div className="card stack filters-card">
        <OweFilterFields f={f} set={set} topics={data.topics.map((x) => ({ id: x.id, name: topicName[x.id] }))} kinds={data.kinds}>
          <label className="filters">Powtórka, gdy pytano w
            <select className="select" value={String(win)} onChange={(e) => setWin(e.target.value === "all" ? "all" : (Number(e.target.value) as 3 | 5))}>
              {WINDOWS.map((w) => <option key={w.id} value={String(w.id)}>{w.label}</option>)}
            </select>
          </label>
        </OweFilterFields>
        <div className="row">
          <span className="spacer" />
          {(filterToParams(f) || win !== "all") && <button className="btn small secondary" onClick={() => { setF(DEFAULT_FILTER); setWin("all"); }}>Wyczyść filtry</button>}
        </div>
      </div>

      <h2>{title}: powtórki i nowe pojęcia</h2>
      <div className="card stack" data-testid="cov-summary">
        <div className="cov-summary">
          <Donut a={t.repeat} b={t.fresh} center={fmtPct(t.pct)} ariaLabel={`Powtórki ${fmtPct(t.pct)} pojęć`} />
          <div className="stack" style={{ marginTop: 0 }}>
            <div className="legend"><span><i className="a" />powtórki</span><span><i className="b" />nowe</span></div>
            <div><strong data-testid="cov-repeat">{t.repeat}</strong> powtórek i <strong data-testid="cov-fresh">{t.fresh}</strong> nowych pojęć {one ? "" : "(suma po edycjach)"}</div>
            <div className="muted">Pytania w całości o powtarzane pojęcia: <strong>{t.qRepeat}</strong> z {t.questions} ({fmtPct(t.questions ? Math.round((t.qRepeat / t.questions) * 1000) / 10 : 0)})</div>
          </div>
        </div>
      </div>

      <h2>Edycja po edycji</h2>
      <div className="card stack" data-testid="cov-chart">
        <div className="legend"><span><i className="a" />powtórki</span><span><i className="b" />nowe</span></div>
        <StackBars
          ariaLabel="Odsetek powtórek pojęć w kolejnych edycjach"
          bars={covAll.rows.map((r) => ({ label: ROMAN[r.ed], a: r.repeat, b: r.fresh, tip: `${ROMAN[r.ed]} OWE: ${r.repeat} powtórek (${fmtPct(r.pct)}), ${r.fresh} nowych z ${r.items} pojęć` }))}
          picked={(i) => covAll.rows[i].ed >= f.edFrom && covAll.rows[i].ed <= f.edTo}
          onPick={(i) => { const ed = covAll.rows[i].ed; set(f.edFrom === ed && f.edTo === ed ? { edFrom: 21, edTo: 39 } : { edFrom: ed, edTo: ed }); }}
        />
        <div className="table-wrap">
          <table className="stat-table" data-testid="cov-table">
            <thead><tr><th>Edycja</th><th className="num">Pojęć</th><th className="num">Powtórki</th><th className="num">Nowe</th><th className="num">% powtórek</th></tr></thead>
            <tbody>
              {covAll.rows.map((r) => (
                <tr key={r.ed} className={r.ed >= f.edFrom && r.ed <= f.edTo ? "" : "muted"}><td>{ROMAN[r.ed]} OWE</td><td className="num">{r.items}</td><td className="num">{r.repeat}</td><td className="num">{r.fresh}</td><td className="num"><strong>{fmtPct(r.pct)}</strong></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2>Najczęściej powtarzane pojęcia</h2>
      <div className="card table-wrap">
        <table className="stat-table">
          <thead><tr><th>Pojęcie</th>{!f.topic && <th>Dział</th>}<th className="num">Wcześniejszych edycji</th></tr></thead>
          <tbody>
            {cov.repeated.slice(0, more.rep ? undefined : LIMIT).map((r) => (
              <tr key={r.id}>
                <td>{data.meta[r.id]?.title}<div className="muted q-meta">{r.editions.map((e) => ROMAN[e]).join(", ")}</div></td>
                {!f.topic && <td className="muted">{topicName[data.meta[r.id]?.topic]}</td>}
                <td className="num"><strong>{r.earlier}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
        {cov.repeated.length === 0 && <p className="muted">Brak powtórek.</p>}
        {!more.rep && cov.repeated.length > LIMIT && <button className="btn small secondary" style={{ marginTop: 10 }} onClick={() => setMore({ ...more, rep: true })}>Pokaż wszystkie ({cov.repeated.length})</button>}
      </div>

      <h2>Nowe pojęcia (pierwszy raz w danych)</h2>
      <div className="card table-wrap">
        <table className="stat-table">
          <thead><tr><th>Pojęcie</th>{!f.topic && <th>Dział</th>}<th>Edycja</th></tr></thead>
          <tbody>
            {cov.fresh.slice(0, more.fresh ? undefined : LIMIT).map((r) => (
              <tr key={r.id}>
                <td>{data.meta[r.id]?.title}</td>
                {!f.topic && <td className="muted">{topicName[data.meta[r.id]?.topic]}</td>}
                <td>{ROMAN[r.ed]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {cov.fresh.length === 0 && <p className="muted">Brak nowych pojęć.</p>}
        {!more.fresh && cov.fresh.length > LIMIT && <button className="btn small secondary" style={{ marginTop: 10 }} onClick={() => setMore({ ...more, fresh: true })}>Pokaż wszystkie ({cov.fresh.length})</button>}
      </div>
      <ToTop />
    </div>
  );
}
