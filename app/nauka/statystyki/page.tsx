import { COURSE } from "@/lib/nauka-course";
import { NaukaStatsView, type StatsMeta } from "./view";

export default function NaukaStatsPage() {
  const meta: StatsMeta = {
    topics: COURSE.topics.map(({ id, title, emoji }) => ({ id, title, emoji })),
    units: COURSE.units.map(({ id, title, topic }) => ({ id, title, topic })),
    lessons: Object.values(COURSE.lessons).map(({ id, title, unit, no }) => ({ id, title, unit, no })),
    kinds: COURSE.kinds,
  };
  return <NaukaStatsView meta={meta} />;
}
