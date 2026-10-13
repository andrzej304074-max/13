/** Przygotowanie tekstu do czytania na głos (czysta logika, bez przeglądarki). */

const REPL: [RegExp, string][] = [
  [/\s*→\s*/g, " – "],
  [/⇒|⇔/g, ", czyli "],
  [/≈/g, " w przybliżeniu "],
  [/≤/g, " mniejsze lub równe "],
  [/≥/g, " większe lub równe "],
  [/≠/g, " różne od "],
  [/×|·/g, " razy "],
  [/Δ/g, " delta "],
  [/Σ/g, " suma "],
  [/√/g, " pierwiastek z "],
  [/π/g, " pi "],
  [/€/g, " euro"],
  [/‰/g, " promili"],
  [/(\d)\s*%/g, "$1 procent"],
  [/%/g, " procent "],
  [/\bp\.p\./g, "punktu procentowego"],
  [/\bmln\b/g, "milionów"],
  [/\bmld\b/g, "miliardów"],
  [/\btys\./g, "tysięcy"],
  [/(^|[^\p{L}])zł(?!\p{L})/gu, "$1złotych"],
  [/\bnp\./g, "na przykład"],
  [/\bm\.in\./g, "między innymi"],
  [/\bitp\./g, "i tak dalej"],
  [/\bok\./g, "około"],
  [/\bwg\b/g, "według"],
  [/\bpor\./g, "porównaj"],
  [/\bart\./g, "artykuł"],
  [/\bust\./g, "ustęp"],
  [/\br\./g, "roku"],
  [/[„”"«»]/g, ""],
  [/[*_`#]/g, ""],
  [/\s+([,.;:!?])/g, "$1"],
  [/\s{2,}/g, " "],
];

/** Symbole i skróty → słowa (np. „%” → „procent”, „Δ” → „delta”), bez cudzysłowów i znaczników. */
export function toSpeech(text: string): string {
  let s = ` ${text} `;
  for (const [re, to] of REPL) s = s.replace(re, to);
  return s.trim();
}

/**
 * Podział na fragmenty do kolejki mowy: zdania (Chrome ucina długie wypowiedzi), najwyżej `max` znaków;
 * zbyt długie zdanie dzielone po przecinkach albo spacjach.
 */
export function splitChunks(text: string, max = 220): string[] {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return [];
  const sentences = t.match(/[^.!?…;:]+[.!?…;:]*\s*/g) ?? [t];
  const out: string[] = [];
  let cur = "";
  const push = (x: string) => { const y = x.trim(); if (y) out.push(y); };
  for (const s of sentences) {
    if ((cur + s).length <= max) { cur += s; continue; }
    push(cur);
    cur = "";
    if (s.length <= max) { cur = s; continue; }
    let part = "";
    for (const w of s.split(/(?<=,)\s+|\s+/)) {
      if ((part + " " + w).trim().length > max) { push(part); part = w; } else part = (part + " " + w).trim();
    }
    cur = part;
  }
  push(cur);
  return out;
}

/** Element do przeczytania: tytuł do paska odtwarzacza i tekst (już w formie do mowy po `toSpeech`). */
export interface SpeechItem { id: string; title: string; text: string }

export function speechItem(id: string, title: string, ...parts: (string | null | undefined | false)[]): SpeechItem {
  return { id, title, text: toSpeech(parts.filter(Boolean).map((p) => String(p).trim().replace(/([^.!?…:;])$/, "$1.")).join(" ")) };
}
