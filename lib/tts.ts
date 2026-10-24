import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { AwsClient } from "aws4fetch";
import { query, withTx } from "./db";
import { QUESTIONS } from "@/data/questions";
import { SLOWNIK_QUESTIONS, XL_QUESTIONS } from "@/data/slownik";
import { hasla } from "./data-server";
import { allArticleSections } from "./podrecznik";
import { hasloSpeech, questionAnswer, questionAsk } from "./speech-catalog";
import { articleSpeech } from "./podrecznik-speech";
import {
  allowance, dayOf, DEFAULT_MONTHLY, DEFAULT_USER_DAILY, isVoice, liveBlocked, MIN_GAP_MS, monthOf, normalizeState, pickBatch, ssml,
  textHash, VOICES, type TtsState, type Usage,
} from "./tts-core";
import { HttpError } from "./tests";

/**
 * Nagrania akapitów Podręcznika głosem neuronowym Azure AI Speech, nagrywane porcjami w tle:
 * codzienne zadanie Vercel Cron (/api/cron/tts), opcjonalnie co godzinę z GitHub Actions, albo przycisk w panelu admina.
 * Budżet: miesięczny limit znaków (TTS_MONTHLY_CHARS, domyślnie 450 tys.) rozłożony na dni; darmowy plan Azure F0
 * przyjmuje 20 zapytań na minutę, więc jedno uruchomienie nagrywa najwyżej kilkadziesiąt akapitów.
 * Pliki MP3 w Vercel Blob (`tts/<głos>/<skrót>.mp3`); bez nagrania czytnik używa syntezatora przeglądarki.
 *
 * Nagrania na bieżąco: gdy ktoś słucha artykułu, brakujące akapity są nagrywane od razu (recordLive) – dzięki temu
 * czytanie gra z plików i trwa po wyłączeniu ekranu telefonu. Ten sam miesięczny limit + dzienny limit na konto.
 * Zużycie znaków: tabela tts_usage (dzień × źródło: „cron” albo id konta).
 *
 * Zmienne: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, BLOB_READ_WRITE_TOKEN, CRON_SECRET, opcjonalnie TTS_MONTHLY_CHARS
 * i TTS_USER_DAILY (dzienny limit nagrań na bieżąco na konto, domyślnie 60 tys. znaków).
 * TTS_FAKE=1 – atrapa do testów: cisza w WAV zapisywana w katalogu tymczasowym, bez Azure i Blob;
 * TTS_FAKE=azure – atrapa tylko zamiast Azure (magazyn prawdziwy, np. R2 z R2_ENDPOINT w testach).
 */

