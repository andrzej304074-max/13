"use client";

import { useEffect } from "react";

/** Błąd strony (np. chwilowy brak połączenia z bazą) – komunikat i ponowna próba zamiast pustego ekranu. */
export default function PageError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="stack" data-testid="page-error">
      <h1>Coś poszło nie tak</h1>
      <div className="empty-state">
        <span aria-hidden>⚠️</span>
        <p>Nie udało się wczytać tej strony. Najczęściej to chwilowy problem z połączeniem z bazą danych – spróbuj ponownie za chwilę.</p>
        <div className="row" style={{ justifyContent: "center", gap: 8 }}>
          {/* pełne przeładowanie – błąd serwera (np. bazy) nie zniknie po samym ponownym renderze na kliencie */}
          <button className="btn" onClick={() => window.location.reload()}>Spróbuj ponownie</button>
          <a className="btn secondary" href="/">Strona główna</a>
        </div>
        {error.digest && <p className="muted small">Kod błędu: {error.digest}</p>}
      </div>
    </div>
  );
}
