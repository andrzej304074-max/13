import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listPasskeys, passkeyDelete } from "@/lib/passkeys";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const me = await requireUser({ active: false });
    await passkeyDelete(me, decodeURIComponent((await ctx.params).id));
    return { keys: await listPasskeys(me) };
  });
}
