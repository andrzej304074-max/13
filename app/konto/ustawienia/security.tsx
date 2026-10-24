"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

/** Ustawienia konta: weryfikacja dwuetapowa, klucze dostępu, sesje, Twoje dane (limity, eksport) i usunięcie konta. */

const post = <T,>(url: string, body: unknown = {}) => api<T>(url, { method: "POST", body: JSON.stringify(body) });
const del = <T,>(url: string, body?: unknown) => api<T>(url, { method: "DELETE", ...(body ? { body: JSON.stringify(body) } : {}) });
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }) : "–");
const errText = (e: unknown) => (e instanceof Error ? e.message : "Błąd.");

type MfaInfo = { enabled: boolean; since: string | null; backupLeft: number; google: boolean };

function BackupCodes({ codes }: { codes: string[] }) {
  return (
    <div className="stack" data-testid="mfa-backup" style={{ gap: ".4rem" }}>
      <p className="ok-msg" style={{ margin: 0 }}>Zapisz kody zapasowe w bezpiecznym miejscu – każdy działa raz, gdy nie masz telefonu. Nie pokażemy ich ponownie.</p>
      <pre className="backup-codes">{codes.join("\n")}</pre>
    </div>
  );
}

export function MfaCard({ required }: { required: boolean }) {
  const [info, setInfo] = useState<MfaInfo | null>(null);
  const [setup, setSetup] = useState<{ flow: string; secret: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [backup, setBackup] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => api<MfaInfo>("/api/konto/mfa").then(setInfo).catch(() => {});
  useEffect(() => { load(); }, []);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await fn(); } catch (e) { setError(errText(e)); } finally { setBusy(false); }
  };
  if (!info) return <div className="card muted">Wczytywanie…</div>;
  return (
    <div className="card stack" data-testid="mfa-card" data-enabled={info.enabled ? "1" : "0"}>
      {required && !info.enabled && <p className="error" data-testid="mfa-required" style={{ margin: 0 }}>Panel administratora wymaga włączonej weryfikacji dwuetapowej.</p>}
      {info.enabled ? (
        <>
          <p style={{ margin: 0 }}>✅ Włączona od {when(info.since)}. Kody zapasowe: {info.backupLeft} z 8.</p>
          {backup && <BackupCodes codes={backup} />}
          <label className="field"><span>Kod z aplikacji (do zmian poniżej)</span>
            <input name="mfa-code" value={code} onChange={(e) => setCode(e.target.value.slice(0, 12))} className="code" autoComplete="one-time-code" /></label>
          <div className="row">
            <button className="btn secondary" disabled={busy || code.length < 6} data-testid="mfa-new-backup"
              onClick={() => run(async () => { setBackup((await post<{ backup: string[] }>("/api/konto/mfa/kody", { code })).backup); setCode(""); await load(); })}>
              Nowe kody zapasowe
            </button>
          </div>
          {!info.google && (
            <label className="field"><span>Hasło (do wyłączenia)</span>
              <input type="password" name="mfa-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
          )}
          <button className="btn secondary danger" disabled={busy || code.length < 6 || !password} data-testid="mfa-disable"
            onClick={() => run(async () => { await post("/api/konto/mfa/wylacz", { password, code }); setCode(""); setPassword(""); setBackup(null); await load(); })}>
            Wyłącz weryfikację dwuetapową
          </button>
        </>
      ) : setup ? (
        <>
          <p style={{ margin: 0 }}>Zeskanuj kod w aplikacji uwierzytelniającej (Google Authenticator, Microsoft Authenticator, 1Password…) i wpisz 6 cyfr, które pokaże.</p>
          <div className="mfa-qr" data-testid="mfa-qr" dangerouslySetInnerHTML={{ __html: setup.qr }} />
          <p className="muted" style={{ margin: 0, fontSize: ".85rem" }}>Albo wpisz klucz ręcznie: <code data-testid="mfa-secret">{setup.secret}</code></p>
          <label className="field"><span>Kod z aplikacji</span>
            <input name="mfa-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="code" inputMode="numeric" autoComplete="one-time-code" /></label>
          <button className="btn" disabled={busy || code.length !== 6} data-testid="mfa-enable"
            onClick={() => run(async () => { setBackup((await post<{ backup: string[] }>("/api/konto/mfa/wlacz", { flow: setup.flow, code })).backup); setSetup(null); setCode(""); await load(); })}>
            Włącz
          </button>
        </>
      ) : (
        <>
          <p style={{ margin: 0 }}>Przy logowaniu oprócz hasła poprosimy o kod z aplikacji w telefonie.</p>
          <button className="btn" disabled={busy} data-testid="mfa-start"
            onClick={() => run(async () => setSetup(await post("/api/konto/mfa/start")))}>
            Włącz weryfikację dwuetapową
          </button>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

type Passkey = { id: string; name: string; createdAt: string; lastUsedAt: string | null };

export function PasskeysCard() {
  const [keys, setKeys] = useState<Passkey[] | null>(null);
  const [supported, setSupported] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setSupported(!!window.PublicKeyCredential);
    api<{ keys: Passkey[] }>("/api/konto/klucze").then((r) => setKeys(r.keys)).catch(() => setKeys([]));
  }, []);
  async function add() {
    setBusy(true); setError(null);
    try {
      const { startRegistration } = await import("@simplewebauthn/browser");
      const { flow, options } = await post<{ flow: string; options: Parameters<typeof startRegistration>[0]["optionsJSON"] }>("/api/konto/klucze/opcje");
      let response;
      try { response = await startRegistration({ optionsJSON: options }); } catch { throw new Error("Dodawanie klucza przerwane."); }
      setKeys((await post<{ keys: Passkey[] }>("/api/konto/klucze", { flow, response, name })).keys);
      setName("");
    } catch (e) { setError(errText(e)); } finally { setBusy(false); }
  }
  return (
    <div className="card stack" data-testid="passkeys-card">
      <p style={{ margin: 0 }}>Klucz dostępu to logowanie odciskiem palca, twarzą albo PIN-em urządzenia – bez hasła.</p>
      {keys && keys.length > 0 && (
        <ul className="plain-list" data-testid="passkeys">
          {keys.map((k) => (
            <li key={k.id} className="row" style={{ justifyContent: "space-between" }}>
              <span>🔑 {k.name} <span className="muted">· dodany {when(k.createdAt)} · użyty {when(k.lastUsedAt)}</span></span>
              <button className="linkbtn" data-testid="passkey-delete"
                onClick={async () => { if (confirm(`Usunąć klucz „${k.name}”?`)) setKeys((await del<{ keys: Passkey[] }>(`/api/konto/klucze/${encodeURIComponent(k.id)}`)).keys); }}>
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}
      {supported ? (
        <>
          <label className="field"><span>Nazwa nowego klucza (opcjonalnie)</span>
            <input name="passkey-name" placeholder="np. Telefon" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} /></label>
          <button className="btn secondary" disabled={busy} onClick={add} data-testid="passkey-add">Dodaj klucz dostępu</button>
        </>
      ) : (
        <p className="muted" style={{ margin: 0 }}>Ta przeglądarka nie obsługuje kluczy dostępu.</p>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

type Session = { id: string; createdAt: string; device: string; via: string | null; current: boolean };
const VIA: Record<string, string> = { haslo: "hasło", google: "Google", klucz: "klucz dostępu", reset: "reset hasła", rejestracja: "rejestracja" };

export function SessionsCard() {
  const [list, setList] = useState<Session[] | null>(null);
  useEffect(() => { api<{ sessions: Session[] }>("/api/konto/sesje").then((r) => setList(r.sessions)).catch(() => setList([])); }, []);
  if (!list) return <div className="card muted">Wczytywanie…</div>;
  return (
    <div className="card stack" data-testid="sessions-card">
      <ul className="plain-list" data-testid="sessions">
        {list.map((s) => (
          <li key={s.id} className="row" style={{ justifyContent: "space-between" }} data-current={s.current ? "1" : "0"}>
            <span>{s.device}{s.current && <b> · to urządzenie</b>} <span className="muted">· od {when(s.createdAt)}{s.via ? ` · ${VIA[s.via] ?? s.via}` : ""}</span></span>
            {!s.current && (
              <button className="linkbtn" data-testid="session-end"
                onClick={async () => setList((await del<{ sessions: Session[] }>(`/api/konto/sesje/${s.id}`)).sessions)}>
                Wyloguj
              </button>
            )}
          </li>
        ))}
      </ul>
      {list.length > 1 && (
        <button className="btn secondary" data-testid="logout-everywhere"
          onClick={async () => setList((await post<{ sessions: Session[] }>("/api/konto/sesje/wyloguj-wszedzie")).sessions)}>
          Zakończ sesje na innych urządzeniach
        </button>
      )}
    </div>
  );
}

type Usage = { key: string; label: string; used: number; max: number };
const fmt = (k: string, n: number) => (k === "notesBytes" ? `${(n / 1024 / 1024).toFixed(1)} MB` : String(n));

export function DataCard({ google, mfa }: { google: boolean; mfa: boolean }) {
  const [usage, setUsage] = useState<Usage[] | null>(null);
  const [confirmText, setConfirm] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<{ usage: Usage[] }>("/api/konto/dane").then((r) => setUsage(r.usage)).catch(() => {}); }, []);
  return (
    <div className="card stack" data-testid="data-card">
      {usage && (
        <table className="usage" data-testid="usage">
          <tbody>
            {usage.map((u) => (
              <tr key={u.key}>
                <td>{u.label}</td>
                <td className="num">{fmt(u.key, u.used)} / {fmt(u.key, u.max)}</td>
                <td style={{ width: "30%" }}><div className="meter"><span style={{ width: `${Math.min(100, (100 * u.used) / u.max)}%` }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ margin: 0 }}>
        <a className="btn secondary" href="/api/konto/eksport" download data-testid="export">⬇ Pobierz moje dane (JSON)</a>
      </p>
      <details className="danger-zone" data-testid="delete-account">
        <summary>Usuń konto</summary>
        <div className="stack" style={{ marginTop: ".6rem" }}>
          <p style={{ margin: 0 }}>Usunięcie jest natychmiastowe i nieodwracalne – znikną wyniki, notatki, talie i ustawienia. Najpierw możesz pobrać swoje dane.</p>
          <label className="field"><span>{google ? "Hasło albo e-mail konta" : "Hasło"}</span>
            <input type={google ? "text" : "password"} name="delete-secret" value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete={google ? "off" : "current-password"} /></label>
          {mfa && (
            <label className="field"><span>Kod weryfikacji dwuetapowej</span>
              <input name="delete-code" value={code} onChange={(e) => setCode(e.target.value.slice(0, 12))} className="code" autoComplete="one-time-code" /></label>
          )}
          <label className="field"><span>Wpisz USUŃ</span>
            <input name="delete-confirm" value={confirmText} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" /></label>
          {error && <p className="error">{error}</p>}
          <button className="btn danger" disabled={busy || confirmText !== "USUŃ" || !secret} data-testid="delete-submit"
            onClick={async () => {
              setBusy(true); setError(null);
              try {
                await del("/api/konto/dane", { confirm: confirmText, password: secret, email: google ? secret : undefined, code });
                window.location.assign("/konto/logowanie");
              } catch (e) { setError(errText(e)); setBusy(false); }
            }}>
            Usuń konto na zawsze
          </button>
        </div>
      </details>
    </div>
  );
}
