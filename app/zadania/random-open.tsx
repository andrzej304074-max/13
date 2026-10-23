"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import type { OpenKind, OpenMeta } from "@/lib/otwarte";
import { pickRandom } from "./list-view";

type Row = OpenMeta & { attempts: number };

/** „🎲 Losuj zadanie / esej” – losowo z zakresu edycji i etapów (najpierw nierozwiązane). */
export function RandomOpenButton({ kind, edFrom = 21, edTo = 39, stages }: { kind: OpenKind; edFrom?: number; edTo?: number; stages?: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function go() {
    setBusy(true);
    setMsg(null);
    try {
      const rows = (await api<Row[]>(`/api/otwarte?rodzaj=${kind}`))
        .filter((r) => r.ed >= edFrom && r.ed <= edTo && (!stages?.length || stages.includes(r.stage)));
      if (!rows.length) { setMsg("Brak pozycji dla wybranych edycji i etapów."); return; }
      router.push(`/${kind === "zadanie" ? "zadania" : "eseje"}/${pickRandom(rows).id}`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="btn secondary" onClick={go} disabled={busy} data-testid={`random-${kind}`}>
        🎲 Losuj {kind === "zadanie" ? "zadanie" : "esej"}
      </button>
      {msg && <span className="muted small">{msg}</span>}
    </>
  );
}