const FAKE = process.env.TTS_FAKE === "1";
const FAKE_AZURE = FAKE || process.env.TTS_FAKE === "azure";
const FAKE_DIR = path.join(os.tmpdir(), "owe-tts");
/** MP3 32 kb/s, 16 kHz – dla mowy praktycznie bez różnicy, a pliki o 1/3 mniejsze (całość ok. 1,8 GB zamiast 2,6 GB). */
const FORMAT = "audio-16khz-32kbitrate-mono-mp3";
/** Magazyn plików: Cloudflare R2 (10 GB i 1 mln zapisów miesięcznie za darmo), a bez niego Vercel Blob (Hobby: 1 GB, 2000 zapisów). */
const R2_VARS = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"] as const;
const useR2 = () => R2_VARS.every((k) => process.env[k]);
let r2Client: AwsClient | null = null;
const r2 = () => (r2Client ??= new AwsClient({ accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!, service: "s3", region: "auto" }));
// R2_ENDPOINT – tylko do testów (lokalny serwer zgodny z S3)
const r2ObjectUrl = (key: string) => `${process.env.R2_ENDPOINT ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`}/${process.env.R2_BUCKET}/${key}`;
/** Vercel Blob na planie Hobby: 2000 zapisów miesięcznie – zostawiamy zapas. */
const BLOB_MONTHLY_UPLOADS = 1900;
const r2Public = () => process.env.R2_PUBLIC_URL!.replace(/\/+$/, "");
const envNum = (k: string, d: number) => (Number(process.env[k]) > 0 ? Number(process.env[k]) : d);
/** Limit miesięczny: z panelu admina (settings.tts.monthly), inaczej TTS_MONTHLY_CHARS, inaczej 450 tys. */
const monthlyOf = (s: TtsState) => s.monthly ?? envNum("TTS_MONTHLY_CHARS", DEFAULT_MONTHLY);
/** Tryb szybki (warstwa S0): kilka nagrań naraz, bez przerw i bez rozkładania budżetu na dni. */
const FAST_PARALLEL = 8;
const userDaily = () => envNum("TTS_USER_DAILY", DEFAULT_USER_DAILY);

export function ttsConfigured(): { ok: boolean; missing: string[] } {
  if (FAKE) return { ok: true, missing: [] };
  const missing: string[] = FAKE_AZURE ? [] : ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"].filter((k) => !process.env[k]);
  if (!useR2() && !process.env.BLOB_READ_WRITE_TOKEN) missing.push(...R2_VARS.filter((k) => !process.env[k]));
  return { ok: !missing.length, missing };
}

/** Gdzie trafiają nowe nagrania (do panelu). */
export function ttsStorage(): "r2" | "blob" | "test" | null {
  if (FAKE) return "test";
  return useR2() ? "r2" : process.env.BLOB_READ_WRITE_TOKEN ? "blob" : null;
}

/* ---------- katalog nagrań: Podręcznik, hasła, pytania ---------- */

/** Grupa w panelu: artykuły Podręcznika (article = id działu), hasła, pytania OWE, pytania ze słownika. */
export type ClipGroup = "pod" | "haslo" | "owe" | "slownik";
export const GROUP_LABEL: Record<ClipGroup, string> = { pod: "Podręcznik", haslo: "Hasła i definicje", owe: "Pytania OWE", slownik: "Pytania ze słownika" };
const groupOf = (article: string): ClipGroup => (article === "haslo" || article === "owe" || article === "slownik" ? article : "pod");

interface Paragraph { hash: string; text: string; chars: number; article: string }
const g = globalThis as unknown as {
  ttsParas?: { all: Paragraph[]; byArticle: Map<string, string[]>; byHash: Map<string, Paragraph> };
  ttsLive?: Map<string, Promise<string>>;
};

/**
 * Wszystkie teksty do nagrania (bez powtórzeń), kolejno: akapity Podręcznika (kolejność kursu), hasła,
 * pytania OWE (pytanie z odpowiedziami i osobno wyjaśnienie), pytania ze słownika – liczone raz na proces.
 * Teksty budują te same funkcje co strony (lib/podrecznik-speech.ts, lib/speech-catalog.ts).
 */
function paragraphs() {
  if (!g.ttsParas) {
    const all: Paragraph[] = [];
    const seen = new Set<string>();
    const byArticle = new Map<string, string[]>();
    const add = (text: string, article: string) => {
      const hash = textHash(text);
      if (!seen.has(hash)) { seen.add(hash); all.push({ hash, text, chars: text.length, article }); }
      return hash;
    };
    for (const { unitId, sections } of allArticleSections()) {
      byArticle.set(unitId, articleSpeech(sections, true).items.map((it) => add(it.text, unitId)));
    }
    for (const h of hasla().rows) add(hasloSpeech(h).text, "haslo");
    for (const [bank, list] of [["owe", QUESTIONS], ["slownik", [...SLOWNIK_QUESTIONS, ...XL_QUESTIONS]]] as const) {
      for (const q of list) {
        add(questionAsk(q).text, bank);
        add(questionAnswer(q, q.correct, q.explanation).text, bank);
      }
    }
    g.ttsParas = { all, byArticle, byHash: new Map(all.map((p) => [p.hash, p])) };
  }
  return g.ttsParas;
}

/* ---------- stan (settings.tts) i zużycie (tts_usage) ---------- */

async function loadState(): Promise<TtsState> {
  const { rows } = await query<{ value: string }>("SELECT value FROM settings WHERE key = 'tts'");
  let v: unknown = null;
  try { v = rows[0] ? JSON.parse(rows[0].value) : null; } catch {}
  return normalizeState(v);
}

async function saveState(s: TtsState) {
  await query(
    `INSERT INTO settings (key, value) VALUES ('tts', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(s)]);
}

