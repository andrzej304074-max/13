import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { checkEssay, checkTask } from "@/lib/otwarte";

export const dynamic = "force-dynamic";

/**
 * Zadanie: { answers: { a: ["21,88"] } } → zapis podejścia, punkty podpunktów i rozwiązanie;
 *   { attempt, self: { c: 1 } } → samoocena części opisowych dopisana do podejścia.
 * Esej: { topic, checks: [[true, false, …], …], zapisz?: true } → schemat odpowiedzi i wynik samooceny.
 * Esej bez `zapisz` tylko pokazuje wzorzec, z `zapisz` – zapisuje samoocenę do statystyk.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    const me = await requireUser();
    const body = await readJson(req);
    const save = body.zapisz === true;
    return id.endsWith("-zadanie") ? checkTask(me.id, id, body) : checkEssay(me.id, id, body, save);
  });
}
