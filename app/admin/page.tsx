import { requirePageUser } from "@/lib/auth";
import { AdminPanel } from "./panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await requirePageUser({ admin: true });
  return <AdminPanel meId={me.id} />;
}