async function usage(now = new Date(), who?: string): Promise<Usage & { whoToday: number; live: number }> {
  const { rows } = await query<{ used: string; today: string; who_today: string; live: string }>(
    `SELECT COALESCE(SUM(chars), 0) AS used,
            COALESCE(SUM(chars) FILTER (WHERE day = $2::date), 0) AS today,
            COALESCE(SUM(chars) FILTER (WHERE day = $2::date AND who = $3), 0) AS who_today,
            COALESCE(SUM(chars) FILTER (WHERE who <> 'cron'), 0) AS live
     FROM tts_usage WHERE day >= $1::date`,
    [`${monthOf(now)}-01`, dayOf(now), who ?? ""]);
  const r = rows[0];
  return { used: Number(r.used), usedToday: Number(r.today), whoToday: Number(r.who_today), live: Number(r.live) };
}

async function addUsage(who: string, chars: number) {
  await query(
    `INSERT INTO tts_usage (day, who, chars) VALUES ($1::date, $2, $3)
     ON CONFLICT (day, who) DO UPDATE SET chars = tts_usage.chars + EXCLUDED.chars`,
    [dayOf(new Date()), who, chars]);
}

async function saveClip(p: Paragraph, voice: string, bytes: Buffer, url: string) {
  await query(
    `INSERT INTO tts_clips (hash, voice, article, chars, bytes, url) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (hash, voice) DO UPDATE SET url = EXCLUDED.url, bytes = EXCLUDED.bytes, created_at = now()`,
    [p.hash, voice, p.article, p.chars, bytes.length, url]);
}

/* ---------- Azure i magazyn plików ---------- */

class RateLimited extends Error {}

async function synthesize(text: string, voice: string): Promise<Buffer> {
  if (FAKE_AZURE) return silentWav(0.1);
  const res = await fetch(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY!,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": FORMAT,
      "User-Agent": "testy-owe",
    },
    body: ssml(text, voice),
  });
  if (res.status === 429) throw new RateLimited("Azure: limit zapytań (429)");
  if (!res.ok) throw new Error(`Azure: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function store(voice: string, hash: string, bytes: Buffer): Promise<string> {
  if (FAKE) {
    await mkdir(path.join(FAKE_DIR, voice), { recursive: true });
    await writeFile(path.join(FAKE_DIR, voice, `${hash}.wav`), bytes);
    return `/api/podrecznik/nagrania?plik=${encodeURIComponent(`${voice}/${hash}`)}`;
  }
  const key = `tts/${voice}/${hash}.mp3`;
  if (useR2()) {
    // podpis osobno, a wysyłka zwykłym fetch z buforem – R2 wymaga Content-Length (Request z aws4fetch wysyła strumieniem, bez długości)
    const signed = await r2().sign(r2ObjectUrl(key), {
      method: "PUT", body: new Uint8Array(bytes),
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=31536000, immutable" },
    });
    const res = await fetch(signed.url, { method: "PUT", headers: signed.headers, body: new Uint8Array(bytes) });
    if (!res.ok) throw new Error(`R2: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    return `${r2Public()}/${key}`;
  }
  const b = await put(key, bytes, {
    access: "public", contentType: "audio/mpeg", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000,
  });
  return b.url;
}

/** Usuwanie plików – z R2 albo z Vercel Blob (starsze nagrania), zależnie od adresu. */
async function remove(urls: string[]) {
  if (!urls.length || FAKE) return;
  const fromR2 = useR2() ? urls.filter((u) => u.startsWith(`${r2Public()}/`)) : [];
  for (const u of fromR2) await r2().fetch(r2ObjectUrl(u.slice(r2Public().length + 1)), { method: "DELETE" }).catch(() => {});
  const fromBlob = urls.filter((u) => u.includes(".blob.vercel-storage.com/"));
  if (fromBlob.length && process.env.BLOB_READ_WRITE_TOKEN) for (let i = 0; i < fromBlob.length; i += 100) await del(fromBlob.slice(i, i + 100));
}

