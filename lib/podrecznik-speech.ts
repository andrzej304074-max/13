import type { Block, Run } from "./podrecznik";
import { speechItem, type SpeechItem } from "./speech-text";

/**
 * Elementy czytania na głos artykułu Podręcznika – wspólne dla czytnika (odtwarzanie) i serwera (nagrania Azure, lib/tts.ts),
 * więc tekst akapitu, a z nim klucz nagrania, jest po obu stronach identyczny.
 * Id elementu = „sekcja-blok” (jak data-s / data-b w DOM czytnika), punkty listy: blok·100 + punkt + 10000.
 */

/** Tekst bloku jako jeden ciąg (przesunięcia podkreśleń liczone w nim). */
export const runsText = (r: Run[]) => r.map((x) => x.s).join("");

export function articleSpeech(sections: { title: string; blocks: Block[] }[], headings: boolean): { items: SpeechItem[]; firstOf: number[] } {
  const items: SpeechItem[] = [];
  const firstOf: number[] = [];
  sections.forEach((s, si) => {
    firstOf[si] = items.length;
    if (headings) items.push(speechItem(`${si}-h`, s.title, s.title));
    s.blocks.forEach((b, bi) => {
      if (b.t === "ul") b.items.forEach((it, k) => items.push(speechItem(`${si}-${bi * 100 + k + 10000}`, s.title, runsText(it))));
      else if (b.t === "f") items.push(speechItem(`${si}-${bi}`, s.title, `Wzór: ${b.x}`));
      else items.push(speechItem(`${si}-${bi}`, s.title,
        b.t === "ex" ? `Przykład. ${runsText(b.r)}` : b.t === "trap" ? `Uwaga, pułapka. ${runsText(b.r)}` : b.t === "key" ? `Zapamiętaj. ${runsText(b.r)}` : runsText(b.r)));
    });
  });
  return { items, firstOf };
}
