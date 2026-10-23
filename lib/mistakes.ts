import { query } from "./db";

/** Okno błędów do powtórki. */
export const MISTAKE_DAYS = 90;

/**
 * Pytania do „Tylko moje błędy”: ostatnia odpowiedź użytkownika na pytanie (z ostatnich 90 dni, ze wszystkich testów)
 * była błędna, częściowa albo pominięta. Kolejność – od najdawniejszego błędu. Pytanie wypada, gdy ostatnia odpowiedź jest poprawna.
 */
export async function mistakeIds(userId: string): Promise<string[]> {
  const { rows } = await query<{ q: string }>(
    `SELECT q FROM (
       SELECT DISTINCT ON (a.question_id) a.question_id AS q, a.answered_at AS at,
         CASE WHEN a.skipped THEN 0 WHEN t.type = 'single' THEN (a.points = 2)::int ELSE a.points / 2 END AS acc
       FROM answers a JOIN tests t ON t.id = a.test_id
       WHERE t.user_id = $1 AND a.answered_at > now() - make_interval(days => $2)
       ORDER BY a.question_id, a.answered_at DESC
     ) last WHERE acc < 1 ORDER BY at`,
    [userId, MISTAKE_DAYS],
  );
  return rows.map((r) => r.q);
}
