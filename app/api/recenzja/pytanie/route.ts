import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { reviewQuestion } from "@/lib/review";

export const dynamic = "force-dynamic";

/** Pełne pytanie z kluczem i wyjaśnieniem – do recenzji. */
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser({ reviewer: true });
    return reviewQuestion(new URL(req.url).searchParams.get("id"));
  });
}
