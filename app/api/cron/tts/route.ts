import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { runBatch } from "@/lib/tts";

export const dynamic = "force-dynamic";
// darmowy Azure F0 przyjmuje 20 zapytań na minutę – porcja trwa kilka minut
export const maxDuration = 300;

/**
 * Porcja nagrań Podręcznika (lib/tts.ts) – wywołuje Vercel Cron raz dziennie (vercel.json) i opcjonalnie GitHub Actions
 * co godzinę (.github/workflows/tts.yml). Wymaga nagłówka `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // porównanie w stałym czasie – czas odpowiedzi nie zdradza, ile znaków sekretu się zgadza
  const got = Buffer.from(req.headers.get("authorization") ?? ""), want = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || got.length !== want.length || !timingSafeEqual(got, want)) {
    return NextResponse.json({ error: "Brak uprawnień." }, { status: 401 });
  }
  return handle(() => runBatch(Number(process.env.TTS_RUN_SECONDS) || 270));
}
