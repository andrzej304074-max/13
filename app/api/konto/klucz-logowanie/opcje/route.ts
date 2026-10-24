import { handle } from "@/lib/api";
import { passkeyLoginOptions } from "@/lib/passkeys";

export const dynamic = "force-dynamic";

export async function POST() {
  return handle(async () => passkeyLoginOptions());
}
