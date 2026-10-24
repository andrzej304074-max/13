import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { adminList, createAnnouncement } from "@/lib/announce";

export const dynamic = "force-dynamic";

/** Wszystkie ogłoszenia i ankiety (także szkice) z wynikami i liczbą odczytań. */
export async function GET() {
  return handle(async () => { await requireUser({ admin: true }); return adminList(); });
}

/** Nowe ogłoszenie: { title, body, pinned, published, expires_at }. */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser({ admin: true });
    const body = await readJson(req);
    const r = await createAnnouncement(me.id, body);
    await audit(me.id, "ogloszenie-nowe", typeof body.title === "string" ? body.title.slice(0, 80) : null);
    return r;
  }, 201);
}
