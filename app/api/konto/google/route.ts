import { NextResponse } from "next/server";
import { googleStart } from "@/lib/google-login";
import { HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

/** Start logowania Google – przekierowanie do Google (404, gdy nie skonfigurowano kluczy). */
export async function GET() {
  try {
    return NextResponse.redirect(await googleStart(), 302);
  } catch (e) {
    return NextResponse.json({ error: e instanceof HttpError ? e.message : "Błąd." }, { status: e instanceof HttpError ? e.status : 500 });
  }
}
