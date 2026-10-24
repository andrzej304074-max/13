import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { deleteItem, updateAnnouncement } from "@/lib/announce";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    const me = await requireUser({ admin: true });
    const body = await readJson(req);
    const r = await updateAnnouncement(id, body);
    await audit(me.id, "ogloszenie-zmiana", id, { fields: Object.keys(body) });
    return r;
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    const me = await requireUser({ admin: true });
    const r = await deleteItem("announcement", id);
    await audit(me.id, "ogloszenie-usuniete", id);
    return r;
  });
}
