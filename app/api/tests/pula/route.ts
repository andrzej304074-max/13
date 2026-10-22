import { handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { countByType, type DrawFilter } from "@/lib/questions";
import { parseMetaFilter, SOURCES } from "@/lib/question-meta";
import { HttpError } from "@/lib/tests";
import type { Bank, Origin } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Liczba pytań spełniających filtry formularza testu (jednokrotne, wielokrotne i wg źródła) – bez treści pytań. */
export async function POST(req: Request) {
  return handle(async () => {
    await requireUser();
    const body = await readJson(req);
    const bank = body.bank ?? "owe";
    if (bank !== "owe" && bank !== "slownik" && bank !== "mix") throw new HttpError(400, "Nieznana baza pytań.");
    let meta;
    try { meta = parseMetaFilter(body); } catch (e) { throw new HttpError(400, (e as Error).message); }
    const origin = body.origin === "auto" || body.origin === "manual" ? (body.origin as Origin) : null;
    const section = Number.isInteger(body.section) ? (body.section as number) : null;
    const f: DrawFilter = bank === "slownik" ? { ...meta, sources: null, origin, section } : bank === "mix" ? meta : { ...meta, sources: null };
    const count = (b: Bank, g: DrawFilter) => ({ single: countByType("single", b, g), multi: countByType("multi", b, g) });
    return {
      ...count(bank as Bank, f),
      bySource: bank === "mix"
        ? Object.fromEntries(SOURCES.map((s) => [s.id, count("mix", { ...f, sources: [s.id] })]))
        : null,
    };
  });
}
