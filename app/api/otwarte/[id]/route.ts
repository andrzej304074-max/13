import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getEssayPublic, getTaskPublic } from "@/lib/otwarte";

export const dynamic = "force-dynamic";

/** Treść zadania albo eseju – bez wyników, rozwiązań i schematu odpowiedzi. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    await requireUser();
    return id.endsWith("-zadanie") ? getTaskPublic(id) : getEssayPublic(id);
  });
}
