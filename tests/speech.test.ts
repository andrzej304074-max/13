import { describe, expect, it } from "vitest";
import { speechItem, splitChunks, toSpeech } from "@/lib/speech-text";

describe("czytanie na głos – tekst", () => {
  it("symbole i skróty na słowa", () => {
    expect(toSpeech("Elastyczność = %ΔQ / %ΔP")).toContain("delta");
    expect(toSpeech("wzrost o 5%")).toBe("wzrost o 5 procent");
    expect(toSpeech("ok. 30 mln zł, np. w 2004 r.")).toBe("około 30 milionów złotych, na przykład w 2004 roku");
    expect(toSpeech("„cytat”")).toBe("cytat");
  });
  it("podział na zdania ≤ max znaków", () => {
    const t = "Pierwsze zdanie. Drugie zdanie jest trochę dłuższe! " + "słowo ".repeat(80) + "koniec.";
    const c = splitChunks(t, 120);
    expect(c.every((x) => x.length <= 120)).toBe(true);
    expect(c.join(" ").replace(/\s+/g, " ")).toBe(t.replace(/\s+/g, " ").trim());
    expect(splitChunks("")).toEqual([]);
  });
  it("element: części z kropkami między nimi", () => {
    expect(speechItem("a", "T", "Hasło", "Definicja bez kropki", null).text).toBe("Hasło. Definicja bez kropki.");
  });
});
