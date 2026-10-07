"use client";

import { useCallback, useState } from "react";
import { Graph } from "@/app/components/graph";
import { checkNumber, type Exercise } from "@/lib/nauka-logic";
import { EXERCISE_LABELS, type ZSource } from "@/lib/nauka-types";
import { CaseContext, CheckButton, useEnter, useNumberKeys, type OnResult } from "./ui";

/** Widoki ćwiczeń lekcji „Zrozumienie”: karta wyjaśnienia, łańcuch, kategorie, zadanie liczbowe, wykres. */

type Ex<T extends Exercise["type"]> = Extract<Exercise, { type: T }>;

const fmt = (n: number) => n.toLocaleString("pl-PL", { maximumFractionDigits: 4 });

function Badge({ ex, fallback }: { ex: { stat?: keyof typeof EXERCISE_LABELS }; fallback: string }) {
  return <span className="learn-badge">{ex.stat ? EXERCISE_LABELS[ex.stat] : fallback}</span>;
}

export function Sources({ sources }: { sources: ZSource[] }) {
  if (!sources.length) return null;
  return (
    <div className="sources">
      <small>Źródła (dostęp):</small>
      <ul>
        {sources.map((s) => (
          <li key={s.u}>
            <a href={s.u} target="_blank" rel="noopener noreferrer">{s.n}</a> <span className="muted">({s.d})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExplainCard({ ex, onNext }: { ex: Ex<"karta">; onNext: () => void }) {
  return (
    <div className="stack">
      <span className="learn-badge">Wyjaśnienie</span>
      <div className="card learn-intro stack">
        <h2 style={{ margin: 0 }}>{ex.title}</h2>
        <p style={{ margin: 0 }}>{ex.text}</p>
        {ex.g && <Graph spec={ex.g} />}
        {ex.w && <pre className="formula">{ex.w}</pre>}
        {ex.p && <p className="muted" style={{ margin: 0 }}><strong>Przykład:</strong> {ex.p}</p>}
      </div>
      <div className="learn-actions">
        <button className="btn" onClick={onNext} autoFocus>Dalej</button>
      </div>
    </div>
  );
}

export function Chain({ ex, locked, onResult }: { ex: Ex<"lancuch">; locked: boolean; onResult: OnResult }) {
  const [placed, setPlaced] = useState<string[]>([]);
  const rest = ex.shuffled.filter((s) => !placed.includes(s));
  const check = () => {
    const ok = placed.every((p, i) => p === ex.steps[i]);
    onResult([{ item: ex.item, correct: ok }], ex, {
      correct: ok,
      title: ok ? "Dobra kolejność!" : "Poprawna kolejność:",
      detail: (
        <>
          <ol style={{ margin: "4px 0 0", paddingLeft: 20 }}>{ex.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          {ex.why && <p style={{ margin: "6px 0 0" }}>{ex.why}</p>}
        </>
      ),
    });
  };
  return (
    <div className="stack">
      <Badge ex={ex} fallback="Łańcuch przyczyna → skutek" />
      <CaseContext ctx={ex.ctx} />
      <p className="question" style={{ margin: 0 }}>{ex.q}</p>
      <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>Stukaj kroki od pierwszego do ostatniego. Stuknij ułożony krok, żeby go cofnąć.</p>
      <div className="order-slots">
        {ex.steps.map((_, i) => {
          const s = placed[i];
          const ok = locked && s ? s === ex.steps[i] : null;
          return (
            <button key={i} className={`slot ${s ? "filled" : ""} ${ok === true ? "correct" : ok === false ? "wrong" : ""}`}
              disabled={locked || !s} onClick={() => setPlaced(placed.filter((p) => p !== s))}>
              <span className="tile-no">{i + 1}</span>{s ?? <span className="muted">…</span>}
            </button>
          );
        })}
      </div>
      <div className="chips">
        {rest.map((s) => <button key={s} className="chip" disabled={locked} onClick={() => setPlaced([...placed, s])}>{s}</button>)}
      </div>
      <CheckButton disabled={placed.length < ex.steps.length} onClick={check} locked={locked} />
    </div>
  );
}

export function Buckets({ ex, locked, onResult }: { ex: Ex<"kategorie">; locked: boolean; onResult: OnResult }) {
  const [chosen, setChosen] = useState<(number | null)[]>(() => ex.entries.map(() => null));
  const check = () => {
    const wrong = ex.entries.filter((e, i) => chosen[i] !== e.cat);
    onResult([{ item: ex.item, correct: wrong.length === 0 }], ex, {
      correct: wrong.length === 0,
      title: wrong.length === 0 ? "Wszystko we właściwych kategoriach!" : `Błędnie przypisane: ${wrong.length} z ${ex.entries.length}`,
      detail: (
        <>
          {wrong.length > 0 && (
            <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
              {wrong.map((e) => <li key={e.text}>{e.text} → <strong>{ex.cats[e.cat]}</strong></li>)}
            </ul>
          )}
          {ex.why && <p style={{ margin: "6px 0 0" }}>{ex.why}</p>}
        </>
      ),
    });
  };
  return (
    <div className="stack">
      <Badge ex={ex} fallback="Sortowanie do kategorii" />
      <CaseContext ctx={ex.ctx} />
      <p className="question" style={{ margin: 0 }}>{ex.q}</p>
      <div className="buckets">
        {ex.entries.map((e, i) => (
          <div key={e.text} className={`bucket-row ${locked ? (chosen[i] === e.cat ? "ok" : "bad") : ""}`}>
            <span>{e.text}</span>
            <div className="seg" role="group" aria-label={`Kategoria: ${e.text}`}>
              {ex.cats.map((c, k) => (
                <button key={c} disabled={locked} aria-pressed={chosen[i] === k}
                  className={`${chosen[i] === k ? "active" : ""} ${locked && k === e.cat ? "right" : ""}`}
                  onClick={() => setChosen(chosen.map((v, j) => (j === i ? k : v)))}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <CheckButton disabled={chosen.some((c) => c === null)} onClick={check} locked={locked} />
    </div>
  );
}

export function NumberTask({ ex, locked, onResult }: { ex: Ex<"liczba">; locked: boolean; onResult: OnResult }) {
  const [value, setValue] = useState("");
  const check = () => {
    if (!value.trim()) return;
    const ok = checkNumber(value, ex.a, ex.tol);
    onResult([{ item: ex.item, correct: ok }], ex, {
      correct: ok,
      title: ok ? `Dobrze! ${fmt(ex.a)}${ex.unit ? ` ${ex.unit}` : ""}` : `Wynik: ${fmt(ex.a)}${ex.unit ? ` ${ex.unit}` : ""}`,
      detail: (
        <>
          {!ok && <span className="muted">wpisano: „{value}” · </span>}
          <strong>Rozwiązanie:</strong>
          <ol style={{ margin: "4px 0 0", paddingLeft: 20 }}>{ex.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      ),
    });
  };
  return (
    <div className="stack">
      <Badge ex={ex} fallback="Zadanie obliczeniowe" />
      <CaseContext ctx={ex.ctx} />
      <div className="card prompt">{ex.q}</div>
      <form onSubmit={(e) => { e.preventDefault(); if (!locked) check(); }}>
        <div className="number-row">
          <input className="select learn-input" value={value} onChange={(e) => setValue(e.target.value)} disabled={locked}
            autoFocus autoComplete="off" inputMode="decimal" placeholder="Wynik…" aria-label="Wynik" />
          {ex.unit && <span className="unit">{ex.unit}</span>}
        </div>
        {!locked && (
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Przecinek albo kropka; dopuszczalne zaokrąglenie ±{fmt(ex.tol)}.
          </p>
        )}
        <CheckButton disabled={!value.trim()} onClick={check} locked={locked} />
      </form>
    </div>
  );
}

export function GraphChoice({ ex, locked, onResult }: { ex: Ex<"wykres">; locked: boolean; onResult: OnResult }) {
  const [sel, setSel] = useState<number | null>(null);
  const check = useCallback(() => {
    if (sel === null) return;
    const ok = sel === ex.correct;
    onResult([{ item: ex.item, correct: ok }], ex, {
      correct: ok,
      title: ok ? "Dobrze!" : "Poprawna odpowiedź:",
      detail: <>{!ok && <>{ex.options[ex.correct]}. </>}{ex.why}</>,
    });
  }, [sel, ex, onResult]);
  useNumberKeys(ex.options.length, locked, setSel);
  useEnter(!locked && sel !== null, check);
  return (
    <div className="stack">
      <Badge ex={ex} fallback="Wykres" />
      <CaseContext ctx={ex.ctx} />
      <p className="question" style={{ margin: 0 }}>{ex.q}</p>
      <div className="card"><Graph spec={ex.g} mode={locked ? "after" : "before"} /></div>
      <div className="tiles long">
        {ex.options.map((o, i) => {
          const cls = locked ? (i === ex.correct ? "correct" : i === sel ? "wrong" : "") : i === sel ? "selected" : "";
          return (
            <button key={i} className={`tile ${cls}`} disabled={locked} onClick={() => setSel(i)}>
              <span className="tile-no">{i + 1}</span>{o}
            </button>
          );
        })}
      </div>
      <CheckButton disabled={sel === null} onClick={check} locked={locked} />
    </div>
  );
}
