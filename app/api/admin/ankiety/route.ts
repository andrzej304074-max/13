import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { createPoll } from "@/lib/announce";

export const dynamic = "force-dynamic";

/** Nowa ankieta: { question, options, multi, anonymous, results_after, published, closes_at }. */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser({ admin: true });
    const body = await readJson(req);
    const r = await createPoll(me.id, body);
    await audit(me.id, "ankieta-nowa", typeof body.question === "string" ? body.question.slice(0, 80) : null);
    return r;
  }, 201);
}
