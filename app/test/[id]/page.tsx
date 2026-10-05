"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, fmtPct, fmtPoints, LETTERS, rememberTest } from "@/lib/client";
import type { AnswerFeedback, TestState } from "@/lib/types";

type AnswerResponse = AnswerFeedback & { totalScore: number };

function fmtTime(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<TestState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const answers = useMemo(() => new Map(test?.answers.map((a) => [a.questionId, a])), [test]);

  useEffect(() => {
    api<TestState>(`/api/tests/${id}`)
      .then((t) => {
        setTest(t);
        const answered = new Set(t.answers.map((a) => a.questionId));
        const first = t.questions.findIndex((q) => !answered.has(q.id));
        setIndex(first === -1 ? t.questions.length - 1 : first);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const finish = useCallback(async () => {
    setBusy(true);
    try {
      setTest(await api<TestState>(`/api/tests/${id}/finish`, { method: "POST" }));
      rememberTest(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [id]);

  const finished = !!test?.finishedAt;
  const remaining = test ? new Date(test.deadline).getTime() - now : 0;

  const running = !!test && !finished;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (test && !finished && remaining <= 0 && !busy) finish();
  }, [test, finished, remaining, busy, finish]);

  if (error) return <p className="error">{error}</p>;
  if (!test) return <p className="muted">Ładowanie…</p>;

  if (finished) return <Summary test={test} />;

  const q = test.questions[index];
  const fb = answers.get(q.id);
  const isMulti = q.type === "multi";
  const allAnswered = test.answers.length === test.questions.length;

  function toggle(i: number) {
    if (fb) return;
    if (isMulti) setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
    else setSelected([i]);
  }

  async function check() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<AnswerResponse>(`/api/tests/${id}/answer`, {
        method: "POST",
        body: JSON.stringify({ questionId: q.id, selected }),
      });
      setTest((t) => t && { ...t, answers: [...t.answers, res], score: res.totalScore });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function go(next: number) {
    setIndex(next);
    setSelected([]);
    setError(null);
  }

  function optionClass(i: number) {
    const base = `option ${isMulti ? "multi" : ""}`;
    if (!fb) return `${base} ${selected.includes(i) ? "selected" : ""}`;
    const picked = fb.selected.includes(i);
    const right = fb.correct.includes(i);
    if (picked && right) return `${base} selected correct`;
    if (picked && !right) return `${base} selected wrong`;
    if (!picked && right) return `${base} missed`;
    return base;
  }

  function optionTag(i: number) {
    if (!fb) return null;
    const picked = fb.selected.includes(i);
    const right = fb.correct.includes(i);
    if (picked && right) return "✓ dobrze";
    if (picked && !right) return "✗ źle";
    if (!picked && right) return isMulti ? "✗ pominięta" : "poprawna";
    return isMulti ? "✓ słusznie puste" : null;
  }

  return (
    <div>
      <div className="bar">
        <span>Pytanie {index + 1}/{test.questions.length}</span>
        <span>Punkty: <strong>{fmtPoints(test.score)}</strong> / {fmtPoints(test.maxScore)}</span>
        <span className={`timer ${remaining < 60_000 ? "low" : ""}`}>⏱ {fmtTime(remaining)}</span>
      </div>
      <div className="progress"><div style={{ width: `${(test.answers.length / test.questions.length) * 100}%` }} /></div>

      <div className="card">
        <p className="muted" style={{ margin: "0 0 8px", fontSize: "0.85rem" }}>
          {isMulti ? "Wielokrotny wybór — zaznacz wszystkie poprawne" : "Jednokrotny wybór — zaznacz jedną odpowiedź"}
          {q.edition && ` · ${q.edition}`}
        </p>
        <p className="question">{q.question}</p>
        {q.options.map((opt, i) => (
          <button key={i} className={optionClass(i)} onClick={() => toggle(i)} disabled={!!fb}>
            <span className="letter">{LETTERS[i]}</span>
            <span>{opt}</span>
            {optionTag(i) && <span className="tag">{optionTag(i)}</span>}
          </button>
        ))}

        {fb && (
          <div className="feedback">
            <div className={`points ${fb.points > 0 ? "pos" : fb.points < 0 ? "neg" : ""}`}>
              {fb.points > 0 ? "+" : ""}{fmtPoints(fb.points)} pkt
              {" · "}Poprawna odpowiedź: {fb.correct.map((c) => LETTERS[c]).join(", ")}
            </div>
            <p style={{ margin: "8px 0 0" }}>{fb.explanation}</p>
          </div>
        )}
        {error && <p className="error">{error}</p>}

        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn secondary" onClick={() => go(index - 1)} disabled={index === 0}>←</button>
          {!fb ? (
            <button className="btn" onClick={check} disabled={busy || (!isMulti && selected.length === 0)}>
              Sprawdź
            </button>
          ) : index < test.questions.length - 1 ? (
            <button className="btn" onClick={() => go(index + 1)}>Dalej →</button>
          ) : null}
          {!fb && index < test.questions.length - 1 && (
            <button className="btn secondary" onClick={() => go(index + 1)}>Pomiń</button>
          )}
          <span className="spacer" />
          <button
            className={allAnswered ? "btn" : "btn secondary"}
            disabled={busy}
            onClick={() => {
              if (allAnswered || confirm("Zakończyć test? Pytania bez odpowiedzi dostaną 0 pkt.")) finish();
            }}
          >
            Zakończ test
          </button>
        </div>
      </div>
    </div>
  );
}

function Summary({ test }: { test: TestState }) {
  const percent = test.maxScore > 0 ? Math.round((test.score / test.maxScore) * 1000) / 10 : 0;
  const answers = new Map(test.answers.map((a) => [a.questionId, a]));
  return (
    <div className="stack">
      <h1>Wynik testu</h1>
      <div className="card">
        <div className="big">{fmtPct(percent)}</div>
        <p className="muted" style={{ margin: 0 }}>
          {fmtPoints(test.score)} / {fmtPoints(test.maxScore)} pkt · odpowiedzi: {test.answers.length}/{test.questions.length}
        </p>
      </div>
      <h2>Przegląd pytań</h2>
      <div className="card">
        <table>
          <thead><tr><th>#</th><th>Pytanie</th><th>Twoja</th><th>Poprawna</th><th>Pkt</th></tr></thead>
          <tbody>
            {test.questions.map((q, i) => {
              const a = answers.get(q.id);
              return (
                <tr key={q.id}>
                  <td>{i + 1}</td>
                  <td>{q.question}</td>
                  <td>{a ? a.selected.map((s) => LETTERS[s]).join(", ") || "—" : "—"}</td>
                  <td>{(test.solutions?.[q.id] ?? []).map((c) => LETTERS[c]).join(", ")}</td>
                  <td>{a ? fmtPoints(a.points) : 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="row">
        <Link className="btn" href="/">Nowy test</Link>
        <Link className="btn secondary" href="/stats">Statystyki</Link>
      </div>
    </div>
  );
}
