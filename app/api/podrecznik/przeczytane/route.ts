import { handle, readJson } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { markRead, readArticles } from "@/lib/nauka";

export const dynamic = "force-dynamic";

/** Przeczytane artykuły Podręcznika: { ref: data }. */
export async function GET(req: Request) {
  return handle(async () => readArticles(await viewedUserId(req, await requireUser())));
}

/** { ref, ms } – rozdział lekcji przeczytany do końca (zalicza „Poznaj”) albo przegląd działu. */
export async function POST(req: Request) {
  return handle(async () => {
    const { ref, ms } = await readJson(req);
    return markRead((await requireUser()).id, ref, ms);
  });
}
