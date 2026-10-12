import type { Metadata } from "next";
import Link from "next/link";
import { currentUser, type User } from "@/lib/auth";
import { AccountMenu } from "./components/account-menu";
import { SectionNav, SubTabs } from "./components/nav";
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
      <head>
        {/* czcionka tekstu potrzebna od pierwszego ekranu – pobierana równolegle z CSS */}
        <link rel="preload" href="/fonts/lexend-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <header className="top">
          <Link href="/" className="brand">Testy OWE</Link>
          {me?.active && <SectionNav variant="top" />}
          {me && <AccountMenu email={me.email} isAdmin={me.isAdmin} />}
        </header>
        <main className="container">
          {me?.active && <SubTabs />}
          {children}
        </main>
        {me?.active && <SectionNav variant="bottom" />}
      </body>
    </html>
  );
}
