"use client";

import { THEMES } from "@/data/olimpiada/info";
import { fmtPct } from "@/lib/client";
import { ROMAN, type themeShares } from "@/lib/owe-stats";

/** Karta „pytania z hasła przewodniego”: udział pytań o hasło swojej edycji, edycja po edycji (klik – wybór edycji). */
export function ThemeShareCard({ shares, edFrom, edTo, pick }: {
  shares: ReturnType<typeof themeShares>;
  edFrom: number;
  edTo: number;
  pick: (ed: number) => void;
}) {
  return (
    <div className="card stack" data-testid="owe-theme">
      <p style={{ margin: 0 }} data-testid="owe-theme-total">
        Razem: <strong>{fmtPct(shares.total.pct)}</strong> <span className="muted">({shares.total.th} z {shares.total.n} pytań)</span>
      </p>
      {shares.rows.map((r) => (
        <button key={r.ed} className={`share-row ${edFrom === r.ed && edTo === r.ed ? "active" : ""}`} data-testid="owe-theme-row"
          onClick={() => pick(r.ed)} title={`${ROMAN[r.ed]} OWE – „${THEMES[r.ed - 1]?.theme ?? ""}”`}>
          <span className="share-name">{ROMAN[r.ed]} OWE <small className="muted theme-name">{THEMES[r.ed - 1]?.theme}</small></span>
          <span className="share-bar"><span style={{ width: `${r.pct}%` }} /></span>
          <span className="share-val"><strong>{fmtPct(r.pct)}</strong> <small>({r.th}/{r.n})</small></span>
        </button>
      ))}
      {shares.rows.length === 0 && <p className="muted">Brak pytań.</p>}
    </div>
  );
}
