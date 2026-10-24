"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { SkeletonRows } from "@/app/components/loading-page";
import { api, LETTERS } from "@/lib/client";
import { SOURCES } from "@/lib/question-source";
import { FLAG_LABEL, MIN_N, type QFlag, type QStatRow } from "@/lib/question-stats-core";
import { REVIEW_STATUS_LABEL } from "@/lib/review-core";

type Data = { rows: QStatRow[]; course: { item: string; title: string; exercise: string; n: number; pct: number }[] };
type Full = { id: string; edition: string; question: string; options: string[]; correct: number[]; explanation: string | null };
const STEP = 50;
const SRC = Object.fromEntries(SOURCES.map((s) => [s.id, `${s.icon} ${s.label}`]));

/**
 * Karta „Pytania” w panelu admina: skuteczność każdego pytania u wszystkich użytkowników, najczęstsza błędna odpowiedź,
 * flagi do przeglądu (podejrzany klucz, za trudne, za łatwe) i zgłoszenia błędów z id pytania; zakładka ćwiczeń kursu.
 */
export function QuestionsCard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"q" | "kurs">("q");
  const [src, setSrc] = useState("");
  const [flag, setFlag] = useState<QFlag | "">("");
  const [minN, setMinN] = useState(MIN_N);
  const [sort, setSort] = useState<"pct" | "n" | "reports">("pct");
  const [limit, setLimit] = useState(STEP);
  const [open, setOpen] = useState<string | null>(null);
  const [full, setFull] = useState<Record<string, Full>>({});
  // dane (kilkaset kB przy dużej liczbie odpowiedzi) pobierane dopiero na żądanie – nie spowalniają wejścia do panelu
  const [on, setOn] = useState(false);
  useEffect(() => { if (on) api<Data>("/api/admin/pytania").then(setData).catch((e) => setError(e.message)); }, [on]);
  useEffect(() => {
    if (!open || full[open]) return;
    api<Full>(`/api/admin/pytania?id=${encodeURIComponent(open)}`).then((f) => setFull((m) => ({ ...m, [f.id]: f }))).catch(() => {});
  }, [open, full]);

  const rows = useMemo(() => {
    if (!data) return [];
    const r = data.rows.filter((x) => x.n >= minN && (!src || x.src === src) && (!flag || x.flags.includes(flag)));
    return r.sort((a, b) => (sort === "pct" ? a.pct - b.pct : sort === "n" ? b.n - a.n : b.reports - a.reports));
  }, [data, src, flag, minN, sort]);
  const counts = useMemo(() => {
    const c: Record<QFlag, number> = { klucz: 0, trudne: 0, latwe: 0 };
    for (const r of data?.rows ?? []) for (const f of r.flags) c[f]++;
    return c;
  }, [data]);

  if (!on) return (
    <div className="card row" style={{ flexWrap: "wrap", gap: 8 }}>
      <span className="muted small">Skuteczność każdego pytania, najczęstsza błędna odpowiedź, flagi do przeglądu i ćwiczenia kursu.</span>
      <button className="btn secondary" onClick={() => setOn(true)} data-testid="qa-load">Pokaż statystyki pytań</button>
    </div>
  );
  if (error) return <div className="card"><p className="error" style={{ margin: 0 }}>{error}</p></div>;
  if (!data) return <div className="card"><SkeletonRows rows={3} height={40} label="Ładowanie statystyk pytań" /></div>;
  return (
    <div className="card stack" data-testid="questions-admin">
      <div className="seg" role="group" aria-label="Zakres">
        <button className={tab === "q" ? "active" : ""} aria-pressed={tab === "q"} onClick={() => setTab("q")}>Pytania testowe ({data.rows.length})</button>
        <button className={tab === "kurs" ? "active" : ""} aria-pressed={tab === "kurs"} onClick={() => setTab("kurs")}>Ćwiczenia kursu</button>
      </div>
      {tab === "kurs" ? <CourseTable rows={data.course} /> : <>
        <p className="muted small" style={{ margin: 0 }}>
          Do przeglądu: {(Object.keys(counts) as QFlag[]).map((f) => `${FLAG_LABEL[f]} – ${counts[f]}`).join(" · ")}. Flagi od {MIN_N} odpowiedzi.
          „Podejrzany klucz” – błędna opcja wybierana częściej niż poprawna: sprawdź klucz albo treść pytania.
        </p>
        <div className="filter-grid">
          <label className="filters">Źródło
            <select className="select" value={src} onChange={(e) => { setSrc(e.target.value); setLimit(STEP); }} data-testid="qa-src">
              <option value="">wszystkie</option>
              {SOURCES.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
            </select>
          </label>
          <label className="filters">Flaga
            <select className="select" value={flag} onChange={(e) => { setFlag(e.target.value as QFlag | ""); setLimit(STEP); }} data-testid="qa-flag">
              <option value="">wszystkie pytania</option>
              {(Object.keys(FLAG_LABEL) as QFlag[]).map((f) => <option key={f} value={f}>{FLAG_LABEL[f]} ({counts[f]})</option>)}
            </select>
          </label>
          <label className="filters">Min. odpowiedzi
            <select className="select" value={minN} onChange={(e) => setMinN(Number(e.target.value))}>
              {[1, 5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="filters">Kolejność
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="pct">najtrudniejsze najpierw</option>
              <option value="n">najwięcej odpowiedzi</option>
              <option value="reports">najwięcej zgłoszeń</option>
            </select>
          </label>
        </div>
        <p className="muted small" style={{ margin: 0 }} data-testid="qa-count">Pytań: {rows.length}</p>
        <div className="table-wrap">
          <table className="db-tables">
            <thead><tr><th>Pytanie</th><th className="num">Odp.</th><th className="num">Poprawne</th><th>Najczęstszy błąd</th><th>Flagi</th><th>Recenzja</th></tr></thead>
            <tbody>
              {rows.slice(0, limit).map((r) => (
                <Fragment key={r.id}>
                  <tr className="clickable" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id} data-testid="qa-row" data-id={r.id}>
                    <td><span className="muted small">{SRC[r.src]} · {r.id}{r.reports ? ` · 🐞 ${r.reports}` : ""}</span><div>{r.question.length > 140 ? `${r.question.slice(0, 140)}…` : r.question}</div></td>
                    <td className="num">{r.n}</td>
                    <td className="num">{r.pct.toLocaleString("pl-PL")}%</td>
                    <td>{r.topWrong ? `${LETTERS[r.topWrong.opt]} · ${r.topWrong.pct.toLocaleString("pl-PL")}%` : "–"}</td>
                    <td>{r.flags.map((f) => <span key={f} className={`tag qa-flag-${f}`}>{FLAG_LABEL[f].split(" (")[0]}</span>)}</td>
                    <td data-testid="qa-review">{r.review ? <span className={`tag review-${r.review.status}`} title={r.review.comment ?? ""}>{REVIEW_STATUS_LABEL[r.review.status]}</span> : <span className="muted small">–</span>}</td>
                  </tr>
                  {open === r.id && (
                    <tr><td colSpan={6}>
                      {!full[r.id] ? <SkeletonRows rows={1} height={60} /> : (
                        <div className="stack" style={{ gap: 6 }} data-testid="qa-full">
                          <div className="muted small">{full[r.id].edition}</div>
                          <div>{full[r.id].question}</div>
                          {full[r.id].options.map((o, i) => (
                            <div key={i} className={`qa-opt${r.correct.includes(i) ? " ok" : ""}`}>
                              <b>{LETTERS[i]}</b> {o} <span className="muted small">· wybrano {r.picks[i]}×{r.correct.includes(i) ? " · ✓ klucz" : ""}</span>
                            </div>
                          ))}
                          {full[r.id].explanation && <div className="muted small">Wyjaśnienie: {full[r.id].explanation}</div>}
                          {r.review && <div className="small" data-testid="qa-review-note">Recenzja ({r.review.by ?? "?"}): {REVIEW_STATUS_LABEL[r.review.status]}{r.review.comment ? ` – ${r.review.comment}` : ""}</div>}
                        </div>
                      )}
                    </td></tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > limit && <button className="btn small secondary" onClick={() => setLimit(limit + STEP)}>Pokaż kolejne {STEP}</button>}
      </>}
    </div>
  );
}

function CourseTable({ rows }: { rows: Data["course"] }) {
  const sorted = [...rows].sort((a, b) => a.pct - b.pct).slice(0, 100);
  if (!sorted.length) return <p className="muted" style={{ margin: 0 }}>Brak ćwiczeń z co najmniej 5 odpowiedziami.</p>;
  return (
    <div className="table-wrap">
      <p className="muted small">100 najtrudniejszych par hasło × typ ćwiczenia (od 5 odpowiedzi).</p>
      <table className="db-tables">
        <thead><tr><th>Hasło</th><th>Ćwiczenie</th><th className="num">Odp.</th><th className="num">Poprawne</th></tr></thead>
        <tbody>{sorted.map((r) => <tr key={`${r.item}|${r.exercise}`}><td>{r.title}</td><td>{r.exercise}</td><td className="num">{r.n}</td><td className="num">{r.pct.toLocaleString("pl-PL")}%</td></tr>)}</tbody>
      </table>
    </div>
  );
}
