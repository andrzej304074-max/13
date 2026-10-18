import { SETS } from "@/data/otwarte";
import { THEMES } from "@/data/olimpiada/info";
import themeMap from "@/data/olimpiada/theme.json";
import { query } from "./db";
import {
  publicEssay, publicTask, scoreEssay, scoreTask, STAGE_NAME,
  type Essay, type OpenSet, type PublicEssay, type PublicTask, type SelfRating, type Stage, type Task,
} from "./otwarte-core";
import { HttpError } from "./tests";

/** Zadania i eseje z kluczy OWE: lista, treść bez klucza, sprawdzenie (wynik + rozwiązanie), zapis podejścia, statystyki. */

export type OpenKind = "zadanie" | "esej";
export interface OpenMeta {
  id: string; kind: OpenKind; set: string; ed: number; edRoman: string; year: string; stage: Stage; stageName: string;
  title: string; pts: number; topic: string; theme: string; choose: number;
  /** Dotyczy hasła przewodniego swojej edycji (tools/otwarte/theme.py + ręczny przegląd). */
  th: boolean;
}

const THEME_OPEN = new Set(themeMap.open);

const roman = (ed: number) => THEMES[ed - 1]?.ed ?? String(ed);
const yearOf = (ed: number) => THEMES[ed - 1]?.year ?? "";

const TASKS = new Map<string, { set: OpenSet; task: Task }>();
const ESSAYS = new Map<string, { set: OpenSet; essay: Essay }>();
for (const s of SETS) {
  if (s.task) TASKS.set(s.task.id, { set: s, task: s.task });
  for (const e of s.essays) ESSAYS.set(e.id, { set: s, essay: e });
}

const meta = (kind: OpenKind, s: OpenSet, id: string, title: string, pts: number, topic: string, choose = 1): OpenMeta => ({
  id, kind, set: s.set, ed: s.ed, edRoman: roman(s.ed), year: yearOf(s.ed), stage: s.stage, stageName: STAGE_NAME[s.stage],
  title, pts, topic, theme: THEMES[s.ed - 1]?.theme ?? "", choose, th: THEME_OPEN.has(id),
});
const ALL: OpenMeta[] = [
  ...[...TASKS.values()].map(({ set, task }) => meta("zadanie", set, task.id, task.title, task.pts, task.topic)),
  ...[...ESSAYS.values()].map(({ set, essay }) => meta("esej", set, essay.id, essay.topics.length > 1 ? essay.topics.map((t) => t.title).join(" / ") : essay.topics[0].title,
    essay.pts, essay.topic, essay.topics.length)),
].sort((a, b) => b.ed - a.ed || "soc".indexOf(a.stage) - "soc".indexOf(b.stage));

export const openMeta = (id: string) => ALL.find((m) => m.id === id) ?? null;
/** Wszystkie eseje i zadania (metadane) – do statystyk tematów. */
export const openAll = (): readonly OpenMeta[] => ALL;

export function openCounts() {
  return { zadanie: TASKS.size, esej: ESSAYS.size };
}

/** Lista z moim najlepszym wynikiem i liczbą podejść. */
export async function listOpen(userId: string, kind: OpenKind) {
  const { rows } = await query<{ item_id: string; best: number; max: number; n: string; last: Date }>(
    `SELECT item_id, MAX(score) AS best, MAX(max) AS max, COUNT(*) AS n, MAX(created_at) AS last
     FROM open_attempts WHERE user_id = $1 AND kind = $2 GROUP BY item_id`, [userId, kind]);
  const mine = new Map(rows.map((r) => [r.item_id, r]));
  return ALL.filter((m) => m.kind === kind).map((m) => {
    const r = mine.get(m.id);
    return { ...m, best: r ? Number(r.best) : null, attempts: r ? Number(r.n) : 0 };
  });
}

export function getTaskPublic(id: string): { meta: OpenMeta; task: PublicTask } {
  const t = TASKS.get(id);
  if (!t) throw new HttpError(404, "Nie ma takiego zadania.");
  return { meta: ALL.find((m) => m.id === id)!, task: publicTask(t.task) };
}
export function getEssayPublic(id: string): { meta: OpenMeta; essay: PublicEssay } {
  const e = ESSAYS.get(id);
  if (!e) throw new HttpError(404, "Nie ma takiego eseju.");
  return { meta: ALL.find((m) => m.id === id)!, essay: publicEssay(e.essay) };
}

const asStrings = (v: unknown) => (Array.isArray(v) ? v.slice(0, 10).map((x) => (typeof x === "string" ? x.slice(0, 40) : "")) : []);
const isRating = (v: unknown): v is SelfRating => v === 0 || v === 0.5 || v === 1;

/**
 * Sprawdzenie zadania. Pierwsze sprawdzenie zapisuje podejście z wpisanymi wynikami (żeby nie dało się podejrzeć rozwiązania
 * i dopiero potem wpisać wyników) i zwraca punkty oraz pełne rozwiązanie. Z `attempt` – dopisanie samooceny części opisowych
 * do tego podejścia (wyniki liczbowe zostają z pierwszego sprawdzenia).
 */
