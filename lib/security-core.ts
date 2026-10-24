/** Nagłówki bezpieczeństwa liczone w proxy.ts (bez zależności od Next.js – testowane w tests/security.test.ts). */

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF: zapytanie zmieniające dane z obcej strony – inny `Origin` niż host aplikacji albo `Sec-Fetch-Site: cross-site`.
 * Uzupełnia `SameSite=Lax` ciasteczka sesji. Bez `Origin` i `Sec-Fetch-Site` (curl, serwer–serwer) – przepuszczane;
 * takie żądanie i tak nie ma ciasteczka sesji przeglądarki ofiary.
 */
export function crossSite(method: string, header: (name: string) => string | null, host: string): boolean {
  if (SAFE.has(method)) return false;
  const origin = header("origin");
  if (origin) {
    try {
      return new URL(origin).host !== (header("x-forwarded-host") ?? header("host") ?? host);
    } catch {
      return true;
    }
  }
  return header("sec-fetch-site") === "cross-site";
}

/**
 * CSP z jednorazowym nonce: skrypty tylko z tej aplikacji (Next.js dopisuje nonce do swoich znaczników),
 * bez osadzania w ramkach, bez wtyczek; dźwięk także z magazynu nagrań (https). Skrypt Turnstile ładuje się przez
 * 'strict-dynamic' (wstawia go skrypt z nonce), jego ramka – przez frame-src.
 */
export function csp(nonce: string, dev = false, turnstile = false): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' data: blob: https:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Cloudflare Turnstile (rejestracja, reset hasła) – ramka widżetu, tylko gdy klucze są ustawione
    ...(turnstile ? ["frame-src https://challenges.cloudflare.com"] : []),
  ].join("; ");
}
