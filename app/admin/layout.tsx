import { requirePageUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requirePageUser({ admin: true });
  return children;
}
