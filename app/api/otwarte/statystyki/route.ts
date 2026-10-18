import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { openStats } from "@/lib/otwarte";

export const dynamic = "force-dynamic";

/** Statystyki zadań i esejów (osobno od testów). */
export async function GET(req: Request) {
  return handle(async () => openStats(await viewedUserId(req, await requireUser())));
}
