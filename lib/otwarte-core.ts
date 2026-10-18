/**
 * Zadania obliczeniowe i eseje z kluczy OWE (dane: data/otwarte/sets/*.json) – typy, sprawdzanie wyników, punktacja.
 * Czysty moduł (bez bazy) – testy: tests/otwarte.test.ts.
 */

export type Stage = "s" | "o" | "c";
export const STAGE_NAME: Record<Stage, string> = { s: "szkolny", o: "okręgowy", c: "centralny" };

/** Blok treści: akapit, wzór (tekst w czcionce wzorów), tabela, lista. */
export type Block =
  | { t: "p"; x: string }
  | { t: "f"; x: string }
  | { t: "table"; head?: string[]; rows: string[][] }
  | { t: "ul"; items: string[] };

export interface Answer {
  label: string;
  value: number;
  /** Dopuszczalna różnica bezwzględna (domyślnie 0,5% wartości, min. 0,01). */
  tol?: number;
  unit?: string;
  /** Inne akceptowane wyniki (np. ścisłe rozwiązanie, gdy klucz przyjmuje uproszczenie). */
  alt?: number[];
}
export interface TaskPart {
  label: string;
  pts: number | null;
  prompt: string;
  /** Wyniki liczbowe sprawdzane automatycznie; pusta lista – część opisowa (samoocena). */
  answers: Answer[];
  solution: Block[];
}
export interface Task {
  id: string; title: string; pts: number; topic: string;
  intro: Block[];
  parts: TaskPart[];
}
export interface SchemaSection { title: string; pts: number | null; points: string[] }
export interface EssayTopic { title: string; schema: SchemaSection[] }
export interface Essay {
  id: string;
  /** „ogolne” – pytanie opisowe o charakterze ogólnym; „sponsor” – pytanie do wyboru od sponsora (bez schematu w kluczu). */
  kind: "ogolne" | "sponsor";
  pts: number; topic: string;
  topics: EssayTopic[];
}
export interface OpenSet { set: string; ed: number; stage: Stage; essays: Essay[]; task: Task | null }

/* ---------- liczby ---------- */

