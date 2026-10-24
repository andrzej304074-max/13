import { describe, expect, it } from "vitest";
import { distribution, MIN_USERS, validRankName } from "@/lib/world-core";

describe("statystyki świata", () => {
  it("poniżej progu osób – bez rozkładu i porównania (k-anonimowość)", () => {
    const d = distribution("xp", [10, 20, 30, 40], 20);
    expect(d).toMatchObject({ n: 4, me: 20, better: null, dist: null });
    expect(MIN_USERS).toBe(5);
  });
  it("percentyl względem pozostałych osób, średnia, mediana, przedziały", () => {
    const d = distribution("xp", [0, 50, 100, 150, 200, 250], 150);
    expect(d.better).toBe(60); // 3 z 5 pozostałych ma mniej
    expect(d.dist!.mean).toBe(125);
    expect(d.dist!.median).toBe(125);
    expect(d.dist!.bins.reduce((s, b) => s + b.n, 0)).toBe(6);
    expect(d.dist!.bins.filter((b) => b.me)).toHaveLength(1);
    expect(distribution("xp", [1, 2, 3, 4, 5], 5).better).toBe(100);
    expect(distribution("xp", [1, 2, 3, 4, 5], 1).better).toBe(0);
  });
  it("skuteczność w przedziałach co 10 pp., 100% w ostatnim", () => {
    const d = distribution("skutecznosc", [0, 35, 50, 99, 100], 100);
    expect(d.dist!.bins).toHaveLength(10);
    expect(d.dist!.bins[9]).toMatchObject({ n: 2, me: true });
  });
  it("bez własnego wyniku – rozkład bez wyróżnienia", () => {
    const d = distribution("aktywnosc", [3, 4, 5, 6, 7], null);
    expect(d.better).toBeNull();
    expect(d.dist!.bins.some((b) => b.me)).toBe(false);
  });
  it("pseudonim w rankingu", () => {
    expect(validRankName("Ekonomistka_7")).toBeNull();
    expect(validRankName("Łódź 2027")).toBeNull();
    expect(validRankName("ab")).not.toBeNull();
    expect(validRankName("jan@kowalski.pl")).not.toBeNull();
    expect(validRankName("Admin")).not.toBeNull();
    expect(validRankName("<script>")).not.toBeNull();
    expect(validRankName("Principal")).toBeNull();
    expect(validRankName("Huj_123")).not.toBeNull();
  });
  it("percentyl przy wartości niecałkowitej – siebie nie liczymy jako lepszego", () => {
    const d = distribution("skutecznosc", [2 / 3 * 100, 70, 80, 90, 95], 2 / 3 * 100);
    expect(d.better).toBe(0);
    expect(d.me).toBe(66.7);
  });
});
