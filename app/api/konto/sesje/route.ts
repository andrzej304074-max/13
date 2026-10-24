import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listSessions } from "@/lib/account";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => ({ sessions: await listSessions(await requireUser({ active: false })) }));
}
