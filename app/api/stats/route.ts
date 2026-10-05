import { handle } from "@/lib/api";
import { getStats } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const block = Number(params.get("block"));
  const type = params.get("type");
  return handle(() => getStats(block || undefined, type === "single" || type === "multi" ? type : null));
}
