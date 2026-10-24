"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, viewedUser, withUser, XP_EVENT } from "@/lib/client";
import type { XpSummary } from "@/lib/xp";
import { DAILY_GOALS, XP_SOURCE_LABEL, XP_SOURCES } from "@/lib/xp-core";

/**
 * Wspólny stan celu i serii (🔥 w nagłówku, strona Nauki): jedno zapytanie na 30 s dla wszystkich miejsc naraz, odświeżane po akcjach
 * dających XP (jedno wspólne zapytanie po zdarzeniu). Przy podglądzie admina (`?user=`) – dane oglądanego konta, tylko do odczytu.
 */
let cache: { at: number; url: string; fresh: boolean; p: Promise<XpSummary> } | null = null;
const TTL = 30_000;
const subs = new Set<(x: XpSummary) => void>();
function load(fresh = false): Promise<XpSummary> {
  const url = withUser("/api/cel");
  // po zdarzeniu XP wszystkie zamontowane miejsca dzielą jedno świeże zapytanie
  if (cache && cache.url === url && (fresh ? cache.fresh && Date.now() - cache.at < 2000 : Date.now() - cache.at < TTL)) return cache.p;
  const p = api<XpSummary>(url);
  cache = { at: Date.now(), url, fresh, p };
  p.catch(() => { cache = null; });
  return p;
}

export function useXp(): [XpSummary | null, (s: XpSummary) => void] {
  const [s, setS] = useState<XpSummary | null>(null);
  const path = usePathname();
  useEffect(() => {
    let live = true;
    const get = (fresh = false) => load(fresh).then((x) => live && setS(x)).catch(() => {});
    get();
    const on = () => get(true);
    const sub = (x: XpSummary) => live && setS(x);
    window.addEventListener(XP_EVENT, on);
    subs.add(sub);
    return () => { live = false; window.removeEventListener(XP_EVENT, on); subs.delete(sub); };
  }, [path]);
  // nowy stan z odpowiedzi PUT /api/cel – bez ponownego pobierania, dla wszystkich miejsc
  const set = (x: XpSummary) => { cache = { at: Date.now(), url: withUser("/api/cel"), fresh: false, p: Promise.resolve(x) }; subs.forEach((f) => f(x)); };
  return [s, set];
}

const DAY = ["pn", "wt", "śr", "cz", "pt", "sb", "nd"];
const dayName = (d: string) => DAY[(new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7];

/** Pierścień postępu celu dziennego. */
function Ring({ pct, size = 26 }: { pct: number; size?: number }) {
  const r = size / 2 - 3, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="xp-ring" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} className="xp-ring-bg" />
      <circle cx={size / 2} cy={size / 2} r={r} className="xp-ring-fg" strokeDasharray={`${(Math.min(pct, 100) / 100) * c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

/** Panel celu i serii – w okienku z nagłówka i na stronie Nauki. */
export function XpPanel({ s, onChange }: { s: XpSummary; onChange: (x: XpSummary) => void }) {
  const [busy, setBusy] = useState(false);
  // podgląd admina (`?user=`): cel oglądanego konta tylko do odczytu
  const [preview, setPreview] = useState(false);
  useEffect(() => setPreview(!!viewedUser()), []);
  const pct = s.goal ? (s.today.xp / s.goal) * 100 : 0;
  const max = Math.max(s.goal, ...s.week.map((d) => d.xp), 1);
  async function choose(goal: number) {
    setBusy(true);
    try { onChange(await api<XpSummary>("/api/cel", { method: "PUT", body: JSON.stringify({ goal }) })); } catch {} finally { setBusy(false); }
  }
  return (
    <div className="xp-panel stack" data-testid="xp-panel">
      <div className="xp-head">
        <span className="xp-flame" aria-hidden>{s.todayMet ? "🔥" : "🕯️"}</span>
        <div>
          <strong data-testid="xp-streak">{s.streak} {s.streak === 1 ? "dzień" : "dni"} serii</strong>
          <div className="muted small">rekord: {s.record} · {s.freezeLeft ? "🧊 zamrożenie w tym tygodniu dostępne" : "🧊 zamrożenie z tego tygodnia już użyte"}</div>
        </div>
      </div>
      <div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Cel dzienny: {s.goal} XP</strong>
          <span className="muted small" data-testid="xp-today">{s.today.xp} XP{s.todayMet ? " · ✅ osiągnięty" : ` · brakuje ${Math.max(0, s.goal - s.today.xp)}`}</span>
        </div>
        <div className="goal-bar"><div style={{ width: `${Math.min(pct, 100)}%` }} /></div>
      </div>
      {Object.keys(s.today.by).length > 0 && (
        <div className="xp-by muted small">
          Dziś: {XP_SOURCES.filter((k) => s.today.by[k]).map((k) => `${XP_SOURCE_LABEL[k]} ${s.today.by[k]}`).join(" · ")}
        </div>
      )}
      <div className="week" aria-label="XP w ostatnim tygodniu">
        {s.week.map((d) => (
          <div key={d.day} className="week-day" title={`${d.day}: ${d.xp} XP${d.met ? " – cel" : d.frozen ? " – zamrożenie" : ""}`}>
            <div className="week-bar"><div style={{ height: `${(d.xp / max) * 100}%` }} className={d.met ? "hit" : ""} /></div>
            <small>{d.frozen ? "🧊" : dayName(d.day)}</small>
          </div>
        ))}
      </div>
      <div className="seg" role="group" aria-label="Cel dzienny" style={{ flexWrap: "wrap" }}>
        {DAILY_GOALS.map((g) => (
          <button key={g.xp} className={g.xp === s.goal ? "active" : ""} aria-pressed={g.xp === s.goal} disabled={busy || preview}
            onClick={() => choose(g.xp)} data-goal={g.xp}>{g.label} · {g.xp}</button>
        ))}
      </div>
      <details className="why">
        <summary>Jak zdobywam XP?</summary>
        <div className="muted small">
          Kurs – XP z lekcji; test – 10 za poprawną odpowiedź, 5 za częściową, 2 za błędną; fiszki – 2 za ocenę (do 100 dziennie);
          zadanie – 30, esej – 50 (pierwsze podejście danego dnia); przeczytany rozdział Podręcznika – 10. Dzień liczy się do serii,
          gdy zbierzesz cel. Raz w tygodniu jeden dzień bez celu nie przerywa serii (🧊 zamrożenie zużywa się samo).
        </div>
      </details>
    </div>
  );
}

/** 🔥 w nagłówku: seria i pierścień celu; kliknięcie otwiera panel. */
export function StreakBadge() {
  const [s, set] = useXp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  const pct = s && s.goal ? (s.today.xp / s.goal) * 100 : 0;
  const label = s ? `Seria: ${s.streak} dni, dziś ${s.today.xp} z ${s.goal} XP` : "Cel dzienny i seria";
  return (
    <span className="xp-badge-wrap" ref={ref}>
      <button type="button" className="qn-btn xp-badge" aria-label={label} title={label} aria-expanded={open} onClick={() => setOpen((o) => !o)} data-testid="xp-badge">
        <Ring pct={pct} />
        <span className="xp-badge-n"><span aria-hidden>{s?.todayMet ? "🔥" : "🕯️"}</span>{s?.streak ?? "–"}</span>
      </button>
      {open && s && <div className="xp-pop card" role="dialog" aria-label="Cel dzienny i seria"><XpPanel s={s} onChange={set} /></div>}
    </span>
  );
}
