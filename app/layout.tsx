import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "./components/back";
import { currentUser, type User } from "@/lib/auth";
import { AccountMenu } from "./components/account-menu";
import { AnnounceBell, PinnedBar } from "./components/announce-bell";
import { StreakBadge } from "./components/streak";
import { QuickNotes } from "./components/notes/quick-notes";
import { BugPopup } from "./components/bug-popup";
import { SectionNav, SubTabs } from "./components/nav";
import { AccessGuard, AccessProvider } from "./components/access";
import { ReaderBar } from "./components/speech/reader-bar";
import { CopyGuard } from "./components/copy-guard";
import { ToTop } from "./components/to-top";
import { accessFor } from "@/lib/access";
import { firstAllowed, isBlocked, type BlockMode } from "@/lib/access-core";
import "./globals.css";

// nagłówek zależy od zalogowanego użytkownika (ciasteczko sesji)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Testy OWE",
  description: "Testy z pytań z poprzednich edycji Olimpiady Wiedzy Ekonomicznej",
  robots: { index: false, follow: false },
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
            {me?.active && <BackButton />}
            <Link href={home} className="brand">Testy OWE</Link>
            {me?.active && <SectionNav variant="top" />}
            {me?.active && !notesOff && <QuickNotes />}
            {me?.active && <StreakBadge />}
            {me?.active && <AnnounceBell />}
            {me && <AccountMenu email={me.email} isAdmin={me.isAdmin} />}
          </header>
          <main className="container">
            {me?.active && <PinnedBar />}
            {me?.active && <SubTabs />}
            {me?.active ? <AccessGuard>{children}</AccessGuard> : children}
            <footer className="site-footer" data-testid="footer">
              <Link href="/regulamin">Regulamin</Link> · <Link href="/prywatnosc">Polityka prywatności</Link>
            </footer>
          </main>
          {me?.active && <SectionNav variant="bottom" />}
          {me?.active && <ReaderBar />}
          {me && <BugPopup />}
          {me?.active && <CopyGuard />}
          <ToTop />
        </AccessProvider>
      </body>
    </html>
  );
}
