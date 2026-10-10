import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AdminCodeForm, ChangePasswordForm, LogoutButton } from "../forms";

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
      {me.active && !me.isAdmin && (
        <>
          <h2>Kod administratora</h2>
          <div className="card"><AdminCodeForm /></div>
        </>
      )}
      {me.isAdmin && <p><Link href="/admin">Panel admina →</Link></p>}
      <p><LogoutButton className="btn secondary" /></p>
    </div>
  );
}
