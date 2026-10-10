import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { startSession } from "@/lib/nauka";
import { HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const { lesson, sub } = await readJson(req);
    if (typeof lesson !== "string") throw new HttpError(400, "Brak lekcji.");
    if (!Number.isInteger(sub)) throw new HttpError(400, "Nieprawidłowa pod-lekcja.");
    return startSession(me.id, lesson, sub as number);
  }, 201);
}
