import { parseMetaFilter, type MetaFilter } from "./question-meta";
import { isStage, type DrawFilter } from "./questions";
import { HttpError } from "./tests";

/**
 * Filtr z formularza „Pytania” (od Planu IV jeden formularz zamiast zakładek Olimpiada, Słownik i „Wszystkie pytania”).
 * Stare wywołania z `bank: "owe" | "slownik"` (np. strona otwarta przed aktualizacją) zamieniamy na odpowiednie źródło:
 * Słownik – pochodzenie i dział jako filtry Słownika, OWE – tylko Archiwum; `stage` (dawny wybór etapu: szkolny/okręgowy)
 * – Archiwum OWE tego etapu.
 */
export function formFilter(body: Record<string, unknown>): MetaFilter {
  const b = { ...body };
  if (b.stage != null) {
    if (!isStage(b.stage)) throw new HttpError(400, "Nieznany etap zawodów.");
    b.sources = ["owe"];
    // wielokrotny wybór OWE to tylko etap centralny – tam dawny etap był ignorowany
    if (b.type !== "multi") b.stages = [b.stage];
  }
  if (b.bank === "slownik") {
    b.sources = ["slownik", "xl"];
    if (b.slOrigin == null && (b.origin === "manual" || b.origin === "auto")) b.slOrigin = b.origin;
    if (b.slSection == null && Number.isInteger(b.section)) b.slSection = b.section;
  } else if (b.bank === "owe") {
    b.sources = ["owe"];
  } else if (b.bank != null && b.bank !== "mix") {
    throw new HttpError(400, "Nieznana baza pytań.");
  }
  try {
    return parseMetaFilter(b);
  } catch (e) {
    throw new HttpError(400, (e as Error).message);
  }
}

/**
 * Filtr nowego testu: jak `formFilter`, a test jednokrotnego wyboru z samego Archiwum OWE jednego etapu (szkolnego albo
 * okręgowego) zapamiętuje ten etap – w historii statystyk widać „etap szkolny/okręgowy”.
 */
export function testFilter(body: Record<string, unknown>): DrawFilter {
  const f: DrawFilter = formFilter(body);
  const single = f.stages?.filter((s) => s !== "c");
  if (body.type === "single" && f.sources?.length === 1 && f.sources[0] === "owe" && single?.length === 1) f.stage = single[0];
  return f;
}
