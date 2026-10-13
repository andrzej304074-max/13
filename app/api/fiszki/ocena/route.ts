import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { rateFlashcard } from "@/lib/mastery";
import { isOwnId } from "@/lib/own-cards-core";
import { rateOwnCard } from "@/lib/own-cards";

export const dynamic = "force-dynamic";

/** Samoocena fiszki: { item, known }. */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const { item, known } = await readJson(req);
    // własna fiszka – ocena tylko w karcie (bez wpływu na Naukę i statystyki)
    if (isOwnId(item)) return rateOwnCard(me.id, item, known === true);
    return rateFlashcard(me.id, item, known);
  }, 201);
}
