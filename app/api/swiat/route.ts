import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { getWorld } from "@/lib/world";
import { isMetric, isPeriod, isWorldSource } from "@/lib/world-core";

export const dynamic = "force-dynamic";

/** Ty na tle innych: Twój wynik, percentyl i anonimowy rozkład (?miara=xp|skutecznosc|aktywnosc|seria&zrodlo=…&okres=7d|30d|all). */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const m = p.get("miara"), s = p.get("zrodlo"), o = p.get("okres");
  return handle(async () => getWorld(await viewedUserId(req, await requireUser()), isMetric(m) ? m : "xp", isWorldSource(s) ? s : "lacznie", isPeriod(o) ? o : "30d"));
}
