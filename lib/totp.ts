import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Weryfikacja dwuetapowa: kody TOTP (RFC 6238 – 6 cyfr, co 30 s, SHA-1, jak w Google Authenticator / Authy / 1Password)
 * i jednorazowe kody zapasowe. Bez bazy – testy: tests/totp.test.ts.
 */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Uint8Array): string {
  let bits = 0, value = 0, out = "";
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const c of clean) {
    const i = B32.indexOf(c);
    if (i < 0) throw new Error("Nieprawidłowy sekret.");
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

/** Nowy sekret (160 bitów) w base32. */
export const newTotpSecret = () => base32Encode(randomBytes(20));

export function hotp(secret: string, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", base32Decode(secret)).update(msg).digest();
  const off = h[h.length - 1] & 15;
  const code = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

export const TOTP_STEP = 30;

/** Kod z bieżącego okna albo sąsiedniego (±1 – różnica zegarów do 30 s). Zwraca numer okna albo null. */
export function verifyTotp(secret: string, raw: unknown, now = Date.now()): number | null {
  const code = typeof raw === "string" ? raw.replace(/\s/g, "") : "";
  if (!/^\d{6}$/.test(code)) return null;
  const t = Math.floor(now / 1000 / TOTP_STEP);
  for (const d of [0, -1, 1]) {
    const c = hotp(secret, t + d);
    if (timingSafeEqual(Buffer.from(c), Buffer.from(code))) return t + d;
  }
  return null;
}

/** Adres do aplikacji uwierzytelniającej (kod QR). */
export function otpauthUrl(secret: string, account: string, issuer = "Testy OWE"): string {
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${TOTP_STEP}`;
}

/** 8 jednorazowych kodów zapasowych w postaci XXXX-XXXX (bez liter mylących się z cyframi). */
const BACKUP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newBackupCodes(n = 8): string[] {
  return Array.from({ length: n }, () => {
    const b = randomBytes(8);
    const s = Array.from(b, (x) => BACKUP_ALPHABET[x % BACKUP_ALPHABET.length]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}
export const normBackup = (v: unknown) => (typeof v === "string" ? v.toUpperCase().replace(/[^A-Z0-9]/g, "") : "");
