import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { finishTest } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => finishTest((await requireUser()).id, id));
}
