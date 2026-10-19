"use client";

import { useEffect, useRef } from "react";
import { NETWORK_MSG } from "@/lib/client";

/**
 * Błąd wczytania strony: komunikat i „Spróbuj ponownie” (domyślnie przeładowanie strony).
 * Po powrocie sieci (zdarzenie `online`) ponawia sam – tylko przy błędzie sieci albo chwilowym błędzie serwera;
 * błąd trwały (np. sekcja zablokowana, 404) nie przeładowuje strony przy każdej zmianie sieci (Wi-Fi ↔ LTE).
 */
export function LoadError({ message, onRetry, children }: { message: string; onRetry?: () => void; children?: React.ReactNode }) {
  const retry = useRef(onRetry ?? (() => window.location.reload()));
  retry.current = onRetry ?? (() => window.location.reload());
  const transient = message === NETWORK_MSG || /^Serwer chwilowo nie odpowiada/.test(message);
  useEffect(() => {
    if (!transient) return;
    const on = () => retry.current();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, [transient]);
  return (
    <div className="stack" data-testid="load-error" role="alert">
      <p className="error" style={{ margin: 0 }}>{message}</p>
      <div className="row">
        <button type="button" className="btn" onClick={() => retry.current()}>Spróbuj ponownie</button>
        {children}
      </div>
    </div>
  );
}
