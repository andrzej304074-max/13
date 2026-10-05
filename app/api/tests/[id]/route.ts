import { handle } from "@/lib/api";
import { getTest } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(() => getTest(id));
}
