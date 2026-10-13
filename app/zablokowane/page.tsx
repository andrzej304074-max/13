import { BlockedScreen } from "@/app/components/access";
import { ACCESS_KEYS } from "@/lib/access-core";

export const metadata = { title: "Sekcja wyłączona – Testy OWE" };

export default async function Zablokowane({ searchParams }: { searchParams: Promise<{ sekcja?: string }> }) {
  const { sekcja } = await searchParams;
  return <BlockedScreen sectionKey={sekcja && ACCESS_KEYS.includes(sekcja) ? sekcja : null} />;
}
