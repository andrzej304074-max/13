import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { listOpen } from "@/lib/otwarte";

export const dynamic = "force-dynamic";

/** Lista zadań (`?rodzaj=zadanie`) albo esejów (`?rodzaj=esej`) z najlepszym wynikiem konta. */
export async function GET(req: Request) {
  return handle(async () => {
    const kind = new URL(req.url).searchParams.get("rodzaj") === "esej" ? "esej" : "zadanie";
    return listOpen(await viewedUserId(req, await requireUser()), kind);
  });
}
