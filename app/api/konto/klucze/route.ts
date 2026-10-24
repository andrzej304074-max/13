import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listPasskeys, passkeyRegister } from "@/lib/passkeys";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => ({ keys: await listPasskeys(await requireUser({ active: false })) }));
}

/** Zapis nowego klucza – odpowiedź przeglądarki na opcje z /opcje. */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser({ active: false });
    await passkeyRegister(me, await readJson(req));
    return { keys: await listPasskeys(me) };
  }, 201);
}
