"use client";

/** Błąd samego układu strony – zastępuje cały dokument, więc ma własne <html> i proste style. */
export default function GlobalError() {
  return (
    <html lang="pl">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 560, margin: "40px auto", lineHeight: 1.5 }}>
        <h1>Coś poszło nie tak</h1>
        <p>Nie udało się wczytać aplikacji. Spróbuj ponownie za chwilę.</p>
        <button onClick={() => window.location.reload()} style={{ padding: "10px 16px", fontSize: 16 }}>Spróbuj ponownie</button>
      </body>
    </html>
  );
}
