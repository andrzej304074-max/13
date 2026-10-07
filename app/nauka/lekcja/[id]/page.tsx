import { notFound } from "next/navigation";
import { COURSE, getUnit, lessonPayload } from "@/lib/nauka-course";
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
  const payload = [1, 2, 3, 4].includes(sub) ? lessonPayload(id, sub) : null;
  if (!payload) notFound();
  return <LessonPlayer key={`${id}-${sub}`} payload={payload} next={nextHref(id, sub)} />;
}
