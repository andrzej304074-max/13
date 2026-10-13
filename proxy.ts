import { NextResponse, type NextRequest } from "next/server";

/**
 * Bez ciasteczka sesji dostępne są tylko ekrany konta (/konto/*), ich API (/api/konto/*) i zadania cykliczne (/api/cron/*).
 * Proxy sprawdza tylko obecność ciasteczka – ważność sesji, aktywację, rolę admina i blokady sekcji
 * sprawdzają strony (lib/auth.ts: requirePageUser) i trasy API (requireUser); proxy przekazuje im ścieżkę (x-path).
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/konto") || pathname.startsWith("/api/konto/") || req.cookies.has("owe_session")) {
    // ścieżka żądania dla sprawdzania blokad sekcji (lib/auth.ts: requireUser / requirePageUser);
    // zawsze nadpisywana, żeby klient nie mógł podać własnej
    const h = new Headers(req.headers);
    h.set("x-path", pathname);
    h.set("x-search", search);
    return NextResponse.next({ request: { headers: h } });
  }
  // zadania cykliczne (Vercel Cron, GitHub Actions) – bez sesji; trasa sama sprawdza CRON_SECRET
  if (pathname.startsWith("/api/cron/")) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Zaloguj się." }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/konto/logowanie";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // wszystko poza plikami statycznymi Next.js, czcionkami i ikoną
  matcher: ["/((?!_next/static|_next/image|fonts/|icon.svg|favicon.ico).*)"],
};
