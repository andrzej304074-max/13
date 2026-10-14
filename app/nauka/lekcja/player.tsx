"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QuestionScratch } from "@/app/components/notes/question-scratch";
import { api, ApiError, fmtPct, isTyping, LETTERS } from "@/lib/client";
import { fmtDuration, rememberLesson } from "@/lib/nauka-client";
import {
  buildExercises, checkTyped, computeXp, eventOf, acceptedAnswers, questionCorrect, shuffle, yearOf,
  exerciseKind, XP_COMBO_EVERY, type Exercise,
} from "@/lib/nauka-logic";
import { EXERCISE_LABELS, MAX_LEVEL, subsFor, type AnswerLog, type CourseItem, type LessonPayload } from "@/lib/nauka-types";
import type { FinishResult } from "@/lib/nauka";
import { scoreAnswer } from "@/lib/scoring";
import { CaseContext, CheckButton, useEnter, useNumberKeys, type Feedback, type OnResult } from "./ui";
import { Buckets, Chain, ExplainCard, GraphChoice, NumberTask, Sources } from "./zrozum-views";
import { useAccess } from "@/app/components/access";
import { SpeakButton } from "@/app/components/speech/speak";
import { speechItem } from "@/lib/speech-text";
import { stopGroup } from "@/lib/speech";

const KIND_LABEL: Record<string, string> = {
  pojecie: "Pojęcie", wzor: "Wzór", osoba: "Osoba", instytucja: "Instytucja", data: "Data", przepis: "Przepis",
  zrozumienie: "Zrozumienie",
};


/** Odpowiedź do pokazania w pasku informacji zwrotnej. */
function answerText(item: CourseItem) {
  return item.kind === "data" ? `${yearOf(item)} – ${eventOf(item)}` : item.s;
}

const RESUME_PREFIX = "owe:lesson:";
const RESUME_DAYS = 7;
interface Saved {
  v: 1; at: number; session: { id: string; level: number }; queue: Exercise[]; pos: number; log: AnswerLog[];
  combo: number; startedAt: number; requeued: number[];
}
function readSaved(key: string): Saved | null {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "null") as Saved | null;
    // pos == długość kolejki: pod-lekcja ukończona, ale wynik nie doszedł do serwera (brak sieci) – zapis do ponowienia
    if (!v || v.v !== 1 || !Array.isArray(v.queue) || !v.session?.id || v.pos <= 0 || v.pos > v.queue.length) return null;
    if (Date.now() - v.at > RESUME_DAYS * 864e5) { localStorage.removeItem(key); return null; }
    return v;
  } catch {
    return null;
  }
}
const dropSaved = (key: string) => { try { localStorage.removeItem(key); } catch {} };

