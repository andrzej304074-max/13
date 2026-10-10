import { requirePageUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Guard({ children }: { children: React.ReactNode }) {
  await requirePageUser();
  return children;
}
