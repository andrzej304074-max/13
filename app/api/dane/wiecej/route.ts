import { daneResponse } from "@/lib/data-route";
import { WIECEJ } from "@/lib/data-server";

export const dynamic = "force-dynamic";

/** „Więcej” przy hasłach: { id: { x – wyjaśnienie, ex – przykład, ch? – [dział, lekcja] w Podręczniku } }. */
export async function GET(req: Request) {
  return daneResponse(req, WIECEJ);
}
