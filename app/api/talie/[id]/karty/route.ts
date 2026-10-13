import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { addCard, removeCard, reorderDeck } from "@/lib/decks";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** { item } – dodaje kartę na koniec talii. */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => addCard((await requireUser()).id, id, (await readJson(req)).item));
}

/** { item } – usuwa kartę z talii. */
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => removeCard((await requireUser()).id, id, (await readJson(req)).item));
}

/** { items: [id…] } – nowa kolejność wszystkich kart. */
export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => reorderDeck((await requireUser()).id, id, (await readJson(req)).items));
}
