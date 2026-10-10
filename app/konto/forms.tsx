"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client";

type Me = { isAdmin: boolean; active: boolean };

/** Bezpieczny adres powrotu: tylko ścieżka w tej aplikacji (bez „//host”). */
function safeNext(): string {
  const n = new URLSearchParams(window.location.search).get("next");
  return n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/konto") ? n : "/";
}

/** Pełne przeładowanie – nagłówek z e-mailem i strony chronione renderują się od nowa. */
const go = (url: string) => window.location.assign(url);

function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, setError, run };
}

const post = <T,>(url: string, body: unknown) => api<T>(url, { method: "POST", body: JSON.stringify(body) });

function Field(props: { label: string; name: string; type?: string; value: string; set: (v: string) => void; code?: boolean; auto?: string; max?: number }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.set(props.code ? e.target.value.replace(/\D/g, "").slice(0, props.max ?? 5) : e.target.value)}
        className={props.code ? "code" : undefined}
        inputMode={props.code ? "numeric" : undefined}
        autoComplete={props.auto}
        maxLength={props.max}
        required={!props.code}
      />
    </label>
  );
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { busy, error, run } = useSubmit();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const me = await post<Me>("/api/konto/logowanie", { email, password });
          go(me.active ? safeNext() : "/konto/aktywacja");
        });
      }}
    >
      <Field label="E-mail" name="email" type="email" value={email} set={setEmail} auto="email" />
      <Field label="Hasło" name="password" type="password" value={password} set={setPassword} auto="current-password" />
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>Zaloguj się</button>
      <div className="auth-links">
        <Link href="/konto/rejestracja">Załóż konto</Link>
        <Link href="/konto/reset">Nie pamiętam hasła</Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [code, setCode] = useState("");
  const { busy, error, setError, run } = useSubmit();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== password2) return setError("Hasła się różnią.");
        run(async () => {
          try {
            const me = await post<Me>("/api/konto/rejestracja", { email, password, code });
            go(me.active ? "/" : "/konto/aktywacja");
          } catch (err) {
            // konto powstało, ale kod był błędny – dokończ aktywację na osobnym ekranie
            if (err instanceof Error && err.message.startsWith("Konto założone")) {
              go(`/konto/aktywacja?blad=${encodeURIComponent(err.message)}`);
              return;
            }
            throw err;
          }
        });
      }}
    >
      <Field label="E-mail" name="email" type="email" value={email} set={setEmail} auto="email" />
      <Field label="Hasło (min. 8 znaków)" name="password" type="password" value={password} set={setPassword} auto="new-password" />
      <Field label="Powtórz hasło" name="password2" type="password" value={password2} set={setPassword2} auto="new-password" />
      <Field label="Kod aktywacji (5 cyfr, od administratora)" name="code" value={code} set={setCode} code max={5} auto="off" />
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>Załóż konto</button>
      <p className="muted" style={{ margin: 0, fontSize: ".9rem" }}>
        Bez kodu konto powstanie, ale aplikacja odblokuje się dopiero po jego wpisaniu.
      </p>
      <div className="auth-links"><Link href="/konto/logowanie">Mam już konto – zaloguj się</Link></div>
    </form>
  );
}

export function ActivateForm({ initialError }: { initialError?: string }) {
  const [code, setCode] = useState("");
  const { busy, error, run } = useSubmit();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await post("/api/konto/aktywacja", { code });
          go("/");
        });
      }}
    >
      <Field label="Kod aktywacji (5 cyfr)" name="code" value={code} set={setCode} code max={5} auto="one-time-code" />
      {(error ?? initialError) && <p className="error">{error ?? initialError}</p>}
      <button className="btn" disabled={busy || code.length !== 5}>Aktywuj konto</button>
    </form>
  );
}

export function ResetRequestForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useSubmit();
  if (sent) {
    return <p className="ok-msg">Jeśli konto z tym adresem istnieje, wysłaliśmy na nie link do zmiany hasła (ważny 60 minut). Sprawdź też folder spam.</p>;
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await post("/api/konto/reset", { email });
          setSent(true);
        });
      }}
    >
      <Field label="E-mail konta" name="email" type="email" value={email} set={setEmail} auto="email" />
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>Wyślij link</button>
      <div className="auth-links"><Link href="/konto/logowanie">← Logowanie</Link></div>
    </form>
  );
}

export function ResetConfirmForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const { busy, error, setError, run } = useSubmit();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== password2) return setError("Hasła się różnią.");
        run(async () => {
          await post("/api/konto/reset/potwierdz", { token, password });
          go("/");
        });
      }}
    >
      <Field label="Nowe hasło (min. 8 znaków)" name="password" type="password" value={password} set={setPassword} auto="new-password" />
      <Field label="Powtórz nowe hasło" name="password2" type="password" value={password2} set={setPassword2} auto="new-password" />
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>Ustaw hasło</button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [newPassword2, setNew2] = useState("");
  const [done, setDone] = useState(false);
  const { busy, error, setError, run } = useSubmit();
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (newPassword !== newPassword2) return setError("Hasła się różnią.");
        run(async () => {
          await post("/api/konto/haslo", { oldPassword, newPassword });
          setDone(true);
          setOld(""); setNew(""); setNew2("");
        });
      }}
    >
      <Field label="Obecne hasło" name="old" type="password" value={oldPassword} set={setOld} auto="current-password" />
      <Field label="Nowe hasło (min. 8 znaków)" name="new" type="password" value={newPassword} set={setNew} auto="new-password" />
      <Field label="Powtórz nowe hasło" name="new2" type="password" value={newPassword2} set={setNew2} auto="new-password" />
      {error && <p className="error">{error}</p>}
      {done && <p className="ok-msg">Hasło zmienione. Inne urządzenia zostały wylogowane.</p>}
      <button className="btn" disabled={busy}>Zmień hasło</button>
    </form>
  );
}

export function AdminCodeForm() {
  const [code, setCode] = useState("");
  const { busy, error, run } = useSubmit();
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await post("/api/konto/admin-kod", { code });
          go("/admin");
        });
      }}
    >
      <label className="field">
        <span>Kod admina (jednorazowy, od innego administratora)</span>
        <input name="admincode" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))} className="code" autoComplete="off" />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy || code.length !== 8}>Zostań administratorem</button>
    </form>
  );
}

export function LogoutButton({ className = "linkbtn" }: { className?: string }) {
  return (
    <button
      className={className}
      onClick={async () => {
        await post("/api/konto/wyloguj", {}).catch(() => {});
        go("/konto/logowanie");
      }}
    >
      Wyloguj
    </button>
  );
}