/** Plik atrapy (TTS_FAKE) – tylko do testów. */
export async function fakeFile(ref: string): Promise<Buffer> {
  if (!FAKE || !/^[\w-]+\/[a-z0-9]+$/.test(ref)) throw new HttpError(404, "Nie ma takiego pliku.");
  return readFile(path.join(FAKE_DIR, `${ref}.wav`)).catch(() => { throw new HttpError(404, "Nie ma takiego pliku."); });
}

function silentWav(seconds: number): Buffer {
  const rate = 8000, n = Math.round(rate * seconds);
  const b = Buffer.alloc(44 + n);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate, 28);
  b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write("data", 36); b.writeUInt32LE(n, 40); b.fill(128, 44);
  return b;
}

/** Ile zapisów do Vercel Blob zostało w tym miesiącu (Infinity – inny magazyn). */
async function blobUploadsLeft(): Promise<number> {
  if (ttsStorage() !== "blob") return Infinity;
  const { rows } = await query<{ n: string }>(
    "SELECT COUNT(*) AS n FROM tts_clips WHERE created_at >= date_trunc('month', now()) AND url LIKE '%.blob.vercel-storage.com/%'");
  return Math.max(0, BLOB_MONTHLY_UPLOADS - Number(rows[0].n));
}

/* ---------- porcja nagrań w tle ---------- */

export interface RunResult { recorded: number; chars: number; removed: number; stopped: string | null; allowance: number }

/**
 * Nagrywa kolejną porcję: najpierw usuwa pliki akapitów, których już nie ma (zmieniona treść),
 * potem nagrywa brakujące akapity w kolejności kursu, w budżecie znaków i czasu (`seconds`).
 * Jedno uruchomienie naraz (blokada doradcza w bazie).
 */
export async function runBatch(seconds: number): Promise<RunResult> {
  const conf = ttsConfigured();
  if (!conf.ok) throw new HttpError(400, `Brak konfiguracji: ${conf.missing.join(", ")}.`);
  const result = await withTx(async (q) => {
    const { rows } = await q<{ ok: boolean }>("SELECT pg_try_advisory_xact_lock(4242002) AS ok");
    if (!rows[0].ok) return null;
    return record(seconds);
  });
  if (!result) throw new HttpError(409, "Nagrywanie już trwa – spróbuj za kilka minut.");
  return result;
}

async function record(seconds: number): Promise<RunResult> {
  const started = Date.now();
  const now = new Date();
  const [state, use] = await Promise.all([loadState(), usage(now)]);
  const { all } = paragraphs();
  const current = new Set(all.map((p) => p.hash));

  // sprzątanie: nagrania zmienionych akapitów oraz innym głosem, gdy jest już nagranie bieżącym
  const { rows: clips } = await query<{ hash: string; voice: string; url: string }>("SELECT hash, voice, url FROM tts_clips");
  const have = new Set(clips.filter((c) => c.voice === state.voice).map((c) => c.hash));
  const stale = clips.filter((c) => !current.has(c.hash) || (c.voice !== state.voice && have.has(c.hash)));
  if (stale.length) {
    await remove(stale.map((c) => c.url));
    await query("DELETE FROM tts_clips WHERE (hash, voice) IN (SELECT * FROM unnest($1::text[], $2::text[]))",
      [stale.map((c) => c.hash), stale.map((c) => c.voice)]);
  }

  const monthly = monthlyOf(state);
  const budget = state.fast ? Math.max(0, monthly - use.used) : allowance(use, monthly, now);
  const todo = all.filter((p) => !have.has(p.hash));
  const uploadsLeft = await blobUploadsLeft();
  const batch = pickBatch(todo, budget).slice(0, uploadsLeft);
  let recorded = 0, chars = 0;
  // „budżet” – zostały teksty, które nie mieszczą się w dzisiejszej porcji (albo w limicie miesiąca)
  let stopped: string | null = batch.length < todo.length ? (batch.length === uploadsLeft ? "limit Blob" : "budżet") : null;
  const deadline = started + seconds * 1000 - (state.fast ? 4000 : MIN_GAP_MS + 2000);
  let next = 0;
  let halt = false;
  const one = async (p: Paragraph) => {
    for (let attempt = 0; ; attempt++) {
      try {
        const bytes = await synthesize(p.text, state.voice);
        const url = await store(state.voice, p.hash, bytes);
        await saveClip(p, state.voice, bytes, url);
        // zapis po każdym nagraniu – przerwana funkcja nie zgubi zużytych znaków
        await addUsage("cron", p.chars);
        recorded++;
        chars += p.chars;
        state.lastError = null;
        return;
      } catch (e) {
        // tryb szybki: chwilowy limit Azure – krótka przerwa i ponowienie
        if (e instanceof RateLimited && state.fast && attempt < 3) { await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); continue; }
        state.lastError = (e as Error).message.slice(0, 300);
        stopped = e instanceof RateLimited ? "limit Azure" : "błąd";
        halt = true;
        return;
      }
    }
  };
  const worker = async () => {
    while (!halt && next < batch.length) {
      if (Date.now() > deadline) { stopped = "czas"; return; }
      const p = batch[next++];
      const t0 = Date.now();
      await one(p);
      if (!state.fast && !FAKE_AZURE && !halt) await new Promise((r) => setTimeout(r, Math.max(0, MIN_GAP_MS - (Date.now() - t0))));
    }
  };
  await Promise.all(Array.from({ length: state.fast ? FAST_PARALLEL : 1 }, worker));
  await saveState({ ...state, lastRun: new Date().toISOString() });
  return { recorded, chars, removed: stale.length, stopped, allowance: budget };
}

