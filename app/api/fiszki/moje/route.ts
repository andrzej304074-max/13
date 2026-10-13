import { handle, readJson } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { createOwnCard, listOwnCards } from "@/lib/own-cards";

export const dynamic = "force-dynamic";

/** Własne fiszki konta (podgląd admina: `?user=`). */
export async function GET(req: Request) {
  return handle(async () => listOwnCards(await viewedUserId(req, await requireUser())));
}

/** { t, d, w?, topic, kind } – nowa własna fiszka. */
export async function POST(req: Request) {
  return handle(async () => createOwnCard((await requireUser()).id, await readJson(req)), 201);
}
