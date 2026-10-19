import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteItem, updateAnnouncement } from "@/lib/announce";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => { await requireUser({ admin: true }); return updateAnnouncement(id, await readJson(req)); });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => { await requireUser({ admin: true }); return deleteItem("announcement", id); });
}
