import { query } from "./db";

/**
 * Zużycie bazy (karta „Baza danych” w panelu admina) i codzienne sprzątanie.
 * Limit domyślnie 512 MB – plan Free w Neon (0,5 GB na projekt); inny limit: zmienna DB_LIMIT_MB.
 */
export const DB_LIMIT_MB = Number(process.env.DB_LIMIT_MB) > 0 ? Number(process.env.DB_LIMIT_MB) : 512;

export interface DbUsage {
  bytes: number; limitBytes: number; percent: number;
  tables: { name: string; rows: number; bytes: number }[];
  counts: { users: number; tests: number; answers: number; sessions: number; notes: number };
  cleanedAt: string | null;
}

export async function dbUsage(): Promise<DbUsage> {
  const [{ rows: size }, { rows: tables }, { rows: counts }, { rows: cl }] = await Promise.all([
    query<{ b: string }>("SELECT pg_database_size(current_database()) AS b"),
    query<{ name: string; rows: string; bytes: string }>(
      `SELECT relname AS name, n_live_tup AS rows, pg_total_relation_size(relid) AS bytes
       FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 8`),
    query<{ users: string; tests: string; answers: string; sessions: string; notes: string }>(
      `SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM tests) AS tests,
         (SELECT COUNT(*) FROM answers) + (SELECT COUNT(*) FROM learn_answers) AS answers,
         (SELECT COUNT(*) FROM learn_sessions) AS sessions, (SELECT COUNT(*) FROM notes) AS notes`),
    query<{ value: string }>("SELECT value FROM settings WHERE key = 'cleanup_at'"),
  ]);
  const bytes = Number(size[0].b), limitBytes = DB_LIMIT_MB * 1024 * 1024;
  const c = counts[0];
  return {
    bytes, limitBytes, percent: Math.round((bytes / limitBytes) * 1000) / 10,
    tables: tables.map((t) => ({ name: t.name, rows: Number(t.rows), bytes: Number(t.bytes) })),
    counts: { users: Number(c.users), tests: Number(c.tests), answers: Number(c.answers), sessions: Number(c.sessions), notes: Number(c.notes) },
    cleanedAt: cl[0]?.value ?? null,
  };
}

/** Usuwa wygasłe sesje logowania i linki resetu hasła oraz stare błędne kody – najwyżej raz na dobę. */
export async function cleanup(force = false): Promise<{ sessions: number; resets: number; failures: number } | null> {
  if (!force) {
    const { rows } = await query<{ due: boolean }>(
      "SELECT COALESCE((SELECT value::timestamptz < now() - interval '1 day' FROM settings WHERE key = 'cleanup_at'), true) AS due");
    if (!rows[0].due) return null;
  }
  const s = await query("DELETE FROM user_sessions WHERE expires_at < now()");
  const r = await query("DELETE FROM password_resets WHERE expires_at < now() - interval '1 day'");
  const f = await query("DELETE FROM code_failures WHERE at < now() - interval '1 day'");
  await query(
    `INSERT INTO settings (key, value) VALUES ('cleanup_at', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [new Date().toISOString()]);
  return { sessions: s.rowCount ?? 0, resets: r.rowCount ?? 0, failures: f.rowCount ?? 0 };
}
