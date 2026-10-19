import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { vote } from "@/lib/announce";

export const dynamic = "force-dynamic";

/** Głos w ankiecie: { choices: [indeksy] } – raz na konto. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => vote((await requireUser()).id, id, await readJson(req)), 201);
}
