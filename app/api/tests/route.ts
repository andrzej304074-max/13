import { handle, readJson } from "@/lib/api";
import { requireSection, requireUser } from "@/lib/auth";
import { ALLOWED_COUNTS, ENDLESS, type TestSize } from "@/lib/scoring";
import { isStage, type DrawFilter } from "@/lib/questions";
import { parseMetaFilter } from "@/lib/question-meta";
import { contentQuota } from "@/lib/security";
import { createTest, HttpError } from "@/lib/tests";
import type { Bank, Origin } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Zakładka, z której startuje test danej bazy (blokady sekcji). */
const TAB: Record<Bank, string> = { owe: "/", slownik: "/slownik", mix: "/testy/wszystkie", ai: "/testy/wszystkie" };

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const body = await readJson(req);
    const { type, count, bank = "owe", origin = null, section = null, stage = null } = body;
    if (type !== "single" && type !== "multi") throw new HttpError(400, "Nieprawidłowy typ pytań.");
    if (count !== ENDLESS && !ALLOWED_COUNTS.includes(count as TestSize)) {
      throw new HttpError(400, "Liczba pytań musi wynosić 30, 50 albo „bez limitu”.");
    }
    if (bank !== "owe" && bank !== "slownik" && bank !== "mix") throw new HttpError(400, "Nieznana baza pytań.");
    if (origin !== null && origin !== "auto" && origin !== "manual") throw new HttpError(400, "Nieznane pochodzenie pytań.");
    if (section !== null && !(Number.isInteger(section) && (section as number) > 0)) {
      throw new HttpError(400, "Nieprawidłowy dział.");
    }
    if (stage !== null && !isStage(stage)) throw new HttpError(400, "Nieznany etap zawodów.");
    let meta;
    try { meta = parseMetaFilter(body); } catch (e) { throw new HttpError(400, (e as Error).message); }
    await requireSection(me, TAB[bank as Bank]);
    await contentQuota(me, "test");
    // źródła tylko w „Wszystkich pytaniach”; pochodzenie i dział słownika tylko w Słowniku; etap (stary formularz) – OWE
    if (bank !== "mix") delete meta.sources;
    // jeden etap (szkolny albo okręgowy) w pytaniach jednokrotnego wyboru = dawny „etap” testu (historia w statystykach)
    const single = meta.stages?.filter((s) => s !== "c");
    const oneStage = stage ?? (single?.length === 1 ? single[0] : null);
    const filter: DrawFilter = bank === "slownik" ? { ...meta, origin: origin as Origin | null, section: section as number | null }
      : bank === "owe" && type === "single" && oneStage ? { ...meta, stage: oneStage } : meta;
    return createTest(me.id, type, count as TestSize | typeof ENDLESS, bank as Bank, filter);
  }, 201);
}
