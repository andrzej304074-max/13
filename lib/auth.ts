import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
} from "./auth-core";

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
}

const toUser = (r: UserRow): User => ({
  id: r.id, email: r.email, isAdmin: r.is_admin, isOwner: r.is_owner, active: r.activated_at !== null,
  pending: r.activated_at ? null : r.code_ok_at ? "approval" : "code",
  adminPending: !r.is_admin && r.admin_requested_at !== null,
});

const UUID = /^[0-9a-f-]{36}$/i;

/* ---------- sesja ---------- */

async function startSession(userId: string) {
  const token = newToken();
  await query("INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))",
    [hashToken(token), userId, SESSION_DAYS]);
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

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { rows } = await query<UserRow>(
    `SELECT u.* FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] ? toUser(rows[0]) : null;
}

/** Do tras API: 401 bez logowania, 403 bez aktywacji lub roli admina. */
export async function requireUser(opts: { admin?: boolean; active?: boolean } = {}): Promise<User> {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "Zaloguj się.");
  if (opts.active !== false && !u.active) throw new HttpError(403, "Konto nie jest aktywne – wpisz kod aktywacji.");
  if (opts.admin && !u.isAdmin) throw new HttpError(403, "Brak uprawnień administratora.");
  return u;
}

/** Do stron (server components): przekierowania zamiast błędów. */
export async function requirePageUser(opts: { admin?: boolean } = {}): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/konto/logowanie");
  if (!u.active) redirect("/konto/aktywacja");
  if (opts.admin && !u.isAdmin) redirect("/");
  return u;
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

export async function register(rawEmail: unknown, pass: unknown, code: unknown): Promise<User> {
  const email = normEmail(rawEmail);
  const err = emailError(email) ?? passwordError(pass);
  if (err) throw new HttpError(400, err);
  const hash = await hashPassword(pass as string);
  const row = await withTx(async (q) => {
    // blokada tabeli: dwie rejestracje naraz nie mogą obie zostać „pierwszym kontem”
    await q("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
    if ((await q("SELECT 1 FROM users WHERE email = $1", [email])).rowCount) {
      throw new HttpError(409, "Konto z tym adresem e-mail już istnieje.");
    }
    const first = (await q("SELECT 1 FROM users LIMIT 1")).rowCount === 0;
    const { rows } = await q<UserRow>(
      `INSERT INTO users (email, pass_hash, is_admin, is_owner, activated_at)
       VALUES ($1, $2, $3, $3, CASE WHEN $3 THEN now() END) RETURNING *`,
      [email, hash, first],
    );
    if (first) {
      // pierwsze konto przejmuje wyniki testów i postęp nauki sprzed wprowadzenia kont
      await q("UPDATE tests SET user_id = $1 WHERE user_id IS NULL", [rows[0].id]);
      await q("UPDATE learn_sessions SET user_id = $1 WHERE user_id IS NULL", [rows[0].id]);
    }
    return rows[0];
  });
  await startSession(row.id);
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

export async function login(rawEmail: unknown, pass: unknown): Promise<User> {
  const row = await loadRow("email = $1", normEmail(rawEmail));
  // ten sam komunikat dla nieznanego e-maila i złego hasła
  if (!row || typeof pass !== "string" || !(await verifyPassword(pass, row.pass_hash))) {
    throw new HttpError(401, "Nieprawidłowy e-mail lub hasło.");
  }
  await startSession(row.id);
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

export async function requestReset(rawEmail: unknown) {
  const email = normEmail(rawEmail);
  const err = emailError(email);
  if (err) throw new HttpError(400, err);
  if (!mailConfigured()) throw new HttpError(503, "Wysyłka maili nie jest skonfigurowana – poproś administratora o pomoc.");
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

export async function confirmReset(token: unknown, newPass: unknown) {
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
  await startSession(userId);
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
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const { rows } = await query<{
    id: string; email: string; is_admin: boolean; is_owner: boolean; activated_at: Date | null; created_at: Date;
    code_ok_at: Date | null; admin_requested_at: Date | null;
    last_login_at: Date | null; tests: string; score: number | null; max_score: number | null; ls: string; xp: string | null;
    last_t: Date | null; last_l: Date | null;
  }>(
    `SELECT u.id, u.email, u.is_admin, u.is_owner, u.activated_at, u.code_ok_at, u.admin_requested_at, u.created_at, u.last_login_at,
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
}

export async function newActivationCode(): Promise<string> {
  const code = genActivationCode();
  await query(
    `INSERT INTO settings (key, value) VALUES ('activation_code', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [code]);
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
  return code;
}

export async function listAdminCodes() {
  const { rows } = await query<{ code: string; created_at: Date; expires_at: Date; email: string | null }>(
    `SELECT c.code, c.created_at, c.expires_at, u.email FROM admin_codes c LEFT JOIN users u ON u.id = c.created_by
     WHERE c.used_at IS NULL AND c.expires_at > now() ORDER BY c.created_at DESC`,
  );
  return rows.map((r) => ({ code: r.code, createdAt: r.created_at.toISOString(), expiresAt: r.expires_at.toISOString(), createdBy: r.email }));
}

export async function revokeAdminCode(code: unknown) {
  await query("DELETE FROM admin_codes WHERE code = $1 AND used_at IS NULL", [normCode(code)]);
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
