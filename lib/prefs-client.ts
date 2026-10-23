"use client";

import { useEffect, useRef } from "react";
import { api } from "./client";
import type { PrefKey } from "./prefs-core";

/**
 * Filtry zapamiętywane domyślnie: najpierw z przeglądarki (od razu), potem z konta (wspólne dla urządzeń).
 * Strona przekazuje bieżącą wartość filtra jako tekst (parametry adresu albo JSON) i funkcję, która ją wczytuje.
 */

const LOCAL = (k: PrefKey) => `owe:pref:${k}`;
let accountPrefs: Promise<Record<string, string>> | null = null;

function loadAccount(): Promise<Record<string, string>> {
  accountPrefs ??= api<{ prefs: Record<string, string> }>("/api/ustawienia/filtry").then((r) => r.prefs).catch(() => ({}));
  return accountPrefs;
}

function readLocal(k: PrefKey): string | null {
  try { return localStorage.getItem(LOCAL(k)); } catch { return null; }
}

/**
 * @param value  bieżący filtr (null – strona jeszcze nie gotowa, nic nie zapisujemy)
 * @param apply  wczytanie zapisanego filtra do stanu strony
 * @param skip   nie wczytuj zapisanego (np. adres z jawnymi filtrami – link od kogoś) ani nie zapisuj (podgląd admina)
 */
export function usePrefSync(key: PrefKey, value: string | null, apply: (v: string) => void, skip: { load?: boolean; save?: boolean } = {}) {
  const ready = useRef(false);
  const touched = useRef(false);
  const last = useRef<string | null>(null);
  const pending = useRef<string | null>(null);
  const applyRef = useRef(apply);
  applyRef.current = apply;

  // wczytanie: przeglądarka, potem konto (jeśli użytkownik nic jeszcze nie zmienił)
  useEffect(() => {
    if (value === null || ready.current) return;
    ready.current = true;
    last.current = value;
    if (skip.load) return;
    const local = readLocal(key);
    if (local !== null && local !== value) { last.current = local; applyRef.current(local); }
    loadAccount().then((prefs) => {
      const v = prefs[key];
      if (v === undefined || touched.current || v === last.current) return;
      last.current = v;
      try { localStorage.setItem(LOCAL(key), v); } catch {}
      applyRef.current(v);
    });
  }, [key, value, skip.load]);

  // zapis po zmianie (z opóźnieniem – kilka szybkich zmian to jeden zapis)
  useEffect(() => {
    if (value === null || !ready.current || value === last.current) return;
    touched.current = true;
    last.current = value;
    if (skip.save) return;
    try { localStorage.setItem(LOCAL(key), value); } catch {}
    pending.current = value;
    const t = setTimeout(() => send(key, pending), 800);
    return () => clearTimeout(t);
  }, [key, value, skip.save]);

  // wyjście ze strony przed upływem opóźnienia (przejście w aplikacji albo zamknięcie karty) – zapis od razu
  useEffect(() => {
    const flush = () => send(key, pending);
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); flush(); };
  }, [key]);
}

function send(key: PrefKey, pending: { current: string | null }) {
  const value = pending.current;
  if (value === null) return;
  pending.current = null;
  fetch(`/api/ustawienia/filtry/${key}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }), keepalive: true }).catch(() => {});
  accountPrefs = accountPrefs?.then((p) => ({ ...p, [key]: value })) ?? null;
}
