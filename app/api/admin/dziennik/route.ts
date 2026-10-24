import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Dziennik działań administratorów (ostatnie 200). */
export async function GET() {
  return handle(async () => {
    await requireUser({ admin: true });
    return { log: await auditLog() };
  });
}
