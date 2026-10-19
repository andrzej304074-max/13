import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { feed } from "@/lib/announce";

export const dynamic = "force-dynamic";

/** Opublikowane ogłoszenia i ankiety (z moim głosem i wynikami, gdy widoczne). */
export async function GET() {
  return handle(async () => feed((await requireUser()).id));
}
