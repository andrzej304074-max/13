import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { answerQuestion } from "@/lib/tests";
import { contentQuota } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    const me = await requireUser();
    // odpowiedź zwraca klucz i kolejne pytanie (test „bez limitu” dolosowuje je bez końca) – limit jak dla treści
    await contentQuota(me, "odpowiedz");
    const { questionId, selected, skip } = await readJson(req);
    return answerQuestion(me.id, id, questionId, selected, skip);
  });
}
