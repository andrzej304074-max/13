/**
 * Nagrania głosem neuronowym Azure (Podręcznik) – czysta logika, bez sieci i bazy (testy: tests/tts.test.ts).
 * Klucz nagrania to skrót tekstu akapitu: zmiana treści = nowy klucz = nowe nagranie przy kolejnej porcji.
 */

export const VOICES = [
  { id: "pl-PL-ZofiaNeural", label: "Zofia (kobiecy)" },
  { id: "pl-PL-MarekNeural", label: "Marek (męski)" },
  { id: "pl-PL-AgnieszkaNeural", label: "Agnieszka (kobiecy)" },
] as const;
export const DEFAULT_VOICE = VOICES[0].id;
export const isVoice = (v: unknown): v is string => VOICES.some((x) => x.id === v);

/** Domyślny miesięczny budżet znaków – zapas do darmowego progu Azure F0 (0,5 mln znaków głosów neuronowych). */
export const DEFAULT_MONTHLY = 450_000;
/** Darmowy plan Azure F0: 20 zapytań na minutę – między nagraniami co najmniej 3,2 s. */
export const MIN_GAP_MS = 3200;

/** 53-bitowy skrót tekstu (cyrb53) w base36 – identyczny w przeglądarce i na serwerze. */
export function textHash(text: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function ssml(text: string, voice: string): string {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pl-PL"><voice name="${esc(voice)}">${esc(text)}</voice></speak>`;
}

export interface TtsState {
  voice: string;
  /** Miesiąc rozliczeniowy (UTC, RRRR-MM) i zużyte w nim znaki. */
  month: string;
  used: number;
  /** Dzień (RRRR-MM-DD) i znaki zużyte tego dnia – porcja dzienna rozkłada budżet na cały miesiąc. */
  day: string;
  usedToday: number;
  lastRun: string | null;
  lastError: string | null;
}

export const monthOf = (d: Date) => d.toISOString().slice(0, 7);
export const dayOf = (d: Date) => d.toISOString().slice(0, 10);

export function normalizeState(v: unknown, now: Date): TtsState {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : 0);
  const s: TtsState = {
    voice: isVoice(o.voice) ? o.voice : DEFAULT_VOICE,
    month: typeof o.month === "string" ? o.month : monthOf(now),
    used: num(o.used),
    day: typeof o.day === "string" ? o.day : dayOf(now),
    usedToday: num(o.usedToday),
    lastRun: typeof o.lastRun === "string" ? o.lastRun : null,
    lastError: typeof o.lastError === "string" ? o.lastError : null,
  };
  // nowy miesiąc / dzień – liczniki od zera
  if (s.month !== monthOf(now)) { s.month = monthOf(now); s.used = 0; }
  if (s.day !== dayOf(now)) { s.day = dayOf(now); s.usedToday = 0; }
  return s;
}

/** Ile znaków wolno nagrać teraz: pozostały budżet miesiąca rozłożony równo na pozostałe dni (z dzisiejszym). */
export function allowance(s: TtsState, monthly: number, now: Date): number {
  const left = Math.max(0, monthly - s.used);
  const days = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const daysLeft = days - now.getUTCDate() + 1;
  const today = Math.ceil((left + s.usedToday) / daysLeft);
  return Math.max(0, Math.min(left, today - s.usedToday));
}

/** Porcja do nagrania: kolejne akapity w kolejności kursu, dopóki mieszczą się w budżecie znaków. */
export function pickBatch<T extends { chars: number }>(todo: T[], budget: number): T[] {
  const out: T[] = [];
  let sum = 0;
  for (const t of todo) {
    if (sum + t.chars > budget) break;
    out.push(t);
    sum += t.chars;
  }
  return out;
}
