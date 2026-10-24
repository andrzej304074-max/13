import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { mfaDisable } from "@/lib/account";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser({ active: false });
    const { password, code } = await readJson(req);
    await mfaDisable(me, password, code);
    return { ok: true };
  });
}
