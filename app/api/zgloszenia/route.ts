import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createBug, listMyBugs } from "@/lib/bugs";

export const dynamic = "force-dynamic";

/** Moje zgłoszenia błędów. */
export async function GET() {
  return handle(async () => listMyBugs((await requireUser({ active: false })).id));
}

/** Nowe zgłoszenie: { text, page, device }. */
export async function POST(req: Request) {
  return handle(async () => createBug((await requireUser({ active: false })).id, await readJson(req)), 201);
}
