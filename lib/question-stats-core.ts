/**
 * Statystyki pytań dla admina (czysta logika): skuteczność wszystkich użytkowników, najczęściej wybierana błędna opcja
 * i flagi do przeglądu – „podejrzany klucz”, „za trudne”, „za łatwe”.
 */

export const MIN_N = 10;
export type QFlag = "klucz" | "trudne" | "latwe";
export const FLAG_LABEL: Record<QFlag, string> = { klucz: "podejrzany klucz", trudne: "za trudne (< 20%)", latwe: "za łatwe (> 95%)" };

export interface QStatRow {
  id: string;
  src: "owe" | "ai" | "slownik";
  topic: string | null;
  type: "single" | "multi";
  question: string;
  /** Odpowiedzi (sprawdzone + pominięte). */
  n: number;
  /** Skuteczność 0–100. */
  pct: number;
  /** Ile razy wybrano każdą opcję A–D (bez pominiętych). */
  picks: number[];
  correct: number[];
  /** Najczęściej wybierana błędna opcja i jej udział w odpowiedziach (0–100). */
  topWrong: { opt: number; pct: number } | null;
  flags: QFlag[];
  /** Zgłoszenia błędów, w których pada id pytania. */
  reports: number;
}

export function analyse(row: Omit<QStatRow, "topWrong" | "flags">): QStatRow {
  const answered = row.picks.reduce((s, v) => s + v, 0);
  let opt = -1;
  row.picks.forEach((c, i) => { if (!row.correct.includes(i) && c > 0 && (opt < 0 || c > row.picks[opt])) opt = i; });
  const topWrong = opt < 0 ? null : { opt, pct: row.n ? Math.round((row.picks[opt] / row.n) * 1000) / 10 : 0 };
  const flags: QFlag[] = [];
  if (row.n >= MIN_N && answered > 0) {
    // klucz: jakaś błędna opcja wybierana częściej niż (najrzadziej wybierana) poprawna
    const minCorrect = Math.min(...row.correct.map((i) => row.picks[i] ?? 0));
    if (topWrong && row.picks[opt] > minCorrect) flags.push("klucz");
    if (row.pct < 20) flags.push("trudne");
    if (row.pct > 95) flags.push("latwe");
  }
  return { ...row, topWrong, flags };
}
