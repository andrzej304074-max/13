import { NextResponse, type NextRequest } from "next/server";

/**
 * Bez ciasteczka sesji dostępne są tylko ekrany konta (/konto/*) i ich API (/api/konto/*).
 * Proxy sprawdza tylko obecność ciasteczka – ważność sesji, aktywację i rolę admina
 * sprawdzają strony (lib/auth.ts: requirePageUser) i trasy API (requireUser).
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/konto") || pathname.startsWith("/api/konto/")) return NextResponse.next();
  if (req.cookies.has("owe_session")) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Zaloguj się." }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/konto/logowanie";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // wszystko poza plikami statycznymi Next.js i ikoną
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
