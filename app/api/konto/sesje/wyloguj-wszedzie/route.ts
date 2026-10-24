import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { endOtherSessions } from "@/lib/account";

export const dynamic = "force-dynamic";

/** Kończy wszystkie sesje oprócz bieżącej. */
export async function POST() {
  return handle(async () => ({ sessions: await endOtherSessions(await requireUser({ active: false })) }));
}
