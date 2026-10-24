import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getAccessSettings, saveAccessSettings } from "@/lib/access";

export const dynamic = "force-dynamic";

/** Blokady sekcji dla wszystkich / dla wszystkich oprócz adminów i domyślny wygląd (ukryj / kłódka). */
export async function GET() {
  return handle(async () => {
    await requireUser({ admin: true });
    return getAccessSettings();
  });
}

export async function PUT(req: Request) {
  return handle(async () => {
    const me = await requireUser({ admin: true });
    const saved = await saveAccessSettings(await readJson(req));
    await audit(me.id, "dostep-globalny", null, saved as unknown as Record<string, unknown>);
    return saved;
  });
}
