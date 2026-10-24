import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { updateBug } from "@/lib/bugs";

export const dynamic = "force-dynamic";

/** Zmiana statusu i notatki admina: { status?, note? }. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    const me = await requireUser({ admin: true });
    const body = await readJson(req);
    const r = await updateBug(id, body);
    if (body.status !== undefined) await audit(me.id, "zgloszenie-status", id, { status: body.status });
    return r;
  });
}
