import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteOwnAccount, usage } from "@/lib/account";

export const dynamic = "force-dynamic";

/** Zużycie limitów danych konta. */
export async function GET() {
  return handle(async () => ({ usage: await usage(await requireUser({ active: false })) }));
}

/** Usunięcie własnego konta: { confirm: "USUŃ", password | email, code? }. */
export async function DELETE(req: Request) {
  return handle(async () => {
    await deleteOwnAccount(await requireUser({ active: false }), await readJson(req));
    return { ok: true };
  });
}
