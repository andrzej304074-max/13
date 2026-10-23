import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { setPref } from "@/lib/prefs";
import { limit } from "@/lib/security";

export const dynamic = "force-dynamic";

/** { value } – zapis filtra strony `klucz` (lib/prefs-core.ts). */
export async function PUT(req: Request, { params }: { params: Promise<{ klucz: string }> }) {
  return handle(async () => {
    const me = await requireUser();
    await limit(`prefs:${me.id}`, 300, 600, me.id, "zapisów ustawień");
    const { value } = await readJson(req);
    await setPref(me.id, (await params).klucz, value);
    return { ok: true };
  });
}
