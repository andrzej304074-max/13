import { useEffect, useState } from "react";

/** Błąd zapytania do API; `network` – zapytanie nie doszło do serwera albo nie wróciła odpowiedź (brak zasięgu, uśpiona karta). */
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly network = false) {
    super(message);
  }
}
export const NETWORK_MSG = "Brak połączenia z serwerem – sprawdź internet i spróbuj ponownie.";
export const isNetworkError = (e: unknown) => e instanceof ApiError && e.network;

const RETRY_MS = [600, 1500];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Zapytanie JSON do API. Błąd sieci (Safari: „Load failed”, Chrome: „Failed to fetch”) – zapytania GET ponawiane 2×;
 * zapisy (POST/PATCH/DELETE) nie, bo mogły już dojść do serwera – wywołujący decyduje (np. sprawdza stan i ponawia).
 */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const get = !init?.method || init.method.toUpperCase() === "GET";
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers },
        cache: "no-store",
      });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") throw e;
      if (get && attempt < RETRY_MS.length) { await sleep(RETRY_MS[attempt]); continue; }
      throw new ApiError(NETWORK_MSG, 0, true);
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      // 5xx bez JSON (np. strona błędu hostingu) – przejściowe, GET ponawiamy
      if (res.status >= 500 && !data?.error && get && attempt < RETRY_MS.length) { await sleep(RETRY_MS[attempt]); continue; }
      throw new ApiError(data?.error ?? (res.status >= 500 ? `Serwer chwilowo nie odpowiada (błąd ${res.status}) – spróbuj ponownie.` : `Błąd ${res.status}`), res.status);
    }
    // akcje, które dają XP (odpowiedź w teście, ocena fiszki, koniec lekcji, sprawdzenie zadania/eseju, przeczytany rozdział)
    // – licznik celu i serii w nagłówku odświeża się sam
    if (!get && XP_URL.test(url) && typeof window !== "undefined") window.dispatchEvent(new Event(XP_EVENT));
    return (data ?? {}) as T;
  }
}

export const XP_EVENT = "xp:changed";
const XP_URL = /\/api\/(tests\/[^/]+\/answer|fiszki\/ocena|nauka\/sessions\/[^/]+\/finish|otwarte\/[^/]+\/sprawdz|podrecznik\/przeczytane|cel)\b/;

export const LETTERS = ["A", "B", "C", "D"];

export function fmtPoints(p: number): string {
  return p.toLocaleString("pl-PL", { maximumFractionDigits: 1 });
}

export function fmtPct(p: number): string {
  return `${p.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%`;
}

const LAST_TEST_KEY = "owe:lastTest";

export function rememberTest(id: string | null) {
  try {
    if (id) localStorage.setItem(LAST_TEST_KEY, id);
    else localStorage.removeItem(LAST_TEST_KEY);
  } catch {}
}

export function lastTest(): string | null {
  try {
    return localStorage.getItem(LAST_TEST_KEY);
  } catch {
    return null;
  }
}

/** Podgląd danych innego użytkownika przez admina: `?user=<id>` w adresie strony. */
export function viewedUser(): string | null {
  if (typeof window === "undefined") return null;
  const u = new URLSearchParams(window.location.search).get("user");
  return u && /^[0-9a-f-]{36}$/i.test(u) ? u : null;
}

/** Dopisuje `user=` (podgląd admina) do adresu API. */
export function withUser(url: string, user: string | null = viewedUser()): string {
  return user ? `${url}${url.includes("?") ? "&" : "?"}user=${user}` : url;
}

/**
 * Czy zdarzenie klawiatury pochodzi z pisania (notatka, brudnopis, pole tekstowe wieloliniowe)?
 * Skróty lekcji, testów i fiszek (1–4, Enter, spacja, strzałki) muszą wtedy milczeć.
 */
export function isTyping(e: Event): boolean {
  const t = e.target as HTMLElement | null;
  return Boolean(t?.closest?.("textarea, [contenteditable='true'], .notes-editor, .quick-notes"));
}

/**
 * Podgląd admina (`?user=`) odczytany po zamontowaniu – w pierwszym renderze null, tak samo jak na serwerze
 * (odczyt `window` w renderze dawałby różny HTML serwera i klienta – błąd hydratacji).
 */
export function useViewedUser(): string | null {
  const [u, setU] = useState<string | null>(null);
  useEffect(() => setU(viewedUser()), []);
  return u;
}
