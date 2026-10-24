import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { mfaEnable } from "@/lib/account";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser({ active: false });
    const { flow, code } = await readJson(req);
    return mfaEnable(me, flow, code);
  });
}
