import { notFound } from "next/navigation";
import { COURSE } from "@/data/nauka";
import { unitArticle } from "@/lib/podrecznik";
import { Reader, type ReaderSection } from "../reader";

export async function generateMetadata({ params }: { params: Promise<{ unit: string }> }) {
  const { unit } = await params;
  const a = unitArticle(unit);
  return { title: `${a?.unit.title ?? "Podręcznik"} – Podręcznik` };
}

/** Artykuł działu: przegląd „W skrócie” + wszystkie rozdziały (lekcje) jeden pod drugim. */
export default async function UnitArticlePage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit } = await params;
  const a = unitArticle(unit);
  if (!a) notFound();
  const sections: ReaderSection[] = [
    ...(a.intro ? [{ ref: unit, hl: `${unit}:intro`, title: a.intro.title, blocks: a.intro.blocks, words: a.intro.words, kicker: "W skrócie" }] : []),
    ...a.chapters.map((c) => {
      const l = COURSE.lessons[c.lesson];
      return { ref: c.lesson, hl: `${unit}:${c.lesson}`, title: c.title, blocks: c.blocks, words: c.words, kicker: `Lekcja ${l.no}${l.part ? ` · cz. ${l.part}` : ""}` };
    }),
  ];
  return (
    <div className="stack" style={{ ["--topic" as string]: a.unit.topic.color }}>
      <Reader sections={sections} unitId={unit}
        heading={{ title: a.unit.title, sub: `${a.unit.topic.emoji} ${a.unit.topic.title.replace(/^Temat przewodni: /, "")} · ${a.chapters.length} rozdz.`, starRef: unit }}
        crumbs={[{ href: "/nauka/podrecznik", label: "Podręcznik" }, { href: `/nauka/podrecznik?temat=${a.unit.topic.id}`, label: a.unit.topic.title.replace(/^Temat przewodni: /, "") }]} />
    </div>
  );
}
