/**
 * Statystyki „świata” – Ty na tle wszystkich użytkowników (czysta logika, bez bazy).
 * Rozkład pokazujemy tylko, gdy w grupie jest co najmniej MIN_USERS osób (k-anonimowość) – inaczej tylko Twój wynik.
 */

export const WORLD_METRICS = ["xp", "skutecznosc", "aktywnosc", "seria"] as const;
export type WorldMetric = (typeof WORLD_METRICS)[number];
export const WORLD_SOURCES = ["lacznie", "kurs", "testy", "owe", "ai", "slownik", "xl", "fiszki", "zadania", "eseje"] as const;
export type WorldSource = (typeof WORLD_SOURCES)[number];
export const WORLD_PERIODS = ["7d", "30d", "all"] as const;
export type WorldPeriod = (typeof WORLD_PERIODS)[number];

export const METRIC_LABEL: Record<WorldMetric, string> = { xp: "XP", skutecznosc: "Skuteczność", aktywnosc: "Aktywność", seria: "Seria" };
export const SOURCE_LABEL: Record<WorldSource, string> = {
  lacznie: "Łącznie", kurs: "Kurs (Duolingo)", testy: "Testy – wszystkie", owe: "Testy – Archiwum OWE", ai: "Testy – Pytania AI",
  slownik: "Testy – Słownik", xl: "Testy – Hasło XL", fiszki: "Fiszki", zadania: "Zadania", eseje: "Eseje",
};
export const PERIOD_LABEL: Record<WorldPeriod, string> = { "7d": "7 dni", "30d": "30 dni", all: "cały czas" };

export const isMetric = (v: unknown): v is WorldMetric => (WORLD_METRICS as readonly unknown[]).includes(v);
export const isWorldSource = (v: unknown): v is WorldSource => (WORLD_SOURCES as readonly unknown[]).includes(v);
export const isPeriod = (v: unknown): v is WorldPeriod => (WORLD_PERIODS as readonly unknown[]).includes(v);

/** Seria to jedna liczba dla całej aplikacji – bez źródła i okresu. */
export const metricHasSource = (m: WorldMetric) => m !== "seria";

export const MIN_USERS = 5;
/** Skuteczność liczona dopiero od tylu odpowiedzi w okresie (1 trafna na 1 to nie „100%”). */
export const MIN_ANSWERS = 10;

export interface WorldDist {
  /** Liczba osób w grupie (z co najmniej jedną aktywnością w danej mierze i okresie). */
  n: number;
  /** Twój wynik (null – brak aktywności w tej mierze i okresie). */
  me: number | null;
  /** Odsetek pozostałych osób z wynikiem niższym niż Twój (0–100), null bez wyniku lub przy za małej grupie. */
  better: number | null;
  /** Rozkład – tylko od MIN_USERS osób. */
  dist: { mean: number; median: number; bins: { from: number; to: number; n: number; me: boolean }[] } | null;
}

const round1 = (x: number) => Math.round(x * 10) / 10;

/** Podział na 10 przedziałów: skuteczność 0–100 co 10; pozostałe miary od 0 do maksimum (zaokrąglone „ładnie”). */
function binEdges(metric: WorldMetric, max: number): number[] {
  if (metric === "skutecznosc") return Array.from({ length: 11 }, (_, i) => i * 10);
  const raw = Math.max(1, max) / 10;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const n = Math.max(1, Math.ceil(Math.max(1, max) / step));
  return Array.from({ length: n + 1 }, (_, i) => round1(i * step));
}

export function distribution(metric: WorldMetric, values: number[], me: number | null): WorldDist {
  const n = values.length;
  if (n < MIN_USERS) return { n, me: me === null ? null : round1(me), better: null, dist: null };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  let better: number | null = null;
  if (me !== null) {
    const below = sorted.filter((v) => v < me).length;
    // Ty jesteś w grupie – porównanie z pozostałymi osobami
    const others = values.includes(me) ? n - 1 : n;
    better = others > 0 ? Math.round((below / others) * 100) : 0;
  }
  const edges = binEdges(metric, sorted[n - 1]);
  const bins = edges.slice(0, -1).map((from, i) => ({ from, to: edges[i + 1], n: 0, me: false }));
  const idx = (v: number) => Math.min(bins.length - 1, Math.max(0, bins.findIndex((b, i) => v < b.to || i === bins.length - 1)));
  for (const v of sorted) bins[idx(v)].n++;
  if (me !== null) bins[idx(me)].me = true;
  return { n, me: me === null ? null : round1(me), better, dist: { mean: round1(mean), median: round1(median), bins } };
}

/* ---------- ranking opt-in ---------- */

export const RANK_TOP = 50;
/** Rdzenie zakazane w dowolnym miejscu pseudonimu i krótkie – tylko na początku słowa (żeby nie odrzucać np. „Principal”). */
const BANNED = ["admin", "moderator", "kurw", "chuj", "pierd", "pizd", "fuck", "shit", "nazi", "hitler"];
const BANNED_WORD = ["jeb", "huj", "cipa", "cipk"];

/** Pseudonim w rankingu: 3–20 znaków (litery, cyfry, spacja, _ . -), bez adresu e-mail i bez wulgaryzmów. */
export function validRankName(v: unknown): string | null {
  if (typeof v !== "string") return "Podaj pseudonim.";
  const s = v.trim().replace(/\s+/g, " ");
  if (s.length < 3 || s.length > 20) return "Pseudonim: 3–20 znaków.";
  if (!/^[\p{L}\p{N} _.-]+$/u.test(s)) return "Dozwolone są litery, cyfry, spacja i znaki _ . -";
  if (/@/.test(s)) return "Pseudonim nie może być adresem e-mail.";
  const low = s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const words = low.split(/[ _.\-\d]+/);
  if (BANNED.some((b) => low.includes(b)) || words.some((w) => BANNED_WORD.some((b) => w.startsWith(b)))) return "Wybierz inny pseudonim.";
  return null;
}
