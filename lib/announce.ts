import { query } from "./db";
import {
  AnnError, annInput, pollClosed, pollInput, resultsVisible, tally, voteInput, type ResultsAfter,
} from "./announce-core";
import { HttpError } from "./tests";

/** Ogłoszenia i ankiety: widok użytkownika (opublikowane, nieprzeczytane, głosowanie) i zarządzanie w panelu admina. */

export interface Announcement {
  id: string; title: string; body: string; pinned: boolean;
  published_at: string | null; expires_at: string | null; created_at: string; read: boolean;
}
export interface PollView {
  id: string; question: string; options: string[]; multi: boolean; anonymous: boolean; results_after: ResultsAfter;
  published_at: string | null; closes_at: string | null; closed: boolean; read: boolean;
  /** Mój głos (indeksy) albo null. */
  mine: number[] | null;
  /** Wyniki – gdy widoczne (po głosie albo po zamknięciu, zależnie od ustawień). */
  results: { voters: number; counts: number[]; pct: number[] } | null;
}
export interface AdminPoll extends Omit<PollView, "read" | "mine" | "results"> {
  results: { voters: number; counts: number[]; pct: number[] };
  /** Kto głosował (tylko ankiety nieanonimowe). */
  voters: { email: string; choices: number[] }[] | null;
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);
const isId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);
const wrap = <T>(fn: () => T): T => {
  try { return fn(); } catch (e) { if (e instanceof AnnError) throw new HttpError(400, e.message); throw e; }
};

type ARow = { id: string; title: string; body: string; pinned: boolean; published_at: Date | null; expires_at: Date | null; created_at: Date; read?: boolean };
const toAnn = (r: ARow): Announcement => ({
  id: r.id, title: r.title, body: r.body, pinned: r.pinned, published_at: iso(r.published_at), expires_at: iso(r.expires_at),
  created_at: r.created_at.toISOString(), read: !!r.read,
});
type PRow = { id: string; question: string; options: string[]; multi: boolean; anonymous: boolean; results_after: ResultsAfter; published_at: Date | null; closes_at: Date | null };

/* ---------- użytkownik ---------- */

const VISIBLE_ANN = "a.published_at IS NOT NULL AND a.published_at <= now() AND (a.expires_at IS NULL OR a.expires_at > now())";
const VISIBLE_POLL = "p.published_at IS NOT NULL AND p.published_at <= now()";

/** Opublikowane ogłoszenia (przypięte na górze) i ankiety z moim głosem i wynikami (gdy widoczne). */
export async function feed(userId: string): Promise<{ announcements: Announcement[]; polls: PollView[] }> {
  const { rows: a } = await query<ARow>(
    `SELECT a.*, (r.user_id IS NOT NULL) AS read FROM announcements a
     LEFT JOIN announcement_reads r ON r.item_id = a.id AND r.user_id = $1
     WHERE ${VISIBLE_ANN} ORDER BY a.pinned DESC, a.published_at DESC LIMIT 100`, [userId]);
  const { rows: p } = await query<PRow & { read: boolean; mine: number[] | null }>(
    `SELECT p.*, (r.user_id IS NOT NULL) AS read, v.choices AS mine FROM polls p
     LEFT JOIN announcement_reads r ON r.item_id = p.id AND r.user_id = $1
     LEFT JOIN poll_votes v ON v.poll_id = p.id AND v.user_id = $1
     WHERE ${VISIBLE_POLL} ORDER BY p.published_at DESC LIMIT 50`, [userId]);
  const votes = await votesFor(p.map((x) => x.id));
  return {
    announcements: a.map(toAnn),
    polls: p.map((x) => {
      const closes = iso(x.closes_at);
      const show = resultsVisible({ results_after: x.results_after, closes_at: closes }, !!x.mine);
      return {
        id: x.id, question: x.question, options: x.options, multi: x.multi, anonymous: x.anonymous, results_after: x.results_after,
        published_at: iso(x.published_at), closes_at: closes, closed: pollClosed(closes), read: x.read, mine: x.mine,
        results: show ? tally(x.options.length, votes.get(x.id) ?? []) : null,
      };
    }),
  };
}

async function votesFor(ids: string[]): Promise<Map<string, number[][]>> {
  const m = new Map<string, number[][]>();
  if (!ids.length) return m;
  const { rows } = await query<{ poll_id: string; choices: number[] }>("SELECT poll_id, choices FROM poll_votes WHERE poll_id = ANY($1::uuid[])", [ids]);
  for (const r of rows) (m.get(r.poll_id) ?? m.set(r.poll_id, []).get(r.poll_id)!).push(r.choices);
  return m;
}

