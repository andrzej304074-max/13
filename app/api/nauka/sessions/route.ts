import { handle, readJson } from "@/lib/api";
import { startSession } from "@/lib/nauka";
import { HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const { lesson, sub } = await readJson(req);
    if (typeof lesson !== "string") throw new HttpError(400, "Brak lekcji.");
    if (!Number.isInteger(sub)) throw new HttpError(400, "Nieprawidłowa pod-lekcja.");
    return startSession(lesson, sub as number);
  }, 201);
}
