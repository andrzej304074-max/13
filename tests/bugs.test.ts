import { describe, expect, it } from "vitest";
import { BugError, bugInput, bugUpdate } from "@/lib/bugs-core";

describe("zgłoszenia błędów – walidacja", () => {
  it("wymaga opisu i przycina pola", () => {
    expect(() => bugInput({ text: "  " })).toThrow(BugError);
    expect(() => bugInput({ text: "x".repeat(4001) })).toThrow(BugError);
    const v = bugInput({ text: "  Pusty ekran po Sprawdź  ", page: "/test/abc", device: "iOS · Safari" });
    expect(v).toEqual({ text: "Pusty ekran po Sprawdź", page: "/test/abc", device: "iOS · Safari", kind: "techniczny", section: null });
  });
  it("rodzaj (merytoryczny/techniczny) i sekcja strony", () => {
    const v = bugInput({ text: "zła definicja PKB", kind: "merytoryczny", section: "  Produkt krajowy brutto  " });
    expect(v).toMatchObject({ kind: "merytoryczny", section: "Produkt krajowy brutto" });
    expect(() => bugInput({ text: "coś nie działa", kind: "inny" })).toThrow(BugError);
    expect(bugInput({ text: "coś nie działa", section: "x".repeat(500) }).section).toHaveLength(200);
  });
  it("strona tylko jako ścieżka aplikacji", () => {
    expect(bugInput({ text: "coś nie działa", page: "https://evil.example" }).page).toBeNull();
    expect(bugInput({ text: "coś nie działa", page: 5 }).page).toBeNull();
  });
  it("aktualizacja: znany status, notatka, brak zmian = błąd", () => {
    expect(bugUpdate({ status: "w_toku" })).toEqual({ status: "w_toku" });
    expect(bugUpdate({ note: "  naprawione w wersji 2 " })).toEqual({ note: "naprawione w wersji 2" });
    expect(bugUpdate({ note: "" })).toEqual({ note: null });
    expect(() => bugUpdate({ status: "zle" })).toThrow(BugError);
    expect(() => bugUpdate({})).toThrow(BugError);
  });
});
