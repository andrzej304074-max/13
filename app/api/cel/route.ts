import { handle, readJson } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { getXpSummary, setDailyGoal } from "@/lib/xp";

export const dynamic = "force-dynamic";

/** Wspólny cel dzienny i seria: XP dziś (wg źródeł), tydzień, seria, rekord, zamrożenie. */
export async function GET(req: Request) {
  return handle(async () => getXpSummary(await viewedUserId(req, await requireUser())));
}

/** Zmiana celu dziennego (50/100/200/300 XP) – obowiązuje od dziś. */
export async function PUT(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    return setDailyGoal(me.id, (await readJson(req)).goal);
  });
}
