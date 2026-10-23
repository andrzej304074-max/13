import Link from "next/link";
import { notFound } from "next/navigation";
import { COURSE } from "@/data/nauka";
import { lessonArticle } from "@/lib/podrecznik";
import { Reader } from "../../reader";

export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  return { title: `${lessonArticle(lesson)?.chapter.title ?? "Artykuł"} – Podręcznik` };
}

/** Artykuł jednej lekcji – alternatywa dla „Poznaj”: po przeczytaniu do końca pod-lekcja 1 jest zaliczona. */
export default async function LessonArticlePage({ params }: { params: Promise<{ unit: string; lesson: string }> }) {
  const { unit, lesson } = await params;
  const a = lessonArticle(lesson);
  if (!a || a.unit.id !== unit) notFound();
  const l = COURSE.lessons[lesson];
  const footer = (
    <div className="reader-next card">
      <strong>Co dalej?</strong>
      <div className="row">
        <Link className="btn" href={`/nauka/lekcja/${lesson}?sub=2`} data-testid="go-practice">✍️ Przejdź do „Ćwicz”</Link>
      </div>
      {a.next && (
        <Link className="reader-next-link" href={`/nauka/podrecznik/${a.next.unit}/${a.next.lesson}`} data-testid="read-next">
          <span className="muted small">{a.next.unitTitle ? `Następny dział: ${a.next.unitTitle}` : "Następna lekcja"}</span>
          <strong>Czytaj następną lekcję: {a.next.title} →</strong>
        </Link>
      )}
      <p className="muted small" style={{ margin: 0 }}>
        {a.prev && <><Link href={`/nauka/podrecznik/${unit}/${a.prev.lesson}`}>← {a.prev.title}</Link> · </>}
        <Link href={`/nauka/podrecznik/${unit}`}>Cały dział jako jeden artykuł</Link> · <Link href={`/nauka/${a.unit.topic.id}#${lesson}`}>Lekcja na ścieżce</Link>
      </p>
    </div>
  );
  return (
    <div className="stack" style={{ ["--topic" as string]: a.unit.topic.color }}>
      <Reader lessonMode unitId={unit} footer={footer}
        sections={[{ ref: lesson, hl: `${unit}:${lesson}`, title: a.chapter.title, blocks: a.chapter.blocks, words: a.chapter.words, ch: a.chapter.ch }]}
        heading={{ title: a.chapter.title, sub: `Lekcja ${l.no}${l.part ? ` · cz. ${l.part}` : ""} · rozdział ${a.no} z ${a.of}`, starRef: lesson }}
        crumbs={[{ href: "/nauka/podrecznik", label: "Podręcznik" }, { href: `/nauka/podrecznik/${unit}`, label: a.unit.title }]} />
    </div>
  );
}
