"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, fmtPct, LETTERS } from "@/lib/client";
import { fmtDuration, rememberLesson } from "@/lib/nauka-client";
import {
  buildExercises, checkTyped, computeXp, eventOf, acceptedAnswers, questionCorrect, shuffle, yearOf,
  XP_COMBO_EVERY, type Exercise,
} from "@/lib/nauka-logic";
import { SUBLESSONS, MAX_LEVEL, type AnswerLog, type CourseItem, type LessonPayload } from "@/lib/nauka-types";
import type { FinishResult } from "@/lib/nauka";
import { scoreAnswer } from "@/lib/scoring";

const KIND_LABEL: Record<string, string> = {
  pojecie: "Pojęcie", wzor: "Wzór", osoba: "Osoba", instytucja: "Instytucja", data: "Data", przepis: "Przepis",
};

type Feedback = { correct: boolean; title: string; detail?: React.ReactNode } | null;

/** Odpowiedź do pokazania w pasku informacji zwrotnej. */
function answerText(item: CourseItem) {
  return item.kind === "data" ? `${yearOf(item)} – ${eventOf(item)}` : item.s;
}

export function LessonPlayer({ payload, next }: { payload: LessonPayload; next: string | null }) {
  const { lesson, sub, topic } = payload;
  const [session, setSession] = useState<{ id: string; level: number } | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Exercise[] | null>(null);
  const [pos, setPos] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [log, setLog] = useState<AnswerLog[]>([]);
  const [combo, setCombo] = useState(0);
  const [requeued, setRequeued] = useState<Set<Exercise>>(new Set());
  const [result, setResult] = useState<FinishResult | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const shownAt = useRef(Date.now());
  const finishing = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    rememberLesson(lesson.id, sub);
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
  }, [lesson.id, sub, payload]);

  useEffect(() => {
    shownAt.current = Date.now();
  }, [pos]);

  const current = queue?.[pos] ?? null;
  const done = queue !== null && pos >= queue.length;
  const xp = useMemo(() => computeXp(log.map((l) => l.correct), false), [log]);

  const record = useCallback(
    (entries: { item: CourseItem; correct: boolean }[], ex: Exercise, fb: NonNullable<Feedback>) => {
      const ms = Date.now() - shownAt.current;
      const type = ex.type === "intro" ? null : ex.type;
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

  useEffect(() => {
    if (!done || finishing.current || result) return;
    finishing.current = true;
    if (!session || log.length === 0) return;
    api<FinishResult>(`/api/nauka/sessions/${session.id}/finish`, { method: "POST", body: JSON.stringify({ answers: log }) })
      .then(setResult)
      .catch((e) => setFinishError(e.message));
  }, [done, session, log, result]);

  // Enter – „Dalej” po informacji zwrotnej
  useEffect(() => {
    if (!feedback && current?.type !== "intro") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
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

  const subInfo = SUBLESSONS.find((s) => s.no === sub);
  const backHref = payload.review ? "/nauka" : `/nauka/${topic.id}#${lesson.id}`;

  if (!queue) return <p className="muted">Przygotowuję ćwiczenia…</p>;

  if (done) {
    return (
      <EndScreen
        payload={payload}
        log={log}
        result={result}
        error={finishError ?? (startError ? `Wynik nie został zapisany: ${startError}` : null)}
        localXp={computeXp(log.map((l) => l.correct))}
        elapsed={Date.now() - startedAt}
        next={next}
        backHref={backHref}
      />
    );
  }

  const total = queue.length;
  return (
    <div className="learn" style={{ ["--topic" as string]: topic.color }}>
      <div className="learn-top">
        <Link href={backHref} className="learn-close" aria-label="Zakończ lekcję">✕</Link>
        <div className="learn-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={pos}>
          <div style={{ width: `${(pos / total) * 100}%` }} />
        </div>
        <span className="learn-xp" title="XP w tej pod-lekcji">⚡ {xp}</span>
      </div>
      <p className="muted learn-crumb">
        {topic.emoji} {payload.unitTitle} · Lekcja {lesson.no}
        {!payload.review && ` · ${subInfo?.title}`}
        {combo >= XP_COMBO_EVERY && <span className="combo"> 🔥 {combo} z rzędu</span>}
      </p>
      {startError && <p className="error" style={{ fontSize: "0.85rem" }}>Nie udało się rozpocząć zapisu sesji ({startError}) – możesz ćwiczyć, ale wynik nie trafi do statystyk.</p>}
      <ExerciseView key={pos} ex={current!} locked={!!feedback} onResult={record} onNext={advance} />
      {feedback && (
        <div className={`learn-feedback ${feedback.correct ? "ok" : "bad"}`} role="status">
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

type OnResult = (entries: { item: CourseItem; correct: boolean }[], ex: Exercise, fb: NonNullable<Feedback>) => void;

function ExerciseView({ ex, locked, onResult, onNext }: { ex: Exercise; locked: boolean; onResult: OnResult; onNext: () => void }) {
  switch (ex.type) {
    case "intro":
      return <Intro item={ex.item} onNext={onNext} />;
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

function Intro({ item, onNext }: { item: CourseItem; onNext: () => void }) {
  return (
    <div className="stack">
      <span className="learn-badge">Nowe hasło · {KIND_LABEL[item.kind]}</span>
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

/** Wspólny dolny przycisk „Sprawdź” (ukryty po sprawdzeniu). */
function CheckButton({ disabled, onClick, locked, label = "Sprawdź" }: { disabled: boolean; onClick: () => void; locked: boolean; label?: string }) {
  if (locked) return null;
  return (
    <div className="learn-actions">
      <button className="btn" disabled={disabled} onClick={onClick}>{label}</button>
    </div>
  );
}

function useNumberKeys(n: number, locked: boolean, pick: (i: number) => void) {
  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < n) pick(i);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, locked, pick]);
}

function useEnter(enabled: boolean, fn: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, fn]);
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
        detail: <><strong>{ex.item.s}:</strong> {ex.trueDef}</>,
      });
    },
    [locked, ex, onResult],
  );
  useNumberKeys(2, locked, (i) => answer(i === 0));
  return (
    <div className="stack">
      <span className="learn-badge">Prawda czy fałsz?</span>
      <p className="muted" style={{ margin: 0 }}>Czy to poprawny opis hasła <strong style={{ color: "var(--text)" }}>{ex.term}</strong>?</p>
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
      detail: <><strong>{ex.item.s}:</strong> {ex.before}<u>{ex.answer}</u>{ex.after}</>,
    });
  }, [sel, ex, onResult]);
  useNumberKeys(ex.options.length, locked, (i) => setSel(ex.options[i]));
  useEnter(!locked && !!sel, check);
  return (
    <div className="stack">
      <span className="learn-badge">Uzupełnij lukę</span>
      <p className="muted" style={{ margin: 0 }}>Hasło: <strong style={{ color: "var(--text)" }}>{ex.item.s}</strong></p>
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
      title: `${ok ? "Dobrze!" : "Nie tym razem."} (${pts > 0 ? "+" : ""}${pts.toLocaleString("pl-PL")} pkt jak w teście)`,
      detail: <>{q.explanation}</>,
    });
  }, [q, sel, ex, onResult]);
  useNumberKeys(4, locked, toggle);
  useEnter(!locked && (sel.length > 0 || q.type === "multi"), check);
  const origin = q.id.startsWith("owe") ? `Olimpiada ${q.edition}` : q.origin === "manual" ? "Słownik – pytanie ręczne" : "Słownik – pytanie automatyczne";
  return (
    <div className="stack">
      <span className="learn-badge">Pytanie testowe · {q.type === "single" ? "jednokrotny wybór" : "wielokrotny wybór (zaznacz wszystkie poprawne)"}</span>
      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{origin}</p>
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
  payload, log, result, error, localXp, elapsed, next, backHref,
}: {
  payload: LessonPayload; log: AnswerLog[]; result: FinishResult | null; error: string | null; localXp: number;
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
          {payload.review ? "Powtórka słabych haseł" : `${payload.unitTitle} · Lekcja ${lesson.no} · ${SUBLESSONS[sub - 1].title}`}
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
            Koronę dostajesz, gdy każdą z 4 pod-lekcji zaliczysz ze skutecznością co najmniej 80% (kolejne korony – kolejne zaliczenia; wyższy poziom = więcej wpisywania).
          </p>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {!result && !error && <p className="muted">Zapisywanie wyniku…</p>}
      {wrong.length > 0 && (
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
