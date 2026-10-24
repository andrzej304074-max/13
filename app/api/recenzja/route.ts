import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { reviewQueue } from "@/lib/review";

export const dynamic = "force-dynamic";

/** Lista do przeglądu (recenzent albo admin). */
export async function GET() {
  return handle(async () => {
    await requireUser({ reviewer: true });
    return reviewQueue();
  });
}
