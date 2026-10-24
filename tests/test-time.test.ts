import { describe, expect, it } from "vitest";
import { testMinutes } from "@/lib/tests";

describe("czas testu", () => {
  it("proporcjonalnie przy mniejszej liczbie wylosowanych pytań, co najmniej 5 min", () => {
    expect(testMinutes(30, 30)).toBe(40);
    expect(testMinutes(50, 50)).toBe(60);
    expect(testMinutes(30, 15)).toBe(20);
    expect(testMinutes(30, 1)).toBe(5);
  });
});
