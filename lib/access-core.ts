import { activeTab, NAV, type NavSection, type NavTab } from "./nav";

/**
 * Blokady sekcji (panel admina) – czysta logika, bez bazy.
 * Klucz blokady to id działu (`notatki`) albo `href` podzakładki z lib/nav.ts (`/nauka/podrecznik`).
 * Zablokowany dział blokuje wszystkie swoje podzakładki.
 */

export type BlockMode = "hide" | "lock";
export interface AccessSettings {
  /** Zablokowane dla wszystkich (także adminów). */
  all: string[];
  /** Zablokowane dla wszystkich oprócz adminów. */
  nonAdmins: string[];
  /** Domyślny wygląd zablokowanych pozycji w menu: ukryte albo z kłódką. */
  mode: BlockMode;
}
export const DEFAULT_ACCESS: AccessSettings = { all: [], nonAdmins: [], mode: "hide" };

export const ACCESS_KEYS: string[] = NAV.flatMap((s) => [s.id, ...s.tabs.map((t) => t.href)]);
const KEYS = new Set(ACCESS_KEYS);

export const isBlockMode = (v: unknown): v is BlockMode => v === "hide" || v === "lock";

/** Tylko znane klucze, bez powtórzeń, w kolejności menu. */
export function sanitizeKeys(v: unknown): string[] {
  const got = new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && KEYS.has(x)) : []);
  return ACCESS_KEYS.filter((k) => got.has(k));
}

export function sanitizeSettings(v: unknown): AccessSettings {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return { all: sanitizeKeys(o.all), nonAdmins: sanitizeKeys(o.nonAdmins), mode: isBlockMode(o.mode) ? o.mode : "hide" };
}

const sectionOfTab = new Map(NAV.flatMap((s) => s.tabs.map((t) => [t.href, s.id] as const)));

/** Łączne blokady konta: dla wszystkich ∪ (dla wszystkich oprócz adminów, jeśli nie admin) ∪ blokady konta. */
export function effectiveBlocks(user: { isAdmin: boolean; blocked: string[] }, s: AccessSettings): string[] {
  const set = new Set([...s.all, ...(user.isAdmin ? [] : s.nonAdmins), ...user.blocked]);
  return ACCESS_KEYS.filter((k) => set.has(k));
}

/**
 * Wspólne zasoby działu (klucz działu z `pathKey`) i podzakładki, które z nich korzystają: test (`/test/…`, `/api/tests`)
 * – Olimpiada i Słownik; lekcje i postęp (`/api/nauka`) – Kurs, Powtórka, Fiszki, Moje talie, Podręcznik.
 * Zasób jest zablokowany, gdy zablokowane są wszystkie korzystające z niego podzakładki – nowe podzakładki działu
 * (np. Zadania, Eseje, Olimpiada, Literatura) nie odblokowują go same z siebie.
 */
const SHARED_TABS: Record<string, string[]> = {
  testy: ["/", "/slownik"],
  nauka: ["/nauka", "/nauka/podrecznik", "/fiszki", "/fiszki/talie", "/nauka/powtorka"],
};

/** Czy klucz jest zablokowany: wprost, przez swój dział albo (dla działu) przez blokadę podzakładek korzystających z jego zasobów. */
export function isBlocked(key: string | null, blocks: readonly string[]): boolean {
  if (!key) return false;
  const b = new Set(blocks);
  if (b.has(key)) return true;
  const sec = sectionOfTab.get(key);
  if (sec && b.has(sec)) return true;
  const section = NAV.find((s) => s.id === key);
  if (!section) return false;
  return (SHARED_TABS[key] ?? section.tabs.map((t) => t.href)).every((t) => b.has(t));
}

/**
 * Klucz sekcji dla ścieżki strony albo trasy API (null – nie da się zablokować: panel admina, konto,
 * wspólne dane kursu bez danych użytkownika).
 */
export function pathKey(path: string, search = ""): string | null {
  if (/^\/(admin|konto|zablokowane)(\/|$)/.test(path) || /^\/api\/(admin|konto|dane|gwiazdki)(\/|$)/.test(path)) return null;
  const q = new URLSearchParams(search);
  if (path.startsWith("/api/")) {
    if (path.startsWith("/api/tests")) return "testy";
    if (path.startsWith("/api/otwarte/statystyki")) return "/stats";
    if (path === "/api/otwarte") return q.get("rodzaj") === "esej" ? "/eseje" : "/zadania";
    if (path.startsWith("/api/otwarte/")) return /-zadanie(\/|$)/.test(path) ? "/zadania" : "/eseje";
    if (path.startsWith("/api/notatki/brudnopis")) return "/notatki/brudnopisy";
    if (path.startsWith("/api/notatki")) return q.get("rodzaj") === "scratch" ? "/notatki/brudnopisy" : path === "/api/notatki" ? "/notatki" : "notatki";
    if (path.startsWith("/api/podrecznik") || path.startsWith("/api/podkreslenia")) return "/nauka/podrecznik";
    if (path.startsWith("/api/talie") || path.startsWith("/api/fiszki/moje")) return "/fiszki/talie";
    if (path.startsWith("/api/fiszki")) return "/fiszki";
    if (path.startsWith("/api/nauka/stats")) return "/nauka/statystyki";
    if (path.startsWith("/api/nauka")) return "nauka";
    if (path.startsWith("/api/stats/dzialy")) return "/stats/dzialy";
    if (path.startsWith("/api/stats")) return "/stats";
    if (path.startsWith("/api/pojecia")) return "/pojecia/statystyki";
    return null;
  }
  if (path.startsWith("/test/")) return "testy";
  if (path.startsWith("/nauka/lekcja/")) return "/nauka";
  return activeTab(path)?.tab.href ?? null;
}

export type NavState = "ok" | "lock";
export interface NavViewTab extends NavTab { state: NavState }
export interface NavViewSection extends Omit<NavSection, "tabs"> { state: NavState; tabs: NavViewTab[]; /** Link działu: pierwsza dostępna podzakładka. */ href: string }

/** Menu dla konta: w trybie „hide” zablokowane pozycje znikają, w trybie „lock” zostają z kłódką. */
export function navView(blocks: readonly string[], mode: BlockMode): NavViewSection[] {
  const out: NavViewSection[] = [];
  for (const s of NAV) {
    const tabs = s.tabs.map((t) => ({ ...t, state: (isBlocked(t.href, blocks) ? "lock" : "ok") as NavState }));
    const shown = mode === "hide" ? tabs.filter((t) => t.state === "ok") : tabs;
    if (!shown.length) continue;
    const first = tabs.find((t) => t.state === "ok");
    out.push({ ...s, state: first ? "ok" : "lock", tabs: shown, href: (first ?? shown[0]).href });
  }
  return out;
}

/** Pierwsza dostępna strona (po zablokowaniu strony startowej). */
export function firstAllowed(blocks: readonly string[]): string | null {
  for (const s of NAV) for (const t of s.tabs) if (!isBlocked(t.href, blocks)) return t.href;
  return null;
}

/** Nazwa sekcji do komunikatu blokady. */
export function keyLabel(key: string): string {
  for (const s of NAV) {
    if (s.id === key) return s.label;
    const t = s.tabs.find((x) => x.href === key);
    if (t) return `${s.label} → ${t.label}`;
  }
  return key;
}
