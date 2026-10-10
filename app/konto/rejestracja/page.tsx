import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { RegisterForm } from "../forms";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const me = await currentUser();
  if (me) redirect(me.active ? "/" : "/konto/aktywacja");
  return (
    <div className="auth stack">
      <h1>Załóż konto</h1>
      <div className="card"><RegisterForm /></div>
    </div>
  );
}
