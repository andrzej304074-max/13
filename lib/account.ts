import { cookies } from "next/headers";
import QRCode from "qrcode";
import { query, withTx } from "./db";
import { hashToken, normEmail, verifyPassword } from "./auth-core";
import { SESSION_COOKIE, checkSecondFactor, logout, type User } from "./auth";
import { audit } from "./audit";
import { seal } from "./secret-box";
import { HttpError } from "./tests";
import { newBackupCodes, newTotpSecret, normBackup, otpauthUrl, verifyTotp } from "./totp";
import { MAX_DECKS, MAX_DECK_CARDS } from "./decks-core";
import { MAX_HIGHLIGHTS, MAX_NOTES, MAX_NOTES_BYTES } from "./notes-core";
import { MAX_OWN_CARDS } from "./own-cards-core";

/**
 * Konto użytkownika (Ustawienia): weryfikacja dwuetapowa (TOTP + kody zapasowe), aktywne sesje i „Wyloguj wszędzie”,
 * usunięcie konta, eksport danych (RODO) i zużycie limitów danych.
 */

const UUID = /^[0-9a-f-]{36}$/i;

async function row(id: string) {
  const { rows } = await query<{ id: string; email: string; pass_hash: string; is_admin: boolean; is_owner: boolean; totp_secret: string | null;
    totp_enabled_at: Date | null; totp_backup: string[]; google_sub: string | null; activated_at: Date | null; code_ok_at: Date | null;
    admin_requested_at: Date | null; failed_codes: number; locked_until: Date | null; blocked: string[] | null; block_mode: string | null }>(
    "SELECT * FROM users WHERE id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Nie ma takiego konta.");
  return rows[0];
}

/* ---------- weryfikacja dwuetapowa ---------- */

/** Początek włączania: nowy sekret (10 min na potwierdzenie kodem), adres i kod QR dla aplikacji uwierzytelniającej. */
export async function mfaStart(me: User) {
  if (me.mfa) throw new HttpError(400, "Weryfikacja dwuetapowa jest już włączona.");
  const secret = newTotpSecret();
  const { rows } = await query<{ id: string }>(
    "INSERT INTO auth_flows (kind, user_id, data, expires_at) VALUES ('mfa-setup', $1, $2, now() + interval '10 minutes') RETURNING id",
    [me.id, JSON.stringify({ secret: seal(secret) })]);
  const url = otpauthUrl(secret, me.email);
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return { flow: rows[0].id, secret, url, qr };
}

/** Potwierdzenie kodem z aplikacji – włącza weryfikację i zwraca (jedyny raz) 8 kodów zapasowych. */
export async function mfaEnable(me: User, flow: unknown, code: unknown) {
  if (typeof flow !== "string" || !UUID.test(flow)) throw new HttpError(400, "Zacznij włączanie od nowa.");
  const { rows } = await query<{ data: { secret: string } }>(
    "SELECT data FROM auth_flows WHERE id = $1 AND kind = 'mfa-setup' AND user_id = $2 AND expires_at > now()", [flow, me.id]);
  if (!rows[0]) throw new HttpError(400, "Czas na potwierdzenie minął – zacznij od nowa.");
  const { open } = await import("./secret-box");
  const secret = open(rows[0].data.secret);
  const w = verifyTotp(secret, code);
  if (w === null) throw new HttpError(400, "Nieprawidłowy kod – sprawdź czas w telefonie i spróbuj ponownie.");
  const backup = newBackupCodes();
  await query("UPDATE users SET totp_secret = $2, totp_enabled_at = now(), totp_backup = $3, totp_last = $4 WHERE id = $1",
    [me.id, seal(secret), backup.map((b) => hashToken(normBackup(b))), w]);
  await query("DELETE FROM auth_flows WHERE user_id = $1 AND kind = 'mfa-setup'", [me.id]);
  if (me.isAdmin) await audit(me.id, "mfa-wlaczone", me.email);
  return { backup };
}

/** Wyłączenie: hasło i kod (albo kod zapasowy). */
export async function mfaDisable(me: User, password: unknown, code: unknown) {
  const r = await row(me.id);
  if (!r.totp_enabled_at) return { ok: true };
  if (typeof password !== "string" || !(await verifyPassword(password, r.pass_hash))) throw new HttpError(400, "Nieprawidłowe hasło.");
  if (!(await checkSecondFactor(r as never, code))) throw new HttpError(400, "Nieprawidłowy kod.");
  await query("UPDATE users SET totp_secret = NULL, totp_enabled_at = NULL, totp_backup = '{}', totp_last = NULL WHERE id = $1", [me.id]);
  if (me.isAdmin) await audit(me.id, "mfa-wylaczone", me.email);
  return { ok: true };
}

