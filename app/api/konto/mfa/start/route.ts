import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { mfaStart } from "@/lib/account";

export const dynamic = "force-dynamic";

export async function POST() {
  return handle(async () => mfaStart(await requireUser({ active: false })));
}
