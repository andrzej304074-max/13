import { oweStatsData } from "@/lib/owe-stats-data";
import { OweStatsView } from "./view";

export const metadata = { title: "Statystyki pytań OWE – Testy OWE" };

export default function OweStatsPage() {
  return <OweStatsView data={oweStatsData()} />;
}
