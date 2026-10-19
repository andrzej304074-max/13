import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { dismiss } from "@/lib/announce";

export const dynamic = "force-dynamic";

/** Ukryj przypięte ogłoszenie z paska. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => dismiss((await requireUser()).id, id));
}