export function LessonPlayer({ payload, next }: { payload: LessonPayload; next: string | null }) {
  const bookOff = useAccess().blocked("/nauka/podrecznik");
  const { lesson, sub, topic } = payload;
  const [session, setSession] = useState<{ id: string; level: number } | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Exercise[] | null>(null);
  const [pos, setPos] = useState(0);
  // następne ćwiczenie – czytanie poprzedniego milknie
  useEffect(() => () => stopGroup("lekcja:"), [pos]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [log, setLog] = useState<AnswerLog[]>([]);
  const [combo, setCombo] = useState(0);
  const [requeued, setRequeued] = useState<Set<Exercise>>(new Set());
  const [result, setResult] = useState<FinishResult | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  // pod-lekcja przerwana wcześniej (stan w localStorage) – propozycja „Kontynuuj / Zacznij od nowa”
  const saveKey = payload.review ? null : `${RESUME_PREFIX}${lesson.id}:${sub}`;
  const [offer, setOffer] = useState<Saved | null>(null);
  const shownAt = useRef(Date.now());
  const finishing = useRef(false);
  const started = useRef(false);

  const startNew = useCallback(() => {
    if (saveKey) dropSaved(saveKey);
    setOffer(null);
    let level = 0;
    api<{ id: string; level: number }>("/api/nauka/sessions", {
      method: "POST",
      body: JSON.stringify({ lesson: lesson.id, sub }),
    })
      .then((s) => {
        setSession(s);
        level = s.level;
      })
      .catch((e) => setStartError(e.message))
      .finally(() => setQueue(buildExercises(payload, { level })));
  }, [lesson.id, sub, payload, saveKey]);

  /** „Kontynuuj”: ta sama sesja, kolejka, odpowiedzi i miejsce co przed wyjściem. */
  const resumeSaved = useCallback((v: Saved) => {
    setOffer(null);
    setSession(v.session);
    setQueue(v.queue);
    setPos(v.pos);
    setLog(v.log);
    setCombo(v.combo);
    setStartedAt(v.startedAt);
    setRequeued(new Set(v.requeued.map((i) => v.queue[i]).filter(Boolean)));
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    rememberLesson(lesson.id, sub);
    const saved = saveKey ? readSaved(saveKey) : null;
    if (saved && saved.pos >= saved.queue.length) resumeSaved(saved); // od razu do ekranu końcowego i ponownego zapisu
    else if (saved) setOffer(saved);
    else startNew();
  }, [lesson.id, sub, saveKey, startNew, resumeSaved]);


  // zapis stanu po każdym ćwiczeniu (localStorage – pełny stan; serwer – „w trakcie N/M” dla ścieżki)
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!saveKey || !queue || !session || offer) return;
    // ukończona pod-lekcja zostaje zapisana lokalnie, dopóki wynik nie dojdzie do serwera (saveResult)
    if (pos === 0) return;
    const v: Saved = {
      v: 1, at: Date.now(), session, queue, pos, log, combo, startedAt,
      requeued: queue.flatMap((ex, i) => (requeued.has(ex) ? [i] : [])),
    };
    try { localStorage.setItem(saveKey, JSON.stringify(v)); } catch {}
    if (progressTimer.current) clearTimeout(progressTimer.current);
    if (pos >= queue.length) return;
    progressTimer.current = setTimeout(() => {
      api(`/api/nauka/sessions/${session.id}`, { method: "PATCH", body: JSON.stringify({ pos, total: queue.length }) }).catch(() => {});
    }, 1200);
  }, [pos]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    shownAt.current = Date.now();
  }, [pos]);

  const current = queue?.[pos] ?? null;
  const done = queue !== null && pos >= queue.length;
  const xp = useMemo(() => computeXp(log.map((l) => l.correct), false), [log]);

  const record = useCallback(
    (entries: { item: CourseItem; correct: boolean }[], ex: Exercise, fb: NonNullable<Feedback>) => {
      const ms = Date.now() - shownAt.current;
      const type = exerciseKind(ex);
      if (!type) return;
      setLog((l) => [
        ...l,
        ...entries.map((e) => ({ item: e.item.id, itemKind: e.item.kind, exercise: type, correct: e.correct, ms: Math.round(ms / entries.length) })),
      ]);
      const allOk = entries.every((e) => e.correct);
      setCombo((c) => (allOk ? c + entries.length : 0));
      // błędne ćwiczenie wraca na koniec (jeden raz), jak w Duolingo
      if (!allOk && ex.type !== "pary" && !requeued.has(ex)) {
        setRequeued((r) => new Set(r).add(ex));
        setQueue((q) => (q ? [...q, ex] : q));
      }
      setFeedback(fb);
    },
    [requeued],
  );

  const advance = useCallback(() => {
    setFeedback(null);
    setPos((p) => p + 1);
  }, []);

  /**
   * Zapis wyniku. Bez sieci – komunikat, „Spróbuj ponownie” i ponowienie po powrocie sieci; stan zostaje w localStorage,
   * więc wynik nie przepada także po zamknięciu karty. Sesja, której nie udało się rozpocząć, jest zakładana teraz.
   * 409 („już zakończona”) – poprzednia próba doszła, tylko odpowiedź się zgubiła: wynik liczony lokalnie.
   */
  const saveResult = useCallback(async () => {
    if (log.length === 0) return;
    setFinishError(null);
    try {
      let s = session;
      if (!s) {
        s = await api<{ id: string; level: number }>("/api/nauka/sessions", { method: "POST", body: JSON.stringify({ lesson: lesson.id, sub }) });
        setSession(s);
        setStartError(null);
      }
      const r = await api<FinishResult>(`/api/nauka/sessions/${s.id}/finish`, { method: "POST", body: JSON.stringify({ answers: log }) });
      setResult(r);
      if (saveKey) dropSaved(saveKey);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && session) {
        const correct = log.filter((l) => l.correct).length;
        setResult({ xp: computeXp(log.map((l) => l.correct)), correct, total: log.length, percent: Math.round((correct / log.length) * 1000) / 10,
          durationMs: Date.now() - startedAt, level: session.level, levelBefore: session.level });
        if (saveKey) dropSaved(saveKey);
        return;
      }
      setFinishError((e as Error).message);
    }
  }, [log, session, lesson.id, sub, saveKey, startedAt]);

  useEffect(() => {
    if (!done || finishing.current || result) return;
    finishing.current = true;
    saveResult();
  }, [done, result, saveResult]);
  useEffect(() => {
    if (!finishError || result) return;
    const on = () => saveResult();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, [finishError, result, saveResult]);

  // Enter – „Dalej” po informacji zwrotnej
  useEffect(() => {
    if (!feedback && current?.type !== "intro" && current?.type !== "karta") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isTyping(e)) {
        e.preventDefault();
        advance();
      }
    };
    const t = setTimeout(() => window.addEventListener("keydown", onKey), 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [feedback, current, advance]);

  // dolny odstęp lekcji = wysokość panelu informacji zwrotnej, żeby panel nie zasłaniał treści (telefony)
  const fbRef = useRef<HTMLDivElement>(null);
  const [fbHeight, setFbHeight] = useState(0);
  useEffect(() => {
    const el = fbRef.current;
    if (!feedback || !el) {
      setFbHeight(0);
      return;
    }
    const ro = new ResizeObserver(() => setFbHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [feedback]);

  const subInfo = subsFor(lesson).find((s) => s.no === sub);
  const backHref = payload.review ? "/nauka" : `/nauka/${topic.id}#${lesson.id}`;

  if (offer) {
    return (
      <div className="stack resume-offer" style={{ ["--topic" as string]: topic.color }} data-testid="resume-offer">
        <h1>{lesson.title}</h1>
        <div className="card stack">
          <p style={{ margin: 0 }}>Ta pod-lekcja została przerwana – zrobione {offer.pos} z {offer.queue.length} ćwiczeń
            ({new Date(offer.at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}).</p>
          <div className="learn-progress" aria-hidden><div style={{ width: `${(offer.pos / offer.queue.length) * 100}%` }} /></div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => resumeSaved(offer)} data-testid="resume-continue">▶ Kontynuuj od ćwiczenia {offer.pos + 1}</button>
            <button className="btn secondary" onClick={startNew} data-testid="resume-restart">↺ Zacznij od nowa</button>
          </div>
        </div>
        <Link href={backHref}>← Wróć do ścieżki</Link>
      </div>
    );
  }
  if (!queue) return <p className="muted">Przygotowuję ćwiczenia…</p>;

  if (done) {
    return (
      <EndScreen
        payload={payload}
        log={log}
        result={result}
        error={finishError ? `Wynik nie został jeszcze zapisany: ${finishError}` : null}
        onRetry={finishError ? saveResult : undefined}
        localXp={computeXp(log.map((l) => l.correct))}
        elapsed={Date.now() - startedAt}
        next={next}
        backHref={backHref}
      />
    );
  }

  const total = queue.length;
  return (
    <div className="learn" style={{ ["--topic" as string]: topic.color, ...(fbHeight ? { paddingBottom: fbHeight + 24 } : {}) }}>
      <h1 className="sr-only">{lesson.title}</h1>
      <div className="learn-top">
        <Link href={backHref} className="learn-close" aria-label="Zakończ lekcję">✕</Link>
        <div className="learn-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={pos}>
          <div style={{ width: `${(pos / total) * 100}%` }} />
        </div>
        <SpeakButton compact label="Czytaj ćwiczenie" group={`lekcja:${lesson.id}:${sub}:${pos}`} continuous={false} testid="speak-exercise"
          items={() => [speechItem(`ex-${pos}`, lesson.title, readableText(".learn-ex"), readableText(".learn-feedback"))]} />
        <span className="learn-xp" title="XP w tej pod-lekcji">⚡ {xp}</span>
      </div>
      <p className="muted learn-crumb">
        {topic.emoji} {payload.unitTitle} · {payload.zrozum ? "🧠 Zrozumienie" : "Lekcja"} {lesson.no}
        {!payload.review && ` · ${subInfo?.title}`}
        {combo >= XP_COMBO_EVERY && <span className="combo"> 🔥 {combo} z rzędu</span>}
      </p>
      {payload.zrozum && pos === 0 && (
        <details className="lesson-goal">
          <summary>🎯 {lesson.title}</summary>
          <p style={{ margin: "6px 0" }}>{payload.zrozum.goal}</p>
          <Sources sources={payload.zrozum.sources} />
        </details>
      )}
      {sub === 1 && payload.article && pos === 0 && !payload.review && !bookOff && (
        <Link href={`/nauka/podrecznik/${lesson.unit}/${lesson.id}`} className="article-link" data-testid="article-banner">
          <span aria-hidden>📖</span>
          <span><b>Wolisz poczytać? Artykuł tej lekcji zalicza „Poznaj”</b><small>{payload.article}</small></span>
        </Link>
      )}
      {startError && <p className="muted" style={{ fontSize: "0.85rem" }}>Brak połączenia z serwerem – możesz ćwiczyć dalej, wynik zapisze się na końcu, gdy wróci internet.</p>}
      <div className="learn-ex"><ExerciseView key={pos} ex={current!} locked={!!feedback} onResult={record} onNext={advance} /></div>
      {current!.type !== "intro" && current!.type !== "karta" && <QuestionScratch refKey={`lekcja:${lesson.id}:${sub}`} />}
      {feedback && (
        <div ref={fbRef} className={`learn-feedback ${feedback.correct ? "ok" : "bad"}`} role="status">
          <div className="learn-feedback-inner">
            <div>
              <strong>{feedback.title}</strong>
              {feedback.detail && <div className="learn-feedback-detail">{feedback.detail}</div>}
            </div>
            <button className="btn" onClick={advance} autoFocus>Dalej</button>
          </div>
        </div>
      )}
    </div>
  );
}


/** Tekst widocznego ćwiczenia do czytania na głos (bez przycisków sterujących, brudnopisu i numerów skrótów). */
function readableText(sel: string): string {
  const el = document.querySelector(sel);
  if (!el) return "";
  const c = el.cloneNode(true) as HTMLElement;
  c.querySelectorAll(".learn-actions, .q-scratch, .speak-wrap, .tile-no, kbd").forEach((x) => x.remove());
  return (c.innerText || c.textContent || "").replace(/\n+/g, ". ").replace(/\s+/g, " ").trim();
}

function ExerciseView({ ex, locked, onResult, onNext }: { ex: Exercise; locked: boolean; onResult: OnResult; onNext: () => void }) {
  switch (ex.type) {
    case "intro":
      return <Intro item={ex.item} fromQuestions={ex.fromQuestions} onNext={onNext} />;
    case "wybor":
    case "wzor":
      return <Choice ex={ex} locked={locked} onResult={onResult} />;
    case "prawda-falsz":
      return <TrueFalse ex={ex} locked={locked} onResult={onResult} />;
    case "luka":
      return <Cloze ex={ex} locked={locked} onResult={onResult} />;
    case "wpisz":
      return <Typing ex={ex} locked={locked} onResult={onResult} />;
    case "pary":
      return <Pairs ex={ex} locked={locked} onResult={onResult} />;
    case "kolejnosc":
      return <Order ex={ex} locked={locked} onResult={onResult} />;
    case "fiszka":
      return <Flashcard ex={ex} locked={locked} onResult={onResult} />;
    case "pytanie":
      return <BankQuestion ex={ex} locked={locked} onResult={onResult} />;
    case "karta":
      return <ExplainCard ex={ex} onNext={onNext} />;
    case "lancuch":
      return <Chain ex={ex} locked={locked} onResult={onResult} />;
    case "kategorie":
      return <Buckets ex={ex} locked={locked} onResult={onResult} />;
    case "liczba":
      return <NumberTask ex={ex} locked={locked} onResult={onResult} />;
    case "wykres":
      return <GraphChoice ex={ex} locked={locked} onResult={onResult} />;
  }
}

function ItemCard({ item }: { item: CourseItem }) {
  return (
    <div className="stack">
      <p style={{ margin: 0 }}>{item.d}</p>
      {item.w && <pre className="formula">{item.w}</pre>}
      {item.p && <p className="muted" style={{ margin: 0 }}><strong>Przykład:</strong> {item.p}</p>}
      {item.u && <p className="muted" style={{ margin: 0 }}><strong>Uwaga:</strong> {item.u}</p>}
    </div>
  );
}

function Intro({ item, fromQuestions, onNext }: { item: CourseItem; fromQuestions?: boolean; onNext: () => void }) {
  return (
    <div className="stack">
      <span className="learn-badge">
        Nowe hasło · {KIND_LABEL[item.kind]}
        {fromQuestions && <> · z pytań Sprawdzianu</>}
      </span>
      <div className="card learn-intro">
        <h2 style={{ marginTop: 0 }}>{item.t}</h2>
        <ItemCard item={item} />
      </div>
      <div className="learn-actions">
        <button className="btn" onClick={onNext} autoFocus>Dalej</button>
      </div>
    </div>
  );
}

function Choice({ ex, locked, onResult }: { ex: Extract<Exercise, { type: "wybor" | "wzor" }>; locked: boolean; onResult: OnResult }) {
  const [sel, setSel] = useState<number | null>(null);
  const check = useCallback(() => {
    if (sel === null) return;
    const ok = sel === ex.correct;
    onResult([{ item: ex.item, correct: ok }], ex, {
      correct: ok,
      title: ok ? "Dobrze!" : "Poprawna odpowiedź:",
      detail: ok ? <>{ex.item.s}</> : <>{ex.options[ex.correct]}{ex.item.kind !== "data" && ex.options[ex.correct] !== ex.item.s && <> — {ex.item.s}</>}</>,
    });
  }, [sel, ex, onResult]);
  useNumberKeys(ex.options.length, locked, setSel);
  useEnter(!locked && sel !== null, check);
  return (
    <div className="stack">
      <span className="learn-badge">{ex.title}</span>
      <div className={ex.type === "wzor" && !ex.long ? "card prompt formula-prompt" : "card prompt"}>{ex.type === "wzor" && !ex.long ? <pre className="formula">{ex.prompt}</pre> : ex.prompt}</div>
      <div className={ex.long ? "tiles long" : "tiles"}>
        {ex.options.map((o, i) => {
          const cls = locked ? (i === ex.correct ? "correct" : i === sel ? "wrong" : "") : i === sel ? "selected" : "";
          return (
            <button key={i} className={`tile ${cls}`} disabled={locked} onClick={() => setSel(i)}>
              <span className="tile-no">{i + 1}</span>
              {ex.type === "wzor" && ex.long ? <code>{o}</code> : o}
            </button>
          );
        })}
      </div>
      <CheckButton disabled={sel === null} onClick={check} locked={locked} />
    </div>
  );
}

function TrueFalse({ ex, locked, onResult }: { ex: Extract<Exercise, { type: "prawda-falsz" }>; locked: boolean; onResult: OnResult }) {
  const [sel, setSel] = useState<boolean | null>(null);
  const answer = useCallback(
    (v: boolean) => {
      if (locked) return;
      setSel(v);
      const ok = v === ex.truth;
      onResult([{ item: ex.item, correct: ok }], ex, {
        correct: ok,
        title: ok ? (ex.truth ? "Dobrze – to prawda." : "Dobrze – to fałsz.") : ex.truth ? "To była prawda." : "To był fałsz.",
        detail: ex.term ? <><strong>{ex.term}:</strong> {ex.trueDef}</> : ex.trueDef,
      });
    },
    [locked, ex, onResult],
  );
  useNumberKeys(2, locked, (i) => answer(i === 0));
  return (
    <div className="stack">
      <span className="learn-badge">Prawda czy fałsz?{ex.stat ? ` · ${EXERCISE_LABELS[ex.stat]}` : ""}</span>
      <CaseContext ctx={ex.ctx} />
      {ex.term && <p className="muted" style={{ margin: 0 }}>Czy to poprawny opis hasła <strong style={{ color: "var(--text)" }}>{ex.term}</strong>?</p>}
      <div className="card prompt">{ex.statement}</div>
      <div className="tiles">
        {[true, false].map((v, i) => (
          <button
            key={String(v)}
            className={`tile tf ${locked ? (v === ex.truth ? "correct" : v === sel ? "wrong" : "") : ""}`}
            disabled={locked}
            onClick={() => answer(v)}
          >
            <span className="tile-no">{i + 1}</span>
            {v ? "✔ Prawda" : "✘ Fałsz"}
          </button>
        ))}
      </div>
    </div>
  );
}

function Cloze({ ex, locked, onResult }: { ex: Extract<Exercise, { type: "luka" }>; locked: boolean; onResult: OnResult }) {
  const [sel, setSel] = useState<string | null>(null);
  const check = useCallback(() => {
    if (!sel) return;
    const ok = sel === ex.answer;
    onResult([{ item: ex.item, correct: ok }], ex, {
      correct: ok,
      title: ok ? "Dobrze!" : `Brakowało słowa: „${ex.answer}”`,
      detail: ex.why ? <>{ex.before}<u>{ex.answer}</u>{ex.after} {ex.why}</> : <><strong>{ex.item.s}:</strong> {ex.before}<u>{ex.answer}</u>{ex.after}</>,
    });
  }, [sel, ex, onResult]);
  useNumberKeys(ex.options.length, locked, (i) => setSel(ex.options[i]));
  useEnter(!locked && !!sel, check);
  return (
    <div className="stack">
      <span className="learn-badge">Uzupełnij lukę</span>
      <CaseContext ctx={ex.ctx} />
      {!ex.why && <p className="muted" style={{ margin: 0 }}>Hasło: <strong style={{ color: "var(--text)" }}>{ex.item.s}</strong></p>}
      <div className="card prompt">
        {ex.before}
        <span className={`gap ${locked ? (sel === ex.answer ? "ok" : "bad") : sel ? "filled" : ""}`}>{sel ?? " ".repeat(12)}</span>
        {ex.after}
      </div>
      <div className="chips">
        {ex.options.map((o, i) => (
          <button key={o} className={`chip ${sel === o ? "selected" : ""} ${locked && o === ex.answer ? "correct" : ""}`} disabled={locked} onClick={() => setSel(o)}>
            <span className="tile-no">{i + 1}</span>{o}
          </button>
        ))}
      </div>
      <CheckButton disabled={!sel} onClick={check} locked={locked} />
    </div>
  );
}

function Typing({ ex, locked, onResult }: { ex: Extract<Exercise, { type: "wpisz" }>; locked: boolean; onResult: OnResult }) {
  const [value, setValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  const check = () => {
    if (!value.trim()) return;
    const ok = checkTyped(value, ex.item);
    const exact = acceptedAnswers(ex.item).some((a) => a.toLowerCase() === value.trim().toLowerCase());
    onResult([{ item: ex.item, correct: ok }], ex, {
      correct: ok,
      title: ok ? (exact ? "Dobrze!" : "Dobrze! (drobna literówka albo inna forma)") : "Poprawna odpowiedź:",
      detail: <>{answerText(ex.item)}{!ok && <span className="muted"> · wpisano: „{value}”</span>}</>,
    });
  };
  return (
    <div className="stack">
      <span className="learn-badge">{ex.title}</span>
      <div className="card prompt">{ex.prompt}</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!locked) check();
        }}
      >
        <input
          className="select learn-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={locked}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder={ex.item.kind === "data" ? "Rok…" : "Wpisz odpowiedź…"}
          inputMode={ex.item.kind === "data" ? "numeric" : "text"}
          aria-label="Odpowiedź"
        />
        {!locked && (
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Polskie znaki i drobne literówki nie są błędem.{" "}
            {showHint ? <span>Podpowiedź: {ex.hint}</span> : <button type="button" className="linklike" onClick={() => setShowHint(true)}>Podpowiedź</button>}
          </p>
        )}
        <CheckButton disabled={!value.trim()} onClick={check} locked={locked} />
      </form>
    </div>
  );
}

