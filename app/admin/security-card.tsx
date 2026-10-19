"use client";

import { useEffect, useState } from "react";
import { SkeletonRows } from "@/app/components/loading-page";
import { api } from "@/lib/client";

type Kind = "login_fail" | "login_lock" | "rate_limit" | "scrape";
type Ev = { id: string; at: string; kind: Kind; ip: string; detail: string; email: string | null };
const LABEL: Record<Kind, string> = {
  login_fail: "nieudane logowanie", login_lock: "blokada logowania", rate_limit: "limit zapytań",
  scrape: "masowe pobieranie",
};
const fmt = (s: string) => new Date(s).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "medium" });

/** Karta „Bezpieczeństwo” w panelu admina: zdarzenia z ostatnich 90 dni i liczby z ostatniej doby. */
export function SecurityCard() {
  const [kind, setKind] = useState<Kind | "">("");
  const [data, setData] = useState<{ events: Ev[]; day: Partial<Record<Kind, number>> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setData(null);
    api<{ events: Ev[]; day: Partial<Record<Kind, number>> }>(`/api/admin/bezpieczenstwo${kind ? `?kind=${kind}` : ""}`)
      .then(setData).catch((e) => setError(e.message));
  }, [kind]);
  return (
    <div className="card stack" data-testid="security-admin">
      <div className="seg" role="group" aria-label="Rodzaj zdarzeń" style={{ flexWrap: "wrap" }}>
        {(["", ...Object.keys(LABEL)] as (Kind | "")[]).map((k) => (
          <button key={k || "all"} className={kind === k ? "active" : ""} aria-pressed={kind === k} onClick={() => setKind(k)}>
            {k ? LABEL[k] : "wszystkie"}{k && data?.day[k] ? ` · ${data.day[k]} / 24 h` : ""}
          </button>
        ))}
      </div>
      {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
      {!data ? <SkeletonRows rows={2} height={40} label="Ładowanie dziennika" /> : data.events.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>Brak zdarzeń.</p>
      ) : (
        <div className="table-wrap">
          <table className="db-tables sec-log">
            <thead><tr><th>Kiedy</th><th>Zdarzenie</th><th>Konto</th><th>IP</th><th>Szczegóły</th></tr></thead>
            <tbody>
              {data.events.map((e) => (
                <tr key={e.id} data-kind={e.kind}>
                  <td>{fmt(e.at)}</td><td>{LABEL[e.kind] ?? e.kind}</td><td>{e.email ?? "–"}</td><td>{e.ip}</td><td>{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
