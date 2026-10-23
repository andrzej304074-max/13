"use client";

import { useEffect, useState } from "react";
import { PreviewBanner } from "@/app/components/preview-banner";
import { FILTER_KEYS, MyBreakdown } from "./breakdown";

type Bank = "owe" | "ai" | "slownik";
const LABEL: Record<Bank, string> = { owe: "Archiwum OWE", ai: "Pytania AI", slownik: "Słownik" };

/** Moje statystyki wg działów, zagadnień i pojęć – przełącznik źródła pytań (Archiwum OWE / Pytania AI / Słownik). */
export function DzialyView() {
  const [bank, setBank] = useState<Bank | null>(null);
  useEffect(() => {
    let b: Bank = "owe";
    try {
      const v = new URLSearchParams(window.location.search).get("bank") ?? localStorage.getItem("owe:statsBank");
      if (v === "slownik" || v === "ai") b = v;
    } catch {}
    setBank(b);
  }, []);
  function choose(b: Bank) {
    setBank(b);
    try {
      localStorage.setItem("owe:statsBank", b);
      // filtry poprzedniego źródła nie przechodzą na nowe – każde źródło ma własne zapisane filtry
      const p = new URLSearchParams(window.location.search);
      for (const k of FILTER_KEYS) p.delete(k);
      p.set("bank", b);
      window.history.replaceState(null, "", `/stats/dzialy?${p}`);
    } catch {}
  }
  return (
    <div className="stack wide">
      <PreviewBanner />
      <header className="page-head"><h1>Działy i pojęcia – jak mi idzie</h1></header>
      <div className="seg" role="group" aria-label="Źródło pytań" data-testid="dzialy-bank">
        {(["owe", "ai", "slownik"] as Bank[]).map((b) => (
          <button key={b} className={b === bank ? "active" : ""} aria-pressed={b === bank} onClick={() => choose(b)} data-bank={b}>
            {LABEL[b]}
          </button>
        ))}
      </div>
      {bank && <MyBreakdown key={bank} bank={bank} />}
    </div>
  );
}
