"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LogoutButton } from "@/app/konto/forms";

/** Menu nagłówka na telefonie (☰); zamyka się po przejściu na inną stronę i po kliknięciu poza nim. */
export function MobileMenu({ email, active, isAdmin }: { email: string; active: boolean; isAdmin: boolean }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [path]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false;
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <details className="mobile-menu" ref={ref}>
      <summary aria-label="Menu">☰ Menu</summary>
      <div className="mobile-menu-panel">
        {active && (
          <>
            <Link href="/">Nowy test</Link>
            <Link href="/slownik">Słownik</Link>
            <Link href="/nauka">Nauka</Link>
            <Link href="/pojecia">Pojęcia</Link>
            <Link href="/pojecia/statystyki">Statystyki pytań OWE</Link>
            <Link href="/stats">Statystyki</Link>
            <hr />
          </>
        )}
        <span className="email" title={email}>{email}</span>
        {isAdmin && <Link href="/admin">Panel admina</Link>}
        <Link href="/konto/ustawienia">Ustawienia</Link>
        <LogoutButton />
      </div>
    </details>
  );
}
