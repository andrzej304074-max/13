import { NextResponse } from "next/server";
import { HttpError } from "./tests";

export async function handle<T>(fn: () => Promise<T>, status = 200) {
  try {
    return NextResponse.json(await fn(), { status });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}

/** Największe ciało zapytania (notatka z rysunkiem: do 80 tys. punktów ≈ 2–3 MB JSON). */
export const MAX_JSON_BYTES = 4 * 1024 * 1024;

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_JSON_BYTES) throw new HttpError(413, "Za duże dane.");
  let text: string;
  try {
    text = await req.text();
  } catch {
    throw new HttpError(400, "Nieprawidłowy JSON.");
  }
  // bez nagłówka Content-Length (przesyłanie porcjami) – sprawdzenie po odczytaniu
  if (text.length > MAX_JSON_BYTES) throw new HttpError(413, "Za duże dane.");
  try {
    const body = JSON.parse(text);
    return body && typeof body === "object" ? body : {};
  } catch {
    throw new HttpError(400, "Nieprawidłowy JSON.");
  }
}
