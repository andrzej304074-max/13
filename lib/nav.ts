/** Nawigacja: 4 działy aplikacji i ich podzakładki (górny pasek, dolny pasek na telefonie, pasek podzakładek). */
export interface NavTab { href: string; label: string; /** Dodatkowe ścieżki, które też podświetlają tę zakładkę. */ also?: string[] }
export interface NavSection { id: string; icon: string; label: string; tabs: NavTab[] }

export const NAV: NavSection[] = [
  { id: "testy", icon: "📝", label: "Testy", tabs: [
    { href: "/", label: "Olimpiada", also: ["/test"] },
    { href: "/slownik", label: "Słownik" },
  ] },
  { id: "nauka", icon: "🎓", label: "Nauka", tabs: [
    { href: "/nauka", label: "Kurs" },
    { href: "/fiszki", label: "Fiszki" },
    { href: "/nauka/powtorka", label: "Powtórka" },
  ] },
  { id: "pojecia", icon: "📖", label: "Pojęcia", tabs: [
    { href: "/pojecia", label: "Tabela" },
    { href: "/pojecia/statystyki", label: "Statystyki OWE" },
    { href: "/pojecia/pokrycie", label: "Pokrycie olimpiad" },
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

/** Strony skupienia (rozwiązywanie testu, lekcja) – bez dolnego paska i podzakładek. */
export function isFocusPage(path: string): boolean {
  return path.startsWith("/test/") || path.startsWith("/nauka/lekcja/");
}
