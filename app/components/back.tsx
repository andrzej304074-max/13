"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * „←” w nagłówku: powrót do poprzedniej strony aplikacji i do miejsca, w którym się na niej było.
 * - Stos odwiedzonych adresów w sessionStorage (tylko strony tej aplikacji): nowa strona – na stos;
 *   powrót (przycisk albo systemowe „wstecz”) na adres przedostatni – zdjęcie ze stosu.
 * - Pozycja przewinięcia każdego adresu w sessionStorage; po powrocie przywracana, gdy strona (dane ładowane w tle)
 *   jest już dość wysoka – ponawiane do 4 s, przerywane, gdy użytkownik sam przewinie.
 * Feed fiszek przywraca też swoją kartę (isBackNav / feedPos).
 */

const STACK = "owe:nav-stack";
/** Adresy, z których wrócono – do „→” (dalej); nowa strona otwarta inaczej niż „dalej” czyści listę. */
const FWD = "owe:nav-forward";
const POS = "owe:scroll:";
const MAX = 50;

const here = () => window.location.pathname + window.location.search;
const read = (): string[] => { try { return JSON.parse(sessionStorage.getItem(STACK) ?? "[]"); } catch { return []; } };
const write = (s: string[]) => { try { sessionStorage.setItem(STACK, JSON.stringify(s.slice(-MAX))); } catch {} };
const readF = (): string[] => { try { return JSON.parse(sessionStorage.getItem(FWD) ?? "[]"); } catch { return []; } };
const writeF = (s: string[]) => { try { sessionStorage.setItem(FWD, JSON.stringify(s.slice(-MAX))); } catch {} };

let backNav = false;
/**
 * Czy bieżąca zmiana trasy to ruch po historii przeglądarki (wstecz/dalej – zdarzenie popstate), a nie kliknięty link.
 * Bez tego zwykły link do poprzedniej strony wyglądałby jak powrót i pokazywał „→”, które nie ma dokąd prowadzić.
 */
let popped = false;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => { popped = true; });
  // wstecz/dalej do strony spoza pamięci aplikacji = pełne wczytanie dokumentu (bez popstate) – typ nawigacji „back_forward”
  try { popped = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "back_forward"; } catch {}
}
/** Czy bieżąca strona została otwarta powrotem (do przywracania stanu, np. karty w feedzie fiszek). */
export const isBackNav = () => backNav;

/** Zapamiętana liczba (np. pozycja feedu) dla bieżącego adresu. */
export function savedNumber(key: string): number | null {
  try { const v = sessionStorage.getItem(`${key}:${here()}`); return v === null ? null : Number(v); } catch { return null; }
}
export function saveNumber(key: string, v: number) {
  try { sessionStorage.setItem(`${key}:${here()}`, String(Math.round(v))); } catch {}
}

function restoreScroll(url: string) {
  let y: number | null = null;
  try { const v = sessionStorage.getItem(POS + url); y = v === null ? null : Number(v); } catch {}
  if (!y) return;
  const target = y;
  let stopped = false;
  const stop = () => { stopped = true; };
  window.addEventListener("wheel", stop, { once: true, passive: true });
  window.addEventListener("touchstart", stop, { once: true, passive: true });
  const t0 = Date.now();
  const tick = () => {
    if (stopped || here() !== url) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max >= target - 2) { window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior }); return; }
    if (Date.now() - t0 < 4000) setTimeout(tick, 100);
    else window.scrollTo({ top: max, behavior: "instant" as ScrollBehavior });
  };
  setTimeout(tick, 50);
}

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [canBack, setCanBack] = useState(false);
  const [canFwd, setCanFwd] = useState(false);

  // pozycja przewinięcia bieżącego adresu
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const save = () => { try { sessionStorage.setItem(POS + here(), String(Math.round(window.scrollY))); } catch {} };
    const on = () => { if (!t) t = setTimeout(() => { t = null; save(); }, 150); };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("pagehide", save);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("pagehide", save); };
  }, []);

  // stos stron przy każdej zmianie trasy
  useEffect(() => {
    const url = here();
    const s = read();
    const f = readF();
    const pop = popped;
    popped = false;
    if (pop && s.length >= 2 && s[s.length - 2] === url) {
      f.push(s.pop()!);
      backNav = true;
      restoreScroll(url);
    } else if (s[s.length - 1] !== url) {
      // ta sama ścieżka z innymi parametrami (filtry) – podmiana, nie nowy krok
      if (s.length && s[s.length - 1].split("?")[0] === pathname) s[s.length - 1] = url;
      else {
        s.push(url);
        // „dalej” – zdejmij z listy; każda inna nowa strona zaczyna nową gałąź historii
        if (pop && f[f.length - 1] === url) { f.pop(); restoreScroll(url); } else f.length = 0;
      }
      backNav = false;
    }
    write(s);
    writeF(f);
    setCanBack(s.length >= 2);
    setCanFwd(f.length > 0);
  }, [pathname]);

  if (!canBack && !canFwd) return null;
  return (
    <span className="nav-arrows">
      {canBack && (
        <button type="button" className="back-btn" onClick={() => router.back()} aria-label="Wróć do poprzedniej strony" title="Wróć (do tego samego miejsca)" data-testid="back">
          ←
        </button>
      )}
      {canFwd && (
        <button type="button" className="back-btn" onClick={() => router.forward()} aria-label="Przejdź dalej (do strony, z której wrócono)" title="Dalej" data-testid="forward">
          →
        </button>
      )}
    </span>
  );
}
