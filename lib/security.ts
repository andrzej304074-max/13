import { headers } from "next/headers";
import { query } from "./db";
import { HttpError } from "./tests";

/**
 * Limity zapytań w Postgresie (okno przesuwne: liczba wpisów `rate_hits` z danym kluczem w ostatnich N sekundach)
 * i dziennik zdarzeń bezpieczeństwa dla panelu admina. Działa tak samo na wielu instancjach serwera.
 */

export type SecKind = "login_fail" | "login_lock" | "rate_limit" | "scrape" | "csrf";

/** Adres IP klienta (pierwszy z X-Forwarded-For – ustawia go platforma hostingu). */
export async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim().slice(0, 64) || "?";
  } catch {
    return "?";
  }
}

/** Zdarzenie do dziennika (błąd zapisu nie przerywa żądania). */
export async function logEvent(kind: SecKind, detail: string, userId: string | null = null, ip?: string) {
  await query("INSERT INTO security_events (kind, user_id, ip, detail) VALUES ($1, $2, $3, $4)",
    [kind, userId, ip ?? (await clientIp()), detail.slice(0, 300)]).catch(() => null);
}

/** Ile wpisów z kluczem w ostatnich `windowSec` s. */
export async function countHits(key: string, windowSec: number): Promise<number> {
  const { rows } = await query<{ n: string }>(
    "SELECT COUNT(*) AS n FROM rate_hits WHERE key = $1 AND at > now() - make_interval(secs => $2)", [key, windowSec]);
  return Number(rows[0].n);
}

/** Zapisz wpis (bez sprawdzania). */
export async function addHit(key: string): Promise<void> {
  await query("INSERT INTO rate_hits (key) VALUES ($1)", [key]);
}

/** Zapis + licznik w jednym zapytaniu; zwraca liczbę wpisów razem z bieżącym. */
async function hitCount(key: string, windowSec: number): Promise<number> {
  const { rows } = await query<{ n: string }>(
    `WITH ins AS (INSERT INTO rate_hits (key) VALUES ($1))
     SELECT COUNT(*) + 1 AS n FROM rate_hits WHERE key = $1 AND at > now() - make_interval(secs => $2)`, [key, windowSec]);
  return Number(rows[0].n);
}

const minutes = (s: number) => Math.max(1, Math.ceil(s / 60));

/** Limit: przekroczenie → 429 i wpis do dziennika (raz, przy pierwszym przekroczeniu). */
export async function limit(key: string, max: number, windowSec: number, userId: string | null = null, what = "zapytań") {
  const n = await hitCount(key, windowSec);
  if (n > max) {
    if (n === max + 1) await logEvent("rate_limit", `${key}: > ${max} w ${minutes(windowSec)} min`, userId);
    throw new HttpError(429, `Za dużo ${what} w krótkim czasie. Spróbuj ponownie za ${minutes(windowSec)} min.`);
  }
}

/* ---------- logowanie ---------- */

export const LOGIN = { perAccount: 8, perIp: 30, windowSec: 15 * 60 };

/** Przed sprawdzeniem hasła: blokada po zbyt wielu nieudanych próbach na konto (e-mail) albo z jednego IP. */
export async function loginAllowed(email: string): Promise<void> {
  const ip = await clientIp();
  const [acc, fromIp] = await Promise.all([countHits(`login:e:${email}`, LOGIN.windowSec), countHits(`login:ip:${ip}`, LOGIN.windowSec)]);
  if (acc >= LOGIN.perAccount || fromIp >= LOGIN.perIp) {
    throw new HttpError(429, `Za dużo nieudanych prób logowania. Spróbuj ponownie za ${minutes(LOGIN.windowSec)} min albo zresetuj hasło.`);
  }
}

/** Po nieudanej próbie: wpisy dla konta i IP; przy osiągnięciu progu – zdarzenie „blokada”. */
export async function loginFailed(email: string, userId: string | null): Promise<void> {
  const ip = await clientIp();
  await Promise.all([addHit(`login:e:${email}`), addHit(`login:ip:${ip}`)]);
  const n = await countHits(`login:e:${email}`, LOGIN.windowSec);
  await logEvent(n >= LOGIN.perAccount ? "login_lock" : "login_fail", email.slice(0, 120), userId, ip);
}

