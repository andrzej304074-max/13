import course from "./course.json";
import zrozum from "./zrozum.json";
import oweStats from "./owe-stats.json";
import slownikStats from "./slownik-stats.json";
import aiStats from "./ai-stats.json";
import theme from "../olimpiada/theme.json";
import figures from "./figures.json";
import type { Course, FigSpec, ZContent } from "@/lib/nauka-types";
import type { AiRec, OweRec, SlRec } from "@/lib/owe-stats";

// course.json, zrozum.json i owe-stats.json generuje tools/nauka/build_course.py (program kursu z haseł słownika, banków pytań
// i ręcznych lekcji „Zrozumienie” z tools/nauka/zrozum).
export const COURSE = course as unknown as Course;
// Rysunek przy haśle (tools/nauka/build_figures.py: ręczna lista + rysunki Podręcznika) – kurs, fiszki, tabela pojęć.
for (const [id, f] of Object.entries(figures as Record<string, FigSpec>)) if (COURSE.items[id]) COURSE.items[id].f = f;
export const ZROZUM = zrozum as unknown as Record<string, ZContent>;
// Pytania dotyczące hasła przewodniego swojej edycji (tools/otwarte/theme.py + ręczne poprawki) – pole `th`.
const THEME_Q = new Set(theme.questions);
export const OWE_STATS = (oweStats as unknown as OweRec[]).map((r) => (THEME_Q.has(r.id) ? { ...r, th: 1 as const } : r));
export const SLOWNIK_STATS = slownikStats as unknown as SlRec[];
// Pytania AI: dział z eksportu (dz), temat i pojęcia z dopasowania haseł; th – dział „Demografia” (hasło XL).
export const AI_STATS = aiStats as unknown as AiRec[];