export async function checkTask(userId: string, id: string, body: Record<string, unknown>) {
  const t = TASKS.get(id);
  if (!t) throw new HttpError(404, "Nie ma takiego zadania.");
  const rawS = (body.self && typeof body.self === "object" ? body.self : {}) as Record<string, unknown>;
  const self: Record<string, SelfRating> = {};
  for (const p of t.task.parts) if (!p.answers.length && isRating(rawS[p.label])) self[p.label] = rawS[p.label] as SelfRating;
  let answers: Record<string, string[]> = {};
  let attemptId: string;
  if (typeof body.attempt === "string") {
    if (!/^[0-9a-f-]{36}$/i.test(body.attempt)) throw new HttpError(400, "Nieprawidłowe podejście.");
    const { rows } = await query<{ answers: { answers?: Record<string, string[]> } }>(
      "SELECT answers FROM open_attempts WHERE id = $1 AND user_id = $2 AND item_id = $3 AND created_at > now() - interval '1 day'", [body.attempt, userId, id]);
    if (!rows[0]) throw new HttpError(404, "Nie ma takiego podejścia.");
    answers = rows[0].answers.answers ?? {};
    attemptId = body.attempt;
  } else {
    const rawA = (body.answers && typeof body.answers === "object" ? body.answers : {}) as Record<string, unknown>;
    for (const p of t.task.parts) if (p.answers.length) answers[p.label] = asStrings(rawA[p.label]);
    attemptId = "";
  }
  const res = scoreTask(t.task, { answers, self });
  const saved = JSON.stringify({ answers, self });
  if (attemptId) {
    await query("UPDATE open_attempts SET answers = $3, score = $4 WHERE id = $1 AND user_id = $2", [attemptId, userId, saved, res.score]);
  } else {
    const { rows } = await query<{ id: string }>(
      "INSERT INTO open_attempts (user_id, item_id, kind, stage, topic, answers, score, max) VALUES ($1, $2, 'zadanie', $3, $4, $5, $6, $7) RETURNING id",
      [userId, id, t.set.stage, t.task.topic, saved, res.score, res.max]);
    attemptId = rows[0].id;
  }
  return { ...res, attempt: attemptId, given: answers, solution: t.task.parts.map((p) => ({ label: p.label, answers: p.answers, solution: p.solution })) };
}

/** Esej: wzorzec (schemat z klucza) po zakończeniu; `save` – zapis samooceny. */
export async function checkEssay(userId: string, id: string, body: Record<string, unknown>, save: boolean) {
  const e = ESSAYS.get(id);
  if (!e) throw new HttpError(404, "Nie ma takiego eseju.");
  const topic = Number(body.topic ?? 0);
  if (!Number.isInteger(topic) || topic < 0 || topic >= e.essay.topics.length) throw new HttpError(400, "Nieprawidłowy temat.");
  const t = e.essay.topics[topic];
  const checks = Array.isArray(body.checks) ? (body.checks as unknown[]).slice(0, t.schema.length).map((c) => (Array.isArray(c) ? c.slice(0, 40).map((x) => x === true) : [])) : [];
  const res = scoreEssay(e.essay, topic, checks);
  if (save) {
    if (!t.schema.length) throw new HttpError(400, "Ten temat nie ma schematu w kluczu – samoocena niedostępna.");
    const chars = typeof body.chars === "number" && body.chars >= 0 ? Math.min(100000, Math.round(body.chars)) : null;
    await query(
      "INSERT INTO open_attempts (user_id, item_id, kind, stage, topic, answers, score, max) VALUES ($1, $2, 'esej', $3, $4, $5, $6, $7)",
      [userId, id, e.set.stage, e.essay.topic, JSON.stringify({ topic, checks, chars }), res.score, res.max]);
  }
  return { ...res, topic: t.title, schema: t.schema };
}

/** Statystyki: osobno zadania i eseje (bez testów) – łącznie, wg etapu i wg działu. */
export async function openStats(userId: string) {
  const { rows } = await query<{ kind: OpenKind; stage: string; topic: string; n: string; items: string; score: number; max: number }>(
    `SELECT kind, stage, topic, COUNT(*) AS n, COUNT(DISTINCT item_id) AS items, SUM(score) AS score, SUM(max) AS max
     FROM open_attempts WHERE user_id = $1 GROUP BY kind, stage, topic`, [userId]);
  const pct = (s: number, m: number) => (m > 0 ? Math.round((s / m) * 1000) / 10 : 0);
  const sum = (rs: typeof rows) => {
    const score = rs.reduce((a, r) => a + Number(r.score), 0), max = rs.reduce((a, r) => a + Number(r.max), 0);
    return { attempts: rs.reduce((a, r) => a + Number(r.n), 0), score: Math.round(score * 10) / 10, max, percent: pct(score, max) };
  };
  const out = (kind: OpenKind) => {
    const rs = rows.filter((r) => r.kind === kind);
    const by = (key: "stage" | "topic") => Object.fromEntries([...new Set(rs.map((r) => r[key]))].map((v) => [v, sum(rs.filter((r) => r[key] === v))]));
    return { total: { ...sum(rs), items: Number(rs.reduce((a, r) => a + Number(r.items), 0)), available: kind === "zadanie" ? TASKS.size : ESSAYS.size }, byStage: by("stage"), byTopic: by("topic") };
  };
  return { zadanie: out("zadanie"), esej: out("esej") };
}
