import Link from "next/link";

export default function NotFound() {
  return (
    <div className="stack" data-testid="not-found">
      <h1>Nie ma takiej strony</h1>
      <div className="empty-state">
        <span aria-hidden>🔍</span>
        <p>Adres jest nieprawidłowy albo ta strona została usunięta (np. notatka lub talia).</p>
        <Link className="btn" href="/">Strona główna</Link>
      </div>
    </div>
  );
}
