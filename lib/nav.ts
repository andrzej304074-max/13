/** Nawigacja: 5 działów aplikacji i ich podzakładki (górny pasek, dolny pasek na telefonie, pasek podzakładek). */
export interface NavTab { href: string; label: string; /** Dodatkowe ścieżki, które też podświetlają tę zakładkę. */ also?: string[] }
export interface NavSection { id: string; icon: string; label: string; tabs: NavTab[] }

export const NAV: NavSection[] = [
  { id: "testy", icon: "📝", label: "Testy", tabs: [
    { href: "/", label: "Olimpiada", also: ["/test"] },
    { href: "/zadania", label: "Zadania" },
    { href: "/eseje", label: "Eseje" },
    { href: "/slownik", label: "Słownik" },
  ] },
  { id: "nauka", icon: "🎓", label: "Nauka", tabs: [
    { href: "/nauka", label: "Kurs" },
    { href: "/nauka/podrecznik", label: "Podręcznik" },
    { href: "/fiszki", label: "Fiszki" },
    { href: "/fiszki/talie", label: "Moje talie" },
    { href: "/nauka/powtorka", label: "Powtórka" },
    { href: "/nauka/olimpiada", label: "Olimpiada" },
    { href: "/nauka/literatura", label: "Literatura" },
  ] },
  { id: "pojecia", icon: "📖", label: "Pojęcia", tabs: [
    { href: "/pojecia", label: "Tabela" },
    { href: "/pojecia/statystyki", label: "Statystyki OWE" },
    { href: "/pojecia/pokrycie", label: "Pokrycie olimpiad" },
    { href: "/pojecia/mapa", label: "Mapa myśli" },
  ] },
  { id: "notatki", icon: "🗒️", label: "Notatki", tabs: [
    { href: "/notatki", label: "Notatki" },
    { href: "/notatki/brudnopisy", label: "Brudnopisy" },
  ] },
  { id: "statystyki", icon: "📊", label: "Statystyki", tabs: [
    { href: "/stats", label: "Wyniki testów" },
    { href: "/stats/dzialy", label: "Działy i pojęcia" },
    { href: "/nauka/statystyki", label: "Nauka" },
  ] },
];

const match = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

/** Zakładka i dział dla ścieżki – wygrywa najdłuższe dopasowanie (np. /nauka/statystyki → Statystyki, nie Nauka). */
export function activeTab(path: string): { section: NavSection; tab: NavTab } | null {
  let best: { section: NavSection; tab: NavTab; len: number } | null = null;
  for (const section of NAV) for (const tab of section.tabs) for (const h of [tab.href, ...(tab.also ?? [])]) {
    if (match(path, h) && (!best || h.length > best.len)) best = { section, tab, len: h.length };
  }
  return best && { section: best.section, tab: best.tab };
}

/** Strony skupienia (rozwiązywanie testu, lekcja) – bez paska podzakładek (dolny pasek działów zostaje). */
export function isFocusPage(path: string): boolean {
  return path.startsWith("/test/") || path.startsWith("/nauka/lekcja/");
}
