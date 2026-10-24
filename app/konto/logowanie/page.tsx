import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { googleConfigured } from "@/lib/google";
import { LoginForm } from "../forms";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await currentUser();
  if (me) redirect(me.active ? "/" : "/konto/aktywacja");
  const sp = await searchParams;
  // ?mfa=<bilet> – drugi krok po logowaniu Google; ?blad= – komunikat z logowania Google
  const ticket = sp.mfa && /^[A-Za-z0-9_-]{20,80}$/.test(sp.mfa) ? sp.mfa : null;
  return (
    <div className="auth stack">
      <h1>Logowanie</h1>
      <div className="card"><LoginForm google={googleConfigured()} ticket={ticket} initialError={sp.blad?.slice(0, 200) ?? null} /></div>
    </div>
  );
}
