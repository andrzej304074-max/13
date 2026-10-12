import { handle, readJson } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { createNote, listNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

/** Lista notatek (`rodzaj=note|scratch`, `gw=1|0`, `q=`); admin może podejrzeć cudze (`user=`). */
export async function GET(req: Request) {
  return handle(async () => {
    const p = new URL(req.url).searchParams;
    return listNotes(await viewedUserId(req, await requireUser()), { kind: p.get("rodzaj"), starred: p.get("gw"), q: p.get("q") });
  });
}

export async function POST(req: Request) {
  return handle(async () => createNote((await requireUser()).id, await readJson(req)), 201);
}
