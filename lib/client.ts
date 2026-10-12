import { useEffect, useState } from "react";

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Błąd ${res.status}`);
  return data as T;
}

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
