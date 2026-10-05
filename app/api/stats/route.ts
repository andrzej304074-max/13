import { handle } from "@/lib/api";
import { getStats } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(() => getStats());
}
