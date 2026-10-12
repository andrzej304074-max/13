import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { getMastery } from "@/lib/mastery";

export const dynamic = "force-dynamic";

/** Opanowanie haseł (poprawne/wszystkie z nauki, testów i fiszek) – kolor obwódki fiszek. */
export async function GET(req: Request) {
  return handle(async () => getMastery(await viewedUserId(req, await requireUser())));
}
