"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SkeletonRows } from "@/app/components/loading-page";
import { api, LETTERS } from "@/lib/client";
import { SOURCES } from "@/lib/question-source";
import { FLAG_LABEL, type QFlag } from "@/lib/question-stats-core";
import { REVIEW_KIND_LABEL, REVIEW_STATUS_LABEL, type Review, type ReviewKind, type ReviewStatus } from "@/lib/review-core";

type Q = { ref: string; src: string; question: string; n: number; pct: number; flags: QFlag[]; reports: number; review: Review | null };
type Bug = { ref: string; text: string; page: string | null; section: string | null; status: string; createdAt: string; review: Review | null };
type Prog = { ref: string; title: string; href: string; type: "zadanie" | "esej"; review: Review | null };
type Data = { questions: Q[]; bugs: Bug[]; prognoza: Prog[] };
type Full = { id: string; edition: string; question: string; options: string[]; correct: number[]; explanation: string | null };
const SRC = Object.fromEntries(SOURCES.map((s) => [s.id, `${s.icon} ${s.label}`]));
const when = (iso: string) => new Date(iso).toLocaleDateString("pl-PL");

/** Ocena jednej pozycji: OK / do poprawy / komentarz; zapis od razu na serwerze. */
function ReviewBox({ kind, refId, review, onSaved }: { kind: ReviewKind; refId: string; review: Review | null; onSaved: (r: Review | null) => void }) {
  const [comment, setComment] = useState(review?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(status: ReviewStatus | null) {
    setBusy(true); setError(null);
    try {
      onSaved((await api<{ review: Review | null }>("/api/recenzja/ocena", { method: "POST", body: JSON.stringify({ kind, ref: refId, status, comment }) })).review);
    } catch (e) { setError(e instanceof Error ? e.message : "Błąd."); } finally { setBusy(false); }
  }
  return (
    <div className="review-box stack" data-testid="review-box">
      <textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 2000))} rows={2} placeholder="Komentarz (przy „do poprawy” – wymagany)" aria-label="Komentarz" />
      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        <button className={`btn small${review?.status === "ok" ? "" : " secondary"}`} disabled={busy} onClick={() => save("ok")} data-testid="review-ok">✓ OK</button>
        <button className={`btn small${review?.status === "poprawa" ? "" : " secondary"}`} disabled={busy} onClick={() => save("poprawa")} data-testid="review-fix">✎ Do poprawy</button>
        {review && <button className="linkbtn small" disabled={busy} onClick={() => save(null)}>wyczyść ocenę</button>}
        {review && <span className="muted small">{REVIEW_STATUS_LABEL[review.status]} · {review.by ?? "?"} · {when(review.at)}</span>}
      </div>
      {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
    </div>
  );
}

const Status = ({ r }: { r: Review | null }) =>
  r ? <span className={`tag review-${r.status}`} data-review={r.status}>{REVIEW_STATUS_LABEL[r.status]}</span> : <span className="tag" data-review="">do oceny</span>;

