import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { mfaNewBackup } from "@/lib/account";

export const dynamic = "force-dynamic";

/** Nowe kody zapasowe (stare przestają działać) – po podaniu bieżącego kodu. */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser({ active: false });
    return mfaNewBackup(me, (await readJson(req)).code);
  });
}
