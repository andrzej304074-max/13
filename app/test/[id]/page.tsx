"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QuestionScratch } from "@/app/components/notes/question-scratch";
import { api, ApiError, fmtPct, fmtPoints, isNetworkError, LETTERS, rememberTest } from "@/lib/client";
import { correctUnits, multiHits, UNITS_PER_QUESTION } from "@/lib/scoring";
import type { AnswerFeedback, PublicQuestion, TestState } from "@/lib/types";
import { LoadingPage } from "@/app/components/loading-page";
import { SpeakButton } from "@/app/components/speech/speak";
import { correctText, questionAnswer, questionAsk } from "@/lib/speech-catalog";
import { stopGroup } from "@/lib/speech";
import { SOURCES, sourceOf } from "@/lib/question-source";

type AnswerResponse = AnswerFeedback & { totalScore: number; nextQuestion?: PublicQuestion | null };

function fmtTime(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Litery poprawnych odpowiedzi; w wielokrotnym wyborze bywa, że żadna nie jest poprawna (każde pole ocenia się osobno). */

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<TestState | null>(null);
  // błąd wczytania testu (cały ekran z „Spróbuj ponownie”) i błąd akcji (pod pytaniem – test zostaje na ekranie)
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // nieudane zakończenie (np. koniec czasu bez sieci) – bez ponawiania co 0,5 s; ponowi powrót sieci/karty albo przycisk
  const [finishFailed, setFinishFailed] = useState(false);
  const [index, setIndex] = useState(0);
  // następne pytanie – czytanie poprzedniego milknie
  useEffect(() => () => stopGroup("pytanie:"), [index]);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const answers = useMemo(() => new Map(test?.answers.map((a) => [a.questionId, a])), [test]);

  /** Stan testu z serwera. Pierwsze wczytanie ustawia pytanie; kolejne (powrót sieci, karty) tylko synchronizują. */
  const load = useCallback(async (first: boolean): Promise<TestState | null> => {
    try {
      const t = await api<TestState>(`/api/tests/${id}`);
      if (first) setTest(t);
      else {
        // synchronizacja (powrót sieci, karty): migawka z serwera mogła wyjść przed zapisem odpowiedzi, która właśnie
        // wróciła (check) – odpowiedzi i dolosowane pytania sumujemy, a nie nadpisujemy
        setTest((prev) => {
          // test zakończony (gdzie indziej albo po czasie) – stan z serwera jest ostateczny
          if (!prev || t.finishedAt) return t;
          const have = new Set(t.answers.map((a) => a.questionId));
          return {
            ...t,
            answers: [...t.answers, ...prev.answers.filter((a) => !have.has(a.questionId))],
            questions: t.questions.length >= prev.questions.length ? t.questions : prev.questions,
          };
        });
      }
      setLoadError(null);
      if (first) {
        const answered = new Set(t.answers.map((a) => a.questionId));
        const i = t.questions.findIndex((q) => !answered.has(q.id));
        setIndex(i === -1 ? t.questions.length - 1 : i);
      }
      return t;
    } catch (e) {
      if (first) setLoadError((e as Error).message);
      return null;
    }
  }, [id]);
  useEffect(() => { load(true); }, [load]);

  // powrót sieci albo aplikacji z tła (iPhone): dociągnij stan i odblokuj zakończenie po czasie
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState !== "visible") return;
      setFinishFailed(false);
      load(!test);
    };
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", sync);
    return () => { window.removeEventListener("online", sync); document.removeEventListener("visibilitychange", sync); };
  }, [load, test]);

  const finish = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setTest(await api<TestState>(`/api/tests/${id}/finish`, { method: "POST" }));
      rememberTest(null);
      setFinishFailed(false);
    } catch (e) {
      setError((e as Error).message);
      setFinishFailed(true);
    } finally {
      setBusy(false);
    }
  }, [id]);

  const finished = !!test?.finishedAt;
  const endless = test?.mode === "endless";
  const remaining = test?.deadline ? new Date(test.deadline).getTime() - now : Infinity;

  const running = !!test && !finished && !endless;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (test && !finished && remaining <= 0 && !busy && !finishFailed) finish();
  }, [test, finished, remaining, busy, finish, finishFailed]);

  if (loadError && !test) {
    return (
      <div className="stack" data-testid="test-load-error">
        <p className="error">{loadError}</p>
        <p className="muted" style={{ margin: 0 }}>Twoje dotychczasowe odpowiedzi są zapisane – test wczyta się od miejsca, w którym skończyłeś.</p>
        <div className="row">
          <button className="btn" onClick={() => { setLoadError(null); load(true); }}>Spróbuj ponownie</button>
          <Link className="btn secondary" href="/">← Nowy test</Link>
        </div>
      </div>
    );
  }
  if (!test) return <LoadingPage />;

  if (finished) return <Summary test={test} />;

  const q = test.questions[index];
  const fb = answers.get(q.id);
  const isMulti = q.type === "multi";
  const allAnswered = !endless && test.answers.length === test.questions.length;

  function toggle(i: number) {
    if (fb) return;
    if (isMulti) setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
    else setSelected([i]);
  }

  async function check(skip = false) {
    setBusy(true);
    setError(null);
    try {
      const res = await api<AnswerResponse>(`/api/tests/${id}/answer`, {
        method: "POST",
        body: JSON.stringify({ questionId: q.id, selected, skip }),
      });
      const { totalScore, nextQuestion, ...answer } = res;
      setTest(
        (t) =>
          t && {
            ...t,
            answers: [...t.answers, answer],
            score: totalScore,
            maxScore: t.mode === "endless" ? (t.answers.length + 1) * 2 : t.maxScore,
            correct: t.correct + correctUnits(t.type, answer.points, answer.skipped),
            total: t.mode === "endless" ? t.total + UNITS_PER_QUESTION[t.type] : t.total,
            questions: nextQuestion ? [...t.questions, nextQuestion] : t.questions,
          },
      );
      if (skip) go(index + 1);
    } catch (e) {
      // odpowiedź mogła dojść do serwera mimo błędu sieci (albo poszła już wcześniej) – sprawdź stan testu
      if (isNetworkError(e) || (e instanceof ApiError && e.status === 409)) {
        const t = await load(false);
        if (t?.answers.some((a) => a.questionId === q.id)) {
          if (skip) go(index + 1);
          return;
        }
        if (t?.finishedAt) return;
      }
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
        <span>Pytanie {index + 1}{endless ? "" : `/${test.questions.length}`}</span>
        <span>Punkty: <strong>{fmtPoints(test.score)}</strong> / {fmtPoints(test.maxScore)}</span>
        {endless ? (
          <span className="muted">bez limitu</span>
        ) : (
          <span className={`timer ${remaining < 60_000 ? "low" : ""}`}>⏱ {fmtTime(remaining)}</span>
        )}
      </div>
      {!endless && (
        <div className="progress"><div style={{ width: `${(test.answers.length / test.questions.length) * 100}%` }} /></div>
      )}

      <div className="card">
        <p className="muted" style={{ margin: "0 0 8px", fontSize: "0.85rem" }}>
          {isMulti ? "Wielokrotny wybór — zaznacz wszystkie poprawne" : "Jednokrotny wybór — zaznacz jedną odpowiedź"}
          {test.bank === "mix" && ` · ${sourceLabel(q.id)}`}
          {q.edition && !(test.bank === "mix" && !q.id.startsWith("owe")) && ` · ${q.edition}`}
        </p>
        <div className="q-head">
          <p className="question">{q.question}</p>
          {/* pytanie z odpowiedziami, po sprawdzeniu dodatkowo poprawna odpowiedź i wyjaśnienie (teksty jak w katalogu nagrań) */}
          <SpeakButton compact label="Czytaj pytanie" group={`pytanie:${q.id}`} continuous={!!fb} testid="speak-question"
            items={() => [questionAsk(q, `Pytanie ${index + 1}`), ...(fb ? [questionAnswer(q, fb.correct, fb.explanation, `Pytanie ${index + 1} – wyjaśnienie`)] : [])]} />
        </div>
        {q.options.map((opt, i) => (
          <button key={i} className={optionClass(i)} onClick={() => toggle(i)} disabled={!!fb}>
            <span className="letter">{LETTERS[i]}</span>
            <span>{opt}</span>
            {optionTag(i) && <span className="tag">{optionTag(i)}</span>}
          </button>
        ))}

        {fb?.skipped && (
          <div className="feedback">
            <div className="points">Pominięte · 0 pkt · Poprawna odpowiedź: {correctText(fb.correct)}</div>
            <p style={{ margin: "8px 0 0" }}>{fb.explanation}</p>
          </div>
        )}
        {fb && !fb.skipped && (
          <div className="feedback">
            <div className={`points ${fb.points > 0 ? "pos" : fb.points < 0 ? "neg" : ""}`}>
              {fb.points > 0 ? "+" : ""}{fmtPoints(fb.points)} pkt
              {isMulti && <>{" · "}Trafne pola: {multiHits(fb.selected, fb.correct)}/4</>}
              {" · "}Poprawna odpowiedź: {correctText(fb.correct)}
            </div>
            <p style={{ margin: "8px 0 0" }}>{fb.explanation}</p>
          </div>
        )}
        {error && <p className="error" role="alert" data-testid="test-error">{error}</p>}

        <div className="row" style={{ marginTop: 16 }}>
          {!endless && (
            <button className="btn secondary" onClick={() => go(index - 1)} disabled={index === 0}>←</button>
          )}
          {!fb ? (
            <button className="btn" onClick={() => check()} disabled={busy} data-testid="check"
              title={selected.length === 0 ? "Bez zaznaczenia – 0 pkt, zobaczysz poprawną odpowiedź" : undefined}>
              {busy ? "Sprawdzanie…" : error ? "Spróbuj ponownie" : selected.length === 0 ? "Sprawdź (0 pkt)" : "Sprawdź"}
            </button>
          ) : index < test.questions.length - 1 ? (
            <button className="btn" onClick={() => go(index + 1)}>Dalej →</button>
          ) : null}
          {!fb && endless && (
            <button className="btn secondary" onClick={() => check(true)} disabled={busy}>Pomiń</button>
          )}
          {!fb && !endless && index < test.questions.length - 1 && (
            <button className="btn secondary" onClick={() => go(index + 1)}>Pomiń</button>
          )}
          <span className="spacer" />
          <button
            className={allAnswered ? "btn" : "btn secondary"}
            disabled={busy}
            onClick={() => {
              if (endless || allAnswered || confirm("Zakończyć test? Pytania bez odpowiedzi dostaną 0 pkt.")) finish();
            }}
          >
            Zakończ test
          </button>
        </div>
        <QuestionScratch refKey={`${sourceOf(q.id)}:${q.id}`} />
      </div>
    </div>
  );
}

