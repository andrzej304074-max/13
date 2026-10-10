import { handle, readJson } from "@/lib/api";
import { requestReset } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const { email } = await readJson(req);
    await requestReset(email);
    return { ok: true };
  });
}
