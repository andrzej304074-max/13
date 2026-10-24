import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { countByType, type DrawFilter } from "@/lib/questions";
import { SOURCES } from "@/lib/question-meta";
import { formFilter } from "@/lib/test-form";
import { mistakeIds } from "@/lib/mistakes";

export const dynamic = "force-dynamic";

/** Liczba pytań spełniających filtry formularza testu (jednokrotne, wielokrotne i wg źródła) – bez treści pytań. */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const body = await readJson(req);
    const f: DrawFilter = formFilter(body);
    // „Tylko moje błędy” – pula z pytań, na które ostatnio odpowiedziano źle
    if (body.mistakes === true) f.only = await mistakeIds(me.id);
    const count = (g: DrawFilter) => ({ single: countByType("single", "mix", g), multi: countByType("multi", "mix", g) });
    return {
      ...count(f),
      // liczby każdego źródła z jego filtrami (także niewybranego – żeby było widać, ile da włączenie)
      bySource: Object.fromEntries(SOURCES.map((s) => [s.id, count({ ...f, sources: [s.id] })])),
    };
  });
}
