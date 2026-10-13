import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { cleanup, dbUsage } from "@/lib/db-usage";

export const dynamic = "force-dynamic";

/** Rozmiar bazy względem limitu i największe tabele (przy okazji – codzienne sprzątanie). */
export async function GET() {
  return handle(async () => {
    await requireUser({ admin: true });
    await cleanup();
    return dbUsage();
  });
}

/** Sprzątanie od razu (wygasłe sesje, linki resetu hasła, stare błędne kody). */
export async function POST() {
  return handle(async () => {
    await requireUser({ admin: true });
    const removed = await cleanup(true);
    return { removed, usage: await dbUsage() };
  });
}
