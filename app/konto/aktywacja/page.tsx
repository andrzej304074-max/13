import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ActivateForm, LogoutButton } from "../forms";

export const dynamic = "force-dynamic";

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ blad?: string }> }) {
  const me = await currentUser();
  if (!me) redirect("/konto/logowanie");
  if (me.active) redirect("/");
  const { blad } = await searchParams;
  return (
    <div className="auth stack">
      <h1>Aktywacja konta</h1>
      <p className="muted">
        Konto <strong>{me.email}</strong> nie jest jeszcze aktywne. Wpisz 5-cyfrowy kod aktywacji, który otrzymasz od administratora.
      </p>
      <div className="card"><ActivateForm initialError={blad?.slice(0, 200)} /></div>
      <p className="muted"><LogoutButton /></p>
    </div>
  );
}
