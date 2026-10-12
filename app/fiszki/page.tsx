import { COURSE } from "@/lib/nauka-course";
import { oweCountByItem } from "@/lib/owe-stats-data";
import { FlashcardsView, type Card } from "./view";

export const metadata = { title: "Fiszki – Testy OWE" };

export default function FiszkiPage() {
  const owe = oweCountByItem();
  // wszystkie hasła kursu (bez lekcji „Zrozumienie”) w kolejności lekcji – jak tabela pojęć
  const seen = new Set<string>();
  const cards: Card[] = [];
  for (const u of COURSE.units) for (const lid of u.lessons) for (const id of COURSE.lessons[lid].items) {
    const it = COURSE.items[id];
    if (!it || it.kind === "zrozumienie" || seen.has(id)) continue;
    seen.add(id);
    cards.push({ id, t: it.t, d: it.d, w: it.w ?? null, kind: it.kind, topic: it.topic, n: owe[id] ?? 0 });
  }
  return (
    <FlashcardsView
      cards={cards}
      topics={COURSE.topics.map(({ id, title, emoji }) => ({ id, title, emoji }))}
      kinds={COURSE.kinds.filter((k) => k.id !== "zrozumienie")}
    />
  );
}
