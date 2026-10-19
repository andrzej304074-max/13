import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { adminList, createAnnouncement } from "@/lib/announce";

export const dynamic = "force-dynamic";

/** Wszystkie ogłoszenia i ankiety (także szkice) z wynikami i liczbą odczytań. */
export async function GET() {
  return handle(async () => { await requireUser({ admin: true }); return adminList(); });
}

/** Nowe ogłoszenie: { title, body, pinned, published, expires_at }. */
export async function POST(req: Request) {
  return handle(async () => createAnnouncement((await requireUser({ admin: true })).id, await readJson(req)), 201);
}
