"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { api, fmtPct } from "@/lib/client";
import type { AdminUserRow } from "@/lib/auth";
import { SkeletonRows } from "@/app/components/loading-page";
import { GlobalAccess, UserAccess } from "./access-editor";
import type { AccessSettings, BlockMode } from "@/lib/access-core";

type CodeInfo = { code: string | null; updatedAt: string | null };
type AdminCode = { code: string; createdAt: string; expiresAt: string; createdBy: string | null };
type DbUsage = {
  bytes: number; limitBytes: number; percent: number; tables: { name: string; rows: number; bytes: number }[];
  counts: { users: number; tests: number; answers: number; sessions: number; notes: number }; cleanedAt: string | null;
};
const fmtMB = (b: number) => (b >= 1024 * 1024 * 100 ? `${Math.round(b / 1024 / 1024)} MB` : `${(b / 1024 / 1024).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} MB`);
const TABLE_PL: Record<string, string> = {
  learn_answers: "odpowiedzi w Nauce", learn_sessions: "sesje Nauki", tests: "testy", answers: "odpowiedzi w testach", notes: "notatki i brudnopisy",
  users: "konta", user_sessions: "sesje logowania", highlights: "podkreślenia", flash_ratings: "oceny fiszek", deck_cards: "karty talii", decks: "talie",
  stars: "gwiazdki", article_reads: "przeczytane artykuły", settings: "ustawienia",
};

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }) : "–";

