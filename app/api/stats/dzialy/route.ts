import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { myFilterFromParams } from "@/lib/my-stats-core";
import { getMyStats } from "@/lib/my-stats";

export const dynamic = "force-dynamic";

/** Moje statystyki wg działów, zagadnień i pojęć – osobno dla Archiwum OWE (`bank=owe`), Pytań AI (`ai`) i Słownika (`slownik`). */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const b = p.get("bank");
  const bank = b === "slownik" || b === "ai" ? b : "owe";
  return handle(async () => getMyStats(await viewedUserId(req, await requireUser()), bank, myFilterFromParams(p)));
}
