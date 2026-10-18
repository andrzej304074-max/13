"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, fmtPct, fmtPoints, withUser } from "@/lib/client";

type Sum = { attempts: number; score: number; max: number; percent: number };
type Part = { total: Sum & { items: number; available: number }; byStage: Record<string, Sum>; byTopic: Record<string, Sum> };
const STAGE: Record<string, string> = { s: "szkolny", o: "okręgowy", c: "centralny" };
const TOPIC: Record<string, string> = {
  mikro: "Mikroekonomia", makro: "Makroekonomia", polityka: "Polityka gosp.", finanse: "Podstawy finansów",
  firma: "Finanse przedsiębiorstw", zarzadzanie: "Zarządzanie", demografia: "Demografia",
};

/** Statystyki zadań obliczeniowych i esejów – osobno od testów (bez pytań jedno- i wielokrotnego wyboru). */
export function OpenStats() {
  const [d, setD] = useState<{ zadanie: Part; esej: Part } | null>(null);
  useEffect(() => { api<{ zadanie: Part; esej: Part }>(withUser("/api/otwarte/statystyki")).then(setD).catch(() => {}); }, []);
  if (!d) return null;
  return (
    <section className="stack" data-testid="open-stats">
      <h2>Zadania i eseje</h2>
      <p className="muted" style={{ margin: 0 }}>Liczone osobno od testów. Zadania: wyniki liczbowe sprawdzane automatycznie, części opisowe – samoocena; eseje – samoocena według schematu z klucza.</p>
      <div className="stat-grid">
        {(["zadanie", "esej"] as const).map((k) => {
          const p = d[k];
          return (
            <div className="stat" key={k} data-kind={k}>
              <div className="value">{p.total.attempts ? fmtPct(p.total.percent) : "–"}</div>
              <div className="label">
                {k === "zadanie" ? "🧮 zadania" : "✍️ eseje"} · {fmtPoints(p.total.score)}/{fmtPoints(p.total.max)} pkt · podejść: {p.total.attempts} ·
                rozwiązane {p.total.items} z {p.total.available} · <Link href={k === "zadanie" ? "/zadania" : "/eseje"}>{k === "zadanie" ? "zadania" : "eseje"} →</Link>
              </div>
              {Object.keys(p.byStage).length > 0 && (
                <div className="open-breakdown small">
                  {Object.entries(p.byStage).map(([s, v]) => <span key={s}>etap {STAGE[s] ?? s}: {fmtPct(v.percent)}</span>)}
                  {Object.entries(p.byTopic).map(([t, v]) => <span key={t}>{TOPIC[t] ?? t}: {fmtPct(v.percent)}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
