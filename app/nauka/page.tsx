import { COURSE } from "@/lib/nauka-course";
import { NaukaHome, type TopicCard } from "./home";

export default function NaukaPage() {
  const topics: TopicCard[] = COURSE.topics.map((t) => {
    const units = COURSE.units.filter((u) => u.topic === t.id);
    const items = Object.values(COURSE.items).filter((i) => i.topic === t.id);
    const kinds = Object.fromEntries(COURSE.kinds.map((k) => [k.id, items.filter((i) => i.kind === k.id).length]));
    return { ...t, units: units.length, lessons: units.reduce((n, u) => n + u.lessons.length, 0), items: items.length, kinds };
  });
  const lessonIds = Object.keys(COURSE.lessons);
  return <NaukaHome topics={topics} kinds={COURSE.kinds} lessonIds={lessonIds} />;
}
