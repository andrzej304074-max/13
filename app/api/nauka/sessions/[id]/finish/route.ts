import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { finishSession } from "@/lib/nauka";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    const me = await requireUser();
    const { answers } = await readJson(req);
    return finishSession(me.id, id, answers);
  });
}
