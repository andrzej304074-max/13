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

  async function remove(u: AdminUserRow) {
    if (!confirm(`Usunąć konto ${u.email}? Znikną też wszystkie jego testy i postęp w nauce. Tego nie da się cofnąć.`)) return;
    try {
      await api(`/api/admin/uzytkownicy/${u.id}`, { method: "DELETE" });
      await loadUsers();
    } catch (e) {
      fail(e);
    }
  }

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

      <h2>Użytkownicy {users && <span className="muted">({users.length})</span>}</h2>
      <div className="card table-wrap">
        {!users ? <p className="muted">Ładowanie…</p> : (
          <table className="users">
            <thead>
              <tr><th>E-mail</th><th>Założone</th><th>Ostatnio</th><th>Testy</th><th>Nauka</th><th /></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} data-testid="user-row">
                  <td>
                    {u.email}
                    {u.isOwner && <span className="tag">właściciel</span>}
                    {u.isAdmin && !u.isOwner && <span className="tag">admin</span>}
                    {!u.active && <span className="tag">nieaktywne</span>}
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
                  <td>
                    {!u.isOwner && u.id !== meId && (
                      <button className="btn small danger" onClick={() => remove(u)}>Usuń</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
