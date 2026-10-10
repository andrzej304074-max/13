import { handle, readJson } from "@/lib/api";
import { login } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const { email, password } = await readJson(req);
    return login(email, password);
  });
}