function Pairs({ ex, locked, onResult }: { ex: Extract<Exercise, { type: "pary" }>; locked: boolean; onResult: OnResult }) {
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<string[] | null>(null);

  useEffect(() => {
    if (!left || !right) return;
    if (left === right) {
      const m = new Set(matched).add(left);
      setMatched(m);
      if (m.size === ex.items.length) {
        const errs = mistakes.size;
        onResult(ex.items.map((it) => ({ item: it, correct: !mistakes.has(it.id) })), ex, {
          correct: errs === 0,
          title: errs === 0 ? "Wszystkie pary bez błędu!" : `Połączone – błędy przy ${errs} ${errs === 1 ? "haśle" : "hasłach"}.`,
        });
      }
    } else {
      setMistakes((s) => new Set(s).add(left).add(right));
      setFlash([`l${left}`, `r${right}`]);
      setTimeout(() => setFlash(null), 450);
    }
    setLeft(null);
    setRight(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, right]);

  const cls = (side: "l" | "r", id: string, sel: string | null) =>
    `pair ${matched.has(id) ? "done" : ""} ${sel === id ? "selected" : ""} ${flash?.includes(side + id) ? "wrong" : ""}`;
  return (
    <div className="stack">
      <span className="learn-badge">Połącz w pary</span>
      <p className="muted" style={{ margin: 0 }}>Stuknij hasło po lewej, a potem jego opis po prawej.</p>
      <div className="pairs">
        <div className="stack">
          {ex.left.map((l) => (
            <button key={l.id} className={cls("l", l.id, left)} disabled={locked || matched.has(l.id)} onClick={() => setLeft(l.id)}>{l.text}</button>
          ))}
        </div>
        <div className="stack">
          {ex.right.map((r) => (
            <button key={r.id} className={`${cls("r", r.id, right)} small`} disabled={locked || matched.has(r.id)} onClick={() => setRight(r.id)}>{r.text}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Order({ ex, locked, onResult }: { ex: Extract<Exercise, { type: "kolejnosc" }>; locked: boolean; onResult: OnResult }) {
  const [placed, setPlaced] = useState<CourseItem[]>([]);
  const rest = ex.shuffled.filter((i) => !placed.includes(i));
  const check = () => {
    const ok = placed.every((p, i) => p.id === ex.items[i].id);
    onResult(ex.items.map((it) => ({ item: it, correct: ok })), ex, {
      correct: ok,
      title: ok ? "Dobra kolejność!" : "Poprawna kolejność:",
      detail: (
        <ol style={{ margin: "4px 0 0", paddingLeft: 20 }}>
          {ex.items.map((it) => <li key={it.id}><strong>{yearOf(it)}</strong> – {eventOf(it)}</li>)}
        </ol>
      ),
    });
  };
  return (
    <div className="stack">
      <span className="learn-badge">Ułóż chronologicznie</span>
      <p className="muted" style={{ margin: 0 }}>Stukaj wydarzenia od najwcześniejszego. Stuknij ułożone, żeby je cofnąć.</p>
      <div className="order-slots">
        {ex.items.map((_, i) => {
          const it = placed[i];
          const ok = locked && it ? it.id === ex.items[i].id : null;
          return (
            <button key={i} className={`slot ${it ? "filled" : ""} ${ok === true ? "correct" : ok === false ? "wrong" : ""}`} disabled={locked || !it}
              onClick={() => setPlaced(placed.filter((p) => p !== it))}>
              <span className="tile-no">{i + 1}</span>{it ? <>{eventOf(it)}{locked && <strong> ({yearOf(it)})</strong>}</> : <span className="muted">…</span>}
            </button>
          );
        })}
      </div>
      <div className="chips">
        {rest.map((it) => (
          <button key={it.id} className="chip" disabled={locked} onClick={() => setPlaced([...placed, it])}>{eventOf(it)}</button>
        ))}
      </div>
      <CheckButton disabled={placed.length < ex.items.length} onClick={check} locked={locked} />
    </div>
  );
}

function Flashcard({ ex, locked, onResult }: { ex: Extract<Exercise, { type: "fiszka" }>; locked: boolean; onResult: OnResult }) {
  const [flipped, setFlipped] = useState(false);
  const grade = (ok: boolean) =>
    onResult([{ item: ex.item, correct: ok }], ex, { correct: ok, title: ok ? "Super – idziemy dalej." : "Wróci jeszcze na koniec lekcji." });
  useEnter(!flipped && !locked, () => setFlipped(true));
  return (
    <div className="stack">
      <span className="learn-badge">Fiszka · przypomnij sobie definicję</span>
      <button className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(true)} disabled={flipped}>
        <h2 style={{ margin: 0 }}>{ex.item.t}</h2>
        {!flipped && <span className="muted">Stuknij, żeby odwrócić</span>}
      </button>
      {flipped && (
        <div className="card"><ItemCard item={ex.item} /></div>
      )}
      {flipped && !locked && (
        <div className="tiles">
          <button className="tile correct" onClick={() => grade(true)}>Wiedziałem/am</button>
          <button className="tile wrong" onClick={() => grade(false)}>Jeszcze nie</button>
        </div>
      )}
    </div>
  );
}

function BankQuestion({ ex, locked, onResult }: { ex: Extract<Exercise, { type: "pytanie" }>; locked: boolean; onResult: OnResult }) {
  const q = ex.question;
  const [sel, setSel] = useState<number[]>([]);
  const toggle = useCallback(
    (i: number) => setSel((s) => (q.type === "single" ? [i] : s.includes(i) ? s.filter((x) => x !== i) : [...s, i].sort())),
    [q.type],
  );
  const check = useCallback(() => {
    const ok = questionCorrect(q, sel);
    const pts = scoreAnswer(q.type, sel, q.correct);
    onResult([{ item: ex.item, correct: ok }], ex, {
      correct: ok,
      title: ex.stat ? (ok ? "Dobrze!" : "Nie tym razem.") : `${ok ? "Dobrze!" : "Nie tym razem."} (${pts > 0 ? "+" : ""}${pts.toLocaleString("pl-PL")} pkt jak w teście)`,
      detail: <>{q.explanation}</>,
    });
  }, [q, sel, ex, onResult]);
  useNumberKeys(4, locked, toggle);
  useEnter(!locked && (sel.length > 0 || q.type === "multi"), check);
  const origin = q.id.startsWith("owe") ? `Olimpiada ${q.edition}` : q.origin === "manual" ? "Słownik – pytanie ręczne" : "Słownik – pytanie automatyczne";
  const kind = q.type === "single" ? "jednokrotny wybór" : "wielokrotny wybór (zaznacz wszystkie poprawne)";
  return (
    <div className="stack">
      <span className="learn-badge">{ex.stat ? `${EXERCISE_LABELS[ex.stat]} · ${kind}` : `Pytanie testowe · ${kind}`}</span>
      {ex.stat ? <CaseContext ctx={ex.ctx} /> : <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{origin}</p>}
      <p className="question">{q.question}</p>
      <div>
        {q.options.map((o, i) => {
          const isC = q.correct.includes(i), isS = sel.includes(i);
          const cls = locked ? (isC && isS ? "correct" : isS ? "wrong" : isC ? "missed" : "") : isS ? "selected" : "";
          return (
            <button key={i} className={`option ${q.type === "multi" ? "multi" : ""} ${cls}`} disabled={locked} onClick={() => toggle(i)}>
              <span className="letter">{LETTERS[i]}</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      <CheckButton disabled={q.type === "single" && sel.length === 0} onClick={check} locked={locked} />
    </div>
  );
}

function EndScreen({
  payload, log, result, error, onRetry, localXp, elapsed, next, backHref,
}: {
  payload: LessonPayload; log: AnswerLog[]; result: FinishResult | null; error: string | null; onRetry?: () => void; localXp: number;
  elapsed: number; next: string | null; backHref: string;
}) {
  const correct = log.filter((l) => l.correct).length;
  const percent = log.length ? (correct / log.length) * 100 : 0;
  const wrongIds = [...new Set(log.filter((l) => !l.correct).map((l) => l.item))];
  const byId = new Map([...payload.items, ...payload.pool].map((i) => [i.id, i]));
  const wrong = wrongIds.map((id) => byId.get(id)).filter((i): i is CourseItem => !!i);
  const xp = result?.xp ?? localXp;
  const level = result?.level ?? 0;
  const levelUp = result && result.level > result.levelBefore;
  const { lesson, sub } = payload;
  const retryHref = payload.review ? "/nauka/powtorka" : `/nauka/lekcja/${lesson.id}?sub=${sub}`;
  const [again] = useState(() => shuffle(["Świetna robota!", "Tak trzymaj!", "Brawo!", "Kolejny krok za Tobą!"])[0]);
  return (
    <div className="stack learn-end" style={{ ["--topic" as string]: payload.topic.color }}>
      <div className="learn-end-hero">
        <div className="learn-end-emoji">{percent >= 80 ? "🏆" : percent >= 50 ? "💪" : "📚"}</div>
        <h1 style={{ margin: 0 }}>{percent >= 80 ? again : "Ukończone – warto powtórzyć"}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {payload.review ? "Powtórka słabych haseł" : `${payload.unitTitle} · ${payload.zrozum ? "🧠 Zrozumienie" : "Lekcja"} ${lesson.no} · ${subsFor(lesson)[sub - 1].title}`}
        </p>
      </div>
      <div className="stat-grid">
        <div className="stat"><div className="value">{fmtPct(Math.round(percent * 10) / 10)}</div><div className="label">skuteczność · {correct}/{log.length}</div></div>
        <div className="stat"><div className="value">{fmtDuration(result?.durationMs ?? elapsed)}</div><div className="label">czas pod-lekcji</div></div>
        <div className="stat"><div className="value">⚡ {xp}</div><div className="label">zdobyte XP</div></div>
      </div>
      {!payload.review && result && (
        <div className="card">
          <div className="crowns big-crowns" aria-label={`Poziom ${level} z ${MAX_LEVEL}`}>
            {Array.from({ length: MAX_LEVEL }, (_, i) => <span key={i} className={i < level ? "on" : ""}>👑</span>)}
          </div>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            {levelUp ? `Nowy poziom lekcji: ${level}! ` : ""}
            Koronę dostajesz, gdy każdą z 4 pod-lekcji zaliczysz ze skutecznością co najmniej 80% (kolejne korony – kolejne zaliczenia{payload.zrozum ? "" : "; wyższy poziom = więcej wpisywania"}).
          </p>
        </div>
      )}
      {error && (
        <div className="row" role="alert" data-testid="lesson-save-error">
          <p className="error" style={{ margin: 0 }}>{error} Odpowiedzi są zachowane na tym urządzeniu.</p>
          {onRetry && <button type="button" className="btn small" onClick={onRetry}>Spróbuj ponownie</button>}
        </div>
      )}
      {!result && !error && <p className="muted">Zapisywanie wyniku…</p>}
      {payload.zrozum && (
        <div className="card stack">
          <strong>🎯 {lesson.title}</strong>
          <p className="muted" style={{ margin: 0 }}>{payload.zrozum.goal}</p>
          {payload.zrozum.refs.length > 0 && (
            <p style={{ margin: 0, fontSize: "0.9rem" }}>Powiązane hasła: {payload.zrozum.refs.map((r) => r.s).join(" · ")}</p>
          )}
          <Sources sources={payload.zrozum.sources} />
        </div>
      )}
      {!payload.zrozum && wrong.length > 0 && (
        <>
          <h2>Do powtórki</h2>
          <div className="stack">
            {wrong.map((it) => (
              <details key={it.id} className="card review-item">
                <summary><strong>{it.t}</strong> <span className="muted">· {KIND_LABEL[it.kind]}</span></summary>
                <div style={{ marginTop: 8 }}><ItemCard item={it} /></div>
              </details>
            ))}
          </div>
        </>
      )}
      <div className="row">
        {next && <Link className="btn" href={next}>Dalej →</Link>}
        {/* pełne przeładowanie – nowa sesja i nowe losowanie ćwiczeń */}
        <a className="btn secondary" href={retryHref}>Powtórz</a>
        <Link className="btn secondary" href={backHref}>Wróć</Link>
      </div>
    </div>
  );
}
