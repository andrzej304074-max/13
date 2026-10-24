import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { questionStats } from "@/lib/question-stats";
import { reviewsOf } from "@/lib/review";
import { getQuestion } from "@/lib/questions";
import { HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

/** Statystyki pytań wszystkich banków (skuteczność, wybory opcji, flagi) i ćwiczeń kursu – tylko admin. */
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser({ admin: true });
    // ?id= – pełne pytanie z kluczem i wyjaśnieniem (podgląd wiersza)
    const id = new URL(req.url).searchParams.get("id");
    if (id) {
      const q = getQuestion(id);
      if (!q) throw new HttpError(404, "Nie ma takiego pytania.");
      return { id: q.id, edition: q.edition, question: q.question, options: q.options, correct: q.correct, explanation: q.explanation ?? null };
    }
    // z oceną recenzenta (tryb /recenzja)
    const [s, rv] = await Promise.all([questionStats(), reviewsOf("pytanie")]);
    return { ...s, rows: s.rows.map((r) => ({ ...r, review: rv.get(r.id) ?? null })) };
  });
}
