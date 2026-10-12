/**
 * Notatki, brudnopisy, gwiazdki i podkreślenia – czysta logika (walidacja, upraszczanie kresek), bez bazy.
 *
 * Rysunek (`Ink`) jest zapisany w jednostkach logicznych: szerokość płótna = 1000, wysokość `h` rośnie
 * w miarę dopisywania miejsca – dzięki temu notatka z telefonu wygląda tak samo na komputerze.
 */

export const INK_W = 1000;
export const INK_MIN_H = 600;
export const INK_MAX_H = 20000;
const MAX_STROKES = 4000;
const MAX_POINTS = 80000;
export const MAX_BODY = 100_000;
export const MAX_TITLE = 120;

/** Kreska: kolor (indeks palety), grubość (indeks), punkty jako płaska lista [x, y, nacisk 0–100, …]. */
export interface Stroke { c: number; w: number; p: number[] }
export interface Ink { h: number; s: Stroke[] }
export type NoteKind = "note" | "scratch";
export type StarKind = "fiszka" | "artykul";

export const EMPTY_INK: Ink = { h: 0, s: [] };
export const INK_COLORS = 4;
export const INK_WIDTHS = [2, 4, 8];
export const HIGHLIGHT_COLORS = ["y", "g", "b"] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export class NoteError extends Error {}

const int = (v: unknown, lo: number, hi: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : null;

/** Odległość punktu od odcinka (do upraszczania kresek). */
export function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Upraszcza kreskę algorytmem Douglasa–Peuckera (tolerancja w jednostkach logicznych): punkty leżące
 * prawie na prostej między sąsiadami są zbędne. Zachowuje pierwszy i ostatni punkt oraz nacisk.
 */
export function simplify(p: number[], eps = 0.8): number[] {
  const n = p.length / 3;
  if (n <= 2) return p.slice();
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let best = -1, bestD = eps;
    for (let i = a + 1; i < b; i++) {
      const d = segDist(p[i * 3], p[i * 3 + 1], p[a * 3], p[a * 3 + 1], p[b * 3], p[b * 3 + 1]);
      // nacisk też się liczy: wyraźna zmiana grubości zostaje
      if (d > bestD || Math.abs(p[i * 3 + 2] - p[a * 3 + 2]) > 25) { best = i; bestD = Math.max(d, bestD); }
    }
    if (best > 0) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
  return out;
}

/** Sprawdza i normalizuje rysunek z klienta; rzuca NoteError przy złym formacie lub zbyt dużym rysunku. */
export function sanitizeInk(raw: unknown): Ink {
  if (raw == null) return { ...EMPTY_INK };
  if (typeof raw !== "object" || !Array.isArray((raw as Ink).s)) throw new NoteError("Nieprawidłowy rysunek.");
  const src = raw as { h?: unknown; s: unknown[] };
  if (src.s.length > MAX_STROKES) throw new NoteError("Za dużo kresek w jednej notatce.");
  let total = 0, maxY = 0;
  const s: Stroke[] = [];
  for (const k of src.s) {
    const st = k as Partial<Stroke>;
    const c = int(st?.c, 0, INK_COLORS - 1), w = int(st?.w, 0, INK_WIDTHS.length - 1);
    if (c === null || w === null || !Array.isArray(st.p) || st.p.length < 3 || st.p.length % 3) throw new NoteError("Nieprawidłowa kreska.");
    const p: number[] = [];
    for (let i = 0; i < st.p.length; i += 3) {
      const x = int(st.p[i], 0, INK_W), y = int(st.p[i + 1], 0, INK_MAX_H), pr = int(st.p[i + 2], 0, 100);
      if (x === null || y === null || pr === null) throw new NoteError("Nieprawidłowy punkt kreski.");
      p.push(x, y, pr);
      if (y > maxY) maxY = y;
    }
    total += p.length / 3;
    if (total > MAX_POINTS) throw new NoteError("Rysunek jest za duży – zacznij nowy brudnopis.");
    s.push({ c, w, p });
  }
  const h = Math.max(int(src.h, 0, INK_MAX_H) ?? 0, s.length ? Math.min(INK_MAX_H, maxY + 40) : 0);
  return { h, s };
}

export function sanitizeText(v: unknown, max: number, field: string): string {
  if (v == null) return "";
  if (typeof v !== "string") throw new NoteError(`Nieprawidłowe pole: ${field}.`);
  if (v.length > max) throw new NoteError(`Pole „${field}” jest za długie (maks. ${max} znaków).`);
  return v;
}

/** Odnośnik notatki do miejsca w aplikacji: pytanie OWE/słownika, lekcja z pod-lekcją, artykuł. */
const REF = /^(owe|slownik|lekcja|artykul):[A-Za-z0-9_.:-]{1,160}$/;
export function sanitizeRef(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v !== "string" || !REF.test(v)) throw new NoteError("Nieprawidłowy odnośnik notatki.");
  return v;
}

