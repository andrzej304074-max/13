import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listAllBugs } from "@/lib/bugs";
import { BUG_STATUSES } from "@/lib/bugs-core";

export const dynamic = "force-dynamic";

/** Wszystkie zgłoszenia (z e-mailem zgłaszającego); `?status=nowe` – filtr. */
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser({ admin: true });
    const s = new URL(req.url).searchParams.get("status");
    return listAllBugs(s && (BUG_STATUSES as readonly string[]).includes(s) ? s : null);
  });
}
