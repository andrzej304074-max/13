import { handle } from "@/lib/api";
import { logout } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  return handle(async () => {
    await logout();
    return { ok: true };
  });
}
