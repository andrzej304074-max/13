import { handle, readJson } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { getRanking, setRanking } from "@/lib/world";

export const dynamic = "force-dynamic";

/** Tygodniowy ranking XP – tylko osoby zapisane pod pseudonimem (bez e-maili). */
export async function GET(req: Request) {
  return handle(async () => getRanking(await viewedUserId(req, await requireUser())));
}

/** Zapis do rankingu ({ on: true, name }) albo wypisanie ({ on: false }). */
export async function PUT(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const b = await readJson(req);
    return setRanking(me.id, b.on, b.name);
  });
}
