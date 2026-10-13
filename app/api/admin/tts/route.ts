import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { runBatch, setVoice, ttsStatus } from "@/lib/tts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Stan nagrań głosem z chmury: postęp, zużycie znaków w miesiącu, głos. */
export async function GET() {
  return handle(async () => {
    await requireUser({ admin: true });
    return ttsStatus();
  });
}

/** Zmiana głosu nagrań. */
export async function PUT(req: Request) {
  return handle(async () => {
    await requireUser({ admin: true });
    await setVoice((await readJson(req)).voice);
    return ttsStatus();
  });
}

/** „Nagraj porcję teraz” – ok. 50 s (kilkanaście akapitów przy limicie 20 zapytań na minutę). */
export async function POST() {
  return handle(async () => {
    await requireUser({ admin: true });
    const run = await runBatch(50);
    return { run, status: await ttsStatus() };
  });
}
