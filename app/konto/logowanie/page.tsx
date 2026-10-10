import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "../forms";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const me = await currentUser();
  if (me) redirect(me.active ? "/" : "/konto/aktywacja");
  return (
    <div className="auth stack">
      <h1>Logowanie</h1>
      <div className="card"><LoginForm /></div>
    </div>
  );
}
