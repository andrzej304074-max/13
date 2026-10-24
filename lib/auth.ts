import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { query, withTx } from "./db";
import { HttpError } from "./tests";
import { appUrl, mailConfigured, sendMail } from "./mail";
import {
  ADMIN_CODE_HOURS,
  GLOBAL_CODE_FAILS,
  LOCK_MINUTES,
  RESET_MINUTES,
  SESSION_DAYS,
  afterCodeFailure,
  codeMatches,
  emailError,
  genActivationCode,
  genAdminCode,
  hashPassword,
  hashToken,
  lockMessage,
  newToken,
  normCode,
  normEmail,
  passwordError,
  verifyPassword,
  needsRehash,
  DUMMY_HASH,
  adminMfaRequired,
  consentFrom,
} from "./auth-core";
import { audit } from "./audit";
import { open } from "./secret-box";
import { normBackup, verifyTotp } from "./totp";
import { verifyTurnstile } from "./turnstile";
import { cleanup } from "./db-usage";
import { accountLimit, loginAllowed, loginFailed, loginOk, loginUnlock } from "./security";
import { isBlocked, isBlockMode, keyLabel, pathKey, sanitizeKeys, type BlockMode } from "./access-core";
import { accessFor } from "./access";

export const SESSION_COOKIE = "owe_session";

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  isOwner: boolean;
  active: boolean;
  /** Nieaktywne konto: „code” – trzeba wpisać kod, „approval” – kod przyjęty, czeka na zatwierdzenie. */
  pending: "code" | "approval" | null;
  /** Prośba o rolę admina czeka na zatwierdzenie. */
  adminPending: boolean;
  /** Blokady sekcji ustawione dla konta (bez blokad globalnych) i wygląd menu (null – jak dla wszystkich). */
  blocked: string[];
  blockMode: BlockMode | null;
  /** Włączona weryfikacja dwuetapowa (TOTP). */
  mfa: boolean;
  /** Konto połączone z logowaniem Google. */
  google: boolean;
}

interface UserRow {
  id: string;
  email: string;
  pass_hash: string;
  is_admin: boolean;
  is_owner: boolean;
  activated_at: Date | null;
  code_ok_at: Date | null;
  admin_requested_at: Date | null;
  failed_codes: number;
  locked_until: Date | null;
  blocked: string[] | null;
  block_mode: string | null;
  totp_secret: string | null;
  totp_enabled_at: Date | null;
  totp_backup: string[];
  google_sub: string | null;
}

const toUser = (r: UserRow): User => ({
  id: r.id, email: r.email, isAdmin: r.is_admin, isOwner: r.is_owner, active: r.activated_at !== null,
  pending: r.activated_at ? null : r.code_ok_at ? "approval" : "code",
  adminPending: !r.is_admin && r.admin_requested_at !== null,
  blocked: r.blocked ?? [], blockMode: isBlockMode(r.block_mode) ? r.block_mode : null,
  mfa: r.totp_enabled_at !== null,
  google: r.google_sub !== null,
});

const UUID = /^[0-9a-f-]{36}$/i;

/* ---------- sesja ---------- */

