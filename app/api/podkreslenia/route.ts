import { handle, readJson } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { addHighlight, deleteHighlight, listHighlights } from "@/lib/notes";

export const dynamic = "force-dynamic";

/** Podkreślenia w artykule (`artykul=<dział>` zwraca też te z jego rozdziałów). */
export async function GET(req: Request) {
  return handle(async () => listHighlights(await viewedUserId(req, await requireUser()), new URL(req.url).searchParams.get("artykul")));
}

export async function POST(req: Request) {
  return handle(async () => addHighlight((await requireUser()).id, await readJson(req)), 201);
}

export async function DELETE(req: Request) {
  return handle(async () => deleteHighlight((await requireUser()).id, new URL(req.url).searchParams.get("id")));
}
