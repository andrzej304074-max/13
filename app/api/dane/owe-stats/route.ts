import { daneResponse } from "@/lib/data-route";
import { OWE_DATA } from "@/lib/data-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return daneResponse(req, OWE_DATA);
}
