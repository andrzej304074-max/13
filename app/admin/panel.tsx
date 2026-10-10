"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, fmtPct } from "@/lib/client";
import type { AdminUserRow } from "@/lib/auth";

type CodeInfo = { code: string | null; updatedAt: string | null };
type AdminCode = { code: string; createdAt: string; expiresAt: string; createdBy: string | null };

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }) : "–";

export function AdminPanel({ meId }: { meId: string }) {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [code, setCode] = useState<CodeInfo | null>(null);
  const [adminCodes, setAdminCodes] = useState<AdminCode[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Błąd.");
  const loadUsers = () => api<AdminUserRow[]>("/api/admin/uzytkownicy").then(setUsers).catch(fail);

  useEffect(() => {
    loadUsers();
    api<CodeInfo>("/api/admin/kod-aktywacji").then(setCode).catch(fail);
    api<AdminCode[]>("/api/admin/kody-admina").then(setAdminCodes).catch(fail);
  }, []);

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

      <h2>Kod aktywacji</h2>
      <div className="card stack">
        <p className="muted" style={{ margin: 0 }}>
          Podaj ten kod osobom, które mają korzystać z aplikacji. Wpisują go przy zakładaniu konta.
        </p>
        <div className="row">
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
          <table className="users">
            <thead><tr><th>Kod</th><th>Utworzył</th><th>Ważny do</th><th /></tr></thead>
            <tbody>
              {adminCodes.map((c) => (
                <tr key={c.code}>
                  <td><code data-testid="admin-code">{c.code}</code></td>
                  <td>{c.createdBy ?? "–"}</td>
                  <td>{fmtDate(c.expiresAt)}</td>
                  <td><button className="btn small secondary" onClick={() => revoke(c.code)}>Unieważnij</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!users ? <p className="muted">Ładowanie użytkowników…</p> : (
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
                      <td>{u.email}</td>
                      <td>{fmtDate(u.createdAt)}</td>
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
                      <td>{u.email}</td>
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
          <UserTable rows={admins} meId={meId} testid="admins"
            extra={(u) => !u.isOwner && u.id !== meId && (
              <button className="btn small secondary" onClick={() => act(u, "odbierz-admina", `Odebrać rolę administratora ${u.email}?`)}>Odbierz admina</button>
            )}
            onDelete={remove} />

          <h2>Użytkownicy <span className="muted">({regular.length})</span></h2>
          <UserTable rows={regular} meId={meId} testid="users" onDelete={remove} />

          {noCode.length > 0 && (
            <>
              <h2>Bez kodu aktywacji <span className="muted">({noCode.length})</span></h2>
              <UserTable rows={noCode} meId={meId} testid="nocode" onDelete={remove} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function UserTable({ rows, meId, testid, extra, onDelete }: {
  rows: AdminUserRow[];
  meId: string;
  testid: string;
  extra?: (u: AdminUserRow) => React.ReactNode;
  onDelete: (u: AdminUserRow) => void;
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
            <tr key={u.id} data-testid="user-row">
              <td>
                {u.email}
                {u.isOwner && <span className="tag">właściciel</span>}
                {u.adminRequested && <span className="tag">prosi o admina</span>}
                {u.id === meId && <span className="tag">Ty</span>}
              </td>
              <td>{fmtDate(u.createdAt)}</td>
              <td>{fmtDate(u.lastActivity ?? u.lastLoginAt)}</td>
              <td>
                {u.tests}{u.testPercent !== null && <> · {fmtPct(u.testPercent)}</>}
                <br /><Link href={`/stats?user=${u.id}`}>statystyki</Link>
              </td>
              <td>
                {u.learnSessions} sesji · {u.xp} XP
                <br /><Link href={`/nauka?user=${u.id}`}>postęp</Link> · <Link href={`/nauka/statystyki?user=${u.id}`}>statystyki</Link>
              </td>
              <td className="actions">
                {extra?.(u)}
                {!u.isOwner && u.id !== meId && (
                  <button className="btn small danger" onClick={() => onDelete(u)}>Usuń</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
