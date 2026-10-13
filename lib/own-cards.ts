import { COURSE } from "@/data/nauka";
import { query } from "./db";
import { isOwnId, MAX_OWN_CARDS, OwnCardError, ownCardInput, ownUuid } from "./own-cards-core";
import { HttpError } from "./tests";

/** Własne fiszki w bazie (logika: own-cards-core.ts). Odczyt także w podglądzie admina, zapis tylko właściciel. */

export interface OwnCard {
  /** `u:<uuid>` – jak id hasła kursu w taliach i gwiazdkach. */
  id: string; t: string; d: string; w: string | null; topic: string; kind: string;
  /** Oceny „znam” / wszystkie (tylko dla obwódki tej karty). */
  c: number; n: number; updated_at: string;
}

const TOPICS = COURSE.topics.map((t) => t.id);
const KINDS = COURSE.kinds.map((k) => k.id).filter((k) => k !== "zrozumienie");
const COLS = "id, t, d, w, topic, kind, c, n, updated_at";
type Row = { id: string; t: string; d: string; w: string | null; topic: string; kind: string; c: number; n: number; updated_at: Date };
const toCard = (r: Row): OwnCard => ({ ...r, id: `u:${r.id}`, updated_at: r.updated_at.toISOString() });

const input = (body: Record<string, unknown>) => {
  try {
    return ownCardInput(body, TOPICS, KINDS);
  } catch (e) {
    if (e instanceof OwnCardError) throw new HttpError(400, e.message);
    throw e;
  }
};
const uuidOf = (id: string) => {
  if (!isOwnId(id)) throw new HttpError(404, "Nie ma takiej fiszki.");
  return ownUuid(id);
};

export async function listOwnCards(userId: string): Promise<OwnCard[]> {
  const { rows } = await query<Row>(`SELECT ${COLS} FROM own_cards WHERE user_id = $1 ORDER BY updated_at DESC`, [userId]);
  return rows.map(toCard);
}

export async function createOwnCard(userId: string, body: Record<string, unknown>): Promise<OwnCard> {
  const v = input(body);
  const { rows: n } = await query<{ n: string }>("SELECT COUNT(*) AS n FROM own_cards WHERE user_id = $1", [userId]);
  if (Number(n[0].n) >= MAX_OWN_CARDS) throw new HttpError(400, `Możesz mieć najwyżej ${MAX_OWN_CARDS} własnych fiszek.`);
  const { rows } = await query<Row>(
    `INSERT INTO own_cards (user_id, t, d, w, topic, kind) VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLS}`,
    [userId, v.t, v.d, v.w, v.topic, v.kind]);
  return toCard(rows[0]);
}

export async function updateOwnCard(userId: string, id: string, body: Record<string, unknown>): Promise<OwnCard> {
  const v = input(body);
  const { rows } = await query<Row>(
    `UPDATE own_cards SET t = $3, d = $4, w = $5, topic = $6, kind = $7, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING ${COLS}`,
    [uuidOf(id), userId, v.t, v.d, v.w, v.topic, v.kind]);
  if (!rows[0]) throw new HttpError(404, "Nie ma takiej fiszki.");
  return toCard(rows[0]);
}

/** Usunięcie karty – także z talii, gwiazdek (notatki z tą kartą pokażą „usunięta fiszka”). */
export async function deleteOwnCard(userId: string, id: string): Promise<{ ok: true }> {
  const { rowCount } = await query("DELETE FROM own_cards WHERE id = $1 AND user_id = $2", [uuidOf(id), userId]);
  if (!rowCount) throw new HttpError(404, "Nie ma takiej fiszki.");
  await query("DELETE FROM deck_cards WHERE item_id = $1 AND deck_id IN (SELECT id FROM decks WHERE user_id = $2)", [id, userId]);
  await query("DELETE FROM stars WHERE user_id = $1 AND kind = 'fiszka' AND ref = $2", [userId, id]);
  return { ok: true };
}

/** Ocena „znam / nie znam” – tylko licznik w karcie (bez flash_ratings, więc bez wpływu na Naukę i statystyki). */
export async function rateOwnCard(userId: string, id: string, known: boolean): Promise<{ ok: true }> {
  const { rowCount } = await query("UPDATE own_cards SET c = c + $3, n = n + 1 WHERE id = $1 AND user_id = $2",
    [uuidOf(id), userId, known ? 1 : 0]);
  if (!rowCount) throw new HttpError(404, "Nie ma takiej fiszki.");
  return { ok: true };
}

/** Które z podanych id `u:…` to karty tego konta (talie, gwiazdki, notatki). */
export async function ownedIds(userId: string, ids: readonly unknown[]): Promise<Set<string>> {
  const u = [...new Set(ids.filter(isOwnId))];
  if (!u.length) return new Set();
  const { rows } = await query<{ id: string }>("SELECT id FROM own_cards WHERE user_id = $1 AND id = ANY($2::uuid[])", [userId, u.map(ownUuid)]);
  return new Set(rows.map((r) => `u:${r.id}`));
}

/** Tytuły własnych kart (podgląd talii). */
export async function ownTitles(userId: string, ids: readonly string[]): Promise<Record<string, string>> {
  const u = [...new Set(ids.filter(isOwnId))];
  if (!u.length) return {};
  const { rows } = await query<{ id: string; t: string }>("SELECT id, t FROM own_cards WHERE user_id = $1 AND id = ANY($2::uuid[])", [userId, u.map(ownUuid)]);
  return Object.fromEntries(rows.map((r) => [`u:${r.id}`, r.t]));
}