export function isNoteKind(v: unknown): v is NoteKind {
  return v === "note" || v === "scratch";
}
export function isStarKind(v: unknown): v is StarKind {
  return v === "fiszka" || v === "artykul";
}

/** Tytuł do listy: własny albo pierwsza niepusta linia treści. */
export function displayTitle(n: { title: string; body: string; ink?: Ink }, fallback = "Bez tytułu"): string {
  if (n.title.trim()) return n.title.trim();
  const line = n.body.split("\n").find((l) => l.trim());
  if (line) return line.trim().slice(0, 80);
  return n.ink && n.ink.s.length ? `${fallback} (rysunek)` : fallback;
}

/** Adres strony, z której pochodzi brudnopis/notatka (do linku „wróć do pytania”). */
export function refHref(ref: string | null): { href: string; label: string } | null {
  if (!ref) return null;
  const [kind, ...rest] = ref.split(":");
  const id = rest.join(":");
  if (kind === "lekcja") {
    const [lesson, sub] = id.split(":");
    return { href: `/nauka/lekcja/${lesson}${sub ? `?sub=${sub}` : ""}`, label: "Lekcja" };
  }
  if (kind === "artykul") {
    const [unit, lesson] = id.split(":");
    return { href: `/nauka/podrecznik/${unit}${lesson ? `/${lesson}` : ""}`, label: "Artykuł" };
  }
  // pytania testów nie mają własnej strony – brudnopis pokazuje treść pytania (kontekst z serwera)
  return null;
}

/** Podkreślenie: blok ≥ 0, zakres 0 ≤ start < end ≤ 20000, kolor z palety. */
export function sanitizeHighlight(v: Record<string, unknown>): { article: string; block: number; start: number; end: number; color: HighlightColor } {
  const article = v.article;
  if (typeof article !== "string" || !/^[A-Za-z0-9_.:-]{1,160}$/.test(article)) throw new NoteError("Nieprawidłowy artykuł.");
  const block = int(v.block, 0, 1_000_000), start = int(v.start, 0, 20000), end = int(v.end, 0, 20000);
  if (block === null || start === null || end === null || end <= start) throw new NoteError("Nieprawidłowy zakres podkreślenia.");
  const color = (HIGHLIGHT_COLORS as readonly string[]).includes(v.color as string) ? (v.color as HighlightColor) : "y";
  return { article, block, start, end, color };
}

/** Scala nakładające się podkreślenia jednego bloku w rozłączne odcinki (ostatnie wygrywa kolorem) – do renderu. */
export function segments(len: number, hs: { start: number; end: number; color: string; id: string }[]): { start: number; end: number; h?: { color: string; id: string } }[] {
  const owner: (number | -1)[] = new Array(len).fill(-1);
  hs.forEach((h, i) => { for (let k = Math.max(0, h.start); k < Math.min(len, h.end); k++) owner[k] = i; });
  const out: { start: number; end: number; h?: { color: string; id: string } }[] = [];
  let i = 0;
  while (i < len) {
    const o = owner[i];
    let j = i + 1;
    while (j < len && owner[j] === o) j++;
    out.push(o === -1 ? { start: i, end: j } : { start: i, end: j, h: { color: hs[o].color, id: hs[o].id } });
    i = j;
  }
  return out;
}

/** Czy punkt (x, y) leży w promieniu r od kreski – po odcinkach, bo uproszczona prosta kreska ma tylko końce. */
export function strokeNear(p: number[], x: number, y: number, r: number): boolean {
  if (p.length === 3) return Math.hypot(p[0] - x, p[1] - y) <= r;
  for (let i = 3; i < p.length; i += 3) if (segDist(x, y, p[i - 3], p[i - 2], p[i], p[i + 1]) <= r) return true;
  return false;
}
