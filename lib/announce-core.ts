/** Ogłoszenia i ankiety – walidacja i obliczenia bez bazy (testowane w tests/announce.test.ts). */

export const ANN_LIMITS = { title: 200, body: 5000, question: 300, option: 200, minOptions: 2, maxOptions: 10 } as const;
export const RESULTS_AFTER = ["vote", "close"] as const;
export type ResultsAfter = (typeof RESULTS_AFTER)[number];

export class AnnError extends Error {}

const text = (v: unknown, max: number, name: string, min = 1) => {
  const s = typeof v === "string" ? v.replace(/\u0000/g, "").trim() : "";
  if (s.length < min) throw new AnnError(`Uzupełnij pole „${name}”.`);
  if (s.length > max) throw new AnnError(`Pole „${name}” może mieć najwyżej ${max} znaków.`);
  return s;
};
const bool = (v: unknown) => v === true;
/** Data (ISO albo „RRRR-MM-DDTHH:MM” z pola datetime-local); pusta – null. */
function date(v: unknown, name: string): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string") throw new AnnError(`Nieprawidłowa data „${name}”.`);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new AnnError(`Nieprawidłowa data „${name}”.`);
  return d.toISOString();
}

export interface AnnInput { title: string; body: string; pinned: boolean; published: boolean; expires_at: string | null }

/** Ogłoszenie: tytuł, treść (zwykły tekst, akapity z pustych linii), przypięcie, publikacja, wygaśnięcie. */
export function annInput(b: Record<string, unknown>): AnnInput {
  return {
    title: text(b.title, ANN_LIMITS.title, "Tytuł"),
    body: text(b.body, ANN_LIMITS.body, "Treść"),
    pinned: bool(b.pinned),
    published: bool(b.published),
    expires_at: date(b.expires_at, "Wygasa"),
  };
}

export interface PollInput {
  question: string; options: string[]; multi: boolean; anonymous: boolean; results_after: ResultsAfter;
  published: boolean; closes_at: string | null;
}

/** Ankieta: pytanie, 2–10 różnych odpowiedzi, wielokrotny wybór, anonimowość, kiedy pokazać wyniki, zamknięcie. */
export function pollInput(b: Record<string, unknown>): PollInput {
  const raw = Array.isArray(b.options) ? b.options : typeof b.options === "string" ? b.options.split("\n") : [];
  const options = raw.map((o) => (typeof o === "string" ? o.replace(/\u0000/g, "").trim() : "")).filter(Boolean);
  if (options.length < ANN_LIMITS.minOptions) throw new AnnError(`Ankieta potrzebuje co najmniej ${ANN_LIMITS.minOptions} odpowiedzi.`);
  if (options.length > ANN_LIMITS.maxOptions) throw new AnnError(`Ankieta może mieć najwyżej ${ANN_LIMITS.maxOptions} odpowiedzi.`);
  if (options.some((o) => o.length > ANN_LIMITS.option)) throw new AnnError(`Odpowiedź może mieć najwyżej ${ANN_LIMITS.option} znaków.`);
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) throw new AnnError("Odpowiedzi nie mogą się powtarzać.");
  const ra = b.results_after === "close" ? "close" : "vote";
  return {
    question: text(b.question, ANN_LIMITS.question, "Pytanie"),
    options, multi: bool(b.multi), anonymous: bool(b.anonymous), results_after: ra,
    published: bool(b.published), closes_at: date(b.closes_at, "Zamknięcie"),
  };
}

/** Głos: indeksy wybranych odpowiedzi (jedna przy jednokrotnym wyborze), bez powtórzeń. */
export function voteInput(b: Record<string, unknown>, nOptions: number, multi: boolean): number[] {
  const c = Array.isArray(b.choices) ? b.choices : [];
  if (!c.length || !c.every((x) => Number.isInteger(x) && (x as number) >= 0 && (x as number) < nOptions)) throw new AnnError("Wybierz odpowiedź.");
  const set = [...new Set(c as number[])].sort((a, b) => a - b);
  if (!multi && set.length !== 1) throw new AnnError("W tej ankiecie wybierasz jedną odpowiedź.");
  return set;
}

export const pollClosed = (closesAt: string | null, now = Date.now()) => closesAt !== null && new Date(closesAt).getTime() <= now;

/** Czy użytkownik widzi wyniki: po oddaniu głosu (jeśli tak ustawiono) albo po zamknięciu ankiety. */
export const resultsVisible = (p: { results_after: ResultsAfter; closes_at: string | null }, voted: boolean, now = Date.now()) =>
  pollClosed(p.closes_at, now) || (p.results_after === "vote" && voted);

/** Wyniki: liczba głosów na odpowiedź i procent głosujących (przy wielokrotnym wyborze suma > 100%). */
export function tally(nOptions: number, votes: number[][]) {
  const counts = Array.from({ length: nOptions }, () => 0);
  for (const v of votes) for (const i of v) if (i >= 0 && i < nOptions) counts[i]++;
  const voters = votes.length;
  return { voters, counts, pct: counts.map((c) => (voters ? Math.round((c / voters) * 1000) / 10 : 0)) };
}
