import nodemailer from "nodemailer";

/**
 * Wysyłka maili przez Gmail (hasło aplikacji): GMAIL_USER, GMAIL_APP_PASSWORD.
 * MAIL_TEST=1 – maile nie są wysyłane, tylko wypisywane w logu serwera (testy lokalne).
 */
export function mailConfigured(): boolean {
  return process.env.MAIL_TEST === "1" || Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  if (process.env.MAIL_TEST === "1") {
    console.log(`[MAIL_TEST] do: ${to} | ${subject}\n${text}`);
    return;
  }
  const user = process.env.GMAIL_USER, pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("Brak GMAIL_USER lub GMAIL_APP_PASSWORD – wysyłka maili nie jest skonfigurowana.");
  const transport = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  await transport.sendMail({ from: `Testy OWE <${user}>`, to, subject, text });
}

/** Adres aplikacji do linków w mailach – nie z nagłówka Host (podatnego na podmianę). */
export function appUrl(): string {
  const raw = process.env.APP_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
    ?? `http://localhost:${process.env.PORT ?? 3000}`;
  return raw.replace(/\/+$/, "");
}
