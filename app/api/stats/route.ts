import { handle } from "@/lib/api";
import { getStats } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const block = Number(new URL(req.url).searchParams.get("block"));
  return handle(() => getStats(block || undefined));
}
