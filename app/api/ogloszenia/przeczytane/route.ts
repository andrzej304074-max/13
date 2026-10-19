import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { markRead } from "@/lib/announce";

export const dynamic = "force-dynamic";

/** Oznacz ogłoszenia i ankiety jako przeczytane: { ids: [...] }. */
export async function POST(req: Request) {
  return handle(async () => markRead((await requireUser()).id, (await readJson(req)).ids));
}
