import { describe, expect, it } from "vitest";
import { AnnError, annInput, pollClosed, pollInput, resultsVisible, tally, voteInput } from "@/lib/announce-core";

describe("ogłoszenie – walidacja", () => {
  it("poprawne dane", () => {
    const v = annInput({ title: "  Nowa funkcja ", body: "Treść\n\nDrugi akapit", pinned: true, published: true, expires_at: "2030-01-01T10:00" });
    expect(v.title).toBe("Nowa funkcja");
    expect(v.pinned).toBe(true);
    expect(v.expires_at).toMatch(/^2030-01-01T/);
  });
  it("puste i za długie pola, zła data", () => {
    expect(() => annInput({ title: "", body: "x" })).toThrow(AnnError);
    expect(() => annInput({ title: "x", body: "" })).toThrow(AnnError);
    expect(() => annInput({ title: "x".repeat(201), body: "y" })).toThrow(/200/);
    expect(() => annInput({ title: "x", body: "y", expires_at: "jutro" })).toThrow(/data/);
    expect(annInput({ title: "x", body: "y", pinned: "true" }).pinned).toBe(false);
  });
});

describe("ankieta – walidacja", () => {
  it("odpowiedzi z linii, bez pustych", () => {
    const v = pollInput({ question: "Co dalej?", options: "A\n\n B \nC", multi: true });
    expect(v.options).toEqual(["A", "B", "C"]);
    expect(v.results_after).toBe("vote");
    expect(v.anonymous).toBe(false);
  });
  it("za mało, za dużo i powtórzone odpowiedzi", () => {
    expect(() => pollInput({ question: "Q", options: ["A"] })).toThrow(/co najmniej 2/);
    expect(() => pollInput({ question: "Q", options: Array.from({ length: 11 }, (_, i) => `o${i}`) })).toThrow(/najwyżej 10/);
    expect(() => pollInput({ question: "Q", options: ["Tak", "tak"] })).toThrow(/powtarzać/);
    expect(() => pollInput({ question: "", options: ["A", "B"] })).toThrow(AnnError);
  });
});

describe("głos", () => {
  it("jednokrotny i wielokrotny wybór", () => {
    expect(voteInput({ choices: [1] }, 3, false)).toEqual([1]);
    expect(() => voteInput({ choices: [0, 1] }, 3, false)).toThrow(/jedną/);
    expect(voteInput({ choices: [2, 0, 2] }, 3, true)).toEqual([0, 2]);
    expect(() => voteInput({ choices: [3] }, 3, true)).toThrow(AnnError);
    expect(() => voteInput({ choices: [] }, 3, true)).toThrow(AnnError);
    expect(() => voteInput({ choices: ["1"] }, 3, false)).toThrow(AnnError);
  });
});

describe("wyniki", () => {
  const now = Date.parse("2026-10-19T12:00:00Z");
  it("widoczność po głosie albo po zamknięciu", () => {
    expect(resultsVisible({ results_after: "vote", closes_at: null }, true, now)).toBe(true);
    expect(resultsVisible({ results_after: "vote", closes_at: null }, false, now)).toBe(false);
    expect(resultsVisible({ results_after: "close", closes_at: null }, true, now)).toBe(false);
    expect(resultsVisible({ results_after: "close", closes_at: "2026-10-19T11:00:00Z" }, false, now)).toBe(true);
    expect(pollClosed("2026-10-19T13:00:00Z", now)).toBe(false);
  });
  it("liczenie głosów i procentów głosujących", () => {
    const t = tally(3, [[0], [0, 2], [1]]);
    expect(t.voters).toBe(3);
    expect(t.counts).toEqual([2, 1, 1]);
    expect(t.pct).toEqual([66.7, 33.3, 33.3]);
    expect(tally(2, []).pct).toEqual([0, 0]);
  });
});
