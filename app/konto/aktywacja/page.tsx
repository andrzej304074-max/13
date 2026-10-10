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
      {me.pending === "approval" ? (
        <div className="card stack" data-testid="waiting">
          <p className="ok-msg" style={{ margin: 0 }}>Kod przyjęty.</p>
          <p style={{ margin: 0 }}>
            Konto <strong>{me.email}</strong> czeka na zatwierdzenie przez administratora. Gdy to nastąpi, aplikacja się odblokuje.
          </p>
          <p style={{ margin: 0 }}><a className="btn secondary" href="/konto/aktywacja">Sprawdź ponownie</a></p>
        </div>
      ) : (
        <>
          <p className="muted">
            Konto <strong>{me.email}</strong> nie jest jeszcze aktywne. Wpisz 5-cyfrowy kod aktywacji, który otrzymasz od administratora.
            Po wpisaniu kodu administrator musi jeszcze zatwierdzić konto.
          </p>
          <div className="card"><ActivateForm initialError={blad?.slice(0, 200)} /></div>
        </>
      )}
      <p className="muted"><LogoutButton /></p>
    </div>
  );
}