/** Licznik nieprzeczytanych (🔔) i przypięte ogłoszenie do paska (najnowsze nieukryte). */
export async function badge(userId: string): Promise<{ unread: number; pinned: { id: string; title: string; body: string } | null }> {
  // Jedno zapytanie (licznik + przypięte) – wywoływane na każdej stronie.
  const { rows } = await query<{ n: string; id: string | null; title: string | null; body: string | null }>(
    `SELECT (SELECT COUNT(*) FROM announcements a WHERE ${VISIBLE_ANN}
              AND NOT EXISTS (SELECT 1 FROM announcement_reads r WHERE r.item_id = a.id AND r.user_id = $1))
          + (SELECT COUNT(*) FROM polls p WHERE ${VISIBLE_POLL}
              AND NOT EXISTS (SELECT 1 FROM announcement_reads r WHERE r.item_id = p.id AND r.user_id = $1)) AS n,
            pin.id, pin.title, pin.body
       FROM (SELECT 1) one LEFT JOIN LATERAL (
         SELECT a.id, a.title, a.body FROM announcements a WHERE ${VISIBLE_ANN} AND a.pinned
            AND NOT EXISTS (SELECT 1 FROM announcement_reads r WHERE r.item_id = a.id AND r.user_id = $1 AND r.dismissed)
          ORDER BY a.published_at DESC LIMIT 1) pin ON true`, [userId]);
  const r = rows[0];
  const pin = r.id ? [{ id: r.id, title: r.title ?? "", body: r.body ?? "" }] : [];
  return { unread: Number(rows[0].n), pinned: pin[0] ? { ...pin[0], body: pin[0].body.slice(0, 280) } : null };
}

/** Oznacz jako przeczytane (lista identyfikatorów widocznych ogłoszeń i ankiet). */
export async function markRead(userId: string, ids: unknown): Promise<{ ok: true }> {
  const list = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string" && isId(x)).slice(0, 200) : [];
  if (list.length) {
    await query(
      `INSERT INTO announcement_reads (user_id, item_id)
       SELECT $1, x FROM unnest($2::uuid[]) AS x
       WHERE EXISTS (SELECT 1 FROM announcements WHERE id = x) OR EXISTS (SELECT 1 FROM polls WHERE id = x)
       ON CONFLICT DO NOTHING`, [userId, list]);
  }
  return { ok: true };
}

/** Ukryj przypięte ogłoszenie z paska (zostaje na liście, jest przeczytane). */
export async function dismiss(userId: string, id: string): Promise<{ ok: true }> {
  if (!isId(id)) throw new HttpError(404, "Nie ma takiego ogłoszenia.");
  const { rowCount } = await query(
    `INSERT INTO announcement_reads (user_id, item_id, dismissed) SELECT $1, id, true FROM announcements WHERE id = $2
     ON CONFLICT (user_id, item_id) DO UPDATE SET dismissed = true`, [userId, id]);
  if (!rowCount) throw new HttpError(404, "Nie ma takiego ogłoszenia.");
  return { ok: true };
}

