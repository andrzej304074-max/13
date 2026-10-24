import { createHash, createPublicKey, randomBytes, verify as verifySig } from "node:crypto";

/**
 * Logowanie Google (OpenID Connect, przepływ „authorization code” z PKCE). Włącza się po ustawieniu GOOGLE_CLIENT_ID
 * i GOOGLE_CLIENT_SECRET (Google Cloud Console → Credentials → OAuth client ID, typ „Web application”, adres przekierowania
 * `<APP_URL>/api/konto/google/callback`). Bez nich przycisk jest ukryty, a trasy zwracają 404.
 * Ta część bez bazy i bez sieci (poza `fetchJson`) – testy: tests/google.test.ts.
 */

export const googleConfigured = (env: Record<string, string | undefined> = process.env) => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
export const GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

const b64url = (b: Buffer) => b.toString("base64url");

/** Losowe state, nonce i weryfikator PKCE (z wyzwaniem S256). */
export function newOAuthSecrets() {
  const verifier = b64url(randomBytes(32));
  return { state: b64url(randomBytes(24)), nonce: b64url(randomBytes(24)), verifier, challenge: b64url(createHash("sha256").update(verifier).digest()) };
}

export function authUrl(clientId: string, redirectUri: string, s: { state: string; nonce: string; challenge: string }): string {
  const q = new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: "openid email", state: s.state, nonce: s.nonce,
    code_challenge: s.challenge, code_challenge_method: "S256", prompt: "select_account",
  });
  return `${GOOGLE_AUTH}?${q}`;
}

export interface IdClaims { sub: string; email: string; email_verified: boolean; aud: string; iss: string; exp: number; nonce?: string }

/**
 * Weryfikacja id_token (JWT RS256): podpis kluczem z JWKS Google, wystawca, odbiorca (nasz client_id), ważność, nonce
 * z naszego żądania i potwierdzony e-mail. Zwraca sub i e-mail albo rzuca błąd z opisem.
 */
export function verifyIdToken(token: string, jwks: { keys: (JsonWebKey & { kid?: string })[] }, clientId: string, nonce: string, now = Date.now()): { sub: string; email: string } {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("zły format tokenu");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString()) as { alg?: string; kid?: string };
  if (header.alg !== "RS256") throw new Error("nieobsługiwany algorytm");
  const jwk = jwks.keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("nieznany klucz");
  const key = createPublicKey({ key: jwk, format: "jwk" });
  const ok = verifySig("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), key, Buffer.from(parts[2], "base64url"));
  if (!ok) throw new Error("zły podpis");
  const c = JSON.parse(Buffer.from(parts[1], "base64url").toString()) as IdClaims;
  if (!ISSUERS.includes(c.iss)) throw new Error("zły wystawca");
  if (c.aud !== clientId) throw new Error("zły odbiorca");
  if (!(c.exp * 1000 > now - 60_000)) throw new Error("token wygasł");
  if (!nonce || c.nonce !== nonce) throw new Error("zły nonce");
  if (c.email_verified !== true || typeof c.email !== "string") throw new Error("e-mail niepotwierdzony");
  if (typeof c.sub !== "string" || !c.sub) throw new Error("brak identyfikatora");
  return { sub: c.sub, email: c.email.toLowerCase() };
}

let jwksCache: { at: number; v: { keys: JsonWebKey[] } } | null = null;
export async function googleJwks(fetcher: typeof fetch = fetch) {
  if (jwksCache && Date.now() - jwksCache.at < 3600_000) return jwksCache.v;
  const r = await fetcher(GOOGLE_JWKS);
  if (!r.ok) throw new Error("JWKS niedostępne");
  jwksCache = { at: Date.now(), v: (await r.json()) as { keys: JsonWebKey[] } };
  return jwksCache.v;
}

/** Wymiana kodu na tokeny (z weryfikatorem PKCE). */
export async function exchangeCode(code: string, verifier: string, redirectUri: string, fetcher: typeof fetch = fetch): Promise<string> {
  const r = await fetcher(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, code_verifier: verifier, redirect_uri: redirectUri, grant_type: "authorization_code",
      client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  });
  const j = (await r.json().catch(() => ({}))) as { id_token?: string };
  if (!r.ok || !j.id_token) throw new Error("wymiana kodu nieudana");
  return j.id_token;
}
