import { handle } from "@/lib/api";
import { listUsers, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requireUser({ admin: true });
    return listUsers();
  });
}
