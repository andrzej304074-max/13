import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { isStage } from "@/lib/questions";
import { getStats } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const block = Number(params.get("block"));
  const type = params.get("type");
  const b = params.get("bank");
  const bank = b === "slownik" || b === "mix" ? b : "owe";
  const stage = params.get("stage");
  return handle(async () => getStats(await viewedUserId(req, await requireUser()), block || undefined, type === "single" || type === "multi" ? type : null, bank,
    isStage(stage) ? stage : null));
}
