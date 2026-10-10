import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ALLOWED_COUNTS, ENDLESS, type TestSize } from "@/lib/scoring";
import { createTest, HttpError } from "@/lib/tests";
import type { Bank, Origin } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const { type, count, bank = "owe", origin = null, section = null } = await readJson(req);
    if (type !== "single" && type !== "multi") throw new HttpError(400, "Nieprawidłowy typ pytań.");
    if (count !== ENDLESS && !ALLOWED_COUNTS.includes(count as TestSize)) {
      throw new HttpError(400, "Liczba pytań musi wynosić 30, 50 albo „bez limitu”.");
    }
    if (bank !== "owe" && bank !== "slownik") throw new HttpError(400, "Nieznana baza pytań.");
    if (origin !== null && origin !== "auto" && origin !== "manual") throw new HttpError(400, "Nieznane pochodzenie pytań.");
    if (section !== null && !(Number.isInteger(section) && (section as number) > 0)) {
      throw new HttpError(400, "Nieprawidłowy dział.");
    }
    const filter = bank === "slownik" ? { origin: origin as Origin | null, section: section as number | null } : {};
    return createTest(me.id, type, count as TestSize | typeof ENDLESS, bank as Bank, filter);
  }, 201);
}
