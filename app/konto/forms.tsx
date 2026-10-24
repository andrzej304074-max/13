"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

type Challenge = { mfa: true; ticket: string };
const isChallenge = (x: unknown): x is Challenge => !!x && typeof x === "object" && (x as Challenge).mfa === true;

/** Drugi krok logowania: kod z aplikacji uwierzytelniającej albo kod zapasowy. */
function MfaStep({ ticket, onDone }: { ticket: string; onDone: (me: Me) => void }) {
  const [code, setCode] = useState("");
  const { busy, error, run } = useSubmit();
  return (
    <form
      data-testid="mfa-step"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => onDone(await post<Me>("/api/konto/mfa/logowanie", { ticket, code })));
      }}
    >
      <p style={{ margin: 0 }}>Konto ma włączoną weryfikację dwuetapową. Wpisz 6-cyfrowy kod z aplikacji uwierzytelniającej albo jeden z kodów zapasowych.</p>
      <label className="field">
        <span>Kod</span>
        <input name="mfa" value={code} onChange={(e) => setCode(e.target.value.slice(0, 12))} className="code" autoComplete="one-time-code" inputMode="text" autoFocus />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy || code.replace(/[\s-]/g, "").length < 6}>Potwierdź</button>
    </form>
  );
}

/** Logowanie kluczem dostępu (WebAuthn) – przycisk widoczny, gdy przeglądarka je obsługuje. */
function PasskeyButton({ onDone }: { onDone: (me: Me) => void }) {
  const [ok, setOk] = useState(false);
  const { busy, error, run } = useSubmit();
  useEffect(() => setOk(typeof window !== "undefined" && !!window.PublicKeyCredential), []);
  if (!ok) return null;
  return (
    <>
      <button
        type="button"
        className="btn secondary"
        data-testid="passkey-login"
        disabled={busy}
        onClick={() =>
          run(async () => {
            const { startAuthentication } = await import("@simplewebauthn/browser");
            const { flow, options } = await post<{ flow: string; options: Parameters<typeof startAuthentication>[0]["optionsJSON"] }>("/api/konto/klucz-logowanie/opcje", {});
            let response;
            try {
              response = await startAuthentication({ optionsJSON: options });
            } catch {
              throw new Error("Logowanie kluczem przerwane.");
            }
            onDone(await post<Me>("/api/konto/klucz-logowanie", { flow, response }));
          })
        }
      >
        🔑 Zaloguj kluczem dostępu
      </button>
      {error && <p className="error">{error}</p>}
    </>
  );
}

export function LoginForm({ google = false, ticket: initialTicket = null, initialError = null }: { google?: boolean; ticket?: string | null; initialError?: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ticket, setTicket] = useState<string | null>(initialTicket);
  const { busy, error, run } = useSubmit();
  const done = (me: Me) => go(me.active ? safeNext() : "/konto/aktywacja");
  if (ticket) return <MfaStep ticket={ticket} onDone={done} />;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const r = await post<Me | Challenge>("/api/konto/logowanie", { email, password });
          if (isChallenge(r)) setTicket(r.ticket);
          else done(r);
        });
      }}
    >
      <Field label="E-mail" name="email" type="email" value={email} set={setEmail} auto="email webauthn" />
      <Field label="Hasło" name="password" type="password" value={password} set={setPassword} auto="current-password" />
      {(error ?? initialError) && <p className="error">{error ?? initialError}</p>}
      <button className="btn" disabled={busy}>Zaloguj się</button>
      <div className="auth-alt">
        <PasskeyButton onDone={done} />
        {google && <a className="btn secondary" href="/api/konto/google" data-testid="google-login">Zaloguj przez Google</a>}
      </div>
      <div className="auth-links">
        <Link href="/konto/rejestracja">Załóż konto</Link>
        <Link href="/konto/reset">Nie pamiętam hasła</Link>
      </div>
    </form>
  );
}

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void; remove: (id: string) => void };
  }
}

/** Widżet Cloudflare Turnstile (tylko gdy skonfigurowany) – token trafia do `onToken`. */
function Turnstile({ siteKey, onToken, resetKey }: { siteKey: string | null; onToken: (t: string) => void; resetKey?: number }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!siteKey || !box.current) return;
    let id: string | null = null;
    let gone = false;
    const mount = () => {
      if (gone || !box.current || !window.turnstile) return;
      id = window.turnstile.render(box.current, { sitekey: siteKey, language: "pl", callback: onToken, "expired-callback": () => onToken(""), "error-callback": () => onToken("") });
    };
    if (window.turnstile) mount();
    else {
      let sc = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
      if (!sc) {
        sc = document.createElement("script");
        sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        sc.async = true;
        sc.dataset.turnstile = "1";
        document.head.appendChild(sc);
      }
      sc.addEventListener("load", mount);
    }
    return () => {
      gone = true;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, resetKey]);
  if (!siteKey) return null;
  return <div ref={box} data-testid="turnstile" />;
}

