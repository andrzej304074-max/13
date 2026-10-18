"use client";

import { useEffect, useState } from "react";
import { SkeletonRows } from "@/app/components/loading-page";
import { api } from "@/lib/client";
import type { BugReport } from "@/lib/bugs";
import { BUG_STATUSES, BUG_STATUS_LABEL, type BugStatus } from "@/lib/bugs-core";

const fmt = (s: string) => new Date(s).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });

/** Karta „Zgłoszenia błędów” w panelu admina: kto, kiedy, z której strony, treść; status i odpowiedź dla zgłaszającego. */
export function BugsCard() {
  const [filter, setFilter] = useState<BugStatus | "">("nowe");
  const [data, setData] = useState<{ reports: BugReport[]; counts: Record<string, number> } | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setData(null);
    api<{ reports: BugReport[]; counts: Record<string, number> }>(`/api/admin/zgloszenia${filter ? `?status=${filter}` : ""}`)
      .then((d) => { setData(d); setNotes(Object.fromEntries(d.reports.map((r) => [r.id, r.note ?? ""]))); })
      .catch((e) => setError(e.message));
  }, [filter]);

  async function update(r: BugReport, body: { status?: BugStatus; note?: string }) {
    setError(null);
    try {
      const n = await api<BugReport>(`/api/admin/zgloszenia/${r.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setData((d) => d && {
        counts: body.status && body.status !== r.status
          ? { ...d.counts, [r.status]: (d.counts[r.status] ?? 1) - 1, [body.status]: (d.counts[body.status] ?? 0) + 1 } : d.counts,
        reports: d.reports.map((x) => (x.id === r.id ? { ...n, email: r.email } : x)),
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;
  return (
    <div className="card stack" data-testid="bugs-admin">
      <div className="seg" role="group" aria-label="Status zgłoszeń" style={{ flexWrap: "wrap" }}>
        {(["", ...BUG_STATUSES] as const).map((s) => (
          <button key={s || "all"} className={filter === s ? "active" : ""} aria-pressed={filter === s} onClick={() => setFilter(s)} data-status={s}>
            {s ? BUG_STATUS_LABEL[s] : "wszystkie"} · {s ? data?.counts[s] ?? 0 : total}
          </button>
        ))}
      </div>
      {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
      {!data ? <SkeletonRows rows={2} height={80} label="Ładowanie zgłoszeń" /> : data.reports.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>Brak zgłoszeń{filter ? ` o statusie „${BUG_STATUS_LABEL[filter]}”` : ""}.</p>
      ) : (
        <ul className="bug-list">
          {data.reports.map((r) => (
            <li key={r.id} className="bug-item admin" data-testid="bug-admin-item">
              <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
                <strong className="bug-user">{r.email}</strong>
                <span className="muted small">{fmt(r.created_at)}</span>
                {r.page && <a className="small" href={r.page} target="_blank" rel="noreferrer">{r.page}</a>}
              </div>
              <p className="bug-text">{r.text}</p>
              {r.device && <p className="muted small" style={{ margin: 0 }}>{r.device}</p>}
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <select className="select" value={r.status} onChange={(e) => update(r, { status: e.target.value as BugStatus })} aria-label="Status" data-testid="bug-status">
                  {BUG_STATUSES.map((s) => <option key={s} value={s}>{BUG_STATUS_LABEL[s]}</option>)}
                </select>
                <input className="select" style={{ flex: "1 1 200px" }} value={notes[r.id] ?? ""} maxLength={2000} placeholder="Odpowiedź dla zgłaszającego"
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} aria-label="Odpowiedź dla zgłaszającego" data-testid="bug-note" />
                <button className="btn small secondary" onClick={() => update(r, { note: notes[r.id] ?? "" })} disabled={(notes[r.id] ?? "") === (r.note ?? "")} data-testid="bug-note-save">Zapisz odpowiedź</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
