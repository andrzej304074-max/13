import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { saveReview } from "@/lib/review";

export const dynamic = "force-dynamic";

/** Ocena pozycji: { kind, ref, status: "ok" | "poprawa" | null, comment }. */
export async function POST(req: Request) {
  return handle(async () => ({ review: await saveReview(await requireUser({ reviewer: true }), await readJson(req)) }));
}
