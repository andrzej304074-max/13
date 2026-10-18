"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { loadData } from "@/lib/data-client";
import { navView } from "@/lib/access-core";
import { activeTab, isFocusPage } from "@/lib/nav";
import { useAccess } from "./access";

/** Działy w nagłówku (komputer) i w dolnym pasku (telefon). Link prowadzi do ostatnio odwiedzonej podzakładki działu. */
export function SectionNav({ variant }: { variant: "top" | "bottom" }) {
  const path = usePathname();
  const cur = activeTab(path);
  const { blocks, mode } = useAccess();
  const view = navView(blocks, mode);
  return (
    <nav className={variant === "top" ? "sections desktop-only" : "bottom-bar mobile-only"} aria-label="Działy">
      {view.map((s) => {
        const on = cur?.section.id === s.id;
        const lock = s.state === "lock";
        return (
          <Link key={s.id} href={s.href} className={`${on ? "active" : ""}${lock ? " locked" : ""}`} aria-current={on ? "page" : undefined}
            title={lock ? "Sekcja wyłączona przez administratora" : undefined}>
            <span className="ico" aria-hidden>{lock ? "🔒" : s.icon}</span>
            <span>{s.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Dane zakładek działu pobierane w tle (gdy przeglądarka jest bezczynna) – pierwsze wejście w zakładkę nie czeka na sieć. */
const WARM: Record<string, string[]> = {
  pojecia: ["/api/dane/hasla", "/api/dane/owe-stats"],
  nauka: ["/api/dane/hasla"],
  statystyki: ["/api/dane/nauka-meta"],
};

/** Podzakładki bieżącego działu – pasek nad treścią strony (na telefonie przewijany poziomo). */
export function SubTabs() {
  const path = usePathname();
  const cur = activeTab(path);
  const section = cur?.section.id;
  useEffect(() => {
    if (!section || !WARM[section]) return;
    const run = () => WARM[section].forEach((u) => loadData(u).catch(() => {}));
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(run, { timeout: 3000 }); return () => w.cancelIdleCallback?.(id); }
    const t = setTimeout(run, 1500);
    return () => clearTimeout(t);
  }, [section]);
  const { blocks, mode } = useAccess();
  // na telefonie pasek przewija się poziomo – aktywna zakładka zawsze widoczna (np. „Literatura” na końcu listy)
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current, on = el?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!el || !on || el.scrollWidth <= el.clientWidth) return;
    const b = el.getBoundingClientRect(), r = on.getBoundingClientRect();
    if (r.left < b.left || r.right > b.right) el.scrollLeft += r.left - b.left - (b.width - r.width) / 2;
  }, [path]);
  if (!cur || isFocusPage(path)) return null;
  const sec = navView(blocks, mode).find((s) => s.id === cur.section.id);
  if (!sec || sec.tabs.length < 2) return null;
  return (
    <div className="subtabs" role="tablist" aria-label={cur.section.label} ref={bar}>
      {sec.tabs.map((t) => {
        const on = t.href === cur.tab.href;
        const lock = t.state === "lock";
        return (
          <Link key={t.href} href={t.href} role="tab" aria-selected={on} className={`${on ? "active" : ""}${lock ? " locked" : ""}`}
            title={lock ? "Sekcja wyłączona przez administratora" : undefined}>{lock ? "🔒 " : ""}{t.label}</Link>
        );
      })}
    </div>
  );
}
