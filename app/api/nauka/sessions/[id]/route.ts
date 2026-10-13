import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { saveSessionProgress } from "@/lib/nauka";

export const dynamic = "force-dynamic";

/** { pos, total } – postęp pod-lekcji w trakcie (ścieżka pokazuje „w trakcie”). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => saveSessionProgress((await requireUser()).id, id, await readJson(req)));
}
