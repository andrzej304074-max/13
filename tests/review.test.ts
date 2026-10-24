import { describe, expect, it } from "vitest";
import { reviewInput } from "@/lib/review-core";

describe("recenzja: walidacja oceny", () => {
  it("rodzaj, pozycja i status", () => {
    expect(reviewInput({ kind: "inne", ref: "x", status: "ok" })).toMatch(/rodzaj/);
    expect(reviewInput({ kind: "pytanie", ref: "", status: "ok" })).toMatch(/pozycji/);
    expect(reviewInput({ kind: "pytanie", ref: "x".repeat(121), status: "ok" })).toMatch(/pozycji/);
    expect(reviewInput({ kind: "pytanie", ref: "q1", status: "super" })).toMatch(/OK albo/);
  });
  it("OK bez komentarza, „do poprawy” z komentarzem, null usuwa ocenę", () => {
    expect(reviewInput({ kind: "prognoza", ref: "p1", status: "ok", comment: "  " })).toEqual({ kind: "prognoza", ref: "p1", status: "ok", comment: null });
    expect(reviewInput({ kind: "pytanie", ref: "q1", status: "poprawa", comment: "" })).toMatch(/opisz/);
    expect(reviewInput({ kind: "pytanie", ref: "q1", status: "poprawa", comment: " zły klucz \u0000" })).toEqual({ kind: "pytanie", ref: "q1", status: "poprawa", comment: "zły klucz" });
    expect(reviewInput({ kind: "zgloszenie", ref: "b", status: null })).toMatchObject({ status: null });
    const long = reviewInput({ kind: "pytanie", ref: "q", status: "ok", comment: "a".repeat(5000) });
    expect(typeof long !== "string" && long.comment?.length).toBe(2000);
  });
});