export function AdminPanel({ meId }: { meId: string }) {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [code, setCode] = useState<CodeInfo | null>(null);
  const [adminCodes, setAdminCodes] = useState<AdminCode[] | null>(null);
  const [db, setDb] = useState<DbUsage | null>(null);
  const [access, setAccess] = useState<AccessSettings | null>(null);
  const [accessOpen, setAccessOpen] = useState<string | null>(null);
  const accessSaved = (id: string, blocked: string[], blockMode: BlockMode | null) =>
    setUsers((all) => all && all.map((u) => (u.id === id ? { ...u, blocked, blockMode } : u)));
  const accessProps = { global: access, openId: accessOpen, setOpenId: setAccessOpen, onAccess: accessSaved };
  const [cleaned, setCleaned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Błąd.");
  const loadUsers = () => api<AdminUserRow[]>("/api/admin/uzytkownicy").then(setUsers).catch(fail);

  useEffect(() => {
    loadUsers();
    api<CodeInfo>("/api/admin/kod-aktywacji").then(setCode).catch(fail);
    api<AdminCode[]>("/api/admin/kody-admina").then(setAdminCodes).catch(fail);
    api<DbUsage>("/api/admin/baza").then(setDb).catch(fail);
  }, []);

  async function cleanNow() {
    const r = await api<{ removed: { sessions: number; resets: number; failures: number }; usage: DbUsage }>("/api/admin/baza", { method: "POST" }).catch((e) => (fail(e), null));
    if (!r) return;
    setDb(r.usage);
    setCleaned(`Usunięto: ${r.removed.sessions} wygasłych sesji, ${r.removed.resets} linków resetu hasła, ${r.removed.failures} starych błędnych kodów.`);
  }

  async function newCode() {
    if (code?.code && !confirm("Wygenerować nowy kod aktywacji? Stary przestanie działać (aktywne konta pozostają aktywne).")) return;
    setCode(await api<CodeInfo>("/api/admin/kod-aktywacji", { method: "POST" }).catch((e) => (fail(e), code)));
  }

  async function newAdminCode() {
    setAdminCodes(await api<AdminCode[]>("/api/admin/kody-admina", { method: "POST" }).catch((e) => (fail(e), adminCodes)));
  }

  async function revoke(c: string) {
    setAdminCodes(await api<AdminCode[]>("/api/admin/kody-admina", { method: "DELETE", body: JSON.stringify({ code: c }) }).catch((e) => (fail(e), adminCodes)));
  }

  async function act(u: AdminUserRow, action: string, question?: string) {
    if (question && !confirm(question)) return;
    try {
      await api(`/api/admin/uzytkownicy/${u.id}/${action}`, { method: "POST" });
      await loadUsers();
    } catch (e) {
      fail(e);
    }
  }

  async function remove(u: AdminUserRow) {
    if (!confirm(`Usunąć konto ${u.email}? Znikną też wszystkie jego testy i postęp w nauce. Tego nie da się cofnąć.`)) return;
    try {
      await api(`/api/admin/uzytkownicy/${u.id}`, { method: "DELETE" });
      await loadUsers();
    } catch (e) {
      fail(e);
    }
  }

  const all = users ?? [];
  const pending = all.filter((u) => !u.active && u.codeOk);
  const noCode = all.filter((u) => !u.active && !u.codeOk);
  const adminRequests = all.filter((u) => u.active && u.adminRequested);
  const admins = all.filter((u) => u.active && u.isAdmin);
  const regular = all.filter((u) => u.active && !u.isAdmin);

  return (
    <div className="stack">
      <h1>Panel admina</h1>
      {error && <p className="error">{error}</p>}
      {db && db.percent >= 70 && (
        <p className="db-warn" role="alert">⚠️ Baza zajmuje {db.percent}% limitu ({fmtMB(db.bytes)} z {fmtMB(db.limitBytes)}). Rozważ usunięcie nieużywanych kont albo wyższy plan bazy.</p>
      )}

      <h2>Kod aktywacji</h2>
      <div className="card stack">
        <p className="muted" style={{ margin: 0 }}>
          Podaj ten kod osobom, które mają korzystać z aplikacji. Wpisują go przy zakładaniu konta.
        </p>
        <div className="row code-row">
          <span className="big-code" data-testid="activation-code">{code?.code ?? "brak"}</span>
          <span className="spacer" />
          <button className="btn" onClick={newCode}>{code?.code ? "Generuj nowy" : "Generuj kod"}</button>
        </div>
        {code?.updatedAt && <p className="muted" style={{ margin: 0 }}>Ustawiony: {fmtDate(code.updatedAt)}</p>}
      </div>

      <h2>Kody administratora</h2>
      <div className="card stack">
        <p className="muted" style={{ margin: 0 }}>
          Jednorazowy kod (ważny 24 h) nadaje rolę administratora. Użytkownik wpisuje go w Ustawieniach konta. Kody widzą tylko administratorzy.
        </p>
        <div className="row"><button className="btn secondary" onClick={newAdminCode}>Generuj kod administratora</button></div>
        {adminCodes && adminCodes.length > 0 && (
          <table className="users codes">
            <thead><tr><th>Kod</th><th>Utworzył</th><th>Ważny do</th><th /></tr></thead>
            <tbody>
              {adminCodes.map((c) => (
                <tr key={c.code}>
                  <td className="u-main"><code data-testid="admin-code">{c.code}</code></td>
                  <td data-label="Utworzył">{c.createdBy ?? "–"}</td>
                  <td data-label="Ważny do">{fmtDate(c.expiresAt)}</td>
                  <td className="actions"><button className="btn small secondary" onClick={() => revoke(c.code)}>Unieważnij</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!users ? <SkeletonRows rows={5} height={48} label="Ładowanie użytkowników" /> : (
        <>
          <h2>Czekają na zatwierdzenie <span className="muted">({pending.length + adminRequests.length})</span></h2>
          <div className="card stack table-wrap" data-testid="pending">
            {pending.length + adminRequests.length === 0 && <p className="muted" style={{ margin: 0 }}>Nikt nie czeka.</p>}
            {pending.length > 0 && (
              <table className="users">
                <thead><tr><th>Nowe konto (kod przyjęty)</th><th>Założone</th><th /></tr></thead>
                <tbody>
                  {pending.map((u) => (
                    <tr key={u.id} data-testid="pending-user">
                      <td className="u-main">{u.email}</td>
                      <td data-label="Założone">{fmtDate(u.createdAt)}</td>
                      <td className="actions">
                        <button className="btn small" onClick={() => act(u, "zatwierdz")}>Zatwierdź</button>
                        <button className="btn small danger" onClick={() => act(u, "odrzuc", `Odrzucić i usunąć konto ${u.email}?`)}>Odrzuć</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {adminRequests.length > 0 && (
              <table className="users">
                <thead><tr><th>Prośba o rolę administratora</th><th /></tr></thead>
                <tbody>
                  {adminRequests.map((u) => (
                    <tr key={u.id} data-testid="pending-admin">
                      <td className="u-main">{u.email}</td>
                      <td className="actions">
                        <button className="btn small" onClick={() => act(u, "zatwierdz-admina", `Nadać rolę administratora ${u.email}?`)}>Zatwierdź</button>
                        <button className="btn small danger" onClick={() => act(u, "odrzuc-admina")}>Odrzuć</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <h2>Administratorzy <span className="muted">({admins.length})</span></h2>
          <UserTable rows={admins} meId={meId} testid="admins" {...accessProps}
            extra={(u) => !u.isOwner && u.id !== meId && (
              <button className="btn small secondary" onClick={() => act(u, "odbierz-admina", `Odebrać rolę administratora ${u.email}?`)}>Odbierz admina</button>
            )}
            onDelete={remove} />

          <h2>Użytkownicy <span className="muted">({regular.length})</span></h2>
          <UserTable rows={regular} meId={meId} testid="users" onDelete={remove} {...accessProps} />

          {noCode.length > 0 && (
            <>
              <h2>Bez kodu aktywacji <span className="muted">({noCode.length})</span></h2>
              <UserTable rows={noCode} meId={meId} testid="nocode" onDelete={remove} {...accessProps} />
            </>
          )}
        </>
      )}

      <h2>Dostęp do sekcji</h2>
      <GlobalAccess onChange={setAccess} />

      <h2>Baza danych</h2>
      <div className="card stack" data-testid="db-usage">
        {!db ? <SkeletonRows rows={2} height={40} label="Ładowanie rozmiaru bazy" /> : <>
          <div className="row" style={{ alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <span className="big">{fmtMB(db.bytes)}</span>
            <span className="muted">z {fmtMB(db.limitBytes)} limitu · {fmtPct(db.percent)}</span>
          </div>
          <div className={`goal-bar db-bar${db.percent >= 70 ? " warn" : ""}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={db.percent} aria-label="Zajęte miejsce w bazie">
            <div style={{ width: `${Math.min(100, Math.max(0.5, db.percent))}%` }} />
          </div>
          <p className="muted" style={{ margin: 0 }}>
            Konta: {db.counts.users} · testy: {db.counts.tests} · odpowiedzi: {db.counts.answers.toLocaleString("pl-PL")} · sesje Nauki: {db.counts.sessions.toLocaleString("pl-PL")} · notatki: {db.counts.notes}
          </p>
          <table className="db-tables">
            <thead><tr><th>Co zajmuje miejsce</th><th>Wiersze</th><th>Rozmiar</th></tr></thead>
            <tbody>
              {db.tables.map((t) => (
                <tr key={t.name}><td>{TABLE_PL[t.name] ?? t.name}</td><td>{t.rows.toLocaleString("pl-PL")}</td><td>{fmtMB(t.bytes)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <button className="btn small secondary" onClick={cleanNow}>🧹 Posprzątaj teraz</button>
            <span className="muted" style={{ fontSize: ".85rem" }}>Automatycznie raz na dobę{db.cleanedAt ? ` · ostatnio ${fmtDate(db.cleanedAt)}` : ""}</span>
          </div>
          {cleaned && <p className="muted" role="status" style={{ margin: 0 }}>{cleaned}</p>}
        </>}
      </div>
    </div>
  );
}

function UserTable({ rows, meId, testid, extra, onDelete, global, openId, setOpenId, onAccess }: {
  rows: AdminUserRow[];
  meId: string;
  testid: string;
  extra?: (u: AdminUserRow) => React.ReactNode;
  onDelete: (u: AdminUserRow) => void;
  global: AccessSettings | null;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onAccess: (id: string, blocked: string[], mode: BlockMode | null) => void;
}) {
  if (rows.length === 0) return <div className="card"><p className="muted" style={{ margin: 0 }}>Brak.</p></div>;
  return (
    <div className="card table-wrap" data-testid={testid}>
      <table className="users">
        <thead>
          <tr><th>E-mail</th><th>Założone</th><th>Ostatnio</th><th>Testy</th><th>Nauka</th><th /></tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <Fragment key={u.id}>
            <tr data-testid="user-row">
              <td className="u-main">
                {u.email}
                {u.isOwner && <span className="tag">właściciel</span>}
                {u.adminRequested && <span className="tag">prosi o admina</span>}
                {u.id === meId && <span className="tag">Ty</span>}
              </td>
              <td data-label="Założone">{fmtDate(u.createdAt)}</td>
              <td data-label="Ostatnio">{fmtDate(u.lastActivity ?? u.lastLoginAt)}</td>
              <td data-label="Testy">
                <span>
                  {u.tests}{u.testPercent !== null && <> · {fmtPct(u.testPercent)}</>}
                  <br /><Link href={`/stats?user=${u.id}`}>statystyki</Link>
                </span>
              </td>
              <td data-label="Nauka">
                <span>
                  {u.learnSessions} sesji · {u.xp} XP
                  <br /><Link href={`/nauka?user=${u.id}`}>postęp</Link> · <Link href={`/nauka/statystyki?user=${u.id}`}>statystyki</Link>
                </span>
              </td>
              <td className="actions">
                <button className={`btn small secondary${u.blocked.length ? " has-blocks" : ""}`} aria-expanded={openId === u.id}
                  onClick={() => setOpenId(openId === u.id ? null : u.id)} data-testid="access-btn">
                  🔒 Dostęp{u.blocked.length ? ` (${u.blocked.length})` : ""}
                </button>
                {extra?.(u)}
                {!u.isOwner && u.id !== meId && (
                  <button className="btn small danger" onClick={() => onDelete(u)}>Usuń</button>
                )}
              </td>
            </tr>
            {openId === u.id && (
              <tr className="access-row"><td colSpan={6}>
                <UserAccess user={u} global={global} onSaved={(b, m) => onAccess(u.id, b, m)} />
              </td></tr>
            )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