/** Po udanym logowaniu licznik konta się zeruje (IP – nie, żeby nie dało się go „wyczyścić” własnym kontem). */
export async function loginOk(email: string): Promise<void> {
  await query("DELETE FROM rate_hits WHERE key = $1", [`login:e:${email}`]);
}

/** Rejestracja, reset hasła, kody: limit na IP. */
export async function accountLimit(kind: "rejestracja" | "reset" | "kod"): Promise<void> {
  const ip = await clientIp();
  await limit(`acct:${kind}:${ip}`, kind === "reset" ? 5 : 10, 3600, null, "prób");
}

/* ---------- treść (ochrona przed zczytywaniem bazy pytań) ---------- */

/** Limity pobrań treści na konto: krótkie okno (masowe pobieranie) i dobowe. */
export const CONTENT = {
  /** start testu / sesji pytań */
  test: { burst: 40, burstSec: 10 * 60, day: 300 },
  /** zestaw zadania / eseju */
  otwarte: { burst: 30, burstSec: 10 * 60, day: 200 },
  /** pliki danych /api/dane/* (pobierane raz i trzymane w pamięci przeglądarki) */
  dane: { burst: 60, burstSec: 10 * 60, day: 400 },
} as const;

/** Pobranie treści: przekroczenie krótkiego okna to „masowe pobieranie” – 429 i wpis „scrape” do dziennika. */
export async function contentQuota(userId: string, kind: keyof typeof CONTENT): Promise<void> {
  const c = CONTENT[kind];
  const key = `c:${kind}:${userId}`;
  const n = await hitCount(key, 24 * 3600);
  if (n > c.day) {
    if (n === c.day + 1) await logEvent("scrape", `${kind}: > ${c.day} pobrań w ciągu doby`, userId);
    throw new HttpError(429, "Dzienny limit pobrań został wyczerpany. Spróbuj jutro.");
  }
  const burst = await countHits(key, c.burstSec);
  if (burst > c.burst) {
    if (burst === c.burst + 1) await logEvent("scrape", `${kind}: > ${c.burst} pobrań w ${minutes(c.burstSec)} min`, userId);
    throw new HttpError(429, `Za dużo pobrań w krótkim czasie. Spróbuj ponownie za ${minutes(c.burstSec)} min.`);
  }
}

/** Sprzątanie starych wpisów (wywoływane razem z innym sprzątaniem bazy). */
export async function cleanupSecurity(): Promise<void> {
  await query("DELETE FROM rate_hits WHERE at < now() - interval '2 days'");
  await query("DELETE FROM security_events WHERE at < now() - interval '90 days'");
}

/** Dziennik dla panelu admina: ostatnie zdarzenia i podsumowanie z 24 h. */
export async function securityLog(kind: string | null) {
  const k = kind && ["login_fail", "login_lock", "rate_limit", "scrape", "csrf"].includes(kind) ? kind : null;
  const [ev, sum] = await Promise.all([
    query<{ id: string; at: Date; kind: SecKind; ip: string; detail: string; email: string | null }>(
      `SELECT e.id, e.at, e.kind, e.ip, e.detail, u.email FROM security_events e LEFT JOIN users u ON u.id = e.user_id
       WHERE ($1::text IS NULL OR e.kind = $1) ORDER BY e.at DESC LIMIT 200`, [k]),
    query<{ kind: SecKind; n: string }>(
      "SELECT kind, COUNT(*) AS n FROM security_events WHERE at > now() - interval '1 day' GROUP BY 1"),
  ]);
  return {
    events: ev.rows.map((r) => ({ ...r, id: String(r.id), at: r.at.toISOString() })),
    day: Object.fromEntries(sum.rows.map((r) => [r.kind, Number(r.n)])) as Partial<Record<SecKind, number>>,
  };
}
