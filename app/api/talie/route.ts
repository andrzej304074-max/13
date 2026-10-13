import { handle, readJson } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { createDeck, listDecks } from "@/lib/decks";

export const dynamic = "force-dynamic";

/** Talie użytkownika (z liczbą kart i pierwszymi hasłami); `?item=<id>` – dodatkowo, czy talia zawiera to hasło. */
export async function GET(req: Request) {
  return handle(async () => listDecks(await viewedUserId(req, await requireUser()), new URL(req.url).searchParams.get("item")));
}

/** { name, items? } – nowa talia. */
export async function POST(req: Request) {
  return handle(async () => createDeck((await requireUser()).id, await readJson(req)), 201);
}
