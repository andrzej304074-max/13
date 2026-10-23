"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Blocks } from "@/app/components/blocks";
import { LoadingPage } from "@/app/components/loading-page";
import { LoadError } from "@/app/components/load-error";
import { QuestionScratch } from "@/app/components/notes/question-scratch";
import { api, fmtPoints, withUser } from "@/lib/client";
import type { OpenMeta } from "@/lib/otwarte";
import { PROGNOZA_LABEL, type Answer, type Block, type PartResult, type PublicTask, type SelfRating } from "@/lib/otwarte-core";

type Checked = { parts: PartResult[]; score: number; max: number; attempt: string; given: Record<string, string[]>;
  solution: { label: string; answers: Answer[]; solution: Block[] }[] };
const fmtNum = (v: number, a: Answer) => `${v.toLocaleString("pl-PL", { maximumFractionDigits: 4 })}${a.unit ? ` ${a.unit}` : ""}`;
const fmtVal = (a: Answer) => [a.value, ...(a.alt ?? [])].map((v) => fmtNum(v, a)).join(" lub ");

/** Zadanie obliczeniowe: treść → brudnopis → wyniki podpunktów → sprawdzenie, punkty i pełny tok obliczeń; samoocena części opisowych. */
export function TaskView({ id }: { id: string }) {
  const [data, setData] = useState<{ meta: OpenMeta; task: PublicTask } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vals, setVals] = useState<Record<string, string[]>>({});
  const [res, setRes] = useState<Checked | null>(null);
  const [self, setSelf] = useState<Record<string, SelfRating>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { api<{ meta: OpenMeta; task: PublicTask }>(`/api/otwarte/${id}`).then(setData).catch((e) => setError(e.message)); }, [id]);
  if (error) return <LoadError message={error}><Link className="btn secondary" href="/zadania">← Zadania</Link></LoadError>;
  if (!data) return <LoadingPage />;
  const { meta, task } = data;
  const numeric = task.parts.some((p) => p.answers.length);
  const set = (label: string, i: number, v: string) => setVals((x) => { const a = [...(x[label] ?? [])]; a[i] = v; return { ...x, [label]: a }; });

  async function check() {
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      setRes(await api<Checked>(`/api/otwarte/${id}/sprawdz`, { method: "POST", body: JSON.stringify({ answers: vals }) }));
      setTimeout(() => document.querySelector(".task-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }
  async function saveSelf(next: Record<string, SelfRating>) {
    setSelf(next);
    if (!res) return;
    try {
      const r = await api<Checked>(`/api/otwarte/${id}/sprawdz`, { method: "POST", body: JSON.stringify({ attempt: res.attempt, self: next }) });
      setRes(r);
    } catch (e) { setMsg((e as Error).message); }
  }
  const sol = (label: string) => res?.solution.find((s) => s.label === label);
  const pr = (label: string) => res?.parts.find((p) => p.label === label);

  return (
    <div className="stack task">
      <nav className="muted small"><Link href="/zadania">← Zadania</Link></nav>
      <h1>{task.title}</h1>
      <p className="muted" style={{ marginTop: -8 }}>{meta.src === "prognoza" ? <span className="open-src" data-testid="src-label">{PROGNOZA_LABEL}</span> : <>OWE {meta.edRoman}</>} ({meta.year}) · etap {meta.stageName} · {task.pts} pkt · hasło edycji: „{meta.theme}”</p>
      {task.own && meta.src === "prognoza" && <p className="card open-own" role="note" data-testid="own-note">Zadanie przygotowane w aplikacji jako prognoza na XL edycję OWE (2026/2027) – nie pochodzi z arkusza olimpiady. Wyniki przeliczono skryptem z danych zadania; dane liczbowe są przybliżone lub umowne, a źródła podano w treści.</p>}
      {task.own && meta.src !== "prognoza" && <p className="card open-own" role="note" data-testid="own-note">Oficjalny klucz zawiera tylko treść tego zestawu – wyniki i tok rozwiązania opracowano w aplikacji. Traktuj je jako przykładowe, nie jako wzorzec jury.</p>}
      <div className="card stack task-body"><Blocks blocks={task.intro} /></div>

      <ol className="task-parts">
        {task.parts.map((p) => {
          const r = pr(p.label), s = sol(p.label);
          return (
            <li key={p.label} className="card stack task-part" data-testid="task-part" data-label={p.label}>
              <div className="task-part-head"><strong>{p.label})</strong> <span>{p.prompt}</span>{p.pts !== null && <span className="muted small"> ({p.pts} pkt)</span>}</div>
              {p.answers.map((a, i) => {
                const ok = r?.correct[i];
                return (
                  <label key={i} className={`task-answer${r ? (ok ? " ok" : " bad") : ""}`}>
                    <span>{a.label}{a.unit ? ` (${a.unit})` : ""}</span>
                    <input className="select" inputMode="decimal" autoComplete="off" value={vals[p.label]?.[i] ?? ""} disabled={!!res}
                      onChange={(e) => set(p.label, i, e.target.value)} placeholder="wynik" data-testid="task-input" />
                    {r && <span className="task-mark" aria-label={ok ? "poprawnie" : "błędnie"}>{ok ? "✓" : `✗ poprawnie: ${fmtVal(s!.answers[i])}`}</span>}
                  </label>
                );
              })}
              {!p.answers.length && !res && <p className="muted small" style={{ margin: 0 }}>Część opisowa – odpowiedz w brudnopisie; po sprawdzeniu porównasz z odpowiedzią z klucza.</p>}
              {res && s && (
                <div className="task-solution stack" data-testid="task-solution">
                  <strong>Rozwiązanie</strong>
                  <Blocks blocks={s.solution} />
                  {!p.answers.length && (
                    <div className="row self-rate" role="group" aria-label="Samoocena">
                      <span className="muted small">Twoja odpowiedź:</span>
                      {([[1, "mam to"], [0.5, "częściowo"], [0, "nie mam"]] as const).map(([v, l]) => (
                        <button key={v} type="button" className={`btn small${self[p.label] === v ? "" : " secondary"}`} aria-pressed={self[p.label] === v}
                          onClick={() => saveSelf({ ...self, [p.label]: v })} data-testid={`self-${v}`}>{l}</button>
                      ))}
                    </div>
                  )}
                  {r && <span className="muted small">Punkty: {fmtPoints(r.pts)} / {r.max}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {msg && <p className="error" role="alert">{msg}</p>}
      {!res ? (
        <div className="row">
          <button className="btn" onClick={check} disabled={busy} data-testid="task-check">{busy ? "Sprawdzanie…" : numeric ? "Sprawdź wyniki i pokaż rozwiązanie" : "Pokaż rozwiązanie"}</button>
          <span className="muted small">Po sprawdzeniu wyniki zostaną zapisane – nie da się ich poprawić w tym podejściu.</span>
        </div>
      ) : (
        <div className="card task-result" data-testid="task-result">
          <div className="big">{fmtPoints(res.score)} / {res.max} pkt</div>
          <p className="muted" style={{ margin: 0 }}>Wyniki liczbowe sprawdzone automatycznie; części opisowe – według Twojej samooceny. Wynik zapisany w statystykach.</p>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn secondary" onClick={() => { setRes(null); setVals({}); setSelf({}); window.scrollTo({ top: 0 }); }}>↺ Rozwiąż jeszcze raz</button>
            <Link className="btn secondary" href={withUser("/zadania")}>Inne zadania</Link>
          </div>
        </div>
      )}
      <QuestionScratch refKey={`zadanie:${id}`} />
    </div>
  );
}
