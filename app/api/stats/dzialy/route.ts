import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { myFilterFromParams } from "@/lib/my-stats-core";
import { getMyStats } from "@/lib/my-stats";

export const dynamic = "force-dynamic";

/** Moje statystyki wg działów, zagadnień i pojęć – osobno dla pytań OWE (`bank=owe`) i słownikowych (`bank=slownik`). */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const bank = p.get("bank") === "slownik" ? "slownik" : "owe";
  return handle(async () => getMyStats(await viewedUserId(req, await requireUser()), bank, myFilterFromParams(p)));
}
