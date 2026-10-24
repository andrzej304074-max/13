import { NextResponse } from "next/server";
import { appUrl } from "@/lib/mail";
import { googleCallback } from "@/lib/google-login";
import { HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const to = await googleCallback(new URL(req.url).searchParams);
    return NextResponse.redirect(new URL(to, appUrl()), 302);
  } catch (e) {
    return NextResponse.json({ error: e instanceof HttpError ? e.message : "Błąd." }, { status: e instanceof HttpError ? e.status : 500 });
  }
}
