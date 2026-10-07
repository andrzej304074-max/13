"use client";

import { useEffect } from "react";
import type { Exercise } from "@/lib/nauka-logic";
import type { CourseItem } from "@/lib/nauka-types";

/** Wspólne elementy ćwiczeń odtwarzacza lekcji. */

export type Feedback = { correct: boolean; title: string; detail?: React.ReactNode } | null;

export type OnResult = (entries: { item: CourseItem; correct: boolean }[], ex: Exercise, fb: NonNullable<Feedback>) => void;

/** Wspólny dolny przycisk „Sprawdź” (ukryty po sprawdzeniu). */
export function CheckButton({ disabled, onClick, locked, label = "Sprawdź" }: { disabled: boolean; onClick: () => void; locked: boolean; label?: string }) {
  if (locked) return null;
  return (
    <div className="learn-actions">
      <button className="btn" disabled={disabled} onClick={onClick}>{label}</button>
    </div>
  );
}

export function useNumberKeys(n: number, locked: boolean, pick: (i: number) => void) {
  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < n) pick(i);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, locked, pick]);
}

export function useEnter(enabled: boolean, fn: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, fn]);
}

/** Tekst studium przypadku nad pytaniem. */
export function CaseContext({ ctx }: { ctx?: string }) {
  if (!ctx) return null;
  return (
    <div className="case-ctx">
      <small>📄 Przypadek</small>
      <p style={{ margin: 0 }}>{ctx}</p>
    </div>
  );
}
