import { OWE_STATS } from "@/data/nauka";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { filterFromParams, filterRecs } from "@/lib/owe-stats";
import { oweStatsData } from "@/lib/owe-stats-data";
import { getQuestion } from "@/lib/questions";

export const dynamic = "force-dynamic";

/** Pytania OWE dotyczące hasła (`item`), z filtrami jak w statystykach – do rozwinięcia wiersza pojęcia. */
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser();
    const p = new URL(req.url).searchParams;
    const item = p.get("item") ?? "";
    const f = { ...filterFromParams(p), kind: null };
    return filterRecs(OWE_STATS, f, oweStatsData().meta)
      .filter((r) => r.items.includes(item))
      .sort((a, b) => b.ed - a.ed || a.id.localeCompare(b.id))
      .flatMap((r) => {
        const q = getQuestion(r.id);
        return q ? [{ id: q.id, edition: q.edition, question: q.question, options: q.options, correct: q.correct, type: q.type }] : [];
      });
  });
}
