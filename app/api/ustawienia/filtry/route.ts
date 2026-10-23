import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getPrefs } from "@/lib/prefs";

export const dynamic = "force-dynamic";

/** Zapisane filtry konta (jedno zapytanie przy pierwszej stronie z filtrami). */
export async function GET() {
  return handle(async () => ({ prefs: await getPrefs((await requireUser()).id) }));
}
