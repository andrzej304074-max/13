import { notFound } from "next/navigation";
import { COURSE, getUnit, lessonPayload, personalizeRepeats } from "@/lib/nauka-course";
import { currentUser } from "@/lib/auth";
import { getMastery } from "@/lib/mastery";
import { LessonPlayer } from "../player";

export const dynamic = "force-dynamic";

/** Następny krok po pod-lekcji: kolejna pod-lekcja, a po sprawdzianie – pierwsza pod-lekcja następnej lekcji działu. */
function nextHref(lessonId: string, sub: number): string | null {
  if (sub < 4) return `/nauka/lekcja/${lessonId}?sub=${sub + 1}`;
  const lesson = COURSE.lessons[lessonId];
  const unit = getUnit(lesson.unit);
  const i = unit?.lessons.indexOf(lessonId) ?? -1;
  const nextId = unit && i >= 0 ? unit.lessons[i + 1] : undefined;
  return nextId ? `/nauka/lekcja/${nextId}?sub=1` : `/nauka/${lesson.topic}`;
}

export default async function LessonPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { id } = await params;
  const sub = Number((await searchParams).sub ?? 1);
  const base = [1, 2, 3, 4].includes(sub) ? lessonPayload(id, sub) : null;
  if (!base) notFound();
  // powtórki („Ćwicz”, „Utrwal”) dobierane od haseł, które użytkownikowi szły najgorzej
  const me = base.sub === 2 || base.sub === 3 ? await currentUser() : null;
  const payload = me?.active ? personalizeRepeats(base, await getMastery(me.id).catch(() => ({}))) : base;
  return <LessonPlayer key={`${id}-${sub}`} payload={payload} next={nextHref(id, sub)} />;
}
