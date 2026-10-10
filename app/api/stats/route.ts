import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { getStats } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const block = Number(params.get("block"));
  const type = params.get("type");
  const bank = params.get("bank") === "slownik" ? "slownik" : "owe";
  return handle(async () => getStats(await viewedUserId(req, await requireUser()), block || undefined, type === "single" || type === "multi" ? type : null, bank));
}
