import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Szyfrowanie sekretów w bazie (np. sekret TOTP) kluczem z AUTH_SECRET (AES-256-GCM). Bez AUTH_SECRET sekret jest zapisywany
 * jawnie z prefiksem `p:` – działa, ale README zaleca ustawienie zmiennej w Vercel. Po ustawieniu klucza stare wpisy `p:`
 * nadal się odczytują.
 */
const key = () => (process.env.AUTH_SECRET ? createHash("sha256").update(process.env.AUTH_SECRET).digest() : null);

export function seal(plain: string): string {
  const k = key();
  if (!k) return `p:${plain}`;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `g:${Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64url")}`;
}

export function open(sealed: string): string {
  if (sealed.startsWith("p:")) return sealed.slice(2);
  if (!sealed.startsWith("g:")) throw new Error("Nieznany format sekretu.");
  const k = key();
  if (!k) throw new Error("Brak AUTH_SECRET – nie można odczytać zaszyfrowanego sekretu.");
  const b = Buffer.from(sealed.slice(2), "base64url");
  const d = createDecipheriv("aes-256-gcm", k, b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
}
