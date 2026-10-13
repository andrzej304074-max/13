import { describe, expect, it } from "vitest";
import { allowance, liveBlocked, normalizeState, pickBatch, ssml, textHash } from "@/lib/tts-core";
import { articleSpeech } from "@/lib/podrecznik-speech";
import { allArticleSections } from "@/lib/podrecznik";

describe("textHash", () => {
  it("jest deterministyczny i rozróżnia teksty", () => {
    expect(textHash("Popyt rośnie.")).toBe(textHash("Popyt rośnie."));
    expect(textHash("Popyt rośnie.")).not.toBe(textHash("Popyt rośnie!"));
    expect(textHash("ą")).not.toBe(textHash("a"));
  });
  it("nie ma kolizji wśród akapitów Podręcznika", () => {
    const texts = new Set<string>();
    for (const a of allArticleSections()) for (const it of articleSpeech(a.sections, true).items) texts.add(it.text);
    expect(new Set([...texts].map(textHash)).size).toBe(texts.size);
  });
});

describe("ssml", () => {
  it("ucieka znaki XML", () => {
    const x = ssml(`A < B & "C" > D`, "pl-PL-ZofiaNeural");
    expect(x).toContain("A &lt; B &amp; &quot;C&quot; &gt; D");
    expect(x).toContain('<voice name="pl-PL-ZofiaNeural">');
  });
});

describe("budżet", () => {
  const at = (s: string) => new Date(s);
  it("nieznany głos → domyślny", () => {
    expect(normalizeState({ voice: "x" }).voice).toBe("pl-PL-ZofiaNeural");
    expect(normalizeState({ voice: "pl-PL-MarekNeural" }).voice).toBe("pl-PL-MarekNeural");
  });
  it("dzienna porcja w tle = pozostały budżet / pozostałe dni", () => {
    const now = at("2026-10-01T03:00:00Z"); // październik: 31 dni
    expect(allowance({ used: 0, usedToday: 0 }, 310000, now)).toBe(10000);
    // ostatni dzień – cała reszta
    expect(allowance({ used: 300000, usedToday: 0 }, 310000, at("2026-10-31T03:00:00Z"))).toBe(10000);
    // część dzisiejszej porcji już zużyta (także przez nagrania na bieżąco)
    expect(allowance({ used: 4000, usedToday: 4000 }, 310000, now)).toBe(6000);
    // limit miesiąca wyczerpany
    expect(allowance({ used: 310000, usedToday: 0 }, 310000, now)).toBe(0);
  });
  it("nagranie na bieżąco: limit miesiąca i dzienny limit konta", () => {
    expect(liveBlocked({ used: 1000, usedToday: 0 }, 100, 450000, 0, 60000)).toBeNull();
    expect(liveBlocked({ used: 449950, usedToday: 0 }, 100, 450000, 0, 60000)).toMatch(/miesięczny/);
    expect(liveBlocked({ used: 1000, usedToday: 0 }, 100, 450000, 59950, 60000)).toMatch(/dzienny/);
  });
  it("porcja w kolejności, do budżetu", () => {
    const todo = [{ chars: 50 }, { chars: 40 }, { chars: 30 }];
    expect(pickBatch(todo, 95)).toHaveLength(2);
    expect(pickBatch(todo, 49)).toHaveLength(0);
  });
});

describe("articleSpeech", () => {
  it("nagłówki sekcji tylko na stronie artykułu, akapity identyczne w obu widokach", () => {
    const a = allArticleSections()[0];
    const full = articleSpeech(a.sections, true).items;
    const one = articleSpeech([a.sections[1]], false).items;
    expect(full.some((x) => x.id.endsWith("-h"))).toBe(true);
    expect(one.some((x) => x.id.endsWith("-h"))).toBe(false);
    const texts = new Set(full.map((x) => x.text));
    expect(one.every((x) => texts.has(x.text))).toBe(true);
  });
});
