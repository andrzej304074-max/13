/** Tryb recenzenta – czysta walidacja ocen treści (testy: tests/review.test.ts). */

export const REVIEW_KINDS = ["pytanie", "zgloszenie", "prognoza"] as const;
export type ReviewKind = (typeof REVIEW_KINDS)[number];
export const REVIEW_KIND_LABEL: Record<ReviewKind, string> = { pytanie: "Pytania do przeglądu", zgloszenie: "Zgłoszenia merytoryczne", prognoza: "Prognoza XL" };
export type ReviewStatus = "ok" | "poprawa";
export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = { ok: "OK", poprawa: "do poprawy" };
export const REVIEW_COMMENT_MAX = 2000;

export interface Review { status: ReviewStatus; comment: string | null; by: string | null; at: string }

export interface ReviewInput { kind: ReviewKind; ref: string; status: ReviewStatus | null; comment: string | null }

/** Ocena z formularza: rodzaj, pozycja, status (null – usunięcie oceny) i komentarz („do poprawy” wymaga komentarza). */
export function reviewInput(body: Record<string, unknown>): ReviewInput | string {
  if (!REVIEW_KINDS.includes(body.kind as ReviewKind)) return "Nieznany rodzaj pozycji.";
  if (typeof body.ref !== "string" || !body.ref || body.ref.length > 120) return "Brak pozycji do oceny.";
  const status = body.status === null ? null : body.status === "ok" || body.status === "poprawa" ? body.status : undefined;
  if (status === undefined) return "Wybierz: OK albo do poprawy.";
  const comment = typeof body.comment === "string" ? body.comment.replace(/\u0000/g, "").trim().slice(0, REVIEW_COMMENT_MAX) : "";
  if (status === "poprawa" && comment.length < 3) return "Przy „do poprawy” opisz, co poprawić.";
  return { kind: body.kind as ReviewKind, ref: body.ref, status, comment: comment || null };
}
