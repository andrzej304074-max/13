import { COURSE } from "@/data/nauka";
import { query, withTx } from "./db";
import { DeckError, deckName, MAX_DECK_CARDS, MAX_DECKS, validOrder } from "./decks-core";
import { HttpError } from "./tests";
import { isOwnId } from "./own-cards-core";
import { ownedIds, ownTitles } from "./own-cards";

/** Własne talie fiszek w bazie (logika: decks-core.ts). Odczyt także w podglądzie admina, zapis tylko właściciel. */

export interface DeckSummary { id: string; name: string; count: number; preview: string[]; updated_at: string; /** Czy zawiera hasło z parametru `item`. */ has?: boolean }
export interface Deck { id: string; name: string; items: string[]; updated_at: string }

const UUID = /^[0-9a-f-]{36}$/i;
const wrap = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof DeckError) throw new HttpError(400, e.message);
    throw e;
  }
};
const isCard = (id: unknown): id is string =>
  typeof id === "string" && !!COURSE.items[id] && COURSE.items[id].kind !== "zrozumienie";

async function own(userId: string, id: string): Promise<{ id: string; name: string; updated_at: Date }> {
  if (!UUID.test(id)) throw new HttpError(404, "Nie ma takiej talii.");
  const { rows } = await query<{ id: string; name: string; updated_at: Date }>(
    "SELECT id, name, updated_at FROM decks WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!rows[0]) throw new HttpError(404, "Nie ma takiej talii.");
  return rows[0];
}

/** Karty z listy, które istnieją: hasła kursu i własne fiszki tego konta (`u:…`). */
async function validCards(userId: string, ids: readonly unknown[]): Promise<string[]> {
  const own = await ownedIds(userId, ids);
  return ids.filter((x): x is string => isCard(x) || (typeof x === "string" && own.has(x)));
}

export async function listDecks(userId: string, item: string | null = null): Promise<DeckSummary[]> {
  const { rows } = await query<{ id: string; name: string; updated_at: Date; count: string; preview: string[] | null; has: boolean }>(
    `SELECT d.id, d.name, d.updated_at, COUNT(c.item_id) AS count,
       (array_agg(c.item_id ORDER BY c.pos) FILTER (WHERE c.item_id IS NOT NULL))[1:4] AS preview,
       COALESCE(bool_or(c.item_id = $2), false) AS has
     FROM decks d LEFT JOIN deck_cards c ON c.deck_id = d.id
     WHERE d.user_id = $1 GROUP BY d.id ORDER BY d.updated_at DESC`,
    [userId, item]);
  const titles = await ownTitles(userId, rows.flatMap((r) => r.preview ?? []));
  return rows.map((r) => ({
    id: r.id, name: r.name, count: Number(r.count), updated_at: r.updated_at.toISOString(),
    preview: (r.preview ?? []).map((i) => COURSE.items[i]?.t ?? titles[i]).filter(Boolean) as string[],
    ...(item ? { has: r.has } : {}),
  }));
}

export async function getDeck(userId: string, id: string): Promise<Deck> {
  const d = await own(userId, id);
  const { rows } = await query<{ item_id: string }>("SELECT item_id FROM deck_cards WHERE deck_id = $1 ORDER BY pos, added_at", [id]);
  return { id: d.id, name: d.name, updated_at: d.updated_at.toISOString(), items: await validCards(userId, rows.map((r) => r.item_id)) };
}

export async function createDeck(userId: string, body: Record<string, unknown>): Promise<Deck> {
  return wrap(async () => {
    const name = deckName(body.name);
    const items = Array.isArray(body.items) ? [...new Set(await validCards(userId, body.items))].slice(0, MAX_DECK_CARDS) : [];
    return withTx(async (q) => {
      const { rows: n } = await q<{ n: string }>("SELECT COUNT(*) AS n FROM decks WHERE user_id = $1", [userId]);
      if (Number(n[0].n) >= MAX_DECKS) throw new HttpError(400, `Możesz mieć najwyżej ${MAX_DECKS} talii.`);
      const { rows } = await q<{ id: string; updated_at: Date }>("INSERT INTO decks (user_id, name) VALUES ($1, $2) RETURNING id, updated_at", [userId, name]);
      if (items.length) {
        await q("INSERT INTO deck_cards (deck_id, item_id, pos) SELECT $1, x, o::int - 1 FROM unnest($2::text[]) WITH ORDINALITY AS u(x, o)", [rows[0].id, items]);
      }
      return { id: rows[0].id, name, items, updated_at: rows[0].updated_at.toISOString() };
    });
  });
}

export async function renameDeck(userId: string, id: string, body: Record<string, unknown>): Promise<{ ok: true }> {
  return wrap(async () => {
    const name = deckName(body.name);
    await own(userId, id);
    await query("UPDATE decks SET name = $2, updated_at = now() WHERE id = $1", [id, name]);
    return { ok: true as const };
  });
}

export async function deleteDeck(userId: string, id: string): Promise<{ ok: true }> {
  await own(userId, id);
  await query("DELETE FROM decks WHERE id = $1", [id]);
  return { ok: true };
}

/** Dodaje kartę na koniec talii (albo na pozycję `at`); karta już w talii – bez zmian. */
export async function addCard(userId: string, id: string, item: unknown): Promise<Deck> {
  if (!(await validCards(userId, [item])).length) throw new HttpError(400, "Nie ma takiego hasła.");
  await own(userId, id);
  await withTx(async (q) => {
    await q("SELECT 1 FROM decks WHERE id = $1 FOR UPDATE", [id]);
    const { rows } = await q<{ n: string; mx: number | null }>("SELECT COUNT(*) AS n, MAX(pos) AS mx FROM deck_cards WHERE deck_id = $1", [id]);
    if (Number(rows[0].n) >= MAX_DECK_CARDS) throw new HttpError(400, `Talia może mieć najwyżej ${MAX_DECK_CARDS} kart.`);
    await q("INSERT INTO deck_cards (deck_id, item_id, pos) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [id, item, (rows[0].mx ?? -1) + 1]);
    await q("UPDATE decks SET updated_at = now() WHERE id = $1", [id]);
  });
  return getDeck(userId, id);
}

export async function removeCard(userId: string, id: string, item: unknown): Promise<Deck> {
  await own(userId, id);
  await query("DELETE FROM deck_cards WHERE deck_id = $1 AND item_id = $2", [id, String(item)]);
  await query("UPDATE decks SET updated_at = now() WHERE id = $1", [id]);
  return getDeck(userId, id);
}

/** Nowa kolejność kart (pełna lista id – permutacja obecnych). */
export async function reorderDeck(userId: string, id: string, items: unknown): Promise<Deck> {
  return wrap(async () => {
    await own(userId, id);
    await withTx(async (q) => {
      const { rows } = await q<{ item_id: string }>("SELECT item_id FROM deck_cards WHERE deck_id = $1 ORDER BY pos FOR UPDATE", [id]);
      const order = validOrder(rows.map((r) => r.item_id), items);
      await q(
        `UPDATE deck_cards c SET pos = u.o::int - 1 FROM unnest($2::text[]) WITH ORDINALITY AS u(x, o)
         WHERE c.deck_id = $1 AND c.item_id = u.x`, [id, order]);
      await q("UPDATE decks SET updated_at = now() WHERE id = $1", [id]);
    });
    return getDeck(userId, id);
  });
}
