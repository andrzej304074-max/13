"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
          <Link key={s.id} href={s.tabs[0].href} className={on ? "active" : ""} aria-current={on ? "page" : undefined} prefetch>
            <span className="ico" aria-hidden>{s.icon}</span>
            <span>{s.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Podzakładki bieżącego działu – pasek nad treścią strony (na telefonie przewijany poziomo). */
export function SubTabs() {
  const path = usePathname();
  const cur = activeTab(path);
  if (!cur || isFocusPage(path)) return null;
  return (
    <div className="subtabs" role="tablist" aria-label={cur.section.label}>
      {cur.section.tabs.map((t) => {
        const on = t.href === cur.tab.href;
        return (
          <Link key={t.href} href={t.href} role="tab" aria-selected={on} className={on ? "active" : ""} prefetch>{t.label}</Link>
        );
      })}
    </div>
  );
}
