/** „Skąd te liczby?” – rozwijane wyjaśnienie pod kartą statystyk (co i jak liczymy). */
export function Why({ children }: { children: React.ReactNode }) {
  return (
    <details className="why">
      <summary>Skąd te liczby?</summary>
      <div className="muted small">{children}</div>
    </details>
  );
}
