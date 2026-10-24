import { handle, readJson } from "@/lib/api";
import { passkeyLogin } from "@/lib/passkeys";

export const dynamic = "force-dynamic";

/** Logowanie kluczem dostępu (bez hasła). */
export async function POST(req: Request) {
  return handle(async () => passkeyLogin(await readJson(req)));
}
