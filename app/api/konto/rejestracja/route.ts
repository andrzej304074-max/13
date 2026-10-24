import { handle, readJson } from "@/lib/api";
import { register } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    return register(await readJson(req));
  }, 201);
}
