"use client";

import { useEffect, useMemo, useState } from "react";
import { ToTop } from "@/app/components/to-top";
import { useData } from "@/lib/data-client";
import { PageSkeleton } from "../table";
import { api, fmtPct, LETTERS } from "@/lib/client";
import {
  DEFAULT_FILTER, ROMAN, STAGES, filterFromParams, filterRecs, filterToParams, itemCounts, topicShares, unitCounts,
  type ItemMeta, type OweFilter, type OweRec, type Stage,
} from "@/lib/owe-stats";

interface Data {
  recs: OweRec[];
  meta: Record<string, ItemMeta>;
  topics: { id: string; title: string; emoji: string }[];
  units: Record<string, { title: string; topic: string }>;
  kinds: { id: string; title: string }[];
}

type Q = { id: string; edition: string; question: string; options: string[]; correct: number[]; type: string };

const KIND_ONE: Record<string, string> = {
  pojecie: "pojęcie", wzor: "wzór", osoba: "osoba", instytucja: "instytucja", data: "data", przepis: "przepis",
};
const STEP = 50;

export function OweStatsView({ data }: { data: Data }) {
  const [f, setF] = useState<OweFilter | null>(null);
  const [unitLimit, setUnitLimit] = useState(15);
  const [itemLimit, setItemLimit] = useState(STEP);
  const [open, setOpen] = useState<string | null>(null);
  const [qs, setQs] = useState<Record<string, Q[] | string>>({});

  useEffect(() => setF(filterFromParams(new URLSearchParams(window.location.search))), []);
  useEffect(() => {
    if (!f) return;
    const p = filterToParams(f);
    window.history.replaceState(null, "", `/pojecia/statystyki${p ? `?${p}` : ""}`);
    setQs({});
    setOpen(null);
  }, [f]);

  const topicName = useMemo(() => Object.fromEntries(data.topics.map((t) => [t.id, `${t.emoji} ${t.title.replace(/^Temat przewodni: /, "")}`])), [data.topics]);
  const res = useMemo(() => {
    if (!f) return null;
    const recs = filterRecs(data.recs, f, data.meta);
    return {
      recs,
      topics: topicShares(recs, topicName, f.order),
      units: unitCounts(recs, f, data.units),
      items: itemCounts(recs, f, data.meta),
    };
  }, [f, data, topicName]);

  if (!f || !res) return <p className="muted">Ładowanie…</p>;
  const set = (o: Partial<OweFilter>) => {
    setF({ ...f, ...o });
    setItemLimit(STEP);
  };
  const toggleStage = (s: Stage) => {
    const st = f.stages.includes(s) ? f.stages.filter((x) => x !== s) : [...f.stages, s];
    if (st.length) set({ stages: STAGES.map((x) => x.id).filter((x) => st.includes(x)) });
  };
  const maxTopic = Math.max(1, ...res.topics.map((t) => t.n));
  const eds = Array.from({ length: 19 }, (_, i) => 21 + i);

  async function toggleItem(id: string) {
    if (open === id) return setOpen(null);
    setOpen(id);
    if (qs[id]) return;
    try {
      const list = await api<Q[]>(`/api/pojecia/pytania?item=${id}&${filterToParams({ ...f!, kind: null, topic: null })}`);
      setQs((m) => ({ ...m, [id]: list }));
    } catch (e) {
      setQs((m) => ({ ...m, [id]: e instanceof Error ? e.message : "Błąd" }));
    }
  }

  return (
    <div className="stack wide">
      <h1>Statystyki pytań OWE</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        O co pytano na XXI–XXXIX OWE: działy (procent pytań), zagadnienia i pojęcia (liczba pytań). Każde pytanie należy do jednego
        działu i zagadnienia; pojęcia to hasła, o które pytanie pyta (treść i poprawne odpowiedzi) – podobne pytania z różnych lat liczą się osobno.
      </p>

      <div className="card stack filters-card">
        <div className="filter-grid">
          <label className="filters">Typ pytań
            <select className="select" value={f.type} onChange={(e) => set({ type: e.target.value as OweFilter["type"] })}>
              <option value="all">wszystkie</option>
              <option value="single">jednokrotnego wyboru</option>
              <option value="multi">wielokrotnego wyboru</option>
            </select>
          </label>
          <label className="filters">Edycje od
            <select className="select" value={f.edFrom} onChange={(e) => set({ edFrom: Math.min(Number(e.target.value), f.edTo) })}>
              {eds.map((n) => <option key={n} value={n}>{ROMAN[n]} OWE</option>)}
            </select>
          </label>
          <label className="filters">do
            <select className="select" value={f.edTo} onChange={(e) => set({ edTo: Math.max(Number(e.target.value), f.edFrom) })}>
              {eds.map((n) => <option key={n} value={n}>{ROMAN[n]} OWE</option>)}
            </select>
          </label>
          <label className="filters">Dział (zagadnienia i pojęcia)
            <select className="select" value={f.topic ?? ""} onChange={(e) => set({ topic: e.target.value || null })}>
              <option value="">wszystkie</option>
              {data.topics.map((t) => <option key={t.id} value={t.id}>{topicName[t.id]}</option>)}
            </select>
          </label>
          <label className="filters">Rodzaj haseł
            <select className="select" value={f.kind ?? ""} onChange={(e) => set({ kind: e.target.value || null })}>
              <option value="">wszystkie</option>
              {data.kinds.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
            </select>
          </label>
          <label className="filters">Kolejność
            <select className="select" value={f.order} onChange={(e) => set({ order: e.target.value as OweFilter["order"] })}>
              <option value="desc">od największej liczby</option>
              <option value="asc">od najmniejszej liczby</option>
            </select>
          </label>
        </div>
        <div>
          <div className="filter-label">Etap</div>
          <div className="chips">
            {STAGES.map((s) => (
              <button key={s.id} className={`chip ${f.stages.includes(s.id) ? "selected" : ""}`} onClick={() => toggleStage(s.id)} aria-pressed={f.stages.includes(s.id)}>
                {f.stages.includes(s.id) ? "✓ " : ""}{s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <p className="muted" style={{ margin: 0 }} data-testid="owe-total">
            Pytań spełniających filtry: <strong>{res.recs.length}</strong> z {data.recs.length}
          </p>
          <span className="spacer" />
          {filterToParams(f) && <button className="btn small secondary" onClick={() => setF(DEFAULT_FILTER)}>Wyczyść filtry</button>}
        </div>
      </div>

      <h2>Działy – procent pytań</h2>
      <div className="card stack" data-testid="owe-topics">
        {res.topics.map((t) => (
          <button key={t.id} className={`share-row ${f.topic === t.id ? "active" : ""}`} onClick={() => set({ topic: f.topic === t.id ? null : t.id })} title="Zawęź zagadnienia i pojęcia do tego działu">
            <span className="share-name">{t.name}</span>
            <span className="share-bar"><span style={{ width: `${(t.n / maxTopic) * 100}%` }} /></span>
            <span className="share-val"><strong>{fmtPct(t.pct)}</strong> <small>({t.n})</small></span>
          </button>
        ))}
        {res.topics.length === 0 && <p className="muted">Brak pytań.</p>}
      </div>

      <h2>Zagadnienia {f.topic && <span className="muted">– {topicName[f.topic]}</span>}</h2>
      <div className="card table-wrap" data-testid="owe-units">
        <table className="stat-table">
          <thead><tr><th>#</th><th>Zagadnienie</th>{!f.topic && <th>Dział</th>}<th className="num">Pytań</th></tr></thead>
          <tbody>
            {res.units.slice(0, unitLimit).map((u, i) => (
              <tr key={u.id}>
                <td className="muted">{i + 1}</td>
                <td>{u.name}</td>
                {!f.topic && <td className="muted">{topicName[u.topic]}</td>}
                <td className="num"><strong>{u.n}</strong>×</td>
              </tr>
            ))}
          </tbody>
        </table>
        {res.units.length > unitLimit && (
          <button className="btn small secondary" style={{ marginTop: 10 }} onClick={() => setUnitLimit(res.units.length)}>Pokaż wszystkie ({res.units.length})</button>
        )}
      </div>

      <h2>Pojęcia {f.kind && <span className="muted">– {data.kinds.find((k) => k.id === f.kind)?.title}</span>}</h2>
      <p className="muted" style={{ marginTop: -8 }}>Kliknij pojęcie, aby zobaczyć pytania, w których o nie pytano.</p>
      <div className="card table-wrap" data-testid="owe-items">
        <table className="stat-table">
          <thead>
            <tr><th>#</th><th>Pojęcie</th><th className="num">Razem</th><th className="num" title="jednokrotnego wyboru">Jedn.</th><th className="num" title="wielokrotnego wyboru">Wiel.</th></tr>
          </thead>
          <tbody>
            {res.items.slice(0, itemLimit).flatMap((r, i) => {
              const row = (
                <tr key={r.id} className="clickable" onClick={() => toggleItem(r.id)} aria-expanded={open === r.id} data-testid="owe-item">
                  <td className="muted">{i + 1}</td>
                  <td>
                    <span className="item-name">{open === r.id ? "▾" : "▸"} {r.name}</span>
                    <div className="concept-tags">
                      <span className="tag">{KIND_ONE[r.kind] ?? r.kind}</span>
                      {!f.topic && <span className="tag">{topicName[r.topic] ?? r.topic}</span>}
                    </div>
                  </td>
                  <td className="num"><strong>{r.n}</strong>×</td>
                  <td className="num">{r.single}</td>
                  <td className="num">{r.multi}</td>
                </tr>
              );
              if (open !== r.id) return [row];
              const list = qs[r.id];
              return [row, (
                <tr key={`${r.id}-q`} className="q-list-row">
                  <td colSpan={5}>
                    {!list ? <p className="muted">Ładowanie pytań…</p> : typeof list === "string" ? <p className="error">{list}</p> : (
                      <ol className="q-list">
                        {list.map((q) => (
                          <li key={q.id}>
                            <div className="muted q-meta">{q.edition} · {q.type === "multi" ? "wielokrotny" : "jednokrotny"} wybór</div>
                            <div>{q.question}</div>
                            <ul>
                              {q.options.map((o, k) => (
                                <li key={k} className={q.correct.includes(k) ? "ok-msg" : "muted"}>{LETTERS[k]}. {o}{q.correct.includes(k) ? " ✓" : ""}</li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ol>
                    )}
                  </td>
                </tr>
              )];
            })}
          </tbody>
        </table>
        {res.items.length === 0 && <p className="muted">Brak pojęć dla wybranych filtrów.</p>}
        {res.items.length > itemLimit && (
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn small secondary" onClick={() => setItemLimit(itemLimit + STEP)}>Pokaż kolejne {STEP}</button>
            <button className="btn small secondary" onClick={() => setItemLimit(res.items.length)}>Pokaż wszystkie ({res.items.length})</button>
          </div>
        )}
      </div>
      <ToTop />
    </div>
  );
}

export function OweStatsLoader() {
  const { data, error } = useData<Data>("/api/dane/owe-stats");
  if (error) return <p className="error">{error}</p>;
  return data ? <OweStatsView data={data} /> : <PageSkeleton title="Statystyki pytań OWE" />;
}
