"use client";

import { useEffect } from "react";

/**
 * Błąd wczytania strony: komunikat i „Spróbuj ponownie” (domyślnie przeładowanie strony).
 * Po powrocie sieci (zdarzenie `online`) ponawia sam.
 */
export function LoadError({ message, onRetry, children }: { message: string; onRetry?: () => void; children?: React.ReactNode }) {
  const retry = onRetry ?? (() => window.location.reload());
  useEffect(() => {
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  });
  return (
    <div className="stack" data-testid="load-error" role="alert">
      <p className="error" style={{ margin: 0 }}>{message}</p>
      <div className="row">
        <button type="button" className="btn" onClick={retry}>Spróbuj ponownie</button>
        {children}
      </div>
    </div>
  );
}
