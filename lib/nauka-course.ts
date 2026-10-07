import { COURSE, ZROZUM } from "@/data/nauka";
import { getQuestion } from "./questions";
import type { Question } from "./types";
import type { CourseItem, CourseLesson, CourseTopic, CourseUnit, LessonPayload } from "./nauka-types";
import { shuffle } from "./nauka-logic";

export { COURSE };

export function getTopic(id: string): CourseTopic | undefined {
  return COURSE.topics.find((t) => t.id === id);
}

export function getUnit(id: string): CourseUnit | undefined {
  return COURSE.units.find((u) => u.id === id);
}

export function getLesson(id: string): CourseLesson | undefined {
  return Object.hasOwn(COURSE.lessons, id) ? COURSE.lessons[id] : undefined;
}

export function getItem(id: string): CourseItem | undefined {
  return Object.hasOwn(COURSE.items, id) ? COURSE.items[id] : undefined;
}

export function unitsOf(topic: string): CourseUnit[] {
  return COURSE.units.filter((u) => u.topic === topic);
}

/** Pula haseł do dystraktorów: reszta działu, potem hasła tego samego rodzaju i (dla wzorów) inne wzory w temacie. */
function poolFor(lesson: CourseLesson): CourseItem[] {
  const own = new Set(lesson.items);
  const unit = getUnit(lesson.unit);
  const unitIds = (unit?.lessons ?? []).filter((l) => COURSE.lessons[l].type !== "zrozum").flatMap((l) => COURSE.lessons[l].items);
  const topicItems = Object.values(COURSE.items).filter((i) => i.topic === lesson.topic && i.kind !== "zrozumienie");
  const lessonItems = lesson.items.map((i) => COURSE.items[i]);
  const kinds = new Set(lessonItems.map((i) => i.kind));
  const pick = (ids: CourseItem[], n: number) => shuffle(ids.filter((i) => !own.has(i.id))).slice(0, n);
  const out = new Map<string, CourseItem>();
  for (const i of pick(unitIds.map((id) => COURSE.items[id]), 24)) out.set(i.id, i);
  for (const i of pick(topicItems.filter((t) => kinds.has(t.kind)), 16)) out.set(i.id, i);
  if (lessonItems.some((i) => i.w)) for (const i of pick(topicItems.filter((t) => t.w), 10)) out.set(i.id, i);
  // małe działy (np. 1–2 daty w temacie): hasła tego samego rodzaju z innych tematów
  if (out.size < 12) {
    const sameKind = Object.values(COURSE.items).filter((t) => kinds.has(t.kind) && t.topic !== lesson.topic);
    for (const i of pick(sameKind, 16 - out.size)) out.set(i.id, i);
  }
  return [...out.values()];
}

export function lessonPayload(lessonId: string, sub: number): LessonPayload | null {
  const lesson = getLesson(lessonId);
  if (!lesson) return null;
  const topic = getTopic(lesson.topic)!;
  if (lesson.type === "zrozum") {
    const z = ZROZUM[lesson.id];
    if (!z) return null;
    return {
      lesson,
      unitTitle: getUnit(lesson.unit)?.title ?? "",
      topic,
      sub,
      items: lesson.items.map((i) => COURSE.items[i]),
      pool: [],
      questions: [],
      zrozum: { goal: z.goal, sources: z.sources, refs: z.refs.map((i) => COURSE.items[i]), exercises: z.subs[sub - 1] ?? [] },
    };
  }
  const questions = lesson.questions.map(getQuestion).filter((q): q is Question => !!q);
  return {
    lesson,
    unitTitle: getUnit(lesson.unit)?.title ?? "",
    topic,
    sub,
    items: lesson.items.map((i) => COURSE.items[i]),
    pool: poolFor(lesson),
    questions: sub === 4 ? shuffle(questions).slice(0, 10) : [],
  };
}

/** Lekcja powtórkowa z podanych (najsłabszych) haseł – ćwiczenia jak w „Utrwal”. */
export function reviewPayload(itemIds: string[]): LessonPayload | null {
  const items = itemIds.map(getItem).filter((i): i is CourseItem => !!i && i.kind !== "zrozumienie").slice(0, 8);
  if (items.length === 0) return null;
  const lesson: CourseLesson = {
    id: "powtorka", unit: "powtorka", topic: "powtorka", kind: "pojecie", no: 1,
    title: "Powtórka słabych haseł", items: items.map((i) => i.id), questions: [],
  };
  const pool = new Map<string, CourseItem>();
  for (const it of items) {
    const l = Object.values(COURSE.lessons).find((x) => x.items.includes(it.id));
    if (l) for (const p of poolFor(l).slice(0, 8)) pool.set(p.id, p);
  }
  for (const it of items) pool.delete(it.id);
  return {
    lesson,
    unitTitle: "Powtórka",
    topic: { id: "powtorka", title: "Powtórka", emoji: "🔁", color: "#64748b" },
    sub: 3,
    items,
    pool: [...pool.values()],
    questions: [],
    review: true,
  };
}

export function randomLessonId(topic?: string): string {
  const ids = Object.values(COURSE.lessons).filter((l) => !topic || l.topic === topic).map((l) => l.id);
  return ids[Math.floor(Math.random() * ids.length)];
}
