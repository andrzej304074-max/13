"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

/** Pola, w których wolno zaznaczać, kopiować i wklejać (notatki, brudnopisy, formularze). */
const EDITABLE = "input, textarea, select, [contenteditable=''], [contenteditable='true'], [data-allow-copy]";

function editable(n: EventTarget | Node | null | undefined): boolean {
  const el = n instanceof Element ? n : n instanceof Node ? n.parentElement : null;
  return !!el?.closest(EDITABLE);
}

/**
 * Utrudnienie kopiowania treści (pytań, haseł, Podręcznika): bez schowka, menu kontekstowego, przeciągania
 * i skrótów Ctrl/Cmd+C/X/A/S/P/U poza polami edycji. Zaznaczanie w Podręczniku działa (podkreślenia i „Do notatki”
 * mają własne menu), ale skopiować zaznaczenia się nie da. To tylko utrudnienie – realną ochroną są limity na serwerze.
 */
export function CopyGuard() {
  useEffect(() => {
    const sel = () => window.getSelection()?.anchorNode;
    const block = (e: Event) => {
      if (editable(e.target) && editable(sel() ?? e.target)) return;
      e.preventDefault();
      if (e instanceof ClipboardEvent) e.clipboardData?.setData("text/plain", "");
    };
    const keys = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "p") { e.preventDefault(); return; }
      if (!["c", "x", "a", "s", "u"].includes(k)) return;
      if (editable(e.target) && k !== "u") return;
      e.preventDefault();
    };
    const drag = (e: DragEvent) => { if (!editable(e.target)) e.preventDefault(); };
    document.addEventListener("copy", block, true);
    document.addEventListener("cut", block, true);
    document.addEventListener("contextmenu", block, true);
    document.addEventListener("dragstart", drag, true);
    document.addEventListener("keydown", keys, true);
    return () => {
      document.removeEventListener("copy", block, true);
      document.removeEventListener("cut", block, true);
      document.removeEventListener("contextmenu", block, true);
      document.removeEventListener("dragstart", drag, true);
      document.removeEventListener("keydown", keys, true);
    };
  }, []);
  return null;
}

/** Dyskretny znak wodny z nazwą konta – na stronach z treścią (bez ekranów konta i panelu admina). */
export function Watermark({ name }: { name: string }) {
  const path = usePathname();
  const bg = useMemo(() => {
    const esc = name.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><text x='20' y='120' transform='rotate(-24 160 100)' font-family='sans-serif' font-size='15' fill='rgb(128,128,128)' fill-opacity='0.09'>${esc}</text></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [name]);
  if (/^\/(konto|admin|zablokowane)(\/|$)/.test(path)) return null;
  return <div className="watermark" aria-hidden style={{ backgroundImage: bg }} data-testid="watermark" />;
}
