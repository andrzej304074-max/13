import type { Question } from "@/lib/types";
import auto from "./auto.json";
import manual from "./manual.json";
import themeAuto from "./theme_auto.json";
import sections from "./sections.json";

// auto.json generuje tools/slownik/gen_questions.py z haseł słownika; manual.json – pytania pisane ręcznie;
// theme_auto.json – pytania algorytmiczne do hasła przewodniego bieżącej edycji (tools/slownik/gen_theme.py).
// Pytania o hasło XL pisane w aplikacji (id `xl-…`: 400 ręcznych w manual.json i 254 skryptowe z theme_auto.json) to osobne
// źródło „Hasło XL” – reszta to Słownik.
const all = [...(manual as Question[]), ...(auto as Question[]), ...(themeAuto as Question[])];
export const SLOWNIK_QUESTIONS = all.filter((q) => !q.id.startsWith("xl-"));
export const XL_QUESTIONS = all.filter((q) => q.id.startsWith("xl-"));

/** Działy słownika w kolejności z PDF (numer = `section` pytania). */
export const SLOWNIK_SECTIONS = sections as { no: number; title: string }[];
