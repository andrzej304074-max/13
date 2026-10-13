import { query, withTx } from "./db";
import { getQuestion } from "./questions";
import { scoreMulti } from "./scoring";

/**
 * Jednorazowe przeliczenie odpowiedzi wielokrotnego wyboru według punktacji „4 trafne pola – 2 pkt, 3 – 1 pkt, mniej – 0”
 * (wcześniej 0,5 pkt za każde trafne pole). Zaznaczenia są zapisane, więc punkty liczymy od nowa; potem sumy testów.
 * Flaga `scoring_multi = v2` w `settings` – po przeliczeniu kolejne wywołania kończą się na jednym SELECT
 * (a w tym samym procesie – od razu, bez zapytania).
 */
const VERSION = "v2";
const g = globalThis as unknown as { rescored?: Promise<void> };

export interface MultiAnswer { test_id: string; question_id: string; selected: number[]; points: number; skipped: boolean }

/** Nowe punkty dla odpowiedzi, które się zmieniają (pominięte zawsze 0; pytanie spoza bazy – bez zmian). */
export function rescoreRows(rows: MultiAnswer[], correctOf: (qid: string) => number[] | undefined): MultiAnswer[] {
  const out: MultiAnswer[] = [];
  for (const r of rows) {
    const c = correctOf(r.question_id);
    if (!c) continue;
    const pts = r.skipped ? 0 : scoreMulti(r.selected, c);
    if (pts !== r.points) out.push({ ...r, points: pts });
  }
  return out;
}

async function run(): Promise<void> {
  const { rows } = await query<{ value: string }>("SELECT value FROM settings WHERE key = 'scoring_multi'");
  if (rows[0]?.value === VERSION) return;
  await withTx(async (q) => {
    await q("SELECT pg_advisory_xact_lock(4242001)");
    const again = await q<{ value: string }>("SELECT value FROM settings WHERE key = 'scoring_multi'");
    if (again.rows[0]?.value === VERSION) return;
    const { rows: ans } = await q<MultiAnswer>(
      `SELECT a.test_id, a.question_id, a.selected, a.points, a.skipped
       FROM answers a JOIN tests t ON t.id = a.test_id WHERE t.type = 'multi'`,
    );
    const changed = rescoreRows(ans, (qid) => getQuestion(qid)?.correct);
    if (changed.length) {
      await q(
        `UPDATE answers a SET points = u.points
         FROM unnest($1::uuid[], $2::text[], $3::float8[]) AS u(test_id, question_id, points)
         WHERE a.test_id = u.test_id AND a.question_id = u.question_id`,
        [changed.map((r) => r.test_id), changed.map((r) => r.question_id), changed.map((r) => r.points)],
      );
      await q(
        `UPDATE tests t SET score = (SELECT COALESCE(SUM(points), 0) FROM answers a WHERE a.test_id = t.id)
         WHERE t.type = 'multi'`,
      );
    }
    await q(
      `INSERT INTO settings (key, value) VALUES ('scoring_multi', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [VERSION],
    );
  });
}

/** Wywoływane przed odczytem wyników testów i statystyk. */
export function ensureRescored(): Promise<void> {
  if (!g.rescored) g.rescored = run().catch((err) => { g.rescored = undefined; throw err; });
  return g.rescored;
}
