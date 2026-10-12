import { COURSE } from "@/lib/nauka-course";
import { oweCountByItem } from "@/lib/owe-stats-data";
import { ConceptTable, type Row } from "./table";

export const metadata = { title: "Pojęcia – Testy OWE" };

export default function PojeciaPage() {
  const owe = oweCountByItem();
  // kolejność jak w kursie Nauka: tematy → działy → lekcje → hasła (każde hasło raz)
  const seen = new Set<string>();
  const rows: Row[] = [];
  for (const u of COURSE.units) {
    for (const lid of u.lessons) {
      for (const id of COURSE.lessons[lid].items) {
        const it = COURSE.items[id];
        if (!it || it.kind === "zrozumienie" || seen.has(id)) continue;
        seen.add(id);
        rows.push({ id, t: it.t, d: it.d, w: it.w ?? null, kind: it.kind, topic: it.topic, n: owe[id] ?? 0 });
      }
    }
  }
  return (
    <ConceptTable
      rows={rows}
      topics={COURSE.topics.map(({ id, title, emoji }) => ({ id, title, emoji }))}
      kinds={COURSE.kinds.filter((k) => k.id !== "zrozumienie")}
    />
  );
}
