import { handle, readJson } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { listStars, setStar } from "@/lib/notes";

export const dynamic = "force-dynamic";

/** Gwiazdki użytkownika danego rodzaju (`rodzaj=fiszka|artykul`). */
export async function GET(req: Request) {
  return handle(async () => listStars(await viewedUserId(req, await requireUser()), new URL(req.url).searchParams.get("rodzaj")));
}

/** { kind, ref, on } – ustawia albo zdejmuje gwiazdkę. */
export async function POST(req: Request) {
  return handle(async () => {
    const { kind, ref, on } = await readJson(req);
    return setStar((await requireUser()).id, kind, ref, on);
  });
}
