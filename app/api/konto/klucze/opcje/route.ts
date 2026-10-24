import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { passkeyRegisterOptions } from "@/lib/passkeys";

export const dynamic = "force-dynamic";

export async function POST() {
  return handle(async () => passkeyRegisterOptions(await requireUser({ active: false })));
}
