import { requirePageUser } from "@/lib/auth";
import { BugsView } from "./view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zgłoś błąd – Testy OWE" };

export default async function BugsPage() {
  await requirePageUser();
  return <BugsView />;
}
