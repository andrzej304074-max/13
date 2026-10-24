import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { adminMfaRequired } from "@/lib/auth-core";
import { AdminCodeForm, ChangePasswordForm, LogoutButton } from "../forms";
import { DataCard, MfaCard, PasskeysCard, SessionsCard } from "./security";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await currentUser();
  if (!me) redirect("/konto/logowanie");
  return (
    <div className="auth stack">
      <h1>Ustawienia konta</h1>
      <p className="muted">
        {me.email}
        {me.isOwner ? " · właściciel" : me.isAdmin ? " · administrator" : ""}
        {!me.active && <> · <Link href="/konto/aktywacja">konto nieaktywne – wpisz kod</Link></>}
      </p>
      <h2>Zmiana hasła</h2>
      <div className="card"><ChangePasswordForm /></div>
      <h2 id="mfa">Weryfikacja dwuetapowa</h2>
      <MfaCard required={me.isAdmin && adminMfaRequired()} />
      <h2>Klucze dostępu</h2>
      <PasskeysCard />
      <h2>Zalogowane urządzenia</h2>
      <SessionsCard />
      {me.active && !me.isAdmin && (
        <>
          <h2>Kod administratora</h2>
          {me.adminPending ? (
            <div className="card" data-testid="admin-waiting">
              <p className="ok-msg" style={{ margin: 0 }}>Kod przyjęty – prośba o rolę administratora czeka na zatwierdzenie.</p>
            </div>
          ) : (
            <div className="card"><AdminCodeForm /></div>
          )}
        </>
      )}
      <h2>Twoje dane</h2>
      <DataCard google={me.google} mfa={me.mfa} />
      <p><Link href="/zgloszenia" data-testid="bug-settings-link">🐞 Zgłoś błąd albo zobacz swoje zgłoszenia →</Link></p>
      {me.isAdmin && <p><Link href="/admin">Panel admina →</Link></p>}
      <p><LogoutButton className="btn secondary" /></p>
    </div>
  );
}
