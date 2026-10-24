import { handle, readJson } from "@/lib/api";
import { requireSection, requireUser } from "@/lib/auth";
import { ALLOWED_COUNTS, ENDLESS, type TestSize } from "@/lib/scoring";
import type { DrawFilter } from "@/lib/questions";
import { contentQuota } from "@/lib/security";
import { testFilter } from "@/lib/test-form";
import { createTest, HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

/** Nowy test z formularza „Pytania” (wszystkie źródła i ich filtry); zapisywany jako bank `mix`. */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const body = await readJson(req);
    const { type, count } = body;
    if (type !== "single" && type !== "multi") throw new HttpError(400, "Nieprawidłowy typ pytań.");
    if (count !== ENDLESS && !ALLOWED_COUNTS.includes(count as TestSize)) {
      throw new HttpError(400, "Liczba pytań musi wynosić 30, 50 albo „bez limitu”.");
    }
    const filter: DrawFilter = testFilter(body);
    await requireSection(me, "/");
    await contentQuota(me, "test");
    if (body.mistakes === true) filter.mistakes = true;
    return createTest(me.id, type, count as TestSize | typeof ENDLESS, "mix", filter);
  }, 201);
}
