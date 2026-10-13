import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
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
    await requireUser({ admin: true });
    return saveAccessSettings(await readJson(req));
  });
}
