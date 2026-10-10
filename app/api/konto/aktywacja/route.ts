import { handle, readJson } from "@/lib/api";
import { activate, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser({ active: false });
    const { code } = await readJson(req);
    return activate(me, code);
  });
}
