"use client";

import { useEffect, useState } from "react";
import { api } from "./client";

/** Dane statyczne (hasła, statystyki OWE) pobierane raz na sesję karty – kolejne przejścia biorą je z pamięci. */
const mem = new Map<string, unknown>();
const pending = new Map<string, Promise<unknown>>();

export function loadData<T>(url: string): Promise<T> {
  if (mem.has(url)) return Promise.resolve(mem.get(url) as T);
  let p = pending.get(url);
  if (!p) {
    p = api<T>(url).then((v) => { mem.set(url, v); pending.delete(url); return v; }, (e) => { pending.delete(url); throw e; });
    pending.set(url, p);
  }
  return p as Promise<T>;
}

export function useData<T>(url: string): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(() => (mem.get(url) as T) ?? null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (data) return;
    let on = true;
    loadData<T>(url).then((v) => on && setData(v)).catch((e) => on && setError(e instanceof Error ? e.message : "Błąd"));
    return () => { on = false; };
  }, [url, data]);
  return { data, error };
}
