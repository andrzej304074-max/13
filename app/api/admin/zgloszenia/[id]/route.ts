import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { updateBug } from "@/lib/bugs";

export const dynamic = "force-dynamic";

/** Zmiana statusu i notatki admina: { status?, note? }. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    await requireUser({ admin: true });
    return updateBug(id, await readJson(req));
  });
}
