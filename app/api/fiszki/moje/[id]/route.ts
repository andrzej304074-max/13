import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteOwnCard, updateOwnCard } from "@/lib/own-cards";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => updateOwnCard((await requireUser()).id, decodeURIComponent(id), await readJson(req)));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => deleteOwnCard((await requireUser()).id, decodeURIComponent(id)));
}
