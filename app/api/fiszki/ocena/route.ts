import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { rateFlashcard } from "@/lib/mastery";

export const dynamic = "force-dynamic";

/** Samoocena fiszki: { item, known }. */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const { item, known } = await readJson(req);
    return rateFlashcard(me.id, item, known);
  }, 201);
}