/** Nowe kody zapasowe (stare przestają działać) – po podaniu kodu z aplikacji. */
export async function mfaNewBackup(me: User, code: unknown) {
  const r = await row(me.id);
  if (!r.totp_enabled_at || !(await checkSecondFactor(r as never, code))) throw new HttpError(400, "Nieprawidłowy kod.");
  const backup = newBackupCodes();
  await query("UPDATE users SET totp_backup = $2 WHERE id = $1", [me.id, backup.map((b) => hashToken(normBackup(b)))]);
  return { backup };
}

export async function mfaInfo(me: User) {
  const r = await row(me.id);
  return { enabled: r.totp_enabled_at !== null, since: r.totp_enabled_at?.toISOString() ?? null, backupLeft: r.totp_backup.length, google: r.google_sub !== null };
}

/* ---------- sesje ---------- */

const currentHash = async () => hashToken((await cookies()).get(SESSION_COOKIE)?.value ?? "");

export async function listSessions(me: User) {
  const cur = await currentHash();
  const { rows } = await query<{ id: string; created_at: Date; expires_at: Date; ua: string | null; via: string | null; token_hash: string }>(
    "SELECT id, created_at, expires_at, ua, via, token_hash FROM user_sessions WHERE user_id = $1 AND expires_at > now() ORDER BY created_at DESC",
    [me.id]);
  return rows.map((r) => ({ id: r.id, createdAt: r.created_at.toISOString(), expiresAt: r.expires_at.toISOString(), device: deviceOf(r.ua), via: r.via,
    current: r.token_hash === cur }));
}

/** Krótki opis urządzenia z nagłówka User-Agent (bez zapisywania pełnych odcisków). */
export function deviceOf(ua: string | null): string {
  if (!ua) return "nieznane urządzenie";
  const os = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "inne";
  const br = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "przeglądarka";
  return `${br} · ${os}`;
}

export async function endSession(me: User, id: unknown) {
  if (typeof id !== "string" || !UUID.test(id)) throw new HttpError(404, "Nie ma takiej sesji.");
  await query("DELETE FROM user_sessions WHERE id = $1 AND user_id = $2", [id, me.id]);
  return listSessions(me);
}

/** „Wyloguj wszędzie”: wszystkie sesje poza bieżącą. */
export async function endOtherSessions(me: User) {
  await query("DELETE FROM user_sessions WHERE user_id = $1 AND token_hash <> $2", [me.id, await currentHash()]);
  return listSessions(me);
}

/* ---------- usunięcie konta ---------- */

/**
 * Usunięcie własnego konta: hasło (konto z logowania Google – e-mail konta) i wpisanie „USUŃ”. Nie właściciel i nie ostatni
 * administrator. Wszystkie dane konta znikają (klucze obce z ON DELETE CASCADE).
 */
export async function deleteOwnAccount(me: User, body: Record<string, unknown>) {
  if (body.confirm !== "USUŃ") throw new HttpError(400, "Wpisz USUŃ, żeby potwierdzić.");
  const r = await row(me.id);
  if (r.is_owner) throw new HttpError(400, "Konta właściciela nie można usunąć – najpierw przekaż aplikację innej osobie.");
  const passOk = typeof body.password === "string" && (await verifyPassword(body.password, r.pass_hash));
  const googleOk = !!r.google_sub && normEmail(body.email) === r.email;
  if (!passOk && !googleOk) throw new HttpError(400, "Nieprawidłowe hasło.");
  if (r.totp_enabled_at && !(await checkSecondFactor(r as never, body.code))) throw new HttpError(400, "Podaj kod weryfikacji dwuetapowej.");
  await withTx(async (q) => {
    if (r.is_admin) {
      const { rows } = await q<{ n: string }>("SELECT COUNT(*) AS n FROM users WHERE is_admin AND id <> $1", [me.id]);
      if (Number(rows[0].n) === 0) throw new HttpError(400, "Jesteś jedynym administratorem – najpierw nadaj rolę komuś innemu.");
    }
    await q("DELETE FROM users WHERE id = $1 AND NOT is_owner", [me.id]);
  });
  if (r.is_admin) await audit(null, "admin-usunal-wlasne-konto", r.email);
  await logout();
  return { ok: true };
}

/* ---------- eksport danych ---------- */