/** „21,88”, „21.88%”, „1 234,5”, „−3” → liczba; null – nie liczba. */
export function parseNum(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const s = raw.trim().replace(/[\s ]/g, "").replace(/[−–]/g, "-").replace(/%$/, "").replace(/zł$/i, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$|^-?\.\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export const tolOf = (a: Answer) => a.tol ?? Math.max(0.01, Math.abs(a.value) * 0.005);

/** Czy wpisany wynik jest poprawny; przy jednostce „%” akceptuje też ułamek (0,2188 zamiast 21,88). */
export function isCorrect(a: Answer, raw: unknown): boolean {
  const n = parseNum(raw);
  if (n === null) return false;
  const t = tolOf(a) + 1e-9;
  return [a.value, ...(a.alt ?? [])].some((v) => Math.abs(n - v) <= t || (a.unit === "%" && Math.abs(n * 100 - v) <= t));
}

/* ---------- punktacja ---------- */

export type SelfRating = 0 | 0.5 | 1;
export interface TaskSubmission {
  /** [część][wynik] → wpisany tekst */
  answers: Record<string, string[]>;
  /** samoocena części opisowych: 1 – mam, 0,5 – częściowo, 0 – nie */
  self: Record<string, SelfRating>;
}
export interface PartResult { label: string; pts: number; max: number; correct: boolean[] }

/** Punkty części: liczbowa – proporcjonalnie do poprawnych wyników; opisowa – samoocena × punkty. */
export function scoreTask(task: Task, sub: TaskSubmission): { parts: PartResult[]; score: number; max: number } {
  const parts = task.parts.map((p) => {
    const max = p.pts ?? 0;
    if (p.answers.length) {
      const got = sub.answers[p.label] ?? [];
      const correct = p.answers.map((a, i) => isCorrect(a, got[i]));
      return { label: p.label, max, correct, pts: round1((max * correct.filter(Boolean).length) / p.answers.length) };
    }
    const r = sub.self[p.label];
    return { label: p.label, max, correct: [], pts: round1(max * (r === 1 || r === 0.5 ? r : 0)) };
  });
  return { parts, score: round1(parts.reduce((s, p) => s + p.pts, 0)), max: parts.reduce((s, p) => s + p.max, 0) };
}

/** Esej: punkty części schematu proporcjonalnie do odhaczonych punktów (samoocena); bez punktacji części – równo z całości. */
export function scoreEssay(e: Essay, topic: number, checks: boolean[][]): { score: number; max: number } {
  const t = e.topics[topic];
  if (!t || !t.schema.length) return { score: 0, max: e.pts };
  const known = t.schema.reduce((s, x) => s + (x.pts ?? 0), 0);
  const per = (i: number) => t.schema[i].pts ?? (e.pts - known) / t.schema.filter((x) => x.pts === null).length;
  let score = 0;
  t.schema.forEach((sec, i) => {
    const c = checks[i] ?? [];
    const n = sec.points.filter((_, k) => c[k] === true).length;
    score += per(i) * (sec.points.length ? n / sec.points.length : 0);
  });
  return { score: round1(score), max: e.pts };
}

const round1 = (x: number) => Math.round(x * 10) / 10;

/* ---------- wersje publiczne (bez kluczy) ---------- */

export type PublicTask = Omit<Task, "parts"> & { parts: (Omit<TaskPart, "answers" | "solution"> & { answers: Pick<Answer, "label" | "unit">[] })[] };
export const publicTask = (t: Task): PublicTask => ({
  ...t, parts: t.parts.map(({ solution: _s, answers, ...p }) => ({ ...p, answers: answers.map((a) => ({ label: a.label, unit: a.unit })) })),
});
export type PublicEssay = Omit<Essay, "topics"> & { topics: { title: string; hasSchema: boolean }[] };
export const publicEssay = (e: Essay): PublicEssay => ({ ...e, topics: e.topics.map((t) => ({ title: t.title, hasSchema: t.schema.length > 0 })) });

/* ---------- walidacja danych ---------- */

export function validateSet(s: OpenSet, topics: string[]): string[] {
  const err: string[] = [];
  const where = (x: string) => `${s.set}: ${x}`;
  if (!/^owe-\d{2}-(szkolne|okregowe|centralne)$/.test(s.set)) err.push(where("zły identyfikator zestawu"));
  for (const e of s.essays) {
    if (!topics.includes(e.topic)) err.push(where(`esej ${e.id}: nieznany dział ${e.topic}`));
    if (!e.topics.length) err.push(where(`esej ${e.id}: brak tematu`));
    for (const t of e.topics) {
      if (t.title.length < 10) err.push(where(`esej ${e.id}: za krótki temat`));
      const sum = t.schema.reduce((a, x) => a + (x.pts ?? 0), 0);
      if (t.schema.every((x) => x.pts !== null) && t.schema.length && sum !== e.pts) err.push(where(`esej ${e.id}: suma części ${sum} ≠ ${e.pts}`));
      for (const x of t.schema) if (!x.points.length) err.push(where(`esej ${e.id}: pusta część „${x.title}”`));
    }
    if (e.kind === "ogolne" && e.topics.some((t) => !t.schema.length)) err.push(where(`esej ${e.id}: brak schematu odpowiedzi`));
  }
  const t = s.task;
  if (t) {
    if (!topics.includes(t.topic)) err.push(where(`zadanie: nieznany dział ${t.topic}`));
    if (!t.parts.length) err.push(where("zadanie bez podpunktów"));
    const sum = t.parts.reduce((a, p) => a + (p.pts ?? 0), 0);
    if (t.parts.every((p) => p.pts !== null) && sum !== t.pts) err.push(where(`zadanie: suma podpunktów ${sum} ≠ ${t.pts}`));
    for (const p of t.parts) {
      if (!p.solution.length) err.push(where(`zadanie ${p.label}: brak rozwiązania`));
      for (const a of p.answers) {
        if (!Number.isFinite(a.value)) err.push(where(`zadanie ${p.label}: wynik nie jest liczbą`));
        if (a.alt && !a.alt.every(Number.isFinite)) err.push(where(`zadanie ${p.label}: alternatywny wynik nie jest liczbą`));
      }
    }
  }
  return err;
}
