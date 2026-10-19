import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { createHash } from "node:crypto";
import { SCHEMA_SQL } from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool; schemaReady?: Promise<void> };

function getPool(): Pool {
  if (!globalForDb.pool) {
    const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (!connectionString) throw new Error("Brak zmiennej DATABASE_URL");
    const local = /localhost|127\.0\.0\.1/.test(connectionString);
    globalForDb.pool = new Pool({
      connectionString,
      ssl: local ? undefined : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForDb.pool;
}

/** Wersja schematu (skrót SCHEMA_SQL): pełna migracja tylko po zmianie – zwykły zimny start to jedno szybkie SELECT, bez blokad ALTER TABLE. */
const SCHEMA_VERSION = createHash("sha256").update(SCHEMA_SQL).digest("hex").slice(0, 16);

async function migrate(pool: Pool): Promise<void> {
  try {
    const { rows } = await pool.query<{ value: string }>("SELECT value FROM settings WHERE key = 'schema_version'");
    if (rows[0]?.value === SCHEMA_VERSION) return;
  } catch {
    // brak tabeli settings – świeża baza
  }
  await pool.query(SCHEMA_SQL);
  await pool.query(
    `INSERT INTO settings (key, value) VALUES ('schema_version', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [SCHEMA_VERSION]);
}

function ensureSchema(): Promise<void> {
  if (!globalForDb.schemaReady) {
    globalForDb.schemaReady = migrate(getPool())
      .catch((err) => {
        globalForDb.schemaReady = undefined;
        throw err;
      });
  }
  return globalForDb.schemaReady;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  await ensureSchema();
  return getPool().query<T>(text, params);
}

/** Transakcja: `fn` dostaje klienta z otwartą transakcją (COMMIT po sukcesie, ROLLBACK po błędzie). */
export async function withTx<R>(fn: (q: <T extends QueryResultRow>(text: string, params?: unknown[]) => Promise<QueryResult<T>>) => Promise<R>): Promise<R> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const r = await fn(<T extends QueryResultRow>(text: string, params: unknown[] = []) => client.query<T>(text, params));
    await client.query("COMMIT");
    return r;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
