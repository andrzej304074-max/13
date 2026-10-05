import { handle, readJson } from "@/lib/api";
import { ALLOWED_COUNTS, type TestSize } from "@/lib/scoring";
import { createTest, HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const { type, count } = await readJson(req);
    if (type !== "single" && type !== "multi") throw new HttpError(400, "Nieprawidłowy typ pytań.");
    if (!ALLOWED_COUNTS.includes(count as TestSize)) throw new HttpError(400, "Liczba pytań musi wynosić 30 lub 50.");
    return createTest(type, count as TestSize);
  }, 201);
}
