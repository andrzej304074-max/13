import { handle } from "@/lib/api";
import { deleteUser, requireUser, userEmail } from "@/lib/auth";
import { HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    await requireUser({ admin: true });
    const email = await userEmail(id);
    if (!email) throw new HttpError(404, "Nie ma takiego użytkownika.");
    return { id, email };
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    await deleteUser(await requireUser({ admin: true }), id);
    return { ok: true };
  });
}
