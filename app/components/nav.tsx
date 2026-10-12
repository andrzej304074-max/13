"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { loadData } from "@/lib/data-client";
import { activeTab, isFocusPage, NAV } from "@/lib/nav";

/** Działy w nagłówku (komputer) i w dolnym pasku (telefon). Link prowadzi do ostatnio odwiedzonej podzakładki działu. */
export function SectionNav({ variant }: { variant: "top" | "bottom" }) {
  const path = usePathname();
  const cur = activeTab(path);
  if (variant === "bottom" && isFocusPage(path)) return null;
  return (
    <nav className={variant === "top" ? "sections desktop-only" : "bottom-bar mobile-only"} aria-label="Działy">
      {NAV.map((s) => {
        const on = cur?.section.id === s.id;
        return (
          <Link key={s.id} href={s.tabs[0].href} className={on ? "active" : ""} aria-current={on ? "page" : undefined}>
            <span className="ico" aria-hidden>{s.icon}</span>
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
  if (!cur || isFocusPage(path)) return null;
  return (
    <div className="subtabs" role="tablist" aria-label={cur.section.label}>
      {cur.section.tabs.map((t) => {
        const on = t.href === cur.tab.href;
        return (
          <Link key={t.href} href={t.href} role="tab" aria-selected={on} className={on ? "active" : ""}>{t.label}</Link>
        );
      })}
    </div>
  );
}
