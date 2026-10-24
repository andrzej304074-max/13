import { handle, readJson } from "@/lib/api";
import { requireUser, setUserAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** { blocked: [klucze], mode: "hide" | "lock" | null } – blokady sekcji konta. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    return setUserAccess(await requireUser({ admin: true }), id, await readJson(req));
  });
}
