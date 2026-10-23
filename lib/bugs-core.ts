/** Zgłoszenia błędów – walidacja (czysta, testowana w tests/bugs.test.ts). */

export const BUG_STATUSES = ["nowe", "w_toku", "naprawione", "odrzucone"] as const;
export type BugStatus = (typeof BUG_STATUSES)[number];
export const BUG_STATUS_LABEL: Record<BugStatus, string> = { nowe: "nowe", w_toku: "w toku", naprawione: "naprawione", odrzucone: "odrzucone" };
export const BUG_LIMITS = { text: 4000, page: 300, device: 300, section: 200, note: 2000, perDay: 10 } as const;
/** Rodzaj zgłoszenia: błąd w treści (definicja, pytanie, odpowiedź) albo w działaniu aplikacji. */
export const BUG_KINDS = ["merytoryczny", "techniczny"] as const;
export type BugKind = (typeof BUG_KINDS)[number];
export const BUG_KIND_LABEL: Record<BugKind, string> = { merytoryczny: "merytoryczny", techniczny: "techniczny" };

export class BugError extends Error {}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\u0000/g, "").trim().slice(0, max) : "");

export interface BugInput { text: string; page: string | null; device: string | null; kind: BugKind; section: string | null }

export function bugInput(body: Record<string, unknown>): BugInput {
  const text = typeof body.text === "string" ? body.text.replace(/\u0000/g, "").trim() : "";
  if (text.length < 5) throw new BugError("Opisz problem (co najmniej kilka słów).");
  if (text.length > BUG_LIMITS.text) throw new BugError(`Opis może mieć najwyżej ${BUG_LIMITS.text} znaków.`);
  const page = clean(body.page, BUG_LIMITS.page);
  const kind = body.kind === undefined ? "techniczny" : body.kind;
  if (!BUG_KINDS.includes(kind as BugKind)) throw new BugError("Wybierz rodzaj błędu: merytoryczny albo techniczny.");
  return {
    text, page: page.startsWith("/") ? page : null, device: clean(body.device, BUG_LIMITS.device) || null,
    kind: kind as BugKind, section: clean(body.section, BUG_LIMITS.section) || null,
  };
}

export function bugUpdate(body: Record<string, unknown>): { status?: BugStatus; note?: string | null } {
  const out: { status?: BugStatus; note?: string | null } = {};
  if ("status" in body) {
    if (!BUG_STATUSES.includes(body.status as BugStatus)) throw new BugError("Nieznany status.");
    out.status = body.status as BugStatus;
  }
  if ("note" in body) {
    if (body.note !== null && typeof body.note !== "string") throw new BugError("Nieprawidłowa notatka.");
    const n = clean(body.note, BUG_LIMITS.note);
    out.note = n || null;
  }
  if (!("status" in out) && !("note" in out)) throw new BugError("Brak zmian.");
  return out;
}