/* ---------- nagranie na bieżąco (ktoś słucha) ---------- */

/**
 * Nagranie akapitu Podręcznika od razu – dla czytania z plików (także z wyłączonym ekranem).
 * Tekst pochodzi z mapy akapitów serwera, klient podaje tylko skrót. Jedno nagranie danego akapitu naraz.
 */
export async function recordLive(userId: string, hash: unknown): Promise<{ url: string | null; reason?: string }> {
  const p = typeof hash === "string" ? paragraphs().byHash.get(hash) : undefined;
  // tekst spoza katalogu (np. ćwiczenie w lekcji) – bez nagrania, czyta syntezator
  if (!p) return { url: null };
  const state = await loadState();
  const { rows } = await query<{ url: string }>("SELECT url FROM tts_clips WHERE hash = $1 AND voice = $2", [p.hash, state.voice]);
  if (rows[0]) return { url: rows[0].url };
  // limity i brak konfiguracji to zwykła odpowiedź „bez nagrania” – czytnik użyje głosu przeglądarki
  if (!ttsConfigured().ok) return { url: null, reason: "Głos z chmury nie jest skonfigurowany." };
  const key = `${state.voice}/${p.hash}`;
  const use = await usage(new Date(), userId);
  const blocked = liveBlocked(use, p.chars, monthlyOf(state), use.whoToday, userDaily());
  if (blocked) return { url: null, reason: blocked };
  if ((await blobUploadsLeft()) <= 0) return { url: null, reason: "Wyczerpany miesięczny limit zapisów Vercel Blob." };
  g.ttsLive ??= new Map();
  let job = g.ttsLive.get(key);
  if (!job) {
    job = (async () => {
      let bytes: Buffer;
      try {
        bytes = await synthesize(p.text, state.voice);
      } catch (e) {
        if (e instanceof RateLimited) throw new HttpError(429, "Chwilowy limit zapytań – spróbuj za kilka sekund.");
        throw new HttpError(502, "Nie udało się nagrać akapitu.");
      }
      const url = await store(state.voice, p.hash, bytes);
      await saveClip(p, state.voice, bytes, url);
      await addUsage(userId, p.chars);
      return url;
    })().finally(() => g.ttsLive!.delete(key));
    g.ttsLive.set(key, job);
  }
  return { url: await job };
}

/** Czy nagrywanie na bieżąco jest teraz możliwe (konfiguracja i limit miesiąca). */
export async function liveAvailable(): Promise<boolean> {
  if (!ttsConfigured().ok) return false;
  const [state, use] = await Promise.all([loadState(), usage()]);
  return use.used < monthlyOf(state);
}

/* ---------- odczyt ---------- */

