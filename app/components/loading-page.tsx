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
