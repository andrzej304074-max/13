import { describe, expect, it } from "vitest";
import { isOwnId, OwnCardError, ownCardInput, ownUuid } from "@/lib/own-cards-core";

const TOPICS = ["mikro", "makro"];
const KINDS = ["pojecie", "wzor"];

describe("własne fiszki – walidacja", () => {
  it("czyści pola i przyjmuje poprawną kartę", () => {
    expect(ownCardInput({ t: "  Koszt   utopiony ", d: "Koszt,\r\nktórego nie odzyskasz.", w: "", topic: "mikro", kind: "pojecie" }, TOPICS, KINDS))
      .toEqual({ t: "Koszt utopiony", d: "Koszt,\nktórego nie odzyskasz.", w: null, topic: "mikro", kind: "pojecie" });
  });
  it("wymaga hasła, definicji, działu i kategorii z list kursu", () => {
    const ok = { t: "A", d: "B", topic: "mikro", kind: "wzor" };
    expect(() => ownCardInput({ ...ok, t: " " }, TOPICS, KINDS)).toThrow(OwnCardError);
    expect(() => ownCardInput({ ...ok, d: "" }, TOPICS, KINDS)).toThrow(/definicję/);
    expect(() => ownCardInput({ ...ok, topic: "inne" }, TOPICS, KINDS)).toThrow(/dział/);
    expect(() => ownCardInput({ ...ok, kind: "zrozumienie" }, TOPICS, KINDS)).toThrow(/kategorię/);
    expect(() => ownCardInput({ ...ok, t: "x".repeat(121) }, TOPICS, KINDS)).toThrow(/120/);
  });
  it("id własnej karty", () => {
    const id = "u:123e4567-e89b-12d3-a456-426614174000";
    expect(isOwnId(id)).toBe(true);
    expect(isOwnId("i1234")).toBe(false);
    expect(isOwnId("u:'; DROP TABLE x")).toBe(false);
    expect(ownUuid(id)).toBe("123e4567-e89b-12d3-a456-426614174000");
  });
});
