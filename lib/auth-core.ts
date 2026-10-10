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

const scryptAsync = (pass: string, salt: Buffer) =>
  new Promise<Buffer>((res, rej) => scrypt(pass, salt, 64, (err, key) => (err ? rej(err) : res(key))));

/** Hasło → „scrypt$<sól hex>$<hash hex>”. */
export async function hashPassword(pass: string): Promise<string> {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${(await scryptAsync(pass, salt)).toString("hex")}`;
}

export async function verifyPassword(pass: string, stored: string): Promise<boolean> {
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const key = await scryptAsync(pass, Buffer.from(saltHex, "hex"));
  const expected = Buffer.from(hashHex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

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
