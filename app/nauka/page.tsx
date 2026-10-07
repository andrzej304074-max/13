import { COURSE } from "@/lib/nauka-course";
import { NaukaHome, type TopicCard } from "./home";

export default function NaukaPage() {
  const topics: TopicCard[] = COURSE.topics.map((t) => {
    const units = COURSE.units.filter((u) => u.topic === t.id);
    const all = Object.values(COURSE.items).filter((i) => i.topic === t.id);
    const items = all.filter((i) => i.kind !== "zrozumienie");
    const kinds = Object.fromEntries(COURSE.kinds.map((k) => [k.id, all.filter((i) => i.kind === k.id).length]));
    const lessons = units.flatMap((u) => u.lessons).map((l) => COURSE.lessons[l]);
    return {
      ...t, units: units.length, items: items.length, kinds,
      lessons: lessons.filter((l) => l.type !== "zrozum").length,
      zlessons: lessons.filter((l) => l.type === "zrozum").length,
    };
  });
  const lessonIds = Object.keys(COURSE.lessons);
  return <NaukaHome topics={topics} kinds={COURSE.kinds} lessonIds={lessonIds} />;
}
