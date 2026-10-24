import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";

/** Czyste funkcje kont (bez bazy i ciasteczek) – testowane w tests/auth.test.ts. */

export const ACTIVATION_CODE_LEN = 5;
export const ADMIN_CODE_LEN = 8;
/** Po tylu błędnych kodach z rzędu konto jest blokowane na LOCK_MINUTES. */
export const MAX_CODE_FAILS = 5;
export const LOCK_MINUTES = 15;
/** Ile błędnych kodów (wszystkie konta razem) w ciągu LOCK_MINUTES wstrzymuje sprawdzanie kodów. */
export const GLOBAL_CODE_FAILS = 50;
export const MIN_PASSWORD = 8;
export const SESSION_DAYS = 30;
export const RESET_MINUTES = 60;
export const ADMIN_CODE_HOURS = 24;

export function normEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function emailError(email: string): string | null {
  if (!email) return "Podaj adres e-mail.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Nieprawidłowy adres e-mail.";
  return null;
}

export function passwordError(pass: unknown): string | null {
  if (typeof pass !== "string" || pass.length < MIN_PASSWORD) return `Hasło musi mieć co najmniej ${MIN_PASSWORD} znaków.`;
  if (pass.length > 200) return "Hasło jest za długie.";
  return null;
}

/** Koszt scrypt: N = 2^16, r = 8 (64 MB, ~0,1–0,2 s) – wg zaleceń OWASP; stare hasze (N = 2^14) przechodzą na nowy przy logowaniu. */
export const SCRYPT_LOG_N = 16;
const scryptAsync = (pass: string, salt: Buffer, logN: number) =>
  new Promise<Buffer>((res, rej) =>
    scrypt(pass, salt, 64, { N: 2 ** logN, r: 8, p: 1, maxmem: 256 * 2 ** logN * 8 }, (err, key) => (err ? rej(err) : res(key))));

/** Hasło → „scrypt$<log2 N>$<sól hex>$<hash hex>” (starszy zapis „scrypt$<sól>$<hash>” = N 2^14). */
export async function hashPassword(pass: string): Promise<string> {
  const salt = randomBytes(16);
  return `scrypt$${SCRYPT_LOG_N}$${salt.toString("hex")}$${(await scryptAsync(pass, salt, SCRYPT_LOG_N)).toString("hex")}`;
}

function parseHash(stored: string): { logN: number; salt: string; hash: string } | null {
  const p = stored.split("$");
  if (p[0] !== "scrypt") return null;
  if (p.length === 3 && p[1] && p[2]) return { logN: 14, salt: p[1], hash: p[2] };
  const logN = Number(p[1]);
  if (p.length === 4 && Number.isInteger(logN) && logN >= 14 && logN <= 20 && p[2] && p[3]) return { logN, salt: p[2], hash: p[3] };
  return null;
}

export async function verifyPassword(pass: string, stored: string): Promise<boolean> {
  const h = parseHash(stored);
  if (!h) return false;
  const key = await scryptAsync(pass, Buffer.from(h.salt, "hex"), h.logN);
  const expected = Buffer.from(h.hash, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Hash ze starszym (słabszym) kosztem – do przeliczenia po udanym logowaniu. */
export function needsRehash(stored: string): boolean {
  return (parseHash(stored)?.logN ?? 0) < SCRYPT_LOG_N;
}

/** Hash „na pusto” dla nieznanego e-maila – logowanie trwa tyle samo, czy konto istnieje, czy nie. */
export const DUMMY_HASH = `scrypt$${SCRYPT_LOG_N}$${"0".repeat(32)}$${"0".repeat(128)}`;

/** Kod aktywacji: 5 cyfr (może zaczynać się od 0). */
export function genActivationCode(): string {
  return String(randomInt(0, 10 ** ACTIVATION_CODE_LEN)).padStart(ACTIVATION_CODE_LEN, "0");
}

/** Kod admina: 8 znaków bez łatwych do pomylenia (0/O, 1/I/L). */
export function genAdminCode(): string {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: ADMIN_CODE_LEN }, () => A[randomInt(A.length)]).join("");
}

export function normCode(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/[\s-]/g, "").toUpperCase() : "";
}

/** Porównanie w stałym czasie (nie zdradza, ile znaków się zgadza). */
export function codeMatches(given: string, expected: string | null | undefined): boolean {
  if (!expected || !given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Stan blokady po błędnym kodzie: licznik rośnie, przy MAX_CODE_FAILS – blokada i zerowanie licznika. */
export function afterCodeFailure(failed: number, now: Date): { failed: number; lockedUntil: Date | null } {
  const n = failed + 1;
  if (n >= MAX_CODE_FAILS) return { failed: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) };
  return { failed: n, lockedUntil: null };
}

export function lockMessage(lockedUntil: Date | null, now: Date): string | null {
  if (!lockedUntil || lockedUntil.getTime() <= now.getTime()) return null;
  const min = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60_000);
  return `Za dużo błędnych kodów. Spróbuj ponownie za ${min} min.`;
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* ---------- wiek, zgoda rodzica, regulamin (rejestracja) ---------- */

/** Poniżej tego wieku potrzebna zgoda rodzica / opiekuna (RODO art. 8 – w Polsce 16 lat). */
export const CONSENT_AGE = 16;
export const MIN_AGE = 10;

/** Wiek liczony konserwatywnie z samego roku urodzenia (w roku 16. urodzin – jeszcze „poniżej 16”, dopóki rok nie minie). */
export const ageOf = (birthYear: number, now: Date) => now.getFullYear() - birthYear - 1;

export interface Consent { birthYear: number; terms: boolean; parentConsent: boolean; parentEmail: string | null; minor: boolean }

/** Dane zgód z formularza rejestracji: rok urodzenia, regulamin, a poniżej 16 lat – zgoda i e-mail rodzica. */
export function consentFrom(body: Record<string, unknown>, now: Date): Consent | string {
  const y = Number(body.birthYear);
  const year = now.getFullYear();
  if (!Number.isInteger(y) || y < year - 100 || y > year - MIN_AGE) return "Podaj rok urodzenia.";
  if (body.terms !== true) return "Zaakceptuj regulamin i politykę prywatności.";
  const minor = ageOf(y, now) < CONSENT_AGE;
  if (!minor) return { birthYear: y, terms: true, parentConsent: false, parentEmail: null, minor };
  if (body.parentConsent !== true) return "Poniżej 16 lat potrzebna jest zgoda rodzica lub opiekuna.";
  const pe = normEmail(body.parentEmail);
  const err = emailError(pe);
  if (err) return "Podaj poprawny e-mail rodzica lub opiekuna.";
  if (pe === normEmail(body.email)) return "E-mail rodzica musi być inny niż e-mail konta.";
  return { birthYear: y, terms: true, parentConsent: true, parentEmail: pe, minor };
}

/** Panel admina wymaga weryfikacji dwuetapowej (TOTP), chyba że ADMIN_MFA=optional (np. lokalne testy). */
export const adminMfaRequired = (env: Record<string, string | undefined> = process.env) => env.ADMIN_MFA !== "optional";
