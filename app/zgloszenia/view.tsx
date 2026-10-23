"use client";

import { useEffect, useState } from "react";
import { SkeletonRows } from "@/app/components/loading-page";
import { api } from "@/lib/client";
import type { BugReport } from "@/lib/bugs";
import { BUG_KIND_LABEL, BUG_LIMITS, BUG_STATUS_LABEL } from "@/lib/bugs-core";
import { BugForm } from "@/app/components/bug-form";

const fmt = (s: string) => new Date(s).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });

/** „🐞 Zgłoś błąd” (pełna strona): formularz + strona, z której przyszedłeś (`?z=`), i sekcja (`?s=`); lista moich zgłoszeń z odpowiedzią admina. */
export function BugsView() {
  const [page, setPage] = useState("");
  const [section, setSection] = useState("");
  const [mine, setMine] = useState<BugReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const from = q.get("z") ?? "";
    setPage(from.startsWith("/") && !from.startsWith("/zgloszenia") ? from : "");
    setSection((q.get("s") ?? "").slice(0, BUG_LIMITS.section));
    api<BugReport[]>("/api/zgloszenia").then(setMine).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="stack">
      <h1>🐞 Zgłoś błąd</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Opisz, co się stało: co robiłeś, co powinno się stać, a co się stało. Do zgłoszenia dołączamy stronę i rodzaj urządzenia.
        Szybciej zgłosisz z dowolnej strony: menu 👤 → „🐞 Zgłoś błąd” otwiera okienko z wyborem sekcji strony.
      </p>
      <BugForm page={page} editablePage sections={section ? [section] : undefined} section={section}
        onSent={(r) => setMine((m) => [r, ...(m ?? [])])} />
      {error && <p className="error" role="alert">{error}</p>}

      <h2>Moje zgłoszenia</h2>
      {!mine ? <SkeletonRows rows={2} height={64} label="Ładowanie zgłoszeń" /> : mine.length === 0 ? (
        <p className="muted">Nie masz jeszcze zgłoszeń.</p>
      ) : (
        <ul className="bug-list" data-testid="bug-mine">
          {mine.map((b) => (
            <li key={b.id} className="card bug-item">
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <span className={`tag bug-status ${b.status}`}>{BUG_STATUS_LABEL[b.status]}</span>
                <span className={`tag bug-kind ${b.kind}`}>{BUG_KIND_LABEL[b.kind]}</span>
                <span className="muted small">{fmt(b.created_at)}{b.page ? ` · ${b.page}` : ""}{b.section ? ` · ${b.section}` : ""}</span>
              </div>
              <p className="bug-text">{b.text}</p>
              {b.note && <p className="bug-note"><strong>Odpowiedź administratora:</strong> {b.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
