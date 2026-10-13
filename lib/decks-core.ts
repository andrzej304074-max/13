/** Własne talie fiszek – czysta logika (walidacja, kolejność), bez bazy. */

export const MAX_DECKS = 50;
export const MAX_DECK_CARDS = 500;
export const MAX_DECK_NAME = 60;

export class DeckError extends Error {}

/** Nazwa talii: przycięta, bez znaków sterujących, 1–60 znaków. */
export function deckName(v: unknown): string {
  const s = typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim() : "";
  if (!s) throw new DeckError("Podaj nazwę talii.");
  return s.slice(0, MAX_DECK_NAME);
}

/** Przeniesienie elementu z pozycji `from` na `to` (nowa tablica). */
export function moveItem<T>(arr: readonly T[], from: number, to: number): T[] {
  const r = [...arr];
  if (from < 0 || from >= r.length) return r;
  const [x] = r.splice(from, 1);
  r.splice(Math.max(0, Math.min(r.length, to)), 0, x);
  return r;
}

/** Nowa kolejność musi być permutacją obecnych kart (bez braków, duplikatów i obcych id). */
export function validOrder(current: readonly string[], next: unknown): string[] {
  if (!Array.isArray(next) || next.length !== current.length || !next.every((x) => typeof x === "string")) {
    throw new DeckError("Nieprawidłowa kolejność kart.");
  }
  const cur = new Set(current);
  const seen = new Set<string>();
  for (const x of next as string[]) {
    if (!cur.has(x) || seen.has(x)) throw new DeckError("Nieprawidłowa kolejność kart.");
    seen.add(x);
  }
  return next as string[];
}

/** „1 karta”, „2 karty”, „5 kart”, „22 karty”. */
export function cardsLabel(n: number): string {
  const few = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14);
  return `${n} ${n === 1 ? "karta" : few ? "karty" : "kart"}`;
}
