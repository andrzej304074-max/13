import { Pool, type QueryResult, type QueryResultRow } from "pg";
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

function ensureSchema(): Promise<void> {
  if (!globalForDb.schemaReady) {
    globalForDb.schemaReady = getPool()
      .query(SCHEMA_SQL)
      .then(() => undefined)
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
