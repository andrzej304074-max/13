import { handle, readJson } from "@/lib/api";
import { register } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const { email, password, code } = await readJson(req);
    return register(email, password, code);
  }, 201);
}
