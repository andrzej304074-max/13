"use client";

import { useCallback, useEffect, useState } from "react";
import { api, viewedUser, withUser } from "./client";
import type { StarKind } from "./notes-core";

/** Gwiazdki (fiszki, artykuły): jedna lista na rodzaj, wspólna dla wszystkich komponentów karty i zmieniana od razu (optymistycznie). */
const cache = new Map<string, { set: Set<string>; subs: Set<() => void>; loading?: Promise<void>; loaded?: boolean }>();

/** Osobno dla podglądu admina (`?user=`) – nie miesza własnych gwiazdek z cudzymi. */
function entry(kind: StarKind) {
  const key = `${kind}|${viewedUser() ?? ""}`;
  let e = cache.get(key);
  if (!e) cache.set(key, (e = { set: new Set(), subs: new Set() }));
  return e;
}

function load(kind: StarKind): Promise<void> {
  const e = entry(kind);
  if (!e.loading) {
    e.loading = api<string[]>(withUser(`/api/gwiazdki?rodzaj=${kind}`))
      .then((refs) => { e.set = new Set(refs); e.loaded = true; e.subs.forEach((f) => f()); })
      .catch((err) => { e.loading = undefined; throw err; });
  }
  return e.loading;
}

export function useStars(kind: StarKind) {
  const [, bump] = useState(0);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && Boolean(entry(kind).loaded));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const e = entry(kind);
    const f = () => bump((n) => n + 1);
    e.subs.add(f);
    load(kind).then(() => setReady(true)).catch((err) => setError(err.message));
    return () => { e.subs.delete(f); };
  }, [kind]);
  const toggle = useCallback(async (ref: string) => {
    if (viewedUser()) return; // podgląd admina – tylko odczyt
    const e = entry(kind);
    const on = !e.set.has(ref);
    const apply = (v: boolean) => { if (v) e.set.add(ref); else e.set.delete(ref); e.subs.forEach((f) => f()); };
    apply(on);
    try {
      await api("/api/gwiazdki", { method: "POST", body: JSON.stringify({ kind, ref, on }) });
    } catch (err) {
      apply(!on);
      setError((err as Error).message);
    }
  }, [kind]);
  return { stars: entry(kind).set, toggle, ready, error };
}
