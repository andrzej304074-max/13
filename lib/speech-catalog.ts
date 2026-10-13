import { speechItem, type SpeechItem } from "./speech-text";

/**
 * Teksty do czytania haseł i pytań – wspólne dla stron (odtwarzanie) i serwera (katalog nagrań głosem z chmury, lib/tts.ts).
 * Skrót tekstu jest kluczem nagrania, więc każda strona musi budować tekst tymi funkcjami.
 */

const LETTERS = ["A", "B", "C", "D"];

/** Hasło: nazwa, definicja i wzór (Tabela pojęć, fiszki, mapa myśli, talie). */
export function hasloSpeech(h: { id: string; t: string; d?: string | null; w?: string | null }): SpeechItem {
  return speechItem(h.id, h.t, h.t, h.d, h.w ? `Wzór: ${h.w}` : null);
}

/** Poprawne litery słownie (pusta lista w pytaniu wielokrotnego wyboru – żadna). */
export const correctText = (c: number[]) => (c.length ? c.map((i) => LETTERS[i]).join(", ") : "żadna – wszystkie odpowiedzi są fałszywe");

/** Pytanie z odpowiedziami A–D. */
export function questionAsk(q: { id: string; question: string; options: string[] }, title = "Pytanie"): SpeechItem {
  return speechItem(`q-${q.id}`, title, q.question, ...q.options.map((o, i) => `Odpowiedź ${LETTERS[i]}: ${o}`));
}

/** Po sprawdzeniu: poprawna odpowiedź i wyjaśnienie. */
export function questionAnswer(q: { id: string }, correct: number[], explanation: string | null | undefined, title = "Wyjaśnienie"): SpeechItem {
  return speechItem(`a-${q.id}`, title, `Poprawna odpowiedź: ${correctText(correct)}`, explanation ? `Wyjaśnienie: ${explanation}` : null);
}
