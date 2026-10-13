import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { liveAvailable, recordLive } from "@/lib/tts";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Czy głos z chmury jest dostępny (czytnik zamawia wtedy nagrania zamiast syntezatora). */
export async function GET() {
  return handle(async () => {
    await requireUser();
    return { live: await liveAvailable() };
  });
}

/**
 * Nagranie tekstu z katalogu (akapit Podręcznika, hasło, pytanie, wyjaśnienie): `{ hash }` → `{ url }` –
 * gotowe albo nagrane od razu; `url: null` – tekst spoza katalogu albo limit (czyta syntezator przeglądarki).
 */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    return recordLive(me.id, (await readJson(req)).hash);
  });
}
