"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LogoutButton } from "@/app/konto/forms";

/** Menu konta (👤): e-mail, panel admina, ustawienia, wylogowanie; zamyka się po przejściu i kliknięciu obok. */
export function AccountMenu({ email, isAdmin }: { email: string; isAdmin: boolean }) {
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
    <details className="account-menu" ref={ref}>
      <summary aria-label="Konto"><span aria-hidden>👤</span><span className="email desktop-only">{email}</span></summary>
      <div className="account-panel">
        <span className="email" title={email}>{email}</span>
        {isAdmin && <Link href="/admin">Panel admina</Link>}
        <Link href="/konto/ustawienia">Ustawienia</Link>
        <Link href={`/zgloszenia?z=${encodeURIComponent(path)}`} data-testid="bug-link">🐞 Zgłoś błąd</Link>
        <LogoutButton />
      </div>
    </details>
  );
}
