import { SETS } from "@/data/otwarte";
import { query } from "./db";
import { audit } from "./audit";
import type { User } from "./auth";
import { questionStats } from "./question-stats";
import { getQuestion } from "./questions";
import { reviewInput, type Review, type ReviewKind, type ReviewStatus } from "./review-core";
import { HttpError } from "./tests";

/**
 * Tryb recenzenta (`/recenzja`): lista do przeglądu – pytania z flagami statystyk (H4) albo ze zgłoszeniami, zgłoszenia
 * merytoryczne bez rozstrzygnięcia i własne zadania / eseje Prognozy XL – oraz ocena „OK / do poprawy / komentarz”.
 */

const PROGNOZA = SETS.filter((s) => s.src === "prognoza").flatMap((s) => [
  ...(s.task ? [{ ref: s.task.id, title: s.task.title, href: `/zadania/${s.task.id}`, type: "zadanie" as const }] : []),
  ...s.essays.map((e) => ({ ref: e.id, title: e.topics[0]?.title ?? e.id, href: `/eseje/${e.id}`, type: "esej" as const })),
]);
const PROGNOZA_REFS = new Set(PROGNOZA.map((p) => p.ref));

export async function reviewsOf(kind: ReviewKind): Promise<Map<string, Review>> {
  const { rows } = await query<{ ref: string; status: ReviewStatus; comment: string | null; email: string | null; at: Date }>(
    "SELECT r.ref, r.status, r.comment, u.email, r.at FROM content_reviews r LEFT JOIN users u ON u.id = r.reviewer_id WHERE r.kind = $1", [kind]);
  return new Map(rows.map((r) => [r.ref, { status: r.status, comment: r.comment, by: r.email, at: r.at.toISOString() }]));
}

export async function reviewQueue() {
  const [stats, bugs, rq, rb, rp] = await Promise.all([
    questionStats(),
    query<{ id: string; text: string; page: string | null; section: string | null; status: string; created_at: Date }>(
      "SELECT id, text, page, section, status, created_at FROM bug_reports WHERE kind = 'merytoryczny' AND status IN ('nowe', 'w_toku') ORDER BY created_at DESC LIMIT 300"),
    reviewsOf("pytanie"), reviewsOf("zgloszenie"), reviewsOf("prognoza"),
  ]);
  const questions = stats.rows.filter((r) => r.flags.length > 0 || r.reports > 0 || rq.has(r.id))
    .sort((a, b) => b.reports - a.reports || b.flags.length - a.flags.length || a.pct - b.pct)
    .slice(0, 300)
    .map((r) => ({ ref: r.id, src: r.src, question: r.question, n: r.n, pct: r.pct, flags: r.flags, reports: r.reports, review: rq.get(r.id) ?? null }));
  return {
    questions,
    bugs: bugs.rows.map((b) => ({ ref: b.id, text: b.text, page: b.page, section: b.section, status: b.status, createdAt: b.created_at.toISOString(), review: rb.get(b.id) ?? null })),
    prognoza: PROGNOZA.map((p) => ({ ...p, review: rp.get(p.ref) ?? null })),
  };
}

/** Pełne pytanie (z kluczem i wyjaśnieniem) do recenzji. */
export function reviewQuestion(id: string | null) {
  const q = id ? getQuestion(id) : null;
  if (!q) throw new HttpError(404, "Nie ma takiego pytania.");
  return { id: q.id, edition: q.edition, question: q.question, options: q.options, correct: q.correct, explanation: q.explanation ?? null };
}

export async function saveReview(me: User, body: Record<string, unknown>): Promise<Review | null> {
  const v = reviewInput(body);
  if (typeof v === "string") throw new HttpError(400, v);
  const exists = v.kind === "pytanie" ? !!getQuestion(v.ref)
    : v.kind === "prognoza" ? PROGNOZA_REFS.has(v.ref)
    : /^[0-9a-f-]{36}$/i.test(v.ref) && ((await query("SELECT 1 FROM bug_reports WHERE id = $1", [v.ref])).rowCount ?? 0) > 0;
  if (!exists) throw new HttpError(404, "Nie ma takiej pozycji.");
  if (v.status === null) {
    await query("DELETE FROM content_reviews WHERE kind = $1 AND ref = $2", [v.kind, v.ref]);
    return null;
  }
  const { rows } = await query<{ at: Date }>(
    `INSERT INTO content_reviews (kind, ref, status, comment, reviewer_id) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (kind, ref) DO UPDATE SET status = EXCLUDED.status, comment = EXCLUDED.comment, reviewer_id = EXCLUDED.reviewer_id, at = now()
     RETURNING at`, [v.kind, v.ref, v.status, v.comment, me.id]);
  if (me.isAdmin) await audit(me.id, "recenzja", `${v.kind}:${v.ref}`, { status: v.status });
  return { status: v.status, comment: v.comment, by: me.email, at: rows[0].at.toISOString() };
}