function Summary({ test }: { test: TestState }) {
  const percent = test.total > 0 ? Math.round((test.correct / test.total) * 1000) / 10 : 0;
  const unit = test.type === "multi" ? "punkty" : "poprawne odpowiedzi";
  const answers = new Map(test.answers.map((a) => [a.questionId, a]));
  return (
    <div className="stack">
      <h1>Wynik testu</h1>
      <div className="card">
        <div className="big">{fmtPct(percent)}</div>
        <p className="muted" style={{ margin: 0 }}>
          {unit}: {test.correct}/{test.total} · {fmtPoints(test.score)} / {fmtPoints(test.maxScore)} pkt ·{" "}
          {test.mode === "endless"
            ? `rozwiązane: ${test.answers.filter((a) => !a.skipped).length}, pominięte: ${test.answers.filter((a) => a.skipped).length}`
            : `odpowiedzi: ${test.answers.length}/${test.questions.length}`}
        </p>
      </div>
      <h2>Przegląd pytań</h2>
      <div className="card">
        <div className="table-wrap"><table>
          <thead><tr><th>#</th><th>Pytanie</th><th>Twoja</th><th>Poprawna</th><th>Pkt</th></tr></thead>
          <tbody>
            {test.questions.map((q, i) => {
              const a = answers.get(q.id);
              return (
                <tr key={q.id}>
                  <td>{i + 1}</td>
                  <td>{q.question}</td>
                  <td>{a?.skipped ? "pom." : a ? a.selected.map((s) => LETTERS[s]).join(", ") || "—" : "—"}</td>
                  <td>{(test.solutions?.[q.id] ?? []).map((c) => LETTERS[c]).join(", ")}</td>
                  <td>{a ? fmtPoints(a.points) : 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>
      <div className="row">
        <Link className="btn" href={test.bank === "slownik" ? "/slownik" : test.bank === "mix" ? "/testy/wszystkie" : "/"}>Nowy test</Link>
        <Link className="btn secondary" href={`/stats?bank=${test.bank}`}>Statystyki</Link>
        <Link className="btn secondary" href="/testy/wszystkie?bledy=1" data-testid="retry-mistakes">🔁 Powtórz błędy</Link>
      </div>
    </div>
  );
}

/** Źródło pytania w teście „Wszystkie pytania” (z prefiksu id). */
function sourceLabel(id: string): string {
  const s = SOURCES.find((x) => x.id === sourceOf(id))!;
  return `${s.icon} ${s.label}`;
}
