import { query } from "./db";
import { isPrefKey, validPrefValue } from "./prefs-core";
import { HttpError } from "./tests";

/** Wszystkie zapisane filtry konta: klucz → wartość. */
export async function getPrefs(userId: string): Promise<Record<string, string>> {
  const { rows } = await query<{ key: string; value: string }>("SELECT key, value FROM user_prefs WHERE user_id = $1", [userId]);
  return Object.fromEntries(rows.filter((r) => isPrefKey(r.key)).map((r) => [r.key, r.value]));
}

/** Zapis filtra (pusta wartość usuwa wpis – przywrócenie domyślnych). */
export async function setPref(userId: string, key: unknown, value: unknown): Promise<void> {
  if (!isPrefKey(key)) throw new HttpError(400, "Nieznane ustawienie.");
  if (!validPrefValue(value)) throw new HttpError(400, "Nieprawidłowa wartość ustawienia.");
  if (value === "") {
    await query("DELETE FROM user_prefs WHERE user_id = $1 AND key = $2", [userId, key]);
    return;
  }
  await query(
    `INSERT INTO user_prefs (user_id, key, value) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [userId, key, value],
  );
}
