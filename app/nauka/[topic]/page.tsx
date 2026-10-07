import { notFound } from "next/navigation";
import { ZROZUM } from "@/data/nauka";
import { COURSE, getTopic, unitsOf } from "@/lib/nauka-course";
import { TopicPath, type UnitView } from "./path";

export function generateStaticParams() {
  return COURSE.topics.map((t) => ({ topic: t.id }));
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: id } = await params;
  const topic = getTopic(id);
  if (!topic) notFound();
  const units: UnitView[] = unitsOf(id).map((u) => ({
    id: u.id,
    title: u.title,
    kind: u.kind,
    count: u.count,
    zcount: u.zcount ?? 0,
    lessons: u.lessons.map((lid) => {
      const l = COURSE.lessons[lid];
      if (l.type === "zrozum") {
        const z = ZROZUM[lid];
        return { id: l.id, no: l.no, title: l.title, type: "zrozum" as const, goal: z.goal, items: z.refs.map((i) => COURSE.items[i].s), questions: 0 };
      }
      return { id: l.id, no: l.no, title: l.title, items: l.items.map((i) => COURSE.items[i].s), questions: l.questions.length };
    }),
  }));
  return <TopicPath topic={topic} units={units} kinds={COURSE.kinds} />;
}
