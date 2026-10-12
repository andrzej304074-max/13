import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { getScratch } from "@/lib/notes";

export const dynamic = "force-dynamic";

/** Brudnopis pytania lub lekcji (`ref=owe:<id>`, `lekcja:<id>:<sub>` …) albo null. Zapis: POST /api/notatki z kind=scratch. */
export async function GET(req: Request) {
  return handle(async () => ({ note: await getScratch(await viewedUserId(req, await requireUser()), new URL(req.url).searchParams.get("ref")) }));
}
