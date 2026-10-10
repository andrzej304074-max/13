import { handle, readJson } from "@/lib/api";
import { changePassword, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser({ active: false });
    const { oldPassword, newPassword } = await readJson(req);
    await changePassword(me, oldPassword, newPassword);
    return { ok: true };
  });
}
