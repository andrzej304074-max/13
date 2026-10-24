import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { endSession } from "@/lib/account";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    return { sessions: await endSession(await requireUser({ active: false }), (await ctx.params).id) };
  });
}
