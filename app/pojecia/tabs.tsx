import Link from "next/link";

export function PojeciaTabs({ active }: { active: "tabela" | "statystyki" | "pokrycie" }) {
  return (
    <div className="tabs" role="tablist">
      <Link href="/pojecia" className={active === "tabela" ? "active" : ""} role="tab" aria-selected={active === "tabela"}>📖 Tabela pojęć</Link>
      <Link href="/pojecia/statystyki" className={active === "statystyki" ? "active" : ""} role="tab" aria-selected={active === "statystyki"}>📊 Statystyki pytań OWE</Link>
      <Link href="/pojecia/pokrycie" className={active === "pokrycie" ? "active" : ""} role="tab" aria-selected={active === "pokrycie"}>🔁 Pokrycie olimpiad</Link>
    </div>
  );
}
