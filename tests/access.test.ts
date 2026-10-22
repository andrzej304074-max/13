import { describe, expect, it } from "vitest";
import { effectiveBlocks, firstAllowed, isBlocked, navView, pathKey, sanitizeKeys, sanitizeSettings } from "@/lib/access-core";

describe("blokady sekcji – mapowanie ścieżek", () => {
  it("strony", () => {
    expect(pathKey("/")).toBe("/");
    expect(pathKey("/nauka/podrecznik/makro-pkb/makro-pkb-1")).toBe("/nauka/podrecznik");
    expect(pathKey("/nauka/lekcja/mikro-rynek-1")).toBe("/nauka");
    expect(pathKey("/fiszki/talie/abc")).toBe("/fiszki/talie");
    expect(pathKey("/test/123")).toBe("testy");
    expect(pathKey("/notatki/brudnopisy")).toBe("/notatki/brudnopisy");
    expect(pathKey("/pojecia/mapa")).toBe("/pojecia/mapa");
  });
  it("niezablokowalne", () => {
    for (const p of ["/admin", "/konto/ustawienia", "/api/admin/dostep", "/api/konto/ja", "/api/dane/hasla", "/zablokowane"]) expect(pathKey(p)).toBeNull();
  });
  it("API", () => {
    expect(pathKey("/api/notatki", "?rodzaj=scratch")).toBe("/notatki/brudnopisy");
    expect(pathKey("/api/notatki", "?rodzaj=note")).toBe("/notatki");
    expect(pathKey("/api/notatki/brudnopis")).toBe("/notatki/brudnopisy");
    expect(pathKey("/api/podkreslenia")).toBe("/nauka/podrecznik");
    expect(pathKey("/api/talie/x/karty")).toBe("/fiszki/talie");
    expect(pathKey("/api/nauka/stats")).toBe("/nauka/statystyki");
    expect(pathKey("/api/tests/abc/answer")).toBe("testy");
  });
});

describe("blokady sekcji – łączenie i menu", () => {
  const s = sanitizeSettings({ all: ["/pojecia/mapa"], nonAdmins: ["notatki", "zle"], mode: "lock" });
  it("sanityzacja", () => {
    expect(s.nonAdmins).toEqual(["notatki"]);
    expect(sanitizeKeys(["/fiszki", "/fiszki", "x"])).toEqual(["/fiszki"]);
  });
  it("admin a „oprócz adminów”", () => {
    expect(effectiveBlocks({ isAdmin: true, blocked: [] }, s)).toEqual(["/pojecia/mapa"]);
    expect(effectiveBlocks({ isAdmin: false, blocked: ["/fiszki"] }, s)).toEqual(expect.arrayContaining(["/pojecia/mapa", "notatki", "/fiszki"]));
  });
  it("dział blokuje podzakładki, wszystkie podzakładki blokują dział", () => {
    expect(isBlocked("/notatki/brudnopisy", ["notatki"])).toBe(true);
    expect(isBlocked("notatki", ["/notatki", "/notatki/brudnopisy"])).toBe(true);
    expect(isBlocked("notatki", ["/notatki"])).toBe(false);
    // wspólne zasoby: test blokują Olimpiada + Wszystkie pytania + Słownik (Zadania i Eseje go nie odblokowują)
    expect(isBlocked("testy", ["/", "/testy/wszystkie", "/slownik"])).toBe(true);
    expect(isBlocked("testy", ["/", "/slownik"])).toBe(false);
    expect(isBlocked("testy", ["/"])).toBe(false);
    expect(isBlocked("testy", ["/zadania", "/eseje"])).toBe(false);
    expect(isBlocked("nauka", ["/nauka", "/nauka/podrecznik", "/fiszki", "/fiszki/talie", "/nauka/powtorka"])).toBe(true);
    expect(isBlocked("nauka", ["/nauka/olimpiada", "/nauka/literatura"])).toBe(false);
  });
  it("menu: ukryj i kłódka", () => {
    const hide = navView(["/nauka/podrecznik", "notatki"], "hide");
    expect(hide.find((x) => x.id === "notatki")).toBeUndefined();
    expect(hide.find((x) => x.id === "nauka")!.tabs.map((t) => t.href)).not.toContain("/nauka/podrecznik");
    const lock = navView(["/nauka/podrecznik", "notatki"], "lock");
    expect(lock.find((x) => x.id === "notatki")!.state).toBe("lock");
    expect(lock.find((x) => x.id === "nauka")!.tabs.find((t) => t.href === "/nauka/podrecznik")!.state).toBe("lock");
  });
  it("link działu i strona startowa omijają zablokowane", () => {
    expect(navView(["/nauka"], "lock").find((x) => x.id === "nauka")!.href).toBe("/nauka/podrecznik");
    expect(firstAllowed(["testy"])).toBe("/nauka");
  });
});
