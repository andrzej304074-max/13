import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { isStage } from "@/lib/questions";
import { isSource } from "@/lib/question-source";
import { getStats } from "@/lib/tests";

export const dynamic = "force-dynamic";

/** Statystyki testów; `zrodlo` – źródło pytań (brak – wszystkie). Stary parametr `bank` (owe/ai/slownik/mix) nadal działa. */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const block = Number(params.get("block"));
  const type = params.get("type");
  const z = params.get("zrodlo") ?? params.get("bank");
  const src = isSource(z) ? z : null;
  const stage = params.get("stage");
  return handle(async () => getStats(await viewedUserId(req, await requireUser()), block || undefined, type === "single" || type === "multi" ? type : null, src,
    isStage(stage) ? stage : null));
}
