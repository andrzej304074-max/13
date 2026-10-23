import book from "@/data/nauka/podrecznik.json";
import { COURSE } from "@/data/nauka";
import type { CourseTopic } from "./nauka-types";

/**
 * Podręcznik – ręcznie pisane artykuły (data/nauka/podrecznik.json z tools/nauka/build_podrecznik.py):
 * przegląd działu „W skrócie” i rozdziały = artykuły lekcji (alternatywa dla „Poznaj”).
 */

/** Odcinek tekstu: s – tekst, b/i – pogrubienie/kursywa, k – id hasła (odnośnik do Tabeli pojęć). */
export interface Run { s: string; b?: 1; i?: 1; k?: string }
export type Block =
  | { t: "p" | "h" | "ex" | "trap" | "key"; r: Run[] }
  | { t: "ul"; items: Run[][] }
  | { t: "f"; x: string };
export interface Chapter { lesson: string; title: string; blocks: Block[]; words: number }
interface UnitBook { intro: { title: string; blocks: Block[]; words: number } | null; chapters: Chapter[]; words: number }

const UNITS = (book as unknown as { units: Record<string, UnitBook> }).units;

/** Minuty czytania (ok. 180 słów na minutę – spokojne czytanie ze zrozumieniem). */
export const readMinutes = (words: number) => Math.max(1, Math.round(words / 180));

export interface BookIndexUnit {
  id: string; title: string; kind: string; words: number; minutes: number;
  intro: { title: string; words: number } | null;
  chapters: { lesson: string; title: string; words: number }[];
  /** Zwykłe lekcje działu – ile rozdziałów jeszcze brakuje. */
  lessons: number;
}
export interface BookIndex { topics: (CourseTopic & { units: BookIndexUnit[] })[] }

export function bookIndex(): BookIndex {
  return {
    topics: COURSE.topics.map((t) => ({
      ...t,
      units: COURSE.units.filter((u) => u.topic === t.id).map((u) => {
        const b = UNITS[u.id];
        return {
          id: u.id, title: u.title, kind: u.kind, words: b?.words ?? 0, minutes: readMinutes(b?.words ?? 0),
          intro: b?.intro ? { title: b.intro.title, words: b.intro.words } : null,
          chapters: (b?.chapters ?? []).map(({ lesson, title, words }) => ({ lesson, title, words })),
          lessons: u.lessons.filter((l) => COURSE.lessons[l].type !== "zrozum").length,
        };
      }),
    })),
  };
}

export interface UnitArticle {
  unit: { id: string; title: string; topic: CourseTopic };
  intro: UnitBook["intro"];
  chapters: Chapter[];
  words: number;
}

export function unitArticle(unitId: string): UnitArticle | null {
  const u = COURSE.units.find((x) => x.id === unitId);
  const b = UNITS[unitId];
  if (!u || !b) return null;
  const topic = COURSE.topics.find((t) => t.id === u.topic)!;
  return { unit: { id: u.id, title: u.title, topic }, intro: b.intro, chapters: b.chapters, words: b.words };
}

export interface LessonArticle {
  unit: { id: string; title: string; topic: CourseTopic };
  chapter: Chapter;
  no: number;
  of: number;
  prev: { lesson: string; title: string } | null;
  /** Następny rozdział – w tym dziale, a po ostatnim rozdziale pierwszy rozdział następnego działu (z `unit`). */
  next: { lesson: string; title: string; unit: string; unitTitle?: string } | null;
}

/** Następny dział z artykułem w kolejności kursu (także w kolejnym temacie). */
export function nextUnit(unitId: string): { id: string; title: string; first: Chapter | null } | null {
  const i = COURSE.units.findIndex((u) => u.id === unitId);
  for (const u of COURSE.units.slice(i + 1)) {
    const b = UNITS[u.id];
    if (b && b.chapters.length) return { id: u.id, title: u.title, first: b.chapters[0] };
  }
  return null;
}

/** Rozdział lekcji z sąsiadami (poprzedni rozdział w dziale, następny – także przez granicę działu). */
export function lessonArticle(lessonId: string): LessonArticle | null {
  const l = COURSE.lessons[lessonId];
  if (!l) return null;
  const a = unitArticle(l.unit);
  if (!a) return null;
  const i = a.chapters.findIndex((c) => c.lesson === lessonId);
  if (i < 0) return null;
  const pick = (c?: Chapter) => (c ? { lesson: c.lesson, title: c.title } : null);
  const nu = i + 1 < a.chapters.length ? null : nextUnit(a.unit.id);
  const next = a.chapters[i + 1] ? { ...pick(a.chapters[i + 1])!, unit: a.unit.id }
    : nu?.first ? { lesson: nu.first.lesson, title: nu.first.title, unit: nu.id, unitTitle: nu.title } : null;
  return { unit: a.unit, chapter: a.chapters[i], no: i + 1, of: a.chapters.length, prev: pick(a.chapters[i - 1]), next };
}

export function hasArticle(lessonId: string): boolean {
  const l = COURSE.lessons[lessonId];
  return Boolean(l && UNITS[l.unit]?.chapters.some((c) => c.lesson === lessonId));
}

/** Tytuły rozdziałów lekcji (do ścieżki tematu i panelu lekcji) – tylko te, które już są napisane. */
export function chapterTitles(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const b of Object.values(UNITS)) for (const c of b.chapters) out[c.lesson] = c.title;
  return out;
}

/** Artykuły działów w kolejności kursu: przegląd „W skrócie” + rozdziały (jak strona artykułu działu). */
export function allArticleSections(): { unitId: string; sections: { title: string; blocks: Block[] }[] }[] {
  return COURSE.units.flatMap((u) => {
    const b = UNITS[u.id];
    if (!b) return [];
    return [{ unitId: u.id, sections: [...(b.intro ? [b.intro] : []), ...b.chapters] }];
  });
}
