"use client";

/** Przycisk gwiazdki ☆/★ – zaznacza ulubione (fiszki, notatki, artykuły). */
export function StarButton({ on, onToggle, label = "gwiazdkę", disabled, className = "" }: {
  on: boolean; onToggle: () => void; label?: string; disabled?: boolean; className?: string;
}) {
  return (
    <button type="button" className={`star-btn${on ? " on" : ""} ${className}`} aria-pressed={on} disabled={disabled}
      title={on ? `Usuń ${label}` : `Dodaj ${label}`} data-testid="star"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(); }}>
      <span aria-hidden>{on ? "★" : "☆"}</span>
      <span className="sr-only">{on ? `Usuń ${label}` : `Dodaj ${label}`}</span>
    </button>
  );
}

/** Filtr gwiazdek: wszystkie / z gwiazdką / bez. */
export type StarFilter = "" | "1" | "0";
export function StarFilterSeg({ value, onChange, counts }: { value: StarFilter; onChange: (v: StarFilter) => void; counts?: { on: number; off: number } }) {
  const opts: [StarFilter, string][] = [["", "Wszystkie"], ["1", `★ Z gwiazdką${counts ? ` · ${counts.on}` : ""}`], ["0", `☆ Bez gwiazdki${counts ? ` · ${counts.off}` : ""}`]];
  return (
    <div className="seg" role="group" aria-label="Gwiazdka">
      {opts.map(([v, l]) => (
        <button key={v || "all"} type="button" className={value === v ? "active" : ""} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}