export function ReviewPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ReviewKind>("pytanie");
  const [only, setOnly] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [full, setFull] = useState<Record<string, Full>>({});
  // ocenione w tej wizycie zostają na liście (ze statusem) do odświeżenia – nie znikają spod kursora
  const [rated, setRated] = useState<Set<string>>(new Set());
  useEffect(() => { api<Data>("/api/recenzja").then(setData).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    if (tab !== "pytanie" || !open || full[open]) return;
    api<Full>(`/api/recenzja/pytanie?id=${encodeURIComponent(open)}`).then((f) => setFull((m) => ({ ...m, [f.id]: f }))).catch(() => {});
  }, [tab, open, full]);
  const setReview = (kind: ReviewKind, ref: string, review: Review | null) => {
    setRated((s) => new Set(s).add(`${kind}:${ref}`));
    setData((d) => d && ({
    questions: kind === "pytanie" ? d.questions.map((q) => (q.ref === ref ? { ...q, review } : q)) : d.questions,
    bugs: kind === "zgloszenie" ? d.bugs.map((q) => (q.ref === ref ? { ...q, review } : q)) : d.bugs,
    prognoza: kind === "prognoza" ? d.prognoza.map((q) => (q.ref === ref ? { ...q, review } : q)) : d.prognoza,
    }));
  };
  const counts = useMemo(() => data && {
    pytanie: data.questions.filter((x) => !x.review).length,
    zgloszenie: data.bugs.filter((x) => !x.review).length,
    prognoza: data.prognoza.filter((x) => !x.review).length,
  }, [data]);
  if (error) return <div className="card"><p className="error" style={{ margin: 0 }}>{error}</p></div>;
  if (!data || !counts) return <div className="card"><SkeletonRows rows={3} height={48} label="Ładowanie listy do przeglądu" /></div>;
  const list: { ref: string; review: Review | null }[] = tab === "pytanie" ? data.questions : tab === "zgloszenie" ? data.bugs : data.prognoza;
  const shown = list.filter((x) => !only || !x.review || rated.has(`${tab}:${x.ref}`));
  return (
    <div className="stack" data-testid="review-panel">
      <div className="seg" role="group" aria-label="Rodzaj" style={{ flexWrap: "wrap" }}>
        {(Object.keys(REVIEW_KIND_LABEL) as ReviewKind[]).map((k) => (
          <button key={k} className={tab === k ? "active" : ""} aria-pressed={tab === k} onClick={() => { setTab(k); setOpen(null); }} data-kind={k}>
            {REVIEW_KIND_LABEL[k]} ({counts[k]})
          </button>
        ))}
      </div>
      <label className="check"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} data-testid="review-only" /> tylko bez oceny</label>
      {shown.length === 0 ? <div className="card muted">Nic do przeglądu.</div> : (
        <ul className="review-list" data-testid="review-list">
          {shown.slice(0, 100).map((x) => {
            const isOpen = open === x.ref;
            return (
              <li key={x.ref} className="card stack" data-ref={x.ref}>
                <button className="review-head" onClick={() => setOpen(isOpen ? null : x.ref)} aria-expanded={isOpen}>
                  <Status r={x.review} />
                  {tab === "pytanie" && (() => { const q = x as Q; return <span><b>{q.question}</b> <span className="muted small">{SRC[q.src]} · {q.n} odp. · {q.pct}%{q.flags.map((f) => ` · ${FLAG_LABEL[f]}`).join("")}{q.reports ? ` · zgłoszenia: ${q.reports}` : ""}</span></span>; })()}
                  {tab === "zgloszenie" && (() => { const b = x as Bug; return <span><b>{b.text.length > 140 ? `${b.text.slice(0, 137)}…` : b.text}</b> <span className="muted small">{when(b.createdAt)} · {b.status}{b.section ? ` · ${b.section}` : ""}</span></span>; })()}
                  {tab === "prognoza" && (() => { const p = x as Prog; return <span><b>{p.title}</b> <span className="muted small">{p.type}</span></span>; })()}
                </button>
                {isOpen && (
                  <>
                    {tab === "pytanie" && (full[x.ref] ? (
                      <div className="small" data-testid="review-question">
                        <p style={{ margin: 0 }}>{full[x.ref].question} <span className="muted">({full[x.ref].edition})</span></p>
                        <ol className="plain-list">
                          {full[x.ref].options.map((o, i) => <li key={i} className={full[x.ref].correct.includes(i) ? "ok-msg" : ""}>{LETTERS[i]}. {o}{full[x.ref].correct.includes(i) ? " ✓" : ""}</li>)}
                        </ol>
                        {full[x.ref].explanation && <p className="muted" style={{ margin: 0 }}>{full[x.ref].explanation}</p>}
                      </div>
                    ) : <SkeletonRows rows={1} height={60} label="Ładowanie pytania" />)}
                    {tab === "zgloszenie" && (() => { const b = x as Bug; return <p className="small" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{b.text}{b.page && <><br /><Link href={b.page}>Strona: {b.page}</Link></>}</p>; })()}
                    {tab === "prognoza" && <Link href={(x as Prog).href} target="_blank">Otwórz {(x as Prog).type === "esej" ? "esej" : "zadanie"} →</Link>}
                    <ReviewBox kind={tab} refId={x.ref} review={x.review} onSaved={(r) => setReview(tab, x.ref, r)} />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {shown.length > 100 && <p className="muted small">Pokazano 100 z {shown.length} – oceń je, żeby zobaczyć kolejne.</p>}
    </div>
  );
}
