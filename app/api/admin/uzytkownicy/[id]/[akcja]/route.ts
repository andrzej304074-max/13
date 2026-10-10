import { handle } from "@/lib/api";
import { ADMIN_ACTIONS, adminAction, requireUser, type AdminAction } from "@/lib/auth";
import { HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; akcja: string }> }) {
  const { id, akcja } = await params;
  return handle(async () => {
    const me = await requireUser({ admin: true });
    if (!ADMIN_ACTIONS.includes(akcja as AdminAction)) throw new HttpError(404, "Nieznana operacja.");
    await adminAction(me, id, akcja as AdminAction);
    return { ok: true };
  });
}
