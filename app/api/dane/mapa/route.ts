import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";
import { MAPA, jsonCached } from "@/lib/data-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireUser();
  } catch (e) {
    return handle(async () => { throw e; });
  }
  return jsonCached(req, MAPA());
}
