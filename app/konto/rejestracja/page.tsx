import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { googleConfigured } from "@/lib/google";
import { googlePending } from "@/lib/google-login";
import { turnstileSiteKey } from "@/lib/turnstile";
import { RegisterForm } from "../forms";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await currentUser();
  if (me) redirect(me.active ? "/" : "/konto/aktywacja");
  const flow = (await searchParams).google ?? null;
  const googleEmail = googleConfigured() ? await googlePending(flow) : null;
  return (
    <div className="auth stack">
      <h1>Załóż konto</h1>
      <div className="card">
        <RegisterForm siteKey={turnstileSiteKey()} google={googleConfigured()} googleFlow={googleEmail ? flow : null} googleEmail={googleEmail} />
      </div>
    </div>
  );
}
