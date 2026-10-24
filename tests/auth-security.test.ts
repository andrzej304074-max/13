import { describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import { base32Decode, base32Encode, hotp, newBackupCodes, normBackup, otpauthUrl, verifyTotp } from "@/lib/totp";
import { adminMfaRequired, ageOf, consentFrom } from "@/lib/auth-core";
import { authUrl, googleConfigured, newOAuthSecrets, verifyIdToken } from "@/lib/google";
import { csp } from "@/lib/security-core";

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": "1.2.3.4" }) }));

describe("TOTP (RFC 6238)", () => {
  const secret = base32Encode(Buffer.from("12345678901234567890"));
  it("base32 w obie strony", () => {
    expect(secret).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(base32Decode(secret).toString()).toBe("12345678901234567890");
    expect(() => base32Decode("1!")).toThrow();
  });
  it("wektory testowe RFC (6 cyfr)", () => {
    expect(hotp(secret, Math.floor(59 / 30))).toBe("287082");
    expect(hotp(secret, Math.floor(1111111109 / 30))).toBe("081804");
    expect(hotp(secret, Math.floor(2000000000 / 30))).toBe("279037");
  });
  it("okno ±30 s, odrzuca inne kody i formaty", () => {
    const now = 1111111109_000;
    const t = Math.floor(now / 30000);
    expect(verifyTotp(secret, "081804", now)).toBe(t);
    expect(verifyTotp(secret, hotp(secret, t - 1), now)).toBe(t - 1);
    expect(verifyTotp(secret, hotp(secret, t + 1), now)).toBe(t + 1);
    expect(verifyTotp(secret, hotp(secret, t + 2), now)).toBeNull();
    expect(verifyTotp(secret, "08180", now)).toBeNull();
    expect(verifyTotp(secret, 81804, now)).toBeNull();
    expect(verifyTotp(secret, "081 804", now)).toBe(t);
  });
  it("adres otpauth i kody zapasowe", () => {
    expect(otpauthUrl("ABC", "a@b.pl")).toMatch(/^otpauth:\/\/totp\/Testy%20OWE%3Aa%40b\.pl\?secret=ABC&issuer=Testy%20OWE/);
    const codes = newBackupCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const c of codes) expect(c).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(normBackup(" abcd efgh ")).toBe(normBackup("ABCD-EFGH"));
  });
});

describe("rejestracja: wiek i zgody", () => {
  const now = new Date("2026-10-24T12:00:00Z");
  const base = { email: "uczen@example.com", terms: true };
  it("rok urodzenia i regulamin wymagane", () => {
    expect(consentFrom({ ...base }, now)).toBe("Podaj rok urodzenia.");
    expect(consentFrom({ ...base, birthYear: 2020 }, now)).toBe("Podaj rok urodzenia.");
    expect(consentFrom({ ...base, birthYear: 1900 }, now)).toBe("Podaj rok urodzenia.");
    expect(consentFrom({ ...base, birthYear: 2000, terms: false }, now)).toMatch(/regulamin/);
  });
  it("16+ bez zgody rodzica; ostrożnie, gdy urodziny mogą być przed nami", () => {
    expect(ageOf(2010, now)).toBe(15);
    expect(consentFrom({ ...base, birthYear: 2009 }, now)).toMatchObject({ minor: false, parentEmail: null });
    expect(consentFrom({ ...base, birthYear: 2010 }, now)).toMatch(/zgoda rodzica/);
  });
  it("poniżej 16: zgoda i inny e-mail rodzica", () => {
    expect(consentFrom({ ...base, birthYear: 2012, parentConsent: true, parentEmail: "zly" }, now)).toMatch(/e-mail rodzica/);
    expect(consentFrom({ ...base, birthYear: 2012, parentConsent: true, parentEmail: "UCZEN@example.com" }, now)).toMatch(/inny/);
    expect(consentFrom({ ...base, birthYear: 2012, parentConsent: true, parentEmail: "Mama@Example.com" }, now))
      .toEqual({ birthYear: 2012, terms: true, parentConsent: true, parentEmail: "mama@example.com", minor: true });
  });
  it("MFA admina wymagane, chyba że ADMIN_MFA=optional", () => {
    expect(adminMfaRequired({})).toBe(true);
    expect(adminMfaRequired({ ADMIN_MFA: "tak" })).toBe(true);
    expect(adminMfaRequired({ ADMIN_MFA: "optional" })).toBe(false);
  });
});

