import { oweStatsData } from "@/lib/owe-stats-data";
import { CoverageView } from "./view";

export const metadata = { title: "Pokrycie olimpiad – Testy OWE" };

export default function CoveragePage() {
  return <CoverageView data={oweStatsData()} />;
}
