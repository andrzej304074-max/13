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

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    throw new HttpError(400, "Nieprawidłowy JSON.");
  }
}
