/** Szkielet strony pokazywany od razu po kliknięciu, zanim serwer odda treść. */
export function LoadingPage() {
  return (
    <div className="stack" aria-busy aria-label="Ładowanie">
      <div className="skeleton" style={{ height: 34, width: "45%" }} />
      <div className="skeleton" style={{ height: 110 }} />
      <div className="skeleton" style={{ height: 260 }} />
    </div>
  );
}

/** Szkielet fragmentu strony (lista, tabela, wykresy) – zamiast samego napisu „Ładowanie…”. */
export function SkeletonRows({ rows = 3, height = 56, label = "Ładowanie" }: { rows?: number; height?: number; label?: string }) {
  return (
    <div className="stack" aria-busy aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ height, width: i === rows - 1 && rows > 1 ? "70%" : undefined }} />
      ))}
    </div>
  );
}
