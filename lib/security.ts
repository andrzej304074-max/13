import { headers } from "next/headers";
import { query } from "./db";
import { HttpError } from "./tests";

/**
 * Limity zapytań w Postgresie (okno przesuwne: liczba wpisów `rate_hits` z danym kluczem w ostatnich N sekundach)
 * i dziennik zdarzeń bezpieczeństwa dla panelu admina. Działa tak samo na wielu instancjach serwera.
 */

export type SecKind = "login_fail" | "login_lock" | "rate_limit" | "scrape";

/**
 * Adres IP klienta: `x-real-ip` ustawia platforma hostingu (Vercel) i klient nie może go podmienić;
 * `X-Forwarded-For` tylko awaryjnie (pierwsze pozycje klient może dopisać sam). Bez obu nagłówków (serwer bez
 * pośrednika) wszyscy dzielą jeden licznik „?” – wdrożenie poza Vercelem powinno ustawiać `x-real-ip` w pośredniku.
 */
export async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    // z X-Forwarded-For ostatni adres – dopisany przez najbliższy serwer pośredniczący, nie przez klienta
    return (h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",").at(-1) ?? "").trim().slice(0, 64) || "?";
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

/** Na IP luźniej: cała klasa w szkole często wychodzi do internetu z jednego adresu. */
export const LOGIN = { perAccount: 8, perIp: 60, windowSec: 15 * 60 };

/**
 * Wpis próby, jeśli limit nie jest wyczerpany – sprawdzenie i zapis w jednym zapytaniu (równoległe próby nie przechodzą
 * wszystkie przez samo sprawdzenie, jak przy osobnym liczeniu przed hasłem i zapisie po nim).
 * Zwraca, czy próba się zmieściła, i liczbę prób w oknie razem z nią.
 */
async function take(key: string, max: number, windowSec: number): Promise<{ ok: boolean; n: number }> {
  const { rows } = await query<{ n: string; added: string }>(
    `WITH c AS (SELECT COUNT(*) AS n FROM rate_hits WHERE key = $1 AND at > now() - make_interval(secs => $2)),
          ins AS (INSERT INTO rate_hits (key) SELECT $1 FROM c WHERE c.n < $3 RETURNING 1)
     SELECT c.n, (SELECT COUNT(*) FROM ins) AS added FROM c`, [key, windowSec, max]);
  const added = Number(rows[0].added) > 0;
  return { ok: added, n: Number(rows[0].n) + (added ? 1 : 0) };
}

/**
 * Przed sprawdzeniem hasła: próba liczy się od razu (konto i IP); po wyczerpaniu limitu – 429 bez sprawdzania hasła
 * (także bez kosztownego scrypt). Udane logowanie zdejmuje swoją próbę (loginOk), więc liczą się tylko nieudane.
 */
export async function loginAllowed(email: string): Promise<void> {
  const ip = await clientIp();
  const [acc, fromIp] = await Promise.all([take(`login:e:${email}`, LOGIN.perAccount, LOGIN.windowSec), take(`login:ip:${ip}`, LOGIN.perIp, LOGIN.windowSec)]);
  if (!acc.ok || !fromIp.ok) {
    throw new HttpError(429, `Za dużo nieudanych prób logowania. Spróbuj ponownie za ${minutes(LOGIN.windowSec)} min albo zresetuj hasło.`);
  }
}

/** Po nieudanej próbie (już policzonej w loginAllowed): wpis do dziennika; przy osiągnięciu progu – „blokada”. */
export async function loginFailed(email: string, userId: string | null): Promise<void> {
  const ip = await clientIp();
  const n = await countHits(`login:e:${email}`, LOGIN.windowSec);
  await logEvent(n >= LOGIN.perAccount ? "login_lock" : "login_fail", email.slice(0, 120), userId, ip);
}

/** Udane logowanie: licznik konta się zeruje, a z licznika IP znika tylko ta jedna próba (nie da się go „wyczyścić” własnym kontem). */
export async function loginOk(email: string): Promise<void> {
  const ip = await clientIp();
  await Promise.all([
    query("DELETE FROM rate_hits WHERE key = $1", [`login:e:${email}`]),
    query("DELETE FROM rate_hits WHERE ctid IN (SELECT ctid FROM rate_hits WHERE key = $1 ORDER BY at DESC LIMIT 1)", [`login:ip:${ip}`]),
  ]);
}

/** Nowe hasło (reset): zeruje tylko licznik konta. */
export async function loginUnlock(email: string): Promise<void> {
  await query("DELETE FROM rate_hits WHERE key = $1", [`login:e:${email}`]);
}

/** Rejestracja, reset hasła, kody: limit na IP. */
export async function accountLimit(kind: "rejestracja" | "reset" | "kod" | "klucz" | "google"): Promise<void> {
  const ip = await clientIp();
  await limit(`acct:${kind}:${ip}`, kind === "reset" ? 20 : kind === "klucz" || kind === "google" ? 60 : 30, 3600, null, "prób");
}

/* ---------- treść (ochrona przed zczytywaniem bazy pytań) ---------- */

/** Limity pobrań treści na konto: krótkie okno (masowe pobieranie) i dobowe. */
export const CONTENT = {
  /** start testu / sesji pytań */
  test: { burst: 40, burstSec: 10 * 60, day: 300 },
  /** zestaw zadania / eseju i jego sprawdzenie (zwraca rozwiązanie) */
  otwarte: { burst: 60, burstSec: 10 * 60, day: 400 },
  /** pytania OWE z kluczem przy haśle (rozwinięcie wiersza w Pojęciach) */
  pytania: { burst: 60, burstSec: 10 * 60, day: 400 },
  /** odpowiedź w teście (zwraca klucz i następne pytanie – test „bez limitu” dolosowuje pytania bez końca) */
  odpowiedz: { burst: 200, burstSec: 10 * 60, day: 2000 },
  /** pliki danych /api/dane/* – liczone tylko pełne pobrania (304 nie) */
  dane: { burst: 120, burstSec: 10 * 60, day: 1000 },
} as const;

/**
 * Pobranie treści: przekroczenie krótkiego okna to „masowe pobieranie” – 429 i wpis „scrape” do dziennika.
 * Admini są zwolnieni (przeglądają i testują całą bazę).
 */
export async function contentQuota(me: { id: string; isAdmin: boolean }, kind: keyof typeof CONTENT): Promise<void> {
  if (me.isAdmin) return;
  const c = CONTENT[kind];
  const key = `c:${kind}:${me.id}`;
  // zapis i oba liczniki (doba, krótkie okno) w jednym zapytaniu
  const { rows } = await query<{ day: string; burst: string }>(
    `WITH ins AS (INSERT INTO rate_hits (key) VALUES ($1))
     SELECT COUNT(*) + 1 AS day, COUNT(*) FILTER (WHERE at > now() - make_interval(secs => $2)) + 1 AS burst
     FROM rate_hits WHERE key = $1 AND at > now() - interval '1 day'`, [key, c.burstSec]);
  const day = Number(rows[0].day), burst = Number(rows[0].burst);
  if (day > c.day) {
    if (day === c.day + 1) await logEvent("scrape", `${kind}: > ${c.day} pobrań w ciągu doby`, me.id);
    throw new HttpError(429, "Dzienny limit pobrań został wyczerpany. Spróbuj jutro.");
  }
  if (burst > c.burst) {
    if (burst === c.burst + 1) await logEvent("scrape", `${kind}: > ${c.burst} pobrań w ${minutes(c.burstSec)} min`, me.id);
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
  const k = kind && ["login_fail", "login_lock", "rate_limit", "scrape"].includes(kind) ? kind : null;
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