/** Nagrania akapitów artykułu: skrót tekstu → URL (bieżący głos, a dla jeszcze nienagranych – wcześniejszy głos). */
export async function articleClips(unitId: string): Promise<Record<string, string>> {
  const hashes = paragraphs().byArticle.get(unitId);
  if (!hashes?.length) return {};
  const [state, { rows }] = await Promise.all([
    loadState(),
    query<{ hash: string; voice: string; url: string }>("SELECT hash, voice, url FROM tts_clips WHERE hash = ANY($1)", [hashes]),
  ]);
  const out: Record<string, string> = {};
  for (const r of rows) if (r.voice === state.voice || !out[r.hash]) out[r.hash] = r.url;
  return out;
}

/** Koszt głosów neuronowych Azure na warstwie S0 (USD za 1 mln znaków) – do szacunku w panelu. */
export const S0_USD_PER_MILLION = 16;

interface Progress { done: number; total: number; chars: number; charsDone: number }

export interface TtsStatus {
  configured: boolean;
  missing: string[];
  storage: "r2" | "blob" | "test" | null;
  voice: string;
  voices: typeof VOICES;
  monthly: number;
  /** Limit ustawiony w panelu (null – z TTS_MONTHLY_CHARS albo domyślny). */
  monthlySet: number | null;
  fast: boolean;
  used: number;
  /** Z tego nagrania na bieżąco (słuchający). */
  live: number;
  userDaily: number;
  month: string;
  allowanceNow: number;
  paragraphs: Progress;
  groups: (Progress & { id: ClipGroup; label: string })[];
  articles: { done: number; total: number };
  bytes: number;
  lastRun: string | null;
  lastError: string | null;
}

export async function ttsStatus(): Promise<TtsStatus> {
  const now = new Date();
  const [state, use] = await Promise.all([loadState(), usage(now)]);
  const { all, byArticle } = paragraphs();
  const { rows } = await query<{ hash: string; bytes: number }>("SELECT hash, bytes FROM tts_clips WHERE voice = $1", [state.voice]);
  const done = new Set(rows.map((r) => r.hash));
  const conf = ttsConfigured();
  const prog = (list: Paragraph[]): Progress => {
    const d = list.filter((p) => done.has(p.hash));
    return { done: d.length, total: list.length, chars: list.reduce((s, p) => s + p.chars, 0), charsDone: d.reduce((s, p) => s + p.chars, 0) };
  };
  const monthly = monthlyOf(state);
  return {
    configured: conf.ok, missing: conf.missing, storage: ttsStorage(), voice: state.voice, voices: VOICES, monthly, monthlySet: state.monthly, fast: state.fast,
    used: use.used, live: use.live, userDaily: userDaily(), month: monthOf(now),
    allowanceNow: state.fast ? Math.max(0, monthly - use.used) : allowance(use, monthly, now),
    paragraphs: prog(all),
    groups: (Object.keys(GROUP_LABEL) as ClipGroup[]).map((id) => ({ id, label: GROUP_LABEL[id], ...prog(all.filter((p) => groupOf(p.article) === id)) })),
    articles: { done: [...byArticle.values()].filter((hs) => hs.every((h) => done.has(h))).length, total: byArticle.size },
    bytes: rows.reduce((s, r) => s + Number(r.bytes), 0),
    lastRun: state.lastRun, lastError: state.lastError,
  };
}

/**
 * Ustawienia z panelu: głos (zmiana = nagrania od nowa; do tego czasu grają nagrania poprzednim głosem),
 * limit miesięczny znaków (null – z TTS_MONTHLY_CHARS) i tryb szybki (warstwa S0).
 */
export async function setTtsSettings(body: Record<string, unknown>) {
  const s = await loadState();
  if (body.voice !== undefined) {
    if (!isVoice(body.voice)) throw new HttpError(400, "Nieznany głos.");
    s.voice = body.voice;
  }
  if (body.monthly !== undefined) {
    const m = body.monthly === null || body.monthly === "" ? null : Number(body.monthly);
    if (m !== null && !(Number.isInteger(m) && m >= 0 && m <= 50_000_000)) throw new HttpError(400, "Limit: liczba znaków od 0 do 50 000 000.");
    s.monthly = m;
  }
  if (body.fast !== undefined) s.fast = body.fast === true;
  await saveState(s);
}