describe("logowanie Google: id_token", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...(publicKey.export({ format: "jwk" }) as JsonWebKey), kid: "k1", alg: "RS256", use: "sig" };
  const jwks = { keys: [jwk] };
  const now = Date.UTC(2026, 9, 24);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const token = (claims: Record<string, unknown>, header: Record<string, unknown> = { alg: "RS256", kid: "k1" }, key = privateKey) => {
    const data = `${b64(header)}.${b64(claims)}`;
    return `${data}.${sign("RSA-SHA256", Buffer.from(data), key).toString("base64url")}`;
  };
  const good = { iss: "https://accounts.google.com", aud: "cid", sub: "123", email: "Ala@Gmail.com", email_verified: true, exp: now / 1000 + 600, nonce: "n1" };
  it("poprawny token → sub i e-mail małymi literami", () => {
    expect(verifyIdToken(token(good), jwks, "cid", "n1", now)).toEqual({ sub: "123", email: "ala@gmail.com" });
  });
  it("odrzuca: zły podpis, klucz, algorytm, wystawcę, odbiorcę, wygasły, nonce, niepotwierdzony e-mail", () => {
    const other = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    expect(() => verifyIdToken(token(good, undefined, other), jwks, "cid", "n1", now)).toThrow(/podpis/);
    expect(() => verifyIdToken(token(good, { alg: "RS256", kid: "x" }), jwks, "cid", "n1", now)).toThrow(/klucz/);
    expect(() => verifyIdToken(token(good, { alg: "none", kid: "k1" }), jwks, "cid", "n1", now)).toThrow(/algorytm/);
    expect(() => verifyIdToken(token({ ...good, iss: "evil" }), jwks, "cid", "n1", now)).toThrow(/wystawca/);
    expect(() => verifyIdToken(token({ ...good, aud: "inny" }), jwks, "cid", "n1", now)).toThrow(/odbiorca/);
    expect(() => verifyIdToken(token({ ...good, exp: now / 1000 - 3600 }), jwks, "cid", "n1", now)).toThrow(/wygasł/);
    expect(() => verifyIdToken(token(good), jwks, "cid", "n2", now)).toThrow(/nonce/);
    expect(() => verifyIdToken(token(good), jwks, "cid", "", now)).toThrow(/nonce/);
    expect(() => verifyIdToken(token({ ...good, email_verified: false }), jwks, "cid", "n1", now)).toThrow(/e-mail/);
    expect(() => verifyIdToken("a.b", jwks, "cid", "n1", now)).toThrow(/format/);
    // podmieniona treść przy zachowanym podpisie
    const [h, , s] = token(good).split(".");
    expect(() => verifyIdToken(`${h}.${b64({ ...good, sub: "666" })}.${s}`, jwks, "cid", "n1", now)).toThrow(/podpis/);
  });
  it("adres logowania z PKCE S256, state i nonce; włączenie tylko z obiema zmiennymi", () => {
    const s = newOAuthSecrets();
    const u = new URL(authUrl("cid", "https://app/cb", s));
    expect(u.searchParams.get("code_challenge_method")).toBe("S256");
    expect(u.searchParams.get("code_challenge")).toBe(s.challenge);
    expect(u.searchParams.get("state")).toBe(s.state);
    expect(u.searchParams.get("nonce")).toBe(s.nonce);
    expect(s.challenge).not.toBe(s.verifier);
    expect(googleConfigured({ GOOGLE_CLIENT_ID: "a" })).toBe(false);
    expect(googleConfigured({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: "b" })).toBe(true);
  });
});

describe("Cloudflare Turnstile", () => {
  it("bez kluczy nic nie sprawdza; z kluczami – token wymagany i weryfikowany", async () => {
    const { verifyTurnstile, turnstileSiteKey } = await import("@/lib/turnstile");
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ success: true })));
    delete process.env.TURNSTILE_SITE_KEY; delete process.env.TURNSTILE_SECRET;
    expect(turnstileSiteKey()).toBeNull();
    await expect(verifyTurnstile(undefined, fetcher as never)).resolves.toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
    process.env.TURNSTILE_SITE_KEY = "site"; process.env.TURNSTILE_SECRET = "sec";
    try {
      expect(turnstileSiteKey()).toBe("site");
      await expect(verifyTurnstile("", fetcher as never)).rejects.toThrow(/robotem/);
      await expect(verifyTurnstile("tok", fetcher as never)).resolves.toBeUndefined();
      const body = (fetcher.mock.calls[0] as unknown as [string, { body: URLSearchParams }])[1].body;
      expect(body.get("secret")).toBe("sec");
      expect(body.get("response")).toBe("tok");
      expect(body.get("remoteip")).toBe("1.2.3.4");
      const bad = vi.fn(async () => new Response(JSON.stringify({ success: false })));
      await expect(verifyTurnstile("tok", bad as never)).rejects.toThrow(/nie powiodła/);
      const down = vi.fn(async () => { throw new Error("sieć"); });
      await expect(verifyTurnstile("tok", down as never)).rejects.toThrow(/spróbuj ponownie/);
    } finally {
      delete process.env.TURNSTILE_SITE_KEY; delete process.env.TURNSTILE_SECRET;
    }
  });
  it("CSP: ramka Turnstile tylko gdy włączony", () => {
    expect(csp("n")).not.toContain("challenges.cloudflare.com");
    expect(csp("n", false, true)).toContain("frame-src https://challenges.cloudflare.com");
  });
});
