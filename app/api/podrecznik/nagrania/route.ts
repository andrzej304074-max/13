import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { articleClips, fakeFile, liveAvailable, recordLive } from "@/lib/tts";
import { HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

/**
 * Nagrania akapitów artykułu (skrót tekstu → URL pliku) i `live` – czy brakujące akapity można nagrać na bieżąco;
 * `?plik=` – plik atrapy w testach (TTS_FAKE=1).
 */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const file = p.get("plik");
  if (file) {
    try {
      await requireUser();
      return new NextResponse(new Uint8Array(await fakeFile(file)), { headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=3600" } });
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      return NextResponse.json({ error: (e as Error).message }, { status });
    }
  }
  return handle(async () => {
    await requireUser();
    const [clips, live] = await Promise.all([articleClips(p.get("artykul") ?? ""), liveAvailable()]);
    return { clips, live };
  });
}

export const maxDuration = 30;

/** Nagranie akapitu na bieżąco (słuchanie artykułu, także z wyłączonym ekranem): `{ hash }` → `{ url }`. */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    return recordLive(me.id, (await readJson(req)).hash);
  });
}
