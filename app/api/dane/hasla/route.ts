import { daneResponse } from "@/lib/data-route";
import { HASLA } from "@/lib/data-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return daneResponse(req, HASLA);
}
