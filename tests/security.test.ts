import { describe, expect, it } from "vitest";
import { csp, crossSite } from "@/lib/security-core";

const hdr = (h: Record<string, string>) => (n: string) => h[n] ?? null;

describe("CSRF – zapytania z obcej strony", () => {
  it("GET i HEAD zawsze przepuszczane", () => {
    expect(crossSite("GET", hdr({ origin: "https://zla.example" }), "owe.app")).toBe(false);
    expect(crossSite("HEAD", hdr({ "sec-fetch-site": "cross-site" }), "owe.app")).toBe(false);
  });
  it("POST z własnej domeny przechodzi, z obcej – nie", () => {
    expect(crossSite("POST", hdr({ origin: "https://owe.app", host: "owe.app" }), "owe.app")).toBe(false);
    expect(crossSite("POST", hdr({ origin: "https://zla.example", host: "owe.app" }), "owe.app")).toBe(true);
    expect(crossSite("DELETE", hdr({ origin: "http://owe.app:8080", host: "owe.app" }), "owe.app")).toBe(true);
    expect(crossSite("PATCH", hdr({ origin: "null", host: "owe.app" }), "owe.app")).toBe(true);
  });
  it("za pośrednikiem liczy się X-Forwarded-Host", () => {
    expect(crossSite("POST", hdr({ origin: "https://owe.app", host: "wew:3000", "x-forwarded-host": "owe.app" }), "wew:3000")).toBe(false);
  });
  it("bez Origin decyduje Sec-Fetch-Site", () => {
    expect(crossSite("POST", hdr({ "sec-fetch-site": "cross-site" }), "owe.app")).toBe(true);
    expect(crossSite("POST", hdr({ "sec-fetch-site": "same-origin" }), "owe.app")).toBe(false);
    expect(crossSite("POST", hdr({}), "owe.app")).toBe(false);
  });
});

describe("CSP", () => {
  it("nonce, bez ramek i wtyczek, eval tylko w trybie deweloperskim", () => {
    const p = csp("abc");
    expect(p).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(p).toContain("frame-ancestors 'none'");
    expect(p).toContain("object-src 'none'");
    expect(p).not.toContain("unsafe-eval");
    expect(csp("abc", true)).toContain("'unsafe-eval'");
  });
});
