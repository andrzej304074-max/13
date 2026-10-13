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
const POS = "owe:scroll:";
const MAX = 50;

const here = () => window.location.pathname + window.location.search;
const read = (): string[] => { try { return JSON.parse(sessionStorage.getItem(STACK) ?? "[]"); } catch { return []; } };
const write = (s: string[]) => { try { sessionStorage.setItem(STACK, JSON.stringify(s.slice(-MAX))); } catch {} };

let backNav = false;
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
    if (s.length >= 2 && s[s.length - 2] === url) {
      s.pop();
      backNav = true;
      restoreScroll(url);
    } else if (s[s.length - 1] !== url) {
      // ta sama ścieżka z innymi parametrami (filtry) – podmiana, nie nowy krok
      if (s.length && s[s.length - 1].split("?")[0] === pathname) s[s.length - 1] = url;
      else s.push(url);
      backNav = false;
    }
    write(s);
    setCanBack(s.length >= 2);
  }, [pathname]);

  if (!canBack) return null;
  return (
    <button type="button" className="back-btn" onClick={() => router.back()} aria-label="Wróć do poprzedniej strony" title="Wróć (do tego samego miejsca)" data-testid="back">
      ←
    </button>
  );
}
