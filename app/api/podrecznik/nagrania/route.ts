import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { articleClips, fakeFile } from "@/lib/tts";
import { HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

/** Nagrania akapitów artykułu (skrót tekstu → URL pliku); `?plik=` – plik atrapy w testach (TTS_FAKE=1). */
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
    return { clips: await articleClips(p.get("artykul") ?? "") };
  });
}
