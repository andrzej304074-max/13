import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listAllBugs } from "@/lib/bugs";
import { BUG_KINDS, BUG_STATUSES } from "@/lib/bugs-core";

export const dynamic = "force-dynamic";

/** Wszystkie zgłoszenia (z e-mailem zgłaszającego); filtry `?status=nowe`, `?rodzaj=merytoryczny`. */
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser({ admin: true });
    const q = new URL(req.url).searchParams;
    const s = q.get("status"), k = q.get("rodzaj");
    return listAllBugs(s && (BUG_STATUSES as readonly string[]).includes(s) ? s : null, k && (BUG_KINDS as readonly string[]).includes(k) ? k : null);
  });
}