/** Nowa sesja; `via` – sposób logowania (hasło, klucz dostępu, Google), zapisany z urządzeniem do listy sesji w Ustawieniach. */
export async function startSession(userId: string, via: "haslo" | "klucz" | "google" | "rejestracja" | "reset" = "haslo") {
  const token = newToken();
  let ua = "";
  try { ua = ((await headers()).get("user-agent") ?? "").slice(0, 300); } catch {}
  await query("INSERT INTO user_sessions (token_hash, user_id, expires_at, ua, via) VALUES ($1, $2, now() + make_interval(days => $3), $4, $5)",
    [hashToken(token), userId, SESSION_DAYS, ua, via]);
  await query("UPDATE users SET last_login_at = now() WHERE id = $1", [userId]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !/^http:\/\/localhost/.test(appUrl()),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

async function loadRow(where: string, param: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>(`SELECT * FROM users WHERE ${where}`, [param]);
  return rows[0] ?? null;
}

/** Zalogowane konto – raz na żądanie (React `cache`): layout i strona nie pytają bazy osobno. */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { rows } = await query<UserRow>(
    `SELECT u.* FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] ? toUser(rows[0]) : null;
});

/** Sekcja bieżącego żądania (nagłówki x-path / x-search ustawia proxy.ts) zablokowana dla konta? Zwraca klucz albo null. */
async function blockedKey(u: User): Promise<string | null> {
  let path = "", search = "";
  try {
    const h = await headers();
    path = h.get("x-path") ?? "";
    search = h.get("x-search") ?? "";
  } catch {
    return null;
  }
  const key = pathKey(path, search);
  if (!key) return null;
  const { blocks } = await accessFor(u);
  return isBlocked(key, blocks) ? key : null;
}

/** Do tras API: 401 bez logowania, 403 bez aktywacji, roli admina albo gdy sekcja jest zablokowana. */
export async function requireUser(opts: { admin?: boolean; active?: boolean } = {}): Promise<User> {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "Zaloguj się.");
  if (opts.active !== false && !u.active) throw new HttpError(403, "Konto nie jest aktywne – wpisz kod aktywacji.");
  if (opts.admin && !u.isAdmin) throw new HttpError(403, "Brak uprawnień administratora.");
  if (opts.admin && !u.mfa && adminMfaRequired()) {
    throw new HttpError(403, "Panel administratora wymaga weryfikacji dwuetapowej – włącz ją w Ustawieniach konta.");
  }
  const key = await blockedKey(u);
  if (key) throw new HttpError(403, `Sekcja „${keyLabel(key)}” jest wyłączona przez administratora.`);
  return u;
}

/** Sprawdzenie dostępu do konkretnej sekcji (np. test ze słownika w trasie wspólnej dla obu baz). */
export async function requireSection(u: User, key: string) {
  const { blocks } = await accessFor(u);
  if (isBlocked(key, blocks)) throw new HttpError(403, `Sekcja „${keyLabel(key)}” jest wyłączona przez administratora.`);
}

/** Do stron (server components): przekierowania zamiast błędów. */
export async function requirePageUser(opts: { admin?: boolean } = {}): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/konto/logowanie");
  if (!u.active) redirect("/konto/aktywacja");
  if (opts.admin && !u.isAdmin) redirect("/");
  if (opts.admin && !u.mfa && adminMfaRequired()) redirect("/konto/ustawienia?mfa=wymagane");
  const key = await blockedKey(u);
  if (key) redirect(`/zablokowane?sekcja=${encodeURIComponent(key)}`);
  return u;
}

/** Blokady sekcji konta ustawiane przez admina. */
export async function setUserAccess(me: User, id: string, body: Record<string, unknown>) {
  if (!UUID.test(id) || !(await loadRow("id = $1", id))) throw new HttpError(404, "Nie ma takiego użytkownika.");
  const blocked = sanitizeKeys(body.blocked);
  const mode = body.mode === null || body.mode === "" ? null : isBlockMode(body.mode) ? body.mode : undefined;
  if (mode === undefined) throw new HttpError(400, "Nieprawidłowy tryb blokady.");
  await query("UPDATE users SET blocked = $2, block_mode = $3 WHERE id = $1", [id, blocked, mode]);
  await audit(me.id, "blokady-konta", id, { blocked, mode });
  return { blocked, mode };
}

/** Czyje dane czytać: własne albo – tylko dla admina – użytkownika z parametru `user`. */
export async function viewedUserId(req: Request, me: User): Promise<string> {
  const other = new URL(req.url).searchParams.get("user");
  if (!other || other === me.id) return me.id;
  if (!me.isAdmin) throw new HttpError(403, "Brak uprawnień administratora.");
  if (!UUID.test(other) || !(await loadRow("id = $1", other))) throw new HttpError(404, "Nie ma takiego użytkownika.");
  return other;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query("DELETE FROM user_sessions WHERE token_hash = $1", [hashToken(token)]);
  jar.delete(SESSION_COOKIE);
}

/* ---------- kody ---------- */

export async function getActivationCode(): Promise<string | null> {
  const { rows } = await query<{ value: string }>("SELECT value FROM settings WHERE key = 'activation_code'");
  return rows[0]?.value ?? null;
}

/** Sprawdza blokady (konta i ogólną) przed porównaniem kodu; po błędzie zapisuje próbę. */
async function checkCode(row: UserRow, ok: (code: string) => Promise<boolean>, code: string) {
  await accountLimit("kod");
  const now = new Date();
  const locked = lockMessage(row.locked_until, now);
  if (locked) throw new HttpError(429, locked);
  const { rows } = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM code_failures WHERE at > now() - make_interval(mins => $1)`, [LOCK_MINUTES]);
  if (Number(rows[0].n) >= GLOBAL_CODE_FAILS) {
    throw new HttpError(429, `Za dużo błędnych kodów w ostatnim czasie. Spróbuj ponownie za ${LOCK_MINUTES} min.`);
  }
  if (await ok(code)) {
    await query("UPDATE users SET failed_codes = 0, locked_until = NULL WHERE id = $1", [row.id]);
    return;
  }
  const next = afterCodeFailure(row.failed_codes, now);
  await query("UPDATE users SET failed_codes = $2, locked_until = $3 WHERE id = $1", [row.id, next.failed, next.lockedUntil]);
  await query("INSERT INTO code_failures (user_id) VALUES ($1)", [row.id]);
  throw new HttpError(400, next.lockedUntil ? lockMessage(next.lockedUntil, now)! : "Nieprawidłowy kod.");
}

/** Poprawny kod nie wpuszcza od razu – konto czeka na zatwierdzenie przez admina. */
async function activateRow(row: UserRow, rawCode: unknown) {
  if (row.code_ok_at) return;
  const code = normCode(rawCode);
  const expected = await getActivationCode();
  if (!expected) throw new HttpError(400, "Kod aktywacji nie został jeszcze ustalony – poproś administratora.");
  await checkCode(row, async (c) => codeMatches(c, expected), code);
  await query("UPDATE users SET code_ok_at = now() WHERE id = $1 AND activated_at IS NULL", [row.id]);
}

/* ---------- rejestracja, logowanie, aktywacja ---------- */

/**
 * Rejestracja: e-mail, hasło, rok urodzenia i akceptacja regulaminu (poniżej 16 lat – zgoda i e-mail rodzica), opcjonalnie
 * kod aktywacji; Cloudflare Turnstile, gdy skonfigurowany. `google` – konto z logowania Google (bez hasła, e-mail potwierdzony).
 */
export async function register(body: Record<string, unknown>, google: { sub: string; email: string } | null = null): Promise<User> {
  const email = google ? google.email : normEmail(body.email);
  const pass = google ? newToken() : body.password;
  const err = emailError(email) ?? passwordError(pass);
  if (err) throw new HttpError(400, err);
  const consent = consentFrom({ ...body, email }, new Date());
  if (typeof consent === "string") throw new HttpError(400, consent);
  await accountLimit("rejestracja");
  if (!google) await verifyTurnstile(body.turnstile);
  const hash = await hashPassword(pass as string);
  const code = body.code;
  const row = await withTx(async (q) => {
    // blokada tabeli: dwie rejestracje naraz nie mogą obie zostać „pierwszym kontem”
    await q("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
    if ((await q("SELECT 1 FROM users WHERE email = $1", [email])).rowCount) {
      throw new HttpError(409, "Konto z tym adresem e-mail już istnieje.");
    }
    const first = (await q("SELECT 1 FROM users LIMIT 1")).rowCount === 0;
    const { rows } = await q<UserRow>(
      `INSERT INTO users (email, pass_hash, is_admin, is_owner, activated_at, birth_year, parent_email, parent_consent_at, terms_at, google_sub)
       VALUES ($1, $2, $3, $3, CASE WHEN $3 THEN now() END, $4, $5, CASE WHEN $6 THEN now() END, now(), $7) RETURNING *`,
      [email, hash, first, consent.birthYear, consent.parentEmail, consent.parentConsent, google?.sub ?? null],
    );
    if (first) {
      // pierwsze konto przejmuje wyniki testów i postęp nauki sprzed wprowadzenia kont
      await q("UPDATE tests SET user_id = $1 WHERE user_id IS NULL", [rows[0].id]);
      // identyfikator klienta służy tylko do ponowień zapisu – przy przejęciu czyszczony (sesje różnych kont mogły mieć ten sam)
      await q("UPDATE learn_sessions SET user_id = $1, client_id = NULL WHERE user_id IS NULL", [rows[0].id]);
    }
    return rows[0];
  });
  await startSession(row.id, google ? "google" : "rejestracja");
  if (consent.parentEmail && mailConfigured()) {
    // informacja dla rodzica – bez blokowania rejestracji, gdy wysyłka się nie uda
    await sendMail(consent.parentEmail, "Testy OWE – konto dziecka",
      `Ktoś (zapewne Twoje dziecko) założył konto w aplikacji Testy OWE na adres ${email}, wskazując Cię jako rodzica lub opiekuna i potwierdzając Twoją zgodę.\n\n` +
      `Aplikacja służy do nauki do Olimpiady Wiedzy Ekonomicznej. Zapisujemy wyniki testów i postęp nauki; nie wyświetlamy reklam i nie sprzedajemy danych. ` +
      `Szczegóły: ${appUrl()}/prywatnosc\n\nJeśli nie wyrażasz zgody albo konto nie powinno istnieć, odpisz na tę wiadomość – usuniemy je.`).catch((e) => console.error("mail rodzica", e));
  }
  if (!row.activated_at && normCode(code)) {
    // błędny kod nie cofa rejestracji – konto czeka na aktywację
    try {
      await activateRow(row, code);
    } catch (e) {
      if (e instanceof HttpError) throw new HttpError(e.status === 400 ? 422 : e.status, `Konto założone, ale: ${e.message}`);
      throw e;
    }
  }
  return toUser((await loadRow("id = $1", row.id))!);
}

/** Drugi krok logowania: konto z weryfikacją dwuetapową dostaje bilet (5 min, 5 prób) zamiast sesji. */
export interface MfaChallenge { mfa: true; ticket: string }
const MFA_TICKET_MIN = 5;
export async function mfaTicket(userId: string, via: "haslo" | "google"): Promise<MfaChallenge> {
  const { rows } = await query<{ id: string }>(
    "INSERT INTO auth_flows (kind, user_id, data, expires_at) VALUES ('mfa', $1, $2, now() + make_interval(mins => $3)) RETURNING id",
    [userId, JSON.stringify({ via }), MFA_TICKET_MIN]);
  return { mfa: true, ticket: rows[0].id };
}

/** Kod z aplikacji uwierzytelniającej albo jednorazowy kod zapasowy (zużywany). */
export async function checkSecondFactor(row: UserRow, code: unknown): Promise<boolean> {
  if (!row.totp_secret || !row.totp_enabled_at) return false;
  const w = verifyTotp(open(row.totp_secret), code);
  if (w !== null) {
    // ten sam kod (to samo okno 30 s albo wcześniejsze) nie przejdzie drugi raz – ochrona przed podejrzeniem i powtórzeniem
    const { rowCount } = await query("UPDATE users SET totp_last = $2 WHERE id = $1 AND (totp_last IS NULL OR totp_last < $2)", [row.id, w]);
    return rowCount === 1;
  }
  const b = normBackup(code);
  if (b.length !== 8) return false;
  const h = hashToken(b);
  const { rowCount } = await query("UPDATE users SET totp_backup = array_remove(totp_backup, $2) WHERE id = $1 AND $2 = ANY(totp_backup)", [row.id, h]);
  return rowCount === 1;
}

export async function completeMfaLogin(ticket: unknown, code: unknown): Promise<User> {
  if (typeof ticket !== "string" || !UUID.test(ticket)) throw new HttpError(400, "Logowanie wygasło – zaloguj się ponownie.");
  const { rows } = await query<{ user_id: string; attempts: number; data: { via?: "haslo" | "google" } }>(
    "UPDATE auth_flows SET attempts = attempts + 1 WHERE id = $1 AND kind = 'mfa' AND expires_at > now() RETURNING user_id, attempts, data", [ticket]);
  const f = rows[0];
  if (!f) throw new HttpError(400, "Logowanie wygasło – zaloguj się ponownie.");
  if (f.attempts > 5) {
    await query("DELETE FROM auth_flows WHERE id = $1", [ticket]);
    throw new HttpError(429, "Za dużo błędnych kodów – zaloguj się ponownie.");
  }
  const row = await loadRow("id = $1", f.user_id);
  if (!row || !(await checkSecondFactor(row, code))) throw new HttpError(400, "Nieprawidłowy kod.");
  await query("DELETE FROM auth_flows WHERE id = $1", [ticket]);
  await startSession(row.id, f.data.via === "google" ? "google" : "haslo");
  return toUser(row);
}

export async function login(rawEmail: unknown, pass: unknown): Promise<User | MfaChallenge> {
  const email = normEmail(rawEmail).slice(0, 320);
  // blokada po zbyt wielu nieudanych próbach (na konto i na IP) – sprawdzana przed hasłem
  await loginAllowed(email);
  const row = await loadRow("email = $1", email);
  // ten sam komunikat dla nieznanego e-maila i złego hasła
  const ok = typeof pass === "string" && (await verifyPassword(pass, row?.pass_hash ?? DUMMY_HASH));
  if (!row || !ok) {
    await loginFailed(email, row?.id ?? null);
    throw new HttpError(401, "Nieprawidłowy e-mail lub hasło.");
  }
  await loginOk(email);
  if (needsRehash(row.pass_hash)) await query("UPDATE users SET pass_hash = $2 WHERE id = $1", [row.id, await hashPassword(pass as string)]);
  if (row.totp_enabled_at) return mfaTicket(row.id, "haslo");
  await startSession(row.id);
  // sprzątanie bazy (wygasłe sesje itp.) najwyżej raz na dobę – nie opóźnia logowania przy błędzie
  await cleanup().catch(() => null);
  return toUser(row);
}

export async function activate(me: User, code: unknown): Promise<User> {
  if (me.active) return me;
  await activateRow((await loadRow("id = $1", me.id))!, code);
  return toUser((await loadRow("id = $1", me.id))!);
}

/** Kod admina: jednorazowy, ważny ADMIN_CODE_HOURS; po zatwierdzeniu w panelu nadaje rolę admina. */
export async function becomeAdmin(me: User, rawCode: unknown): Promise<User> {
  if (me.isAdmin || me.adminPending) return me;
  const code = normCode(rawCode);
  const row = (await loadRow("id = $1", me.id))!;
  await checkCode(row, async (c) => {
    const { rowCount } = await query(
      `UPDATE admin_codes SET used_by = $2, used_at = now()
       WHERE code = $1 AND used_at IS NULL AND expires_at > now()`, [c, me.id]);
    return rowCount === 1;
  }, code);
  await query("UPDATE users SET admin_requested_at = now() WHERE id = $1", [me.id]);
  return { ...me, adminPending: true };
}

/* ---------- hasła ---------- */

export async function changePassword(me: User, oldPass: unknown, newPass: unknown) {
  const err = passwordError(newPass);
  if (err) throw new HttpError(400, err);
  const row = (await loadRow("id = $1", me.id))!;
  if (typeof oldPass !== "string" || !(await verifyPassword(oldPass, row.pass_hash))) {
    throw new HttpError(400, "Obecne hasło jest nieprawidłowe.");
  }
  await query("UPDATE users SET pass_hash = $2 WHERE id = $1", [me.id, await hashPassword(newPass as string)]);
  // wyloguj inne urządzenia, zostaw bieżącą sesję
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  await query("DELETE FROM user_sessions WHERE user_id = $1 AND token_hash <> $2", [me.id, hashToken(token)]);
}

export async function requestReset(rawEmail: unknown, turnstile: unknown = null) {
  const email = normEmail(rawEmail);
  const err = emailError(email);
  if (err) throw new HttpError(400, err);
  if (!mailConfigured()) throw new HttpError(503, "Wysyłka maili nie jest skonfigurowana – poproś administratora o pomoc.");
  await accountLimit("reset");
  await verifyTurnstile(turnstile);
  const row = await loadRow("email = $1", email);
  if (!row) return; // ta sama odpowiedź dla nieznanego adresu
  const token = newToken();
  await query("DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL", [row.id]);
  await query("INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(mins => $3))",
    [hashToken(token), row.id, RESET_MINUTES]);
  const link = `${appUrl()}/konto/reset/${token}`;
  await sendMail(row.email, "Testy OWE – zmiana hasła",
    `Aby ustawić nowe hasło, otwórz link (ważny ${RESET_MINUTES} minut):\n\n${link}\n\nJeśli to nie Ty prosiłeś o zmianę hasła, zignoruj tę wiadomość.`);
}

export async function confirmReset(token: unknown, newPass: unknown): Promise<MfaChallenge | null> {
  const err = passwordError(newPass);
  if (err) throw new HttpError(400, err);
  if (typeof token !== "string" || !token) throw new HttpError(400, "Nieprawidłowy link.");
  const userId = await withTx(async (q) => {
    const { rows } = await q<{ user_id: string }>(
      `UPDATE password_resets SET used_at = now() WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING user_id`,
      [hashToken(token)]);
    if (!rows[0]) throw new HttpError(400, "Link wygasł albo został już użyty. Poproś o nowy.");
    await q("UPDATE users SET pass_hash = $2, failed_codes = 0, locked_until = NULL WHERE id = $1",
      [rows[0].user_id, await hashPassword(newPass as string)]);
    await q("DELETE FROM user_sessions WHERE user_id = $1", [rows[0].user_id]);
    return rows[0].user_id;
  });
  // nowe hasło zdejmuje blokadę logowania konta
  const row = await loadRow("id = $1", userId);
  if (row) await loginUnlock(row.email);
  // reset hasła nie omija weryfikacji dwuetapowej
  if (row?.totp_enabled_at) return mfaTicket(userId, "haslo");
  await startSession(userId, "reset");
  return null;
}

/* ---------- panel admina ---------- */

export interface AdminUserRow {
  id: string;
  email: string;
  isAdmin: boolean;
  isOwner: boolean;
  active: boolean;
  /** Wpisał poprawny kod aktywacji – czeka na zatwierdzenie. */
  codeOk: boolean;
  /** Prośba o rolę admina czeka na zatwierdzenie. */
  adminRequested: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  tests: number;
  testPercent: number | null;
  learnSessions: number;
  xp: number;
  lastActivity: string | null;
  blocked: string[];
  blockMode: BlockMode | null;
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const { rows } = await query<{
    id: string; email: string; is_admin: boolean; is_owner: boolean; activated_at: Date | null; created_at: Date;
    code_ok_at: Date | null; admin_requested_at: Date | null; blocked: string[] | null; block_mode: string | null;
    last_login_at: Date | null; tests: string; score: number | null; max_score: number | null; ls: string; xp: string | null;
    last_t: Date | null; last_l: Date | null;
  }>(
    `SELECT u.id, u.email, u.is_admin, u.is_owner, u.activated_at, u.code_ok_at, u.admin_requested_at, u.created_at, u.last_login_at,
       u.blocked, u.block_mode,
       t.tests, t.score, t.max_score, t.last_t, l.ls, l.xp, l.last_l
     FROM users u
     LEFT JOIN LATERAL (SELECT COUNT(*) AS tests, SUM(score) AS score, SUM(max_score) AS max_score, MAX(finished_at) AS last_t
                        FROM tests WHERE user_id = u.id AND finished_at IS NOT NULL) t ON true
     LEFT JOIN LATERAL (SELECT COUNT(*) AS ls, SUM(xp) AS xp, MAX(finished_at) AS last_l
                        FROM learn_sessions WHERE user_id = u.id AND finished_at IS NOT NULL) l ON true
     ORDER BY u.created_at`,
  );
  return rows.map((r) => {
    const last = [r.last_t, r.last_l].filter((d): d is Date => d !== null).sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      id: r.id, email: r.email, isAdmin: r.is_admin, isOwner: r.is_owner, active: r.activated_at !== null,
      codeOk: r.activated_at === null && r.code_ok_at !== null, adminRequested: !r.is_admin && r.admin_requested_at !== null,
      createdAt: r.created_at.toISOString(), lastLoginAt: r.last_login_at?.toISOString() ?? null,
      tests: Number(r.tests), testPercent: r.max_score ? Math.round((Number(r.score) / Number(r.max_score)) * 1000) / 10 : null,
      learnSessions: Number(r.ls), xp: Number(r.xp ?? 0), lastActivity: last?.toISOString() ?? null,
      blocked: r.blocked ?? [], blockMode: isBlockMode(r.block_mode) ? r.block_mode : null,
    };
  });
}

export async function userEmail(id: string): Promise<string | null> {
  if (!UUID.test(id)) return null;
  return (await loadRow("id = $1", id))?.email ?? null;
}

export async function deleteUser(me: User, id: string) {
  if (!UUID.test(id)) throw new HttpError(404, "Nie ma takiego użytkownika.");
  if (id === me.id) throw new HttpError(400, "Nie można usunąć własnego konta.");
  const row = await loadRow("id = $1", id);
  if (!row) throw new HttpError(404, "Nie ma takiego użytkownika.");
  if (row.is_owner) throw new HttpError(400, "Pierwszego konta (właściciela) nie można usunąć.");
  await query("DELETE FROM users WHERE id = $1 AND NOT is_owner", [id]);
  await audit(me.id, "usuniecie-konta", row.email);
}

export async function newActivationCode(me: User): Promise<string> {
  const code = genActivationCode();
  await query(
    `INSERT INTO settings (key, value) VALUES ('activation_code', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [code]);
  await audit(me.id, "nowy-kod-aktywacji");
  return code;
}

export async function activationCodeInfo(): Promise<{ code: string | null; updatedAt: string | null }> {
  const { rows } = await query<{ value: string; updated_at: Date }>("SELECT value, updated_at FROM settings WHERE key = 'activation_code'");
  return { code: rows[0]?.value ?? null, updatedAt: rows[0]?.updated_at.toISOString() ?? null };
}

export async function newAdminCode(me: User): Promise<string> {
  const code = genAdminCode();
  await query("INSERT INTO admin_codes (code, created_by, expires_at) VALUES ($1, $2, now() + make_interval(hours => $3))",
    [code, me.id, ADMIN_CODE_HOURS]);
  await audit(me.id, "nowy-kod-admina");
  return code;
}

export async function listAdminCodes() {
  const { rows } = await query<{ code: string; created_at: Date; expires_at: Date; email: string | null }>(
    `SELECT c.code, c.created_at, c.expires_at, u.email FROM admin_codes c LEFT JOIN users u ON u.id = c.created_by
     WHERE c.used_at IS NULL AND c.expires_at > now() ORDER BY c.created_at DESC`,
  );
  return rows.map((r) => ({ code: r.code, createdAt: r.created_at.toISOString(), expiresAt: r.expires_at.toISOString(), createdBy: r.email }));
}

export async function revokeAdminCode(me: User, code: unknown) {
  const { rowCount } = await query("DELETE FROM admin_codes WHERE code = $1 AND used_at IS NULL", [normCode(code)]);
  if (rowCount) await audit(me.id, "uniewaznienie-kodu-admina");
}

/* ---------- zatwierdzanie i role ---------- */

export type AdminAction = "zatwierdz" | "odrzuc" | "zatwierdz-admina" | "odrzuc-admina" | "odbierz-admina";
export const ADMIN_ACTIONS: AdminAction[] = ["zatwierdz", "odrzuc", "zatwierdz-admina", "odrzuc-admina", "odbierz-admina"];

/** Zmiany kont przez admina. Właściciela i własnego konta nie da się odrzucić ani odebrać im roli. */
export async function adminAction(me: User, id: string, action: AdminAction) {
  const row = UUID.test(id) ? await loadRow("id = $1", id) : null;
  if (!row) throw new HttpError(404, "Nie ma takiego użytkownika.");
  const guard = () => {
    if (row.is_owner) throw new HttpError(400, "Tej operacji nie można wykonać na koncie właściciela.");
    if (row.id === me.id) throw new HttpError(400, "Tej operacji nie można wykonać na własnym koncie.");
  };
  await audit(me.id, `konto-${action}`, row.email);
  switch (action) {
    case "zatwierdz":
      if (row.activated_at) return;
      if (!row.code_ok_at) throw new HttpError(400, "To konto nie wpisało jeszcze kodu aktywacji.");
      await query("UPDATE users SET activated_at = now() WHERE id = $1", [id]);
      return;
    case "odrzuc":
      guard();
      if (row.activated_at) throw new HttpError(400, "Konto jest już aktywne – użyj „Usuń”.");
      await query("DELETE FROM users WHERE id = $1 AND activated_at IS NULL AND NOT is_owner", [id]);
      return;
    case "zatwierdz-admina":
      if (!row.admin_requested_at || row.is_admin) throw new HttpError(400, "Brak prośby o rolę administratora.");
      if (!row.activated_at) throw new HttpError(400, "Najpierw zatwierdź konto użytkownika.");
      await query("UPDATE users SET is_admin = true, admin_requested_at = NULL WHERE id = $1", [id]);
      return;
    case "odrzuc-admina":
      await query("UPDATE users SET admin_requested_at = NULL WHERE id = $1 AND NOT is_admin", [id]);
      return;
    case "odbierz-admina":
      guard();
      await query("UPDATE users SET is_admin = false, admin_requested_at = NULL WHERE id = $1 AND NOT is_owner", [id]);
      return;
  }
}