/** Wszystkie dane konta w jednym pliku JSON (prawo dostępu i przenoszenia danych, RODO art. 15 i 20). */
export async function exportData(me: User) {
  const uid = [me.id];
  const one = async (sql: string) => (await query(sql, uid)).rows;
  const [user] = await one(`SELECT email, created_at, last_login_at, activated_at, birth_year, parent_email, parent_consent_at, terms_at,
    is_admin, daily_goal, rank_opt, rank_name, (totp_enabled_at IS NOT NULL) AS mfa, (google_sub IS NOT NULL) AS google FROM users WHERE id = $1`);
  const [tests, answers, sessions, learnAnswers, flash, notes, stars, highlights, reads, decks, deckCards, own, bugs, open, prefs, xp, votes, passkeys, devices] =
    await Promise.all([
      one("SELECT id, bank, type, mode, started_at, finished_at, score, max_score, question_ids FROM tests WHERE user_id = $1 ORDER BY started_at"),
      one("SELECT a.test_id, a.question_id, a.selected, a.points, a.skipped, a.answered_at FROM answers a JOIN tests t ON t.id = a.test_id WHERE t.user_id = $1 ORDER BY a.answered_at"),
      one("SELECT id, topic, unit, lesson, sub, kind, level, mode, started_at, finished_at, correct, total, xp FROM learn_sessions WHERE user_id = $1 ORDER BY started_at"),
      one("SELECT la.session_id, la.seq, la.item_id, la.exercise, la.correct, la.ms FROM learn_answers la JOIN learn_sessions s ON s.id = la.session_id WHERE s.user_id = $1"),
      one("SELECT item_id, known, at FROM flash_ratings WHERE user_id = $1 ORDER BY at"),
      one("SELECT id, kind, title, body, ref, starred, created_at, updated_at, ink, cards FROM notes WHERE user_id = $1 ORDER BY created_at"),
      one("SELECT kind, ref, at FROM stars WHERE user_id = $1"),
      one("SELECT article, block, start_at, end_at, color, created_at FROM highlights WHERE user_id = $1"),
      one("SELECT ref, at FROM article_reads WHERE user_id = $1"),
      one("SELECT id, name, created_at FROM decks WHERE user_id = $1"),
      one("SELECT c.deck_id, c.item_id, c.pos FROM deck_cards c JOIN decks d ON d.id = c.deck_id WHERE d.user_id = $1"),
      one("SELECT id, t, d, w, topic, kind, created_at FROM own_cards WHERE user_id = $1"),
      one("SELECT id, text, page, status, admin_note, created_at FROM bug_reports WHERE user_id = $1"),
      one("SELECT item_id, kind, score, max, answers, created_at FROM open_attempts WHERE user_id = $1"),
      one("SELECT key, value, updated_at FROM user_prefs WHERE user_id = $1"),
      one("SELECT day, xp, by, goal FROM xp_days WHERE user_id = $1 ORDER BY day"),
      one("SELECT poll_id, choices, created_at FROM poll_votes WHERE user_id = $1"),
      one("SELECT name, created_at, last_used_at FROM passkeys WHERE user_id = $1"),
      one("SELECT created_at, via, ua FROM user_sessions WHERE user_id = $1"),
    ]);
  return {
    exportedAt: new Date().toISOString(), app: "Testy OWE", user,
    tests, answers, learnSessions: sessions, learnAnswers, flashRatings: flash, notes, stars, highlights, articleReads: reads,
    decks, deckCards, ownCards: own, bugReports: bugs, openAttempts: open, prefs, xpDays: xp, pollVotes: votes, passkeys, sessions: devices,
  };
}

/* ---------- limity danych ---------- */

/** Limity danych konta – jedno miejsce (wartości z modułów, które ich pilnują). */
export const LIMITS = {
  notes: { max: MAX_NOTES, label: "Notatki i brudnopisy" },
  notesBytes: { max: MAX_NOTES_BYTES, label: "Rozmiar notatek i brudnopisów" },
  highlights: { max: MAX_HIGHLIGHTS, label: "Podkreślenia w Podręczniku" },
  decks: { max: MAX_DECKS, label: "Własne talie" },
  deckCards: { max: MAX_DECK_CARDS, label: "Największa talia (karty)" },
  ownCards: { max: MAX_OWN_CARDS, label: "Własne fiszki" },
} as const;

export async function usage(me: User) {
  const { rows } = await query<{ notes: string; bytes: string; hl: string; decks: string; big: string | null; own: string }>(
    `SELECT (SELECT COUNT(*) FROM notes WHERE user_id = $1) AS notes,
       (SELECT COALESCE(SUM(octet_length(body) + octet_length(ink::text)), 0) FROM notes WHERE user_id = $1) AS bytes,
       (SELECT COUNT(*) FROM highlights WHERE user_id = $1) AS hl,
       (SELECT COUNT(*) FROM decks WHERE user_id = $1) AS decks,
       (SELECT MAX(n) FROM (SELECT COUNT(*) AS n FROM deck_cards c JOIN decks d ON d.id = c.deck_id WHERE d.user_id = $1 GROUP BY c.deck_id) x) AS big,
       (SELECT COUNT(*) FROM own_cards WHERE user_id = $1) AS own`, [me.id]);
  const r = rows[0];
  const used = { notes: Number(r.notes), notesBytes: Number(r.bytes), highlights: Number(r.hl), decks: Number(r.decks), deckCards: Number(r.big ?? 0), ownCards: Number(r.own) };
  return (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).map((k) => ({ key: k, label: LIMITS[k].label, used: used[k], max: LIMITS[k].max }));
}
