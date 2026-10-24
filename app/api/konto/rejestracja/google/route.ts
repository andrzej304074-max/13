import { handle, readJson } from "@/lib/api";
import { googleRegister } from "@/lib/google-login";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => googleRegister(await readJson(req)), 201);
}
