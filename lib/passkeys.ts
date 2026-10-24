import {
  generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse,
  type AuthenticationResponseJSON, type AuthenticatorTransportFuture, type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { query } from "./db";
import { appUrl } from "./mail";
import { startSession, type User } from "./auth";
import { accountLimit } from "./security";
import { HttpError } from "./tests";

/**
 * Klucze dostępu (passkeys, WebAuthn): logowanie odciskiem palca, twarzą albo PIN-em urządzenia, bez hasła.
 * Wyzwania (challenge) w auth_flows, ważne 5 minut, jednorazowe. Domena (rpID) i źródło – z APP_URL.
 */

const rp = () => {
  const u = new URL(appUrl());
  return { rpID: u.hostname, origin: u.origin, rpName: "Testy OWE" };
};
const UUID = /^[0-9a-f-]{36}$/i;

async function flow(kind: string, userId: string | null, challenge: string) {
  const { rows } = await query<{ id: string }>(
    "INSERT INTO auth_flows (kind, user_id, data, expires_at) VALUES ($1, $2, $3, now() + interval '5 minutes') RETURNING id",
    [kind, userId, JSON.stringify({ challenge })]);
  return rows[0].id;
}
async function takeFlow(id: unknown, kind: string, userId: string | null): Promise<string> {
  if (typeof id !== "string" || !UUID.test(id)) throw new HttpError(400, "Spróbuj ponownie.");
  const { rows } = await query<{ data: { challenge: string } }>(
    `DELETE FROM auth_flows WHERE id = $1 AND kind = $2 AND expires_at > now() AND ($3::uuid IS NULL OR user_id = $3) RETURNING data`,
    [id, kind, userId]);
  if (!rows[0]) throw new HttpError(400, "Czas minął – spróbuj ponownie.");
  return rows[0].data.challenge;
}

export interface PasskeyInfo { id: string; name: string; createdAt: string; lastUsedAt: string | null }

export async function listPasskeys(me: User): Promise<PasskeyInfo[]> {
  const { rows } = await query<{ id: string; name: string; created_at: Date; last_used_at: Date | null }>(
    "SELECT id, name, created_at, last_used_at FROM passkeys WHERE user_id = $1 ORDER BY created_at", [me.id]);
  return rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at.toISOString(), lastUsedAt: r.last_used_at?.toISOString() ?? null }));
}

/** Dodanie klucza (zalogowany): opcje dla przeglądarki. */
export async function passkeyRegisterOptions(me: User) {
  const { rpID, rpName } = rp();
  const existing = await query<{ id: string; transports: string[] }>("SELECT id, transports FROM passkeys WHERE user_id = $1", [me.id]);
  if (existing.rows.length >= 10) throw new HttpError(400, "Najwyżej 10 kluczy dostępu na konto.");
  const options = await generateRegistrationOptions({
    rpName, rpID, userName: me.email, userID: new TextEncoder().encode(me.id), attestationType: "none",
    excludeCredentials: existing.rows.map((r) => ({ id: r.id, transports: r.transports as AuthenticatorTransportFuture[] })),
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
  });
  return { flow: await flow("pk-reg", me.id, options.challenge), options };
}

export async function passkeyRegister(me: User, body: Record<string, unknown>) {
  const expectedChallenge = await takeFlow(body.flow, "pk-reg", me.id);
  const { rpID, origin } = rp();
  let v;
  try {
    v = await verifyRegistrationResponse({ response: body.response as RegistrationResponseJSON, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: false });
  } catch {
    throw new HttpError(400, "Nie udało się dodać klucza – spróbuj ponownie.");
  }
  if (!v.verified || !v.registrationInfo) throw new HttpError(400, "Nie udało się dodać klucza – spróbuj ponownie.");
  const c = v.registrationInfo.credential;
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 40) : "Klucz dostępu";
  await query("INSERT INTO passkeys (id, user_id, public_key, counter, transports, name) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING",
    [c.id, me.id, Buffer.from(c.publicKey), c.counter, c.transports ?? [], name]);
  return listPasskeys(me);
}

export async function passkeyDelete(me: User, id: unknown) {
  if (typeof id !== "string" || !id) throw new HttpError(404, "Nie ma takiego klucza.");
  await query("DELETE FROM passkeys WHERE id = $1 AND user_id = $2", [id, me.id]);
  return listPasskeys(me);
}

/** Logowanie kluczem (bez e-maila – klucz wskazuje konto). */
export async function passkeyLoginOptions() {
  await accountLimit("klucz");
  const options = await generateAuthenticationOptions({ rpID: rp().rpID, userVerification: "preferred" });
  return { flow: await flow("pk-login", null, options.challenge), options };
}

export async function passkeyLogin(body: Record<string, unknown>) {
  await accountLimit("klucz");
  const expectedChallenge = await takeFlow(body.flow, "pk-login", null);
  const response = body.response as AuthenticationResponseJSON | undefined;
  if (!response || typeof response.id !== "string") throw new HttpError(400, "Nie udało się zalogować kluczem.");
  const { rows } = await query<{ id: string; user_id: string; public_key: Buffer; counter: string; transports: string[] }>(
    "SELECT id, user_id, public_key, counter, transports FROM passkeys WHERE id = $1", [response.id]);
  const k = rows[0];
  if (!k) throw new HttpError(400, "Ten klucz nie jest przypisany do żadnego konta.");
  const { rpID, origin } = rp();
  let v;
  try {
    v = await verifyAuthenticationResponse({
      response, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: false,
      credential: { id: k.id, publicKey: new Uint8Array(k.public_key), counter: Number(k.counter), transports: k.transports as AuthenticatorTransportFuture[] },
    });
  } catch {
    throw new HttpError(400, "Nie udało się zalogować kluczem.");
  }
  if (!v.verified) throw new HttpError(400, "Nie udało się zalogować kluczem.");
  await query("UPDATE passkeys SET counter = $2, last_used_at = now() WHERE id = $1", [k.id, v.authenticationInfo.newCounter]);
  // klucz dostępu to dwa składniki naraz (urządzenie + odcisk / PIN) – bez osobnego kodu TOTP
  await startSession(k.user_id, "klucz");
  return { ok: true };
}
