"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LogoutButton } from "@/app/konto/forms";
import { BUG_EVENT } from "./bug-popup";

/** Menu konta (👤): e-mail, panel admina, ustawienia, wylogowanie; zamyka się po przejściu i kliknięciu obok. */
export function AccountMenu({ email, isAdmin, isReviewer = false }: { email: string; isAdmin: boolean; isReviewer?: boolean }) {
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
        {(isAdmin || isReviewer) && <Link href="/recenzja" data-testid="review-link">Recenzja treści</Link>}
        <Link href="/konto/ustawienia">Ustawienia</Link>
        <button type="button" className="account-link" onClick={() => { if (ref.current) ref.current.open = false; window.dispatchEvent(new Event(BUG_EVENT)); }}
          data-testid="bug-link">🐞 Zgłoś błąd</button>
        <LogoutButton />
      </div>
    </details>
  );
}
