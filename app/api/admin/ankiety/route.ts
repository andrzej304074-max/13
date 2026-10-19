import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createPoll } from "@/lib/announce";

export const dynamic = "force-dynamic";

/** Nowa ankieta: { question, options, multi, anonymous, results_after, published, closes_at }. */
export async function POST(req: Request) {
  return handle(async () => createPoll((await requireUser({ admin: true })).id, await readJson(req)), 201);
}
