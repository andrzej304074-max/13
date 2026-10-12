"use client";

import { ROMAN, STAGES, type Stage } from "@/lib/owe-stats";

/** Wspólny formularz filtrów pytań OWE (typ, edycje, etap, dział, rodzaj) – statystyki, pokrycie, moje statystyki. */
export interface FilterValue {
  type: "all" | "single" | "multi";
  stages: Stage[];
  edFrom: number;
  edTo: number;
  topic: string | null;
  kind: string | null;
}

export function OweFilterFields<F extends FilterValue>({ f, set, topics, kinds, editions = true, stageLabel = "Etap", children }: {
  f: F;
  set: (o: Partial<F>) => void;
  topics: { id: string; name: string }[];
  kinds: { id: string; title: string }[];
  editions?: boolean;
  stageLabel?: string;
  children?: React.ReactNode;
}) {
  const eds = Array.from({ length: 19 }, (_, i) => 21 + i);
  const toggleStage = (s: Stage) => {
    const st = f.stages.includes(s) ? f.stages.filter((x) => x !== s) : [...f.stages, s];
    if (st.length) set({ stages: STAGES.map((x) => x.id).filter((x) => st.includes(x)) } as Partial<F>);
  };
  return (
    <>
      <div className="filter-grid">
        <label className="filters">Typ pytań
          <select className="select" value={f.type} onChange={(e) => set({ type: e.target.value as F["type"] } as Partial<F>)}>
            <option value="all">wszystkie</option>
            <option value="single">jednokrotnego wyboru</option>
            <option value="multi">wielokrotnego wyboru</option>
          </select>
        </label>
        {editions && <>
          <label className="filters">Edycje od
            <select className="select" value={f.edFrom} onChange={(e) => set({ edFrom: Math.min(Number(e.target.value), f.edTo) } as Partial<F>)}>
              {eds.map((n) => <option key={n} value={n}>{ROMAN[n]} OWE</option>)}
            </select>
          </label>
          <label className="filters">do
            <select className="select" value={f.edTo} onChange={(e) => set({ edTo: Math.max(Number(e.target.value), f.edFrom) } as Partial<F>)}>
              {eds.map((n) => <option key={n} value={n}>{ROMAN[n]} OWE</option>)}
            </select>
          </label>
        </>}
        <label className="filters">Dział
          <select className="select" value={f.topic ?? ""} onChange={(e) => set({ topic: e.target.value || null } as Partial<F>)}>
            <option value="">wszystkie</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="filters">Rodzaj haseł
          <select className="select" value={f.kind ?? ""} onChange={(e) => set({ kind: e.target.value || null } as Partial<F>)}>
            <option value="">wszystkie</option>
            {kinds.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
          </select>
        </label>
        {children}
      </div>
      {editions && (
        <div>
          <div className="filter-label">{stageLabel}</div>
          <div className="chips">
            {STAGES.map((s) => (
              <button key={s.id} className={`chip ${f.stages.includes(s.id) ? "selected" : ""}`} onClick={() => toggleStage(s.id)} aria-pressed={f.stages.includes(s.id)}>
                {f.stages.includes(s.id) ? "✓ " : ""}{s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
