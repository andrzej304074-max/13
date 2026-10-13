import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { runBatch, setTtsSettings, ttsStatus } from "@/lib/tts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Stan nagrań głosem z chmury: postęp, zużycie znaków w miesiącu, głos. */
export async function GET() {
  return handle(async () => {
    await requireUser({ admin: true });
    return ttsStatus();
  });
}

/** Ustawienia: głos, limit miesięczny znaków, tryb szybki (S0). */
export async function PUT(req: Request) {
  return handle(async () => {
    await requireUser({ admin: true });
    await setTtsSettings(await readJson(req));
    return ttsStatus();
  });
}

/**
 * „Nagraj porcję teraz” – ok. 50 s: na F0 kilkanaście tekstów (20 zapytań na minutę), w trybie szybkim (S0) kilkaset;
 * „Nagraj wszystko” w panelu wywołuje to w pętli, dopóki są braki.
 */
export async function POST() {
  return handle(async () => {
    await requireUser({ admin: true });
    const run = await runBatch(50);
    return { run, status: await ttsStatus() };
  });
}
