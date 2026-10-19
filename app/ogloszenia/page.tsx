import { requirePageUser } from "@/lib/auth";
import { AnnouncementsView } from "./view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ogłoszenia – Testy OWE" };

export default async function AnnouncementsPage() {
  await requirePageUser();
  return <AnnouncementsView />;
}
