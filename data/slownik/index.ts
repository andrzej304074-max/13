import type { Question } from "@/lib/types";
import auto from "./auto.json";
import manual from "./manual.json";
import sections from "./sections.json";

// auto.json generuje tools/slownik/gen_questions.py z haseł słownika; manual.json – pytania pisane ręcznie.
export const SLOWNIK_QUESTIONS = [...(manual as Question[]), ...(auto as Question[])];

/** Działy słownika w kolejności z PDF (numer = `section` pytania). */
export const SLOWNIK_SECTIONS = sections as { no: number; title: string }[];
