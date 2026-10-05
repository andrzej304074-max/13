import { handle, readJson } from "@/lib/api";
import { answerQuestion } from "@/lib/tests";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    const { questionId, selected, skip } = await readJson(req);
    return answerQuestion(id, questionId, selected, skip);
  });
}
