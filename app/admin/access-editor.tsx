"use client";

import { Fragment, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { effectiveBlocks, keyLabel, type AccessSettings, type BlockMode } from "@/lib/access-core";
import { NAV } from "@/lib/nav";

type Status = "idle" | "saving" | "saved" | "error";
const STATUS: Record<Status, string> = { idle: "", saving: "Zapisywanie…", saved: "Zapisano ✓", error: "Nie zapisano" };

/** Drzewko działów i podzakładek z kolumnami przełączników (zaznaczony dział blokuje całe jego podzakładki). */
function Tree({ columns, value, onToggle, testid }: {
  columns: { id: string; label: string }[];
  value: Record<string, string[]>;
  onToggle: (col: string, key: string, on: boolean) => void;
  testid: string;
}) {
  const has = (col: string, key: string) => value[col]?.includes(key) ?? false;
  return (
    <table className="access-tree" data-testid={testid}>
      <thead>
        <tr><th>Sekcja</th>{columns.map((c) => <th key={c.id}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {NAV.map((s) => (
          <Fragment key={s.id}>
            <tr className="access-section">
              <td>{s.icon} {s.label} <span className="muted">(cały dział)</span></td>
              {columns.map((c) => (
                <td key={c.id}>
                  <input type="checkbox" checked={has(c.id, s.id)} onChange={(e) => onToggle(c.id, s.id, e.target.checked)}
                    aria-label={`${c.label}: zablokuj dział ${s.label}`} data-key={s.id} data-col={c.id} />
                </td>
              ))}
            </tr>
            {s.tabs.map((t) => (
              <tr key={t.href} className="access-tab">
                <td>{t.label}</td>
                {columns.map((c) => {
                  const viaSection = has(c.id, s.id);
                  return (
                    <td key={c.id}>
                      <input type="checkbox" checked={viaSection || has(c.id, t.href)} disabled={viaSection}
                        onChange={(e) => onToggle(c.id, t.href, e.target.checked)} aria-label={`${c.label}: zablokuj ${s.label} → ${t.label}`}
                        data-key={t.href} data-col={c.id} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

const toggleKey = (list: string[], key: string, on: boolean) => (on ? [...new Set([...list, key])] : list.filter((k) => k !== key));

function ModeSwitch({ value, onChange, inherit, name }: { value: BlockMode | null; onChange: (m: BlockMode | null) => void; inherit?: BlockMode; name: string }) {
  const opts: { v: BlockMode | null; label: string }[] = [
    ...(inherit ? [{ v: null, label: `jak dla wszystkich (${inherit === "hide" ? "ukryj" : "kłódka"})` }] : []),
    { v: "hide", label: "Ukryj zablokowane" },
    { v: "lock", label: "Pokaż z kłódką 🔒" },
  ];
  return (
    <div className="seg access-mode" role="radiogroup" aria-label="Wygląd zablokowanych sekcji">
      {opts.map((o) => (
        <button key={String(o.v)} type="button" role="radio" aria-checked={value === o.v} className={value === o.v ? "active" : ""}
          onClick={() => onChange(o.v)} data-mode={String(o.v)} name={name}>{o.label}</button>
      ))}
    </div>
  );
}

/** Karta „Dostęp do sekcji” – blokady dla wszystkich i dla wszystkich oprócz adminów oraz domyślny wygląd. */
export function GlobalAccess({ onChange }: { onChange?: (s: AccessSettings) => void }) {
  const [s, setS] = useState<AccessSettings | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<AccessSettings>("/api/admin/dostep").then((v) => { setS(v); onChange?.(v); }).catch((e) => setError(e.message)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(next: AccessSettings) {
    setS(next);
    setStatus("saving");
    try {
      const v = await api<AccessSettings>("/api/admin/dostep", { method: "PUT", body: JSON.stringify(next) });
      setS(v);
      onChange?.(v);
      setStatus("saved");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }

  if (error && !s) return <p className="error">{error}</p>;
  if (!s) return <div className="skeleton" style={{ height: 220 }} />;
  return (
    <div className="card stack" data-testid="access-global">
      <p className="muted" style={{ margin: 0 }}>
        Zaznaczona sekcja znika (albo dostaje kłódkę) w menu, jej strony pokazują komunikat o blokadzie, a dane nie są wysyłane.
        „Wszyscy” obejmuje też administratorów; „Oprócz adminów” – tylko zwykłe konta. Blokady pojedynczych kont – przycisk „Dostęp” przy koncie.
        Panelu admina i ustawień konta nie da się zablokować.
      </p>
      <ModeSwitch value={s.mode} onChange={(m) => m && save({ ...s, mode: m })} name="global" />
      <div className="table-wrap">
        <Tree testid="access-tree-global" columns={[{ id: "all", label: "Wszyscy" }, { id: "nonAdmins", label: "Oprócz adminów" }]}
          value={{ all: s.all, nonAdmins: s.nonAdmins }}
          onToggle={(col, key, on) => save({ ...s, [col]: toggleKey(col === "all" ? s.all : s.nonAdmins, key, on) })} />
      </div>
      <span className={`ne-status ${status}`} role="status">{STATUS[status]}</span>
      {error && <p className="error small">{error}</p>}
    </div>
  );
}

/** Dostęp jednego konta: własne blokady, wygląd menu i podgląd łącznych blokad (z globalnymi). */
export function UserAccess({ user, global, onSaved }: {
  user: { id: string; email: string; isAdmin: boolean; blocked: string[]; blockMode: BlockMode | null };
  global: AccessSettings | null;
  onSaved: (blocked: string[], mode: BlockMode | null) => void;
}) {
  const [blocked, setBlocked] = useState(user.blocked);
  const [mode, setMode] = useState<BlockMode | null>(user.blockMode);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function save(b: string[], m: BlockMode | null) {
    setBlocked(b);
    setMode(m);
    setStatus("saving");
    try {
      await api(`/api/admin/uzytkownicy/${user.id}/dostep`, { method: "PUT", body: JSON.stringify({ blocked: b, mode: m }) });
      setStatus("saved");
      onSaved(b, m);
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }

  const total = global ? effectiveBlocks({ isAdmin: user.isAdmin, blocked }, global) : blocked;
  return (
    <div className="stack access-user" data-testid="access-user">
      <strong>Dostęp: {user.email}</strong>
      <ModeSwitch value={mode} inherit={global?.mode ?? "hide"} onChange={(m) => save(blocked, m)} name={`u-${user.id}`} />
      <div className="table-wrap">
        <Tree testid="access-tree-user" columns={[{ id: "u", label: "Zablokuj" }]} value={{ u: blocked }}
          onToggle={(_c, key, on) => save(toggleKey(blocked, key, on), mode)} />
      </div>
      <p className="muted" style={{ margin: 0, fontSize: ".88rem" }} data-testid="access-total">
        Łącznie zablokowane dla tego konta (z ustawieniami dla wszystkich): {total.length ? total.map(keyLabel).join(", ") : "nic"}.
      </p>
      <span className={`ne-status ${status}`} role="status">{STATUS[status]}</span>
      {error && <p className="error small">{error}</p>}
    </div>
  );
}
