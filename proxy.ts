import { NextResponse, type NextRequest } from "next/server";
import { csp, crossSite } from "./lib/security-core";

/**
 * Bez ciasteczka sesji dostępne są tylko ekrany konta (/konto/*), ich API (/api/konto/*) i zadania cykliczne (/api/cron/*).
 * Proxy sprawdza tylko obecność ciasteczka – ważność sesji, aktywację, rolę admina i blokady sekcji
 * sprawdzają strony (lib/auth.ts: requirePageUser) i trasy API (requireUser); proxy przekazuje im ścieżkę (x-path).
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/cron/") && crossSite(req.method, (n) => req.headers.get(n), req.nextUrl.host)) {
    return NextResponse.json({ error: "Zapytanie z obcej strony zostało odrzucone." }, { status: 403 });
  }
  if (pathname.startsWith("/konto") || pathname.startsWith("/api/konto/") || req.cookies.has("owe_session")) {
    // ścieżka żądania dla sprawdzania blokad sekcji (lib/auth.ts: requireUser / requirePageUser);
    // zawsze nadpisywana, żeby klient nie mógł podać własnej
    const h = new Headers(req.headers);
    h.set("x-path", pathname);
    h.set("x-search", search);
    if (pathname.startsWith("/api/")) return NextResponse.next({ request: { headers: h } });
    // strony: nonce w nagłówku żądania – Next.js dopisuje go do swoich skryptów
    const nonce = btoa(crypto.randomUUID());
    const policy = csp(nonce, process.env.NODE_ENV !== "production");
    h.set("x-nonce", nonce);
    h.set("content-security-policy", policy);
    const res = NextResponse.next({ request: { headers: h } });
    res.headers.set("Content-Security-Policy", policy);
    return res;
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
  // wszystko poza plikami statycznymi Next.js, czcionkami, ikoną i robots.txt
  matcher: ["/((?!_next/static|_next/image|fonts/|icon.svg|favicon.ico|robots.txt).*)"],
};
