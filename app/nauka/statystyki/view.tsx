"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Chart } from "@/app/components/chart";
import { api, fmtPct } from "@/lib/client";
import { fmtDuration } from "@/lib/nauka-client";
import type { NaukaStats } from "@/lib/nauka";
import { EXERCISE_LABELS, SUBLESSONS } from "@/lib/nauka-types";

export interface StatsMeta {
  topics: { id: string; title: string; emoji: string }[];
  units: { id: string; title: string; topic: string }[];
  lessons: { id: string; title: string; unit: string; no: number }[];
  kinds: { id: string; title: string }[];
}

const RANGES = [
  { value: "7d", label: "7 dni" },
  { value: "30d", label: "30 dni" },
  { value: "all", label: "Całość" },
] as const;

type Filters = { topic: string; unit: string; lesson: string; sub: string; kind: string; exercise: string; range: string };
const EMPTY: Filters = { topic: "", unit: "", lesson: "", sub: "", kind: "", exercise: "", range: "all" };
const KEYS = Object.keys(EMPTY) as (keyof Filters)[];

export function NaukaStatsView({ meta }: { meta: StatsMeta }) {
  const [f, setF] = useState<Filters | null>(null);
  const [stats, setStats] = useState<NaukaStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setF(Object.fromEntries(KEYS.map((k) => [k, p.get(k) ?? EMPTY[k]])) as Filters);
  }, []);

  useEffect(() => {
    if (!f) return;
    const qs = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && !(k === "range" && v === "all"))).toString();
    window.history.replaceState(null, "", `/nauka/statystyki${qs ? `?${qs}` : ""}`);
    setError(null);
    api<NaukaStats>(`/api/nauka/stats?${qs}`).then(setStats).catch((e) => setError(e.message));
  }, [f]);

  const names = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of meta.topics) m.set(t.id, `${t.emoji} ${t.title}`);
    for (const u of meta.units) m.set(u.id, u.title);
    for (const l of meta.lessons) m.set(l.id, `${meta.units.find((u) => u.id === l.unit)?.title ?? ""} · L${l.no}: ${l.title}`);
    m.set("powtorka", "🔁 Powtórka słabych haseł");
    return m;
  }, [meta]);

  if (!f) return <p className="muted">Ładowanie…</p>;
  const set = (patch: Partial<Filters>) => setF({ ...f, ...patch });
  const units = meta.units.filter((u) => u.topic === f.topic);
  const lessons = meta.lessons.filter((l) => l.unit === f.unit);
  const kindName = (id: string) => meta.kinds.find((k) => k.id === id)?.title ?? id;

  return (
    <div className="stack">
      <p className="muted" style={{ margin: 0 }}><Link href="/nauka">← Nauka</Link> · <Link href="/stats">Statystyki testów</Link></p>
      <h1>Statystyki nauki</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Osobne od testów: skuteczność odpowiedzi w ćwiczeniach i czas lekcji oraz pod-lekcji (wspólne dla wszystkich).
        Skuteczność = poprawne odpowiedzi / wszystkie odpowiedzi (także ćwiczenia powtórzone po błędzie).
      </p>

      <div className="card stack filters">
        <div className="seg" role="group" aria-label="Okres">
          {RANGES.map((r) => (
            <button key={r.value} className={f.range === r.value ? "active" : ""} aria-pressed={f.range === r.value} onClick={() => set({ range: r.value })}>{r.label}</button>
          ))}
        </div>
        <div className="filter-grid">
          <label>Temat
            <select className="select" value={f.topic} onChange={(e) => set({ topic: e.target.value, unit: "", lesson: "" })}>
              <option value="">Wszystkie tematy</option>
              {meta.topics.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.title}</option>)}
              <option value="powtorka">🔁 Powtórki</option>
            </select>
          </label>
          <label>Dział
            <select className="select" value={f.unit} disabled={!units.length} onChange={(e) => set({ unit: e.target.value, lesson: "" })}>
              <option value="">{units.length ? "Wszystkie działy" : "— wybierz temat —"}</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}
            </select>
          </label>
          <label>Lekcja
            <select className="select" value={f.lesson} disabled={!lessons.length} onChange={(e) => set({ lesson: e.target.value })}>
              <option value="">{lessons.length ? "Wszystkie lekcje" : "— wybierz dział —"}</option>
              {lessons.map((l) => <option key={l.id} value={l.id}>Lekcja {l.no}: {l.title}</option>)}
            </select>
          </label>
          <label>Pod-lekcja
            <select className="select" value={f.sub} onChange={(e) => set({ sub: e.target.value })}>
              <option value="">Wszystkie pod-lekcje</option>
              {SUBLESSONS.map((s) => <option key={s.no} value={s.no}>{s.no}. {s.title}</option>)}
            </select>
          </label>
          <label>Rodzaj treści
            <select className="select" value={f.kind} onChange={(e) => set({ kind: e.target.value })}>
              <option value="">Wszystkie rodzaje</option>
              {meta.kinds.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
            </select>
          </label>
          <label>Typ ćwiczenia
            <select className="select" value={f.exercise} onChange={(e) => set({ exercise: e.target.value })}>
              <option value="">Wszystkie ćwiczenia</option>
              {Object.entries(EXERCISE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
        {KEYS.some((k) => f[k] !== EMPTY[k]) && (
          <button className="linklike" style={{ alignSelf: "flex-start" }} onClick={() => setF(EMPTY)}>Wyczyść filtry</button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {!stats ? (
        <p className="muted">Ładowanie…</p>
      ) : stats.sessions.sessions === 0 ? (
        <p className="muted">Brak ukończonych pod-lekcji dla wybranych filtrów.</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat"><div className="value">{fmtPct(stats.answers.percent)}</div><div className="label">skuteczność · {stats.answers.correct}/{stats.answers.answers} odpowiedzi</div></div>
            <div className="stat"><div className="value">{stats.sessions.sessions}</div><div className="label">ukończone pod-lekcje</div></div>
            <div className="stat"><div className="value">{fmtDuration(stats.sessions.totalMs)}</div><div className="label">łączny czas nauki</div></div>
            <div className="stat"><div className="value">{fmtDuration(stats.sessions.avgMs)}</div><div className="label">średni czas pod-lekcji</div></div>
            <div className="stat"><div className="value">{fmtDuration(stats.sessions.avgMs * 4)}</div><div className="label">≈ czas całej lekcji (4 pod-lekcje)</div></div>
            <div className="stat"><div className="value">⚡ {stats.sessions.xp}</div><div className="label">zdobyte XP</div></div>
          </div>

          {stats.daily.length > 0 && (
            <>
              <h2>Skuteczność dzień po dniu</h2>
              <div className="card">
                <Chart
                  points={stats.daily.map((d) => d.percent)}
                  ariaLabel="Skuteczność w kolejnych dniach nauki"
                  label={(i) => `${stats.daily[i].day}: ${fmtPct(stats.daily[i].percent)} · ${stats.daily[i].sessions} pod-lekcji · ${fmtDuration(stats.daily[i].ms)}`}
                />
              </div>
            </>
          )}

          <h2>Pod-lekcje: skuteczność i czas</h2>
          <div className="card table-wrap"><table>
            <thead><tr><th>Pod-lekcja</th><th>Ukończone</th><th>Skuteczność</th><th>Średni czas</th><th>Łącznie</th></tr></thead>
            <tbody>
              {stats.bySub.map((r) => (
                <tr key={r.sub}>
                  <td>{r.sub}. {SUBLESSONS[r.sub - 1]?.title ?? ""}</td><td>{r.sessions}</td><td>{fmtPct(r.percent)}</td>
                  <td>{fmtDuration(r.avgMs)}</td><td>{fmtDuration(r.totalMs)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>

          <h2>{{ topic: "Według tematów", unit: "Według działów", lesson: "Według lekcji" }[stats.breakdown.level]}</h2>
          <div className="card table-wrap"><table>
            <thead><tr><th>{{ topic: "Temat", unit: "Dział", lesson: "Lekcja" }[stats.breakdown.level]}</th><th>Pod-lekcje</th><th>Skuteczność</th><th>Śr. czas</th><th>Łącznie</th></tr></thead>
            <tbody>
              {[...stats.breakdown.rows].sort((a, b) => b.sessions - a.sessions).map((r) => {
                const drill = stats.breakdown.level === "topic" && r.id !== "powtorka" ? { topic: r.id } : stats.breakdown.level === "unit" ? { unit: r.id } : stats.breakdown.level === "lesson" && !f.lesson ? { lesson: r.id } : null;
                return (
                  <tr key={r.id}>
                    <td>{drill ? <button className="linklike" onClick={() => set(drill)}>{names.get(r.id) ?? r.id}</button> : names.get(r.id) ?? r.id}</td>
                    <td>{r.sessions}</td><td>{fmtPct(r.percent)} <small className="muted">({r.correct}/{r.answers})</small></td>
                    <td>{fmtDuration(r.avgMs)}</td><td>{fmtDuration(r.totalMs)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>

          <div className="two-col">
            <div>
              <h2>Typy ćwiczeń</h2>
              <div className="card table-wrap"><table>
                <thead><tr><th>Ćwiczenie</th><th>Skuteczność</th><th>Śr. czas</th></tr></thead>
                <tbody>
                  {[...stats.byExercise].sort((a, b) => a.percent - b.percent).map((r) => (
                    <tr key={r.id}>
                      <td><button className="linklike" onClick={() => set({ exercise: f.exercise === r.id ? "" : r.id })}>{EXERCISE_LABELS[r.id as keyof typeof EXERCISE_LABELS] ?? r.id}</button></td>
                      <td><Bar pct={r.percent} /> {fmtPct(r.percent)} <small className="muted">({r.answers})</small></td>
                      <td>{fmtDuration(r.avgMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
            <div>
              <h2>Rodzaje treści</h2>
              <div className="card table-wrap"><table>
                <thead><tr><th>Rodzaj</th><th>Skuteczność</th></tr></thead>
                <tbody>
                  {[...stats.byKind].sort((a, b) => a.percent - b.percent).map((r) => (
                    <tr key={r.id}>
                      <td><button className="linklike" onClick={() => set({ kind: f.kind === r.id ? "" : r.id })}>{kindName(r.id)}</button></td>
                      <td><Bar pct={r.percent} /> {fmtPct(r.percent)} <small className="muted">({r.answers})</small></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>

          {stats.weakest.length > 0 && (
            <>
              <h2>Najsłabsze hasła</h2>
              <div className="card table-wrap"><table>
                <thead><tr><th>Hasło</th><th>Rodzaj</th><th>Skuteczność</th></tr></thead>
                <tbody>
                  {stats.weakest.map((w) => (
                    <tr key={w.id}><td>{w.title}</td><td>{kindName(w.kind)}</td><td>{fmtPct(w.percent)} <small className="muted">({w.correct}/{w.answers})</small></td></tr>
                  ))}
                </tbody>
              </table></div>
              <Link className="btn secondary" href="/nauka/powtorka" style={{ alignSelf: "flex-start" }}>🔁 Powtórz słabe hasła</Link>
            </>
          )}

          <h2>Ostatnie pod-lekcje</h2>
          <div className="card table-wrap"><table>
            <thead><tr><th>Data</th><th>Lekcja</th><th>Pod-lekcja</th><th>Wynik</th><th>Czas</th><th>XP</th></tr></thead>
            <tbody>
              {stats.history.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.finishedAt).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td>{h.lesson === "powtorka" ? names.get("powtorka") : <Link href={`/nauka/lekcja/${h.lesson}?sub=${h.sub}`}>{names.get(h.lesson) ?? h.lesson}</Link>}</td>
                  <td>{h.lesson === "powtorka" ? "–" : SUBLESSONS[h.sub - 1]?.title}</td>
                  <td>{h.correct}/{h.total} · {fmtPct(h.total ? Math.round((h.correct / h.total) * 1000) / 10 : 0)}</td>
                  <td>{fmtDuration(h.durationMs)}</td><td>{h.xp}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </>
      )}
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return <span className="mini-bar" aria-hidden><span style={{ width: `${pct}%` }} /></span>;
}
