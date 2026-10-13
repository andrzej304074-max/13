import type { Metadata } from "next";
import Link from "next/link";
import { currentUser, type User } from "@/lib/auth";
import { AccountMenu } from "./components/account-menu";
import { QuickNotes } from "./components/notes/quick-notes";
import { SectionNav, SubTabs } from "./components/nav";
import { AccessGuard, AccessProvider } from "./components/access";
import { ReaderBar } from "./components/speech/reader-bar";
import { accessFor } from "@/lib/access";
import { firstAllowed, isBlocked, type BlockMode } from "@/lib/access-core";
import "./globals.css";

// nagłówek zależy od zalogowanego użytkownika (ciasteczko sesji)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Testy OWE",
  description: "Testy z pytań z poprzednich edycji Olimpiady Wiedzy Ekonomicznej",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let me: User | null = null;
  let access: { blocks: string[]; mode: BlockMode } = { blocks: [], mode: "hide" };
  try {
    me = await currentUser();
    if (me?.active) access = await accessFor(me);
  } catch (e) {
    console.error(e);
  }
  // szybkie notatki to zwykłe notatki – znikają razem z podzakładką Notatki; logo prowadzi do pierwszej dostępnej strony
  const notesOff = isBlocked("/notatki", access.blocks);
  const home = isBlocked("/", access.blocks) ? firstAllowed(access.blocks) ?? "/konto/ustawienia" : "/";
  return (
    <html lang="pl">
      <head>
        {/* czcionka tekstu potrzebna od pierwszego ekranu – pobierana równolegle z CSS */}
        <link rel="preload" href="/fonts/lexend-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <AccessProvider blocks={access.blocks} mode={access.mode}>
          <header className="top">
            <Link href={home} className="brand">Testy OWE</Link>
            {me?.active && <SectionNav variant="top" />}
            {me?.active && !notesOff && <QuickNotes />}
            {me && <AccountMenu email={me.email} isAdmin={me.isAdmin} />}
          </header>
          <main className="container">
            {me?.active && <SubTabs />}
            {me?.active ? <AccessGuard>{children}</AccessGuard> : children}
          </main>
          {me?.active && <SectionNav variant="bottom" />}
          {me?.active && <ReaderBar />}
        </AccessProvider>
      </body>
    </html>
  );
}
