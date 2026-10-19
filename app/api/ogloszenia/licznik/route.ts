import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { badge } from "@/lib/announce";

export const dynamic = "force-dynamic";

/** Liczba nieprzeczytanych (🔔) i przypięte ogłoszenie do paska. */
export async function GET() {
  return handle(async () => badge((await requireUser()).id));
}
