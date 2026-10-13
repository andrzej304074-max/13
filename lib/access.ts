import { query } from "./db";
import { DEFAULT_ACCESS, effectiveBlocks, sanitizeSettings, type AccessSettings, type BlockMode } from "./access-core";

/** Ustawienia blokad sekcji (settings.access) – w pamięci procesu przez 30 s; zapis przez panel admina czyści pamięć. */
const g = globalThis as unknown as { access?: { at: number; v: AccessSettings } };
const TTL = 30_000;

export async function getAccessSettings(): Promise<AccessSettings> {
  if (g.access && Date.now() - g.access.at < TTL) return g.access.v;
  const { rows } = await query<{ value: string }>("SELECT value FROM settings WHERE key = 'access'");
  let v = DEFAULT_ACCESS;
  try { if (rows[0]) v = sanitizeSettings(JSON.parse(rows[0].value)); } catch {}
  g.access = { at: Date.now(), v };
  return v;
}

export async function saveAccessSettings(v: unknown): Promise<AccessSettings> {
  const s = sanitizeSettings(v);
  await query(
    `INSERT INTO settings (key, value) VALUES ('access', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [JSON.stringify(s)]);
  g.access = { at: Date.now(), v: s };
  return s;
}

/** Łączne blokady i wygląd menu dla konta. */
export async function accessFor(user: { isAdmin: boolean; blocked: string[]; blockMode: BlockMode | null }): Promise<{ blocks: string[]; mode: BlockMode }> {
  const s = await getAccessSettings();
  return { blocks: effectiveBlocks(user, s), mode: user.blockMode ?? s.mode };
}
