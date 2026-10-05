import { handle, readJson } from "@/lib/api";
import { ALLOWED_COUNTS, ENDLESS, type TestSize } from "@/lib/scoring";
import { createTest, HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const { type, count } = await readJson(req);
    if (type !== "single" && type !== "multi") throw new HttpError(400, "Nieprawidłowy typ pytań.");
    if (count !== ENDLESS && !ALLOWED_COUNTS.includes(count as TestSize)) {
      throw new HttpError(400, "Liczba pytań musi wynosić 30, 50 albo „bez limitu”.");
    }
    return createTest(type, count as TestSize | typeof ENDLESS);
  }, 201);
}
