import { cookies } from "next/headers";
import { query } from "./db";
import { appUrl } from "./mail";
import { mfaTicket, register, startSession } from "./auth";
import { authUrl, exchangeCode, googleConfigured, googleJwks, newOAuthSecrets, verifyIdToken } from "./google";
import { accountLimit } from "./security";
import { HttpError } from "./tests";

/** Logowanie Google – kroki z bazą (state/nonce/PKCE w auth_flows, przypięte ciasteczkiem do przeglądarki). */

const COOKIE = "owe_oauth";
const UUID = /^[0-9a-f-]{36}$/i;
const redirectUri = () => `${appUrl()}/api/konto/google/callback`;

/** Start: zapis sekretów i przekierowanie do Google. */
export async function googleStart(): Promise<string> {
  if (!googleConfigured()) throw new HttpError(404, "Logowanie Google nie jest włączone.");
  await accountLimit("google");
  const s = newOAuthSecrets();
  const { rows } = await query<{ id: string }>(
    "INSERT INTO auth_flows (kind, data, expires_at) VALUES ('google', $1, now() + interval '10 minutes') RETURNING id",
    [JSON.stringify({ state: s.state, nonce: s.nonce, verifier: s.verifier })]);
  (await cookies()).set(COOKIE, `${rows[0].id}.${s.state}`, {
    httpOnly: true, sameSite: "lax", path: "/api/konto/google", maxAge: 600,
    secure: process.env.NODE_ENV === "production" && !/^http:\/\/localhost/.test(appUrl()),
  });
  return authUrl(process.env.GOOGLE_CLIENT_ID!, redirectUri(), s);
}

/**
 * Powrót z Google: sprawdzenie state (z ciasteczka tej przeglądarki), wymiana kodu, weryfikacja tokenu. Istniejące konto
 * (po identyfikatorze Google albo potwierdzonym e-mailu) – logowanie (z drugim krokiem, gdy włączone MFA); nowe – formularz
 * rejestracji z rokiem urodzenia i zgodami. Zwraca adres, pod który przekierować.
 */
export async function googleCallback(params: URLSearchParams): Promise<string> {
  if (!googleConfigured()) throw new HttpError(404, "Logowanie Google nie jest włączone.");
  const jar = await cookies();
  const [flowId, state] = (jar.get(COOKIE)?.value ?? "").split(".");
  jar.delete({ name: COOKIE, path: "/api/konto/google" });
  if (params.get("error")) return "/konto/logowanie?blad=" + encodeURIComponent("Logowanie Google zostało przerwane.");
  if (!flowId || !UUID.test(flowId) || !state || params.get("state") !== state) return "/konto/logowanie?blad=" + encodeURIComponent("Logowanie Google wygasło – spróbuj ponownie.");
  const { rows } = await query<{ data: { state: string; nonce: string; verifier: string } }>(
    "DELETE FROM auth_flows WHERE id = $1 AND kind = 'google' AND expires_at > now() RETURNING data", [flowId]);
  const f = rows[0];
  if (!f || f.data.state !== state) return "/konto/logowanie?blad=" + encodeURIComponent("Logowanie Google wygasło – spróbuj ponownie.");
  let who: { sub: string; email: string };
  try {
    const idToken = await exchangeCode(params.get("code") ?? "", f.data.verifier, redirectUri());
    who = verifyIdToken(idToken, await googleJwks(), process.env.GOOGLE_CLIENT_ID!, f.data.nonce);
  } catch (e) {
    console.error("google", e);
    return "/konto/logowanie?blad=" + encodeURIComponent("Nie udało się potwierdzić konta Google.");
  }
  const { rows: users } = await query<{ id: string; google_sub: string | null; totp_enabled_at: Date | null }>(
    "SELECT id, google_sub, totp_enabled_at FROM users WHERE google_sub = $1 OR email = $2 ORDER BY (google_sub = $1) DESC NULLS LAST LIMIT 1", [who.sub, who.email]);
  const u = users[0];
  if (u) {
    if (u.google_sub && u.google_sub !== who.sub) return "/konto/logowanie?blad=" + encodeURIComponent("To konto jest połączone z innym kontem Google.");
    if (!u.google_sub) await query("UPDATE users SET google_sub = $2 WHERE id = $1", [u.id, who.sub]);
    if (u.totp_enabled_at) return `/konto/logowanie?mfa=${(await mfaTicket(u.id, "google")).ticket}`;
    await startSession(u.id, "google");
    return "/";
  }
  const { rows: nf } = await query<{ id: string }>(
    "INSERT INTO auth_flows (kind, data, expires_at) VALUES ('google-new', $1, now() + interval '15 minutes') RETURNING id", [JSON.stringify(who)]);
  return `/konto/rejestracja?google=${nf[0].id}`;
}

/** E-mail z rozpoczętej rejestracji przez Google (do pokazania w formularzu). */
export async function googlePending(id: string | null): Promise<string | null> {
  if (!id || !UUID.test(id)) return null;
  const { rows } = await query<{ data: { email: string } }>("SELECT data FROM auth_flows WHERE id = $1 AND kind = 'google-new' AND expires_at > now()", [id]);
  return rows[0]?.data.email ?? null;
}

/** Dokończenie rejestracji przez Google: rok urodzenia, zgody (i opcjonalnie kod aktywacji). */
export async function googleRegister(body: Record<string, unknown>) {
  if (typeof body.google !== "string" || !UUID.test(body.google)) throw new HttpError(400, "Rejestracja wygasła – zacznij od nowa.");
  const { rows } = await query<{ data: { sub: string; email: string } }>(
    "DELETE FROM auth_flows WHERE id = $1 AND kind = 'google-new' AND expires_at > now() RETURNING data", [body.google]);
  if (!rows[0]) throw new HttpError(400, "Rejestracja wygasła – zacznij od nowa.");
  return register(body, rows[0].data);
}
