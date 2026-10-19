import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { securityLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Dziennik zdarzeń bezpieczeństwa (nieudane logowania, blokady, przekroczenia limitów); `?kind=` – filtr. */
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser({ admin: true });
    return securityLog(new URL(req.url).searchParams.get("kind"));
  });
}
