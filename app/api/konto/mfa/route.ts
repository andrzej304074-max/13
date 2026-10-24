import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { mfaInfo } from "@/lib/account";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => mfaInfo(await requireUser({ active: false })));
}
