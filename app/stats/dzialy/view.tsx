"use client";

import { useEffect, useState } from "react";
import { PreviewBanner } from "@/app/components/preview-banner";
import { MyBreakdown } from "./breakdown";

type Bank = "owe" | "slownik";

/** Moje statystyki wg działów, zagadnień i pojęć – przełącznik bazy pytań (olimpiady / słownik). */
export function DzialyView() {
  const [bank, setBank] = useState<Bank | null>(null);
  useEffect(() => {
    let b: Bank = "owe";
    try {
      const v = new URLSearchParams(window.location.search).get("bank") ?? localStorage.getItem("owe:statsBank");
      if (v === "slownik") b = "slownik";
    } catch {}
    setBank(b);
  }, []);
  function choose(b: Bank) {
    setBank(b);
    try {
      localStorage.setItem("owe:statsBank", b);
      const p = new URLSearchParams(window.location.search);
      p.set("bank", b);
      window.history.replaceState(null, "", `/stats/dzialy?${p}`);
    } catch {}
  }
  return (
    <div className="stack wide">
      <PreviewBanner />
      <header className="page-head"><h1>Działy i pojęcia – jak mi idzie</h1></header>
      <div className="seg" role="group" aria-label="Baza pytań">
        {(["owe", "slownik"] as Bank[]).map((b) => (
          <button key={b} className={b === bank ? "active" : ""} aria-pressed={b === bank} onClick={() => choose(b)}>
            {b === "owe" ? "Pytania z olimpiad" : "Pytania ze słownika"}
          </button>
        ))}
      </div>
      {bank && <MyBreakdown key={bank} bank={bank} />}
    </div>
  );
}
