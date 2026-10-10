import { handle, readJson } from "@/lib/api";
import { confirmReset } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const { token, password } = await readJson(req);
    await confirmReset(token, password);
    return { ok: true };
  });
}
