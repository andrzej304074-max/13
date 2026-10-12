import course from "./course.json";
import zrozum from "./zrozum.json";
import oweStats from "./owe-stats.json";
import type { Course, ZContent } from "@/lib/nauka-types";
import type { OweRec } from "@/lib/owe-stats";

// course.json, zrozum.json i owe-stats.json generuje tools/nauka/build_course.py (program kursu z haseł słownika, banków pytań
// i ręcznych lekcji „Zrozumienie” z tools/nauka/zrozum).
export const COURSE = course as unknown as Course;
export const ZROZUM = zrozum as unknown as Record<string, ZContent>;
export const OWE_STATS = oweStats as unknown as OweRec[];
