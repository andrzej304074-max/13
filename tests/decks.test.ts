import { describe, expect, it } from "vitest";
import { cardsLabel, DeckError, deckName, moveItem, validOrder } from "@/lib/decks-core";

describe("talie – logika", () => {
  it("nazwa: przycięta, bez znaków sterujących", () => expect(deckName("  Etap \n okręgowy ")).toBe("Etap okręgowy"));
  it("pusta nazwa – błąd", () => expect(() => deckName("   ")).toThrow(DeckError));
  it("nazwa skracana do 60 znaków", () => expect(deckName("x".repeat(80))).toHaveLength(60));
  it("przeniesienie w dół", () => expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]));
  it("przeniesienie w górę", () => expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]));
  it("kolejność musi być permutacją", () => {
    expect(validOrder(["a", "b"], ["b", "a"])).toEqual(["b", "a"]);
    expect(() => validOrder(["a", "b"], ["a", "a"])).toThrow(DeckError);
    expect(() => validOrder(["a", "b"], ["a", "x"])).toThrow(DeckError);
    expect(() => validOrder(["a", "b"], ["a"])).toThrow(DeckError);
  });
  it("odmiana „karta”", () => {
    expect([1, 3, 5, 12, 22].map(cardsLabel)).toEqual(["1 karta", "3 karty", "5 kart", "12 kart", "22 karty"]);
  });
});
