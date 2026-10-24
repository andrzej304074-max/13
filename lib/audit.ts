import { query } from "./db";

/** Dziennik działań administratorów (tabela admin_audit) – zapis nie przerywa działania, gdy się nie uda. */
export async function audit(adminId: string | null, action: string, target: string | null = null, detail: Record<string, unknown> | null = null) {
  await query("INSERT INTO admin_audit (admin_id, action, target, detail) VALUES ($1, $2, $3, $4)",
    [adminId, action, target, detail ? JSON.stringify(detail) : null]).catch((e) => console.error("audit", e));
}

export interface AuditRow { id: number; at: string; admin: string | null; action: string; target: string | null; detail: Record<string, unknown> | null }

export async function auditLog(limit = 200): Promise<AuditRow[]> {
  const { rows } = await query<{ id: string; at: Date; email: string | null; action: string; target: string | null; detail: Record<string, unknown> | null }>(
    `SELECT a.id, a.at, u.email, a.action, a.target, a.detail FROM admin_audit a LEFT JOIN users u ON u.id = a.admin_id
     ORDER BY a.at DESC LIMIT $1`, [Math.min(Math.max(limit, 1), 1000)]);
  return rows.map((r) => ({ id: Number(r.id), at: r.at.toISOString(), admin: r.email, action: r.action, target: r.target, detail: r.detail }));
}
