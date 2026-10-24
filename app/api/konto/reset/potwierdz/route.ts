import { handle, readJson } from "@/lib/api";
import { confirmReset } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const { token, password } = await readJson(req);
    // konto z weryfikacją dwuetapową dostaje bilet drugiego kroku zamiast sesji
    return (await confirmReset(token, password)) ?? { ok: true };
  });
}
