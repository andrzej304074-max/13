"use client";

import { useState } from "react";
import { pause, play, resume, useSpeech } from "@/lib/speech";
import type { SpeechItem } from "@/lib/speech-text";

/**
 * Przycisk 🔊: czyta element albo całą listę (od `start`). Gdy gra jego grupa – ⏸/▶ zamiast startu od nowa.
 * `items` jako funkcja – lista budowana dopiero po kliknięciu (np. 1700 haseł tabeli).
 */
export function SpeakButton({ items, group, start = 0, continuous = true, label = "Czytaj", compact = false, className = "", testid }: {
  items: SpeechItem[] | (() => SpeechItem[]);
  group: string;
  start?: number;
  continuous?: boolean;
  label?: string;
  compact?: boolean;
  className?: string;
  testid?: string;
}) {
  const sp = useSpeech();
  const [warn, setWarn] = useState(false);
  const mine = sp.group === group && sp.status !== "idle";
  const click = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!sp.supported || !sp.voices.length) { setWarn(true); setTimeout(() => setWarn(false), 6000); }
    if (!sp.supported) return;
    if (mine) { if (sp.status === "playing") pause(); else resume(); return; }
    play(typeof items === "function" ? items() : items, start, { group, continuous });
  };
  const icon = mine ? (sp.status === "playing" ? "⏸" : "▶") : "🔊";
  const text = mine ? (sp.status === "playing" ? "Pauza" : "Wznów") : label;
  return (
    <span className="speak-wrap">
      <button type="button" className={`speak-btn${compact ? " compact" : ""}${mine ? " on" : ""} ${className}`} onClick={click}
        aria-label={`${text}${compact ? ` – ${label}` : ""}`} title={compact ? label : undefined} data-testid={testid}>
        <span aria-hidden>{icon}</span>{!compact && <span>{text}</span>}
      </button>
      {warn && (
        <span className="speak-warn" role="status">
          {!sp.supported ? "Ta przeglądarka nie czyta tekstu na głos." : "Brak polskiego głosu w systemie – dodaj go: Android – Ustawienia → Zamiana tekstu na mowę (Google), Windows – Ustawienia → Czas i język → Mowa → Dodaj głosy (polski), iPhone – Ustawienia → Dostępność → Mowa → Głosy."}
        </span>
      )}
    </span>
  );
}
