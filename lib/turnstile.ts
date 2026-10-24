import { headers } from "next/headers";
import { HttpError } from "./tests";

/**
 * Cloudflare Turnstile (ochrona przed botami) przy rejestracji i resecie hasła. Włącza się po ustawieniu TURNSTILE_SITE_KEY
 * i TURNSTILE_SECRET (Vercel → Settings → Environment Variables); bez nich nic nie sprawdza.
 */
export const turnstileSiteKey = () => (process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET ? process.env.TURNSTILE_SITE_KEY : null);

const VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Sprawdzenie tokenu z widżetu; `fetcher` – do testów. */
export async function verifyTurnstile(token: unknown, fetcher: typeof fetch = fetch): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret || !process.env.TURNSTILE_SITE_KEY) return;
  if (typeof token !== "string" || !token || token.length > 2048) throw new HttpError(400, "Potwierdź, że nie jesteś robotem.");
  let ip = "";
  try {
    const h = await headers();
    ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "";
  } catch {}
  let ok = false;
  try {
    const r = await fetcher(VERIFY, { method: "POST", body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }) });
    ok = r.ok && ((await r.json()) as { success?: boolean }).success === true;
  } catch {
    throw new HttpError(503, "Nie udało się sprawdzić zabezpieczenia przed botami – spróbuj ponownie.");
  }
  if (!ok) throw new HttpError(400, "Weryfikacja „nie jestem robotem” nie powiodła się – spróbuj ponownie.");
}
