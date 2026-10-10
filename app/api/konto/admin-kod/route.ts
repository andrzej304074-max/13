import { handle, readJson } from "@/lib/api";
import { becomeAdmin, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const { code } = await readJson(req);
    return becomeAdmin(me, code);
  });
}
