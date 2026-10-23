import { query } from "./db";
import { BUG_LIMITS, BugError, bugInput, bugUpdate, type BugKind, type BugStatus } from "./bugs-core";
import { HttpError } from "./tests";

/** Zgłoszenia błędów: użytkownik widzi swoje, admin wszystkie (z adresem e-mail zgłaszającego). */

export interface BugReport {
  id: string; text: string; page: string | null; device: string | null; status: BugStatus; note: string | null;
  kind: BugKind; section: string | null;
  created_at: string; updated_at: string;
  /** Tylko w liście admina. */
  email?: string;
}

type Row = { id: string; text: string; page: string | null; device: string | null; status: BugStatus; admin_note: string | null; kind: BugKind; section: string | null; created_at: Date; updated_at: Date; email?: string };
const toReport = (r: Row): BugReport => ({
  id: r.id, text: r.text, page: r.page, device: r.device, status: r.status, note: r.admin_note, kind: r.kind, section: r.section,
  created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString(), ...(r.email ? { email: r.email } : {}),
});
const wrap = <T>(fn: () => T): T => {
  try { return fn(); } catch (e) { if (e instanceof BugError) throw new HttpError(400, e.message); throw e; }
};

export async function createBug(userId: string, body: Record<string, unknown>): Promise<BugReport> {
  const v = wrap(() => bugInput(body));
  const { rows: n } = await query<{ n: string }>(
    "SELECT COUNT(*) AS n FROM bug_reports WHERE user_id = $1 AND created_at > now() - interval '1 day'", [userId]);
  if (Number(n[0].n) >= BUG_LIMITS.perDay) throw new HttpError(429, `Najwyżej ${BUG_LIMITS.perDay} zgłoszeń na dobę – spróbuj jutro.`);
  const { rows } = await query<Row>(
    "INSERT INTO bug_reports (user_id, text, page, device, kind, section) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [userId, v.text, v.page, v.device, v.kind, v.section]);
  return toReport(rows[0]);
}

export async function listMyBugs(userId: string): Promise<BugReport[]> {
  const { rows } = await query<Row>("SELECT * FROM bug_reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100", [userId]);
  return rows.map(toReport);
}

export async function listAllBugs(status: string | null, kind: string | null = null): Promise<{ reports: BugReport[]; counts: Record<string, number> }> {
  const { rows } = await query<Row>(
    `SELECT b.*, u.email FROM bug_reports b JOIN users u ON u.id = b.user_id
     WHERE ($1::text IS NULL OR b.status = $1) AND ($2::text IS NULL OR b.kind = $2)
     ORDER BY (b.status = 'nowe') DESC, b.created_at DESC LIMIT 500`, [status, kind]);
  const { rows: c } = await query<{ status: string; n: string }>("SELECT status, COUNT(*) AS n FROM bug_reports GROUP BY status");
  return { reports: rows.map(toReport), counts: Object.fromEntries(c.map((r) => [r.status, Number(r.n)])) };
}

export async function updateBug(id: string, body: Record<string, unknown>): Promise<BugReport> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Nie ma takiego zgłoszenia.");
  const v = wrap(() => bugUpdate(body));
  const { rows } = await query<Row>(
    `UPDATE bug_reports SET status = COALESCE($2, status), admin_note = CASE WHEN $3 THEN $4 ELSE admin_note END, updated_at = now()
     WHERE id = $1 RETURNING *`, [id, v.status ?? null, "note" in v, v.note ?? null]);
  if (!rows[0]) throw new HttpError(404, "Nie ma takiego zgłoszenia.");
  return toReport(rows[0]);
}

export async function countNewBugs(): Promise<number> {
  const { rows } = await query<{ n: string }>("SELECT COUNT(*) AS n FROM bug_reports WHERE status = 'nowe'");
  return Number(rows[0].n);
}
