import { ResetConfirmForm } from "../../forms";

export default async function ResetTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="auth stack">
      <h1>Nowe hasło</h1>
      <div className="card"><ResetConfirmForm token={token} /></div>
    </div>
  );
}
