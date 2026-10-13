import { handle, readJson } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { deleteDeck, getDeck, renameDeck } from "@/lib/decks";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => getDeck(await viewedUserId(req, await requireUser()), id));
}

/** { name } – zmiana nazwy. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => renameDeck((await requireUser()).id, id, await readJson(req)));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => deleteDeck((await requireUser()).id, id));
}
