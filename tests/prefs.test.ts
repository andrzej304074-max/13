import { describe, expect, it } from "vitest";
import { isPrefKey, PREF_KEYS, PREF_MAX, validPrefValue } from "@/lib/prefs-core";
import { pickRandom } from "@/app/zadania/list-view";

describe("zapisane filtry", () => {
  it("tylko znane klucze i krótkie wartości bez znaków sterujących", () => {
    for (const k of PREF_KEYS) expect(isPrefKey(k)).toBe(true);
    expect(isPrefKey("cokolwiek")).toBe(false);
    expect(validPrefValue("od=30&do=35")).toBe(true);
    expect(validPrefValue("")).toBe(true);
    expect(validPrefValue("x".repeat(PREF_MAX + 1))).toBe(false);
    expect(validPrefValue("a\nb")).toBe(false);
    expect(validPrefValue(5)).toBe(false);
  });
});

describe("losowanie zadań i esejów", () => {
  it("najpierw nierozwiązane, a gdy wszystkie rozwiązane – dowolne", () => {
    const rows = [{ id: "a", attempts: 1 }, { id: "b", attempts: 0 }, { id: "c", attempts: 2 }];
    for (let i = 0; i < 30; i++) expect(pickRandom(rows).id).toBe("b");
    const done = rows.map((r) => ({ ...r, attempts: 1 }));
    expect(new Set(Array.from({ length: 200 }, () => pickRandom(done).id)).size).toBe(3);
  });
});
