/**
 * Własne fiszki użytkownika – czysta logika (walidacja), bez bazy.
 * Id karty w taliach, gwiazdkach i notatkach: `u:<uuid>`. Oceny własnych kart nie wpływają na Naukę ani statystyki.
 */

export const MAX_OWN_CARDS = 2000;
export const OWN_LIMITS = { t: 120, d: 2000, w: 300 } as const;
export const OWN_PREFIX = "u:";

export class OwnCardError extends Error {}

export interface OwnCardInput { t: string; d: string; w: string | null; topic: string; kind: string }

export const isOwnId = (id: unknown): id is string => typeof id === "string" && /^u:[0-9a-f-]{36}$/i.test(id);
export const ownUuid = (id: string) => id.slice(OWN_PREFIX.length);

const clean = (v: unknown, multiline = false) =>
  typeof v === "string"
    ? (multiline ? v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ") : v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ")).trim()
    : "";

/** Walidacja pól karty: hasło i definicja wymagane, wzór opcjonalny; dział i kategoria z list kursu. */
export function ownCardInput(body: Record<string, unknown>, topics: readonly string[], kinds: readonly string[]): OwnCardInput {
  const t = clean(body.t);
  const d = clean(body.d, true);
  const w = clean(body.w, true);
  if (!t) throw new OwnCardError("Wpisz hasło.");
  if (!d) throw new OwnCardError("Wpisz definicję.");
  if (t.length > OWN_LIMITS.t) throw new OwnCardError(`Hasło może mieć najwyżej ${OWN_LIMITS.t} znaków.`);
  if (d.length > OWN_LIMITS.d) throw new OwnCardError(`Definicja może mieć najwyżej ${OWN_LIMITS.d} znaków.`);
  if (w.length > OWN_LIMITS.w) throw new OwnCardError(`Wzór może mieć najwyżej ${OWN_LIMITS.w} znaków.`);
  if (typeof body.topic !== "string" || !topics.includes(body.topic)) throw new OwnCardError("Wybierz dział.");
  if (typeof body.kind !== "string" || !kinds.includes(body.kind)) throw new OwnCardError("Wybierz kategorię.");
  return { t, d, w: w || null, topic: body.topic, kind: body.kind };
}
