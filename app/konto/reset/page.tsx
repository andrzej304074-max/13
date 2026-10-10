import { ResetRequestForm } from "../forms";

export default function ResetPage() {
  return (
    <div className="auth stack">
      <h1>Zmiana hasła</h1>
      <p className="muted">Podaj e-mail konta – wyślemy na niego link do ustawienia nowego hasła.</p>
      <div className="card"><ResetRequestForm /></div>
    </div>
  );
}
