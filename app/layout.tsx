import type { Metadata } from "next";
import Link from "next/link";
import { currentUser, type User } from "@/lib/auth";
import { LogoutButton } from "./konto/forms";
import { MobileMenu } from "./components/mobile-menu";
import "./globals.css";

// nagłówek zależy od zalogowanego użytkownika (ciasteczko sesji)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Testy OWE",
  description: "Testy z pytań z poprzednich edycji Olimpiady Wiedzy Ekonomicznej",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let me: User | null = null;
  try {
    me = await currentUser();
  } catch (e) {
    console.error(e);
  }
  return (
    <html lang="pl">
      <body>
        <header className="top">
          <Link href="/" className="brand">Testy OWE</Link>
          {me?.active ? (
            <nav className="desktop-only">
              <Link href="/">Nowy test</Link>
              <Link href="/slownik">Słownik</Link>
              <Link href="/nauka">Nauka</Link>
              <Link href="/pojecia">Pojęcia</Link>
              <Link href="/fiszki">Fiszki</Link>
              <Link href="/stats">Statystyki</Link>
            </nav>
          ) : null}
          {me && <MobileMenu email={me.email} active={me.active} isAdmin={me.isAdmin} />}
        </header>
        {me && (
          <div className="container desktop-only" style={{ paddingBottom: 0 }}>
            <div className="user-nav">
              <span className="email" title={me.email}>{me.email}</span>
              {me.isAdmin && <Link href="/admin">Panel admina</Link>}
              <Link href="/konto/ustawienia">Ustawienia</Link>
              <LogoutButton />
            </div>
          </div>
        )}
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
