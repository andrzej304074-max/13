import { notFound } from "next/navigation";
import { COURSE } from "@/data/nauka";
import Link from "next/link";
import { nextUnit, unitArticle } from "@/lib/podrecznik";
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
  const nu = nextUnit(unit);
  const footer = nu?.first ? (
    <div className="reader-next card">
      <Link className="reader-next-link" href={`/nauka/podrecznik/${nu.id}`} data-testid="read-next-unit">
        <span className="muted small">Następny dział</span>
        <strong>Czytaj dalej: {nu.title} →</strong>
      </Link>
      <p className="muted small" style={{ margin: 0 }}>
        albo od pierwszej lekcji: <Link href={`/nauka/podrecznik/${nu.id}/${nu.first.lesson}`}>{nu.first.title}</Link>
      </p>
    </div>
  ) : null;
  return (
    <div className="stack" style={{ ["--topic" as string]: a.unit.topic.color }}>
      <Reader sections={sections} unitId={unit} footer={footer}
        heading={{ title: a.unit.title, sub: `${a.unit.topic.emoji} ${a.unit.topic.title.replace(/^Temat przewodni: /, "")} · ${a.chapters.length} rozdz.`, starRef: unit }}
        crumbs={[{ href: "/nauka/podrecznik", label: "Podręcznik" }, { href: `/nauka/podrecznik?temat=${a.unit.topic.id}`, label: a.unit.topic.title.replace(/^Temat przewodni: /, "") }]} />
    </div>
  );
}