/** Głos w ankiecie: raz na konto, tylko w otwartej, opublikowanej ankiecie. */
export async function vote(userId: string, pollId: string, body: Record<string, unknown>): Promise<PollView> {
  if (!isId(pollId)) throw new HttpError(404, "Nie ma takiej ankiety.");
  const { rows } = await query<PRow>(`SELECT p.* FROM polls p WHERE p.id = $1 AND ${VISIBLE_POLL}`, [pollId]);
  const p = rows[0];
  if (!p) throw new HttpError(404, "Nie ma takiej ankiety.");
  if (pollClosed(iso(p.closes_at))) throw new HttpError(409, "Ankieta jest już zamknięta.");
  const choices = wrap(() => voteInput(body, p.options.length, p.multi));
  const { rowCount } = await query(
    "INSERT INTO poll_votes (poll_id, user_id, choices) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [pollId, userId, choices]);
  if (!rowCount) throw new HttpError(409, "Już głosowano w tej ankiecie.");
  await markRead(userId, [pollId]);
  const f = await feed(userId);
  return f.polls.find((x) => x.id === pollId)!;
}

/* ---------- admin ---------- */

export async function adminList(): Promise<{ announcements: (Announcement & { reads: number })[]; polls: AdminPoll[]; users: number }> {
  const { rows: a } = await query<ARow & { reads: string }>(
    `SELECT a.*, (SELECT COUNT(*) FROM announcement_reads r WHERE r.item_id = a.id) AS reads
     FROM announcements a ORDER BY a.created_at DESC LIMIT 200`);
  const { rows: p } = await query<PRow>("SELECT * FROM polls ORDER BY created_at DESC LIMIT 100");
  const { rows: v } = await query<{ poll_id: string; choices: number[]; email: string }>(
    "SELECT v.poll_id, v.choices, u.email FROM poll_votes v JOIN users u ON u.id = v.user_id ORDER BY v.created_at");
  const { rows: u } = await query<{ n: string }>("SELECT COUNT(*) AS n FROM users WHERE activated_at IS NOT NULL");
  return {
    users: Number(u[0].n),
    announcements: a.map((r) => ({ ...toAnn(r), reads: Number(r.reads) })),
    polls: p.map((x) => {
      const mine = v.filter((y) => y.poll_id === x.id);
      const closes = iso(x.closes_at);
      return {
        id: x.id, question: x.question, options: x.options, multi: x.multi, anonymous: x.anonymous, results_after: x.results_after,
        published_at: iso(x.published_at), closes_at: closes, closed: pollClosed(closes),
        results: tally(x.options.length, mine.map((y) => y.choices)),
        voters: x.anonymous ? null : mine.map((y) => ({ email: y.email, choices: y.choices })),
      };
    }),
  };
}

/** Publikacja: „published” = true ustawia datę publikacji (zachowuje wcześniejszą), false – wycofuje (szkic). */
const PUB = "CASE WHEN $PUB THEN COALESCE(published_at, now()) ELSE NULL END";

export async function createAnnouncement(authorId: string, body: Record<string, unknown>) {
  const v = wrap(() => annInput(body));
  const { rows } = await query<ARow>(
    `INSERT INTO announcements (title, body, pinned, expires_at, author, published_at)
     VALUES ($1, $2, $3, $4, $5, CASE WHEN $6 THEN now() ELSE NULL END) RETURNING *`,
    [v.title, v.body, v.pinned, v.expires_at, authorId, v.published]);
  return toAnn(rows[0]);
}

export async function updateAnnouncement(id: string, body: Record<string, unknown>) {
  if (!isId(id)) throw new HttpError(404, "Nie ma takiego ogłoszenia.");
  const v = wrap(() => annInput(body));
  const { rows } = await query<ARow>(
    `UPDATE announcements SET title = $2, body = $3, pinned = $4, expires_at = $5,
       published_at = ${PUB.replace("$PUB", "$6")}, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, v.title, v.body, v.pinned, v.expires_at, v.published]);
  if (!rows[0]) throw new HttpError(404, "Nie ma takiego ogłoszenia.");
  return toAnn(rows[0]);
}

export async function createPoll(authorId: string, body: Record<string, unknown>) {
  const v = wrap(() => pollInput(body));
  const { rows } = await query<{ id: string }>(
    `INSERT INTO polls (question, options, multi, anonymous, results_after, closes_at, author, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $8 THEN now() ELSE NULL END) RETURNING id`,
    [v.question, JSON.stringify(v.options), v.multi, v.anonymous, v.results_after, v.closes_at, authorId, v.published]);
  return { id: rows[0].id };
}

/** Edycja ankiety; odpowiedzi, wielokrotny wybór i anonimowość można zmienić tylko przed pierwszym głosem. */
export async function updatePoll(id: string, body: Record<string, unknown>) {
  if (!isId(id)) throw new HttpError(404, "Nie ma takiej ankiety.");
  const v = wrap(() => pollInput(body));
  const { rows: cur } = await query<PRow & { n: string }>(
    "SELECT p.*, (SELECT COUNT(*) FROM poll_votes WHERE poll_id = p.id) AS n FROM polls p WHERE p.id = $1", [id]);
  const c = cur[0];
  if (!c) throw new HttpError(404, "Nie ma takiej ankiety.");
  if (Number(c.n) > 0 && (JSON.stringify(c.options) !== JSON.stringify(v.options) || c.multi !== v.multi || c.anonymous !== v.anonymous)) {
    throw new HttpError(409, "Po pierwszym głosie nie można zmieniać odpowiedzi, wielokrotnego wyboru ani anonimowości.");
  }
  await query(
    `UPDATE polls SET question = $2, options = $3, multi = $4, anonymous = $5, results_after = $6, closes_at = $7,
       published_at = ${PUB.replace("$PUB", "$8")}, updated_at = now() WHERE id = $1`,
    [id, v.question, JSON.stringify(v.options), v.multi, v.anonymous, v.results_after, v.closes_at, v.published]);
  return { id };
}

export async function deleteItem(kind: "announcement" | "poll", id: string) {
  if (!isId(id)) throw new HttpError(404, "Nie ma takiej pozycji.");
  const { rowCount } = await query(`DELETE FROM ${kind === "poll" ? "polls" : "announcements"} WHERE id = $1`, [id]);
  if (!rowCount) throw new HttpError(404, "Nie ma takiej pozycji.");
  await query("DELETE FROM announcement_reads WHERE item_id = $1", [id]);
  return { ok: true };
}
