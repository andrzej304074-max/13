import { describe, expect, it } from "vitest";
import { allowance, normalizeState, pickBatch, ssml, textHash } from "@/lib/tts-core";
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
  it("nowy miesiąc i dzień zerują liczniki", () => {
    const s = normalizeState({ voice: "pl-PL-MarekNeural", month: "2026-09", used: 400000, day: "2026-09-30", usedToday: 9000 }, at("2026-10-01T03:00:00Z"));
    expect(s).toMatchObject({ voice: "pl-PL-MarekNeural", month: "2026-10", used: 0, day: "2026-10-01", usedToday: 0 });
  });
  it("nieznany głos → domyślny", () => {
    expect(normalizeState({ voice: "x" }, at("2026-10-01T00:00:00Z")).voice).toBe("pl-PL-ZofiaNeural");
  });
  it("dzienna porcja = pozostały budżet / pozostałe dni", () => {
    const now = at("2026-10-01T03:00:00Z"); // październik: 31 dni
    expect(allowance(normalizeState({}, now), 310000, now)).toBe(10000);
    // ostatni dzień – cała reszta
    const last = at("2026-10-31T03:00:00Z");
    expect(allowance(normalizeState({ month: "2026-10", used: 300000, day: "2026-10-31" }, last), 310000, last)).toBe(10000);
    // część dzisiejszej porcji już zużyta
    expect(allowance(normalizeState({ month: "2026-10", used: 4000, day: "2026-10-01", usedToday: 4000 }, now), 310000, now)).toBe(6000);
    // limit miesiąca wyczerpany
    expect(allowance(normalizeState({ month: "2026-10", used: 310000, day: "2026-10-01" }, now), 310000, now)).toBe(0);
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
