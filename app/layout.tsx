import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Testy OWE",
  description: "Testy z pytań z poprzednich edycji Olimpiady Wiedzy Ekonomicznej",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <header className="top">
          <Link href="/" className="brand">Testy OWE</Link>
          <nav>
            <Link href="/">Nowy test</Link>
            <Link href="/stats">Statystyki</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