/** Rok urodzenia, zgoda rodzica poniżej 16 lat i akceptacja regulaminu. */
function ConsentFields(props: {
  birthYear: string; setBirthYear: (v: string) => void; terms: boolean; setTerms: (v: boolean) => void;
  parentConsent: boolean; setParentConsent: (v: boolean) => void; parentEmail: string; setParentEmail: (v: string) => void;
}) {
  const y = Number(props.birthYear);
  const now = new Date().getFullYear();
  // rok urodzenia bez daty: „może mieć mniej niż 16 lat” – liczymy ostrożnie (urodziny jeszcze przed nami)
  const minor = props.birthYear.length === 4 && y > 1900 && now - y - 1 < 16;
  return (
    <>
      <label className="field">
        <span>Rok urodzenia</span>
        <input name="birthYear" value={props.birthYear} onChange={(e) => props.setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="bday-year" required />
      </label>
      {minor && (
        <div className="stack" data-testid="parent-consent" style={{ gap: ".5rem" }}>
          <label className="check">
            <input type="checkbox" name="parentConsent" checked={props.parentConsent} onChange={(e) => props.setParentConsent(e.target.checked)} />
            <span>Mam mniej niż 16 lat – mój rodzic lub opiekun zgadza się na założenie konta.</span>
          </label>
          <Field label="E-mail rodzica lub opiekuna (wyślemy informację o koncie)" name="parentEmail" type="email" value={props.parentEmail} set={props.setParentEmail} auto="off" />
        </div>
      )}
      <label className="check">
        <input type="checkbox" name="terms" checked={props.terms} onChange={(e) => props.setTerms(e.target.checked)} />
        <span>Akceptuję <Link href="/regulamin" target="_blank">regulamin</Link> i <Link href="/prywatnosc" target="_blank">politykę prywatności</Link>.</span>
      </label>
    </>
  );
}

function useConsent() {
  const [birthYear, setBirthYear] = useState("");
  const [terms, setTerms] = useState(false);
  const [parentConsent, setParentConsent] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  return {
    props: { birthYear, setBirthYear, terms, setTerms, parentConsent, setParentConsent, parentEmail, setParentEmail },
    body: { birthYear: Number(birthYear), terms, parentConsent, parentEmail },
  };
}

export function RegisterForm({ siteKey = null, google = false, googleFlow = null, googleEmail = null }: { siteKey?: string | null; google?: boolean; googleFlow?: string | null; googleEmail?: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [tries, setTries] = useState(0);
  const consent = useConsent();
  const { busy, error, setError, run } = useSubmit();
  const viaGoogle = !!(googleFlow && googleEmail);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!viaGoogle && password !== password2) return setError("Hasła się różnią.");
        run(async () => {
          try {
            const me = viaGoogle
              ? await post<Me>("/api/konto/rejestracja/google", { google: googleFlow, code, ...consent.body })
              : await post<Me>("/api/konto/rejestracja", { email, password, code, turnstile: token, ...consent.body });
            go(me.active ? "/" : "/konto/aktywacja");
          } catch (err) {
            // konto powstało, ale kod był błędny – dokończ aktywację na osobnym ekranie
            if (err instanceof Error && err.message.startsWith("Konto założone")) {
              go(`/konto/aktywacja?blad=${encodeURIComponent(err.message)}`);
              return;
            }
            // token Turnstile jest jednorazowy – nowy widżet po błędzie
            if (siteKey) { setToken(""); setTries((n) => n + 1); }
            throw err;
          }
        });
      }}
    >
      {viaGoogle ? (
        <p className="ok-msg" data-testid="google-register" style={{ margin: 0 }}>Konto Google: <b>{googleEmail}</b> – uzupełnij rok urodzenia i zgody.</p>
      ) : (
        <>
          <Field label="E-mail" name="email" type="email" value={email} set={setEmail} auto="email" />
          <Field label="Hasło (min. 8 znaków)" name="password" type="password" value={password} set={setPassword} auto="new-password" />
          <Field label="Powtórz hasło" name="password2" type="password" value={password2} set={setPassword2} auto="new-password" />
        </>
      )}
      <ConsentFields {...consent.props} />
      <Field label="Kod aktywacji (5 cyfr, od administratora)" name="code" value={code} set={setCode} code max={5} auto="off" />
      {!viaGoogle && <Turnstile siteKey={siteKey} onToken={setToken} resetKey={tries} />}
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy || (!viaGoogle && !!siteKey && !token)}>Załóż konto</button>
      <p className="muted" style={{ margin: 0, fontSize: ".9rem" }}>
        Po wpisaniu kodu konto musi jeszcze zatwierdzić administrator. Bez kodu konto powstanie, ale nie będzie można go zatwierdzić.
      </p>
      {google && !viaGoogle && <a className="btn secondary" href="/api/konto/google" data-testid="google-login">Załóż konto przez Google</a>}
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
          const me = await post<Me>("/api/konto/aktywacja", { code });
          go(me.active ? "/" : "/konto/aktywacja");
        });
      }}
    >
      <Field label="Kod aktywacji (5 cyfr)" name="code" value={code} set={setCode} code max={5} auto="one-time-code" />
      {(error ?? initialError) && <p className="error">{error ?? initialError}</p>}
      <button className="btn" disabled={busy || code.length !== 5}>Aktywuj konto</button>
    </form>
  );
}

export function ResetRequestForm({ siteKey = null }: { siteKey?: string | null }) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
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
          await post("/api/konto/reset", { email, turnstile: token });
          setSent(true);
        });
      }}
    >
      <Field label="E-mail konta" name="email" type="email" value={email} set={setEmail} auto="email" />
      <Turnstile siteKey={siteKey} onToken={setToken} />
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy || (!!siteKey && !token)}>Wyślij link</button>
      <div className="auth-links"><Link href="/konto/logowanie">← Logowanie</Link></div>
    </form>
  );
}

export function ResetConfirmForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const { busy, error, setError, run } = useSubmit();
  if (ticket) return <MfaStep ticket={ticket} onDone={() => go("/")} />;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== password2) return setError("Hasła się różnią.");
        run(async () => {
          const r = await post<Challenge | { ok: true }>("/api/konto/reset/potwierdz", { token, password });
          if (isChallenge(r)) setTicket(r.ticket);
          else go("/");
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
          go("/konto/ustawienia");
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
