import { handle, readJson } from "@/lib/api";
import { completeMfaLogin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Drugi krok logowania: { ticket, code } – kod z aplikacji uwierzytelniającej albo kod zapasowy. */
export async function POST(req: Request) {
  return handle(async () => {
    const { ticket, code } = await readJson(req);
    return completeMfaLogin(ticket, code);
  });
}
