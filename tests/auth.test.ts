import { describe, expect, it } from "vitest";
import {
  LOCK_MINUTES,
  MAX_CODE_FAILS,
  afterCodeFailure,
  codeMatches,
  emailError,
  genActivationCode,
  genAdminCode,
  hashPassword,
  hashToken,
  lockMessage,
  normCode,
  normEmail,
  passwordError,
  verifyPassword,
} from "../lib/auth-core";

describe("hasła", () => {
  it("hash i weryfikacja", async () => {
    const h = await hashPassword("tajne-haslo-1");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("tajne-haslo-1", h)).toBe(true);
    expect(await verifyPassword("tajne-haslo-2", h)).toBe(false);
    expect(await verifyPassword("x", "zly-format")).toBe(false);
  });
  it("ta sama fraza daje różne hashe (sól)", async () => {
    expect(await hashPassword("abcdefgh")).not.toBe(await hashPassword("abcdefgh"));
  });
  it("walidacja", () => {
    expect(passwordError("krótkie")).toMatch(/8 znaków/);
    expect(passwordError("wystarczająco")).toBeNull();
    expect(passwordError(undefined)).not.toBeNull();
  });
});

describe("e-mail", () => {
  it("normalizacja i walidacja", () => {
    expect(normEmail("  Jan.Kowalski@Example.PL ")).toBe("jan.kowalski@example.pl");
    expect(emailError("jan@example.pl")).toBeNull();
    expect(emailError("jan@example")).not.toBeNull();
    expect(emailError("")).not.toBeNull();
  });
});

describe("kody", () => {
  it("kod aktywacji ma 5 cyfr", () => {
    for (let i = 0; i < 200; i++) expect(genActivationCode()).toMatch(/^\d{5}$/);
  });
  it("kod admina ma 8 znaków bez mylących liter", () => {
    for (let i = 0; i < 200; i++) expect(genAdminCode()).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  });
  it("porównanie kodów", () => {
    expect(codeMatches("01234", "01234")).toBe(true);
    expect(codeMatches("01235", "01234")).toBe(false);
    expect(codeMatches("", "01234")).toBe(false);
    expect(codeMatches("01234", null)).toBe(false);
    expect(normCode(" ab-cd 12 ")).toBe("ABCD12");
  });
  it("blokada po serii błędnych kodów", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    let failed = 0;
    let locked: Date | null = null;
    for (let i = 0; i < MAX_CODE_FAILS; i++) ({ failed, lockedUntil: locked } = afterCodeFailure(failed, now));
    expect(locked?.getTime()).toBe(now.getTime() + LOCK_MINUTES * 60_000);
    expect(failed).toBe(0);
    expect(lockMessage(locked, now)).toMatch(/15 min/);
    expect(lockMessage(locked, new Date(now.getTime() + (LOCK_MINUTES + 1) * 60_000))).toBeNull();
    expect(afterCodeFailure(0, now).lockedUntil).toBeNull();
  });
  it("hash tokenu jest stały i nie zdradza tokenu", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toContain("abc");
  });
});
