import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { query, withTx } from "./db";
import { allArticleSections } from "./podrecznik";
import { articleSpeech } from "./podrecznik-speech";
import {
  allowance, DEFAULT_MONTHLY, isVoice, MIN_GAP_MS, normalizeState, pickBatch, ssml, textHash, VOICES, type TtsState,
} from "./tts-core";
import { HttpError } from "./tests";

/**
 * Nagrania akapitów Podręcznika głosem neuronowym Azure AI Speech, nagrywane porcjami w tle:
 * codzienne zadanie Vercel Cron (/api/cron/tts), opcjonalnie co godzinę z GitHub Actions, albo przycisk w panelu admina.
 * Budżet: miesięczny limit znaków (TTS_MONTHLY_CHARS, domyślnie 450 tys.) rozłożony na dni; darmowy plan Azure F0
 * przyjmuje 20 zapytań na minutę, więc jedno uruchomienie nagrywa najwyżej kilkadziesiąt akapitów.
 * Pliki MP3 w Vercel Blob (`tts/<głos>/<skrót>.mp3`); bez nagrania czytnik używa syntezatora przeglądarki.
 *
 * Zmienne: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, BLOB_READ_WRITE_TOKEN, CRON_SECRET, opcjonalnie TTS_MONTHLY_CHARS.
 * TTS_FAKE=1 – atrapa do testów: cisza w WAV zapisywana w katalogu tymczasowym, bez Azure i Blob.
 */

const FAKE = process.env.TTS_FAKE === "1";
const FAKE_DIR = path.join(os.tmpdir(), "owe-tts");
const FORMAT = "audio-24khz-48kbitrate-mono-mp3";
const monthly = () => Number(process.env.TTS_MONTHLY_CHARS) > 0 ? Number(process.env.TTS_MONTHLY_CHARS) : DEFAULT_MONTHLY;

export function ttsConfigured(): { ok: boolean; missing: string[] } {
  if (FAKE) return { ok: true, missing: [] };
  const missing = ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION", "BLOB_READ_WRITE_TOKEN"].filter((k) => !process.env[k]);
  return { ok: !missing.length, missing };
}

/* ---------- akapity Podręcznika ---------- */

interface Paragraph { hash: string; text: string; chars: number; article: string }
const g = globalThis as unknown as { ttsParas?: { all: Paragraph[]; byArticle: Map<string, string[]> } };

/** Wszystkie akapity (bez powtórzeń) w kolejności kursu i skróty akapitów każdego artykułu – liczone raz na proces. */
function paragraphs() {
  if (!g.ttsParas) {
    const all: Paragraph[] = [];
    const seen = new Set<string>();
    const byArticle = new Map<string, string[]>();
    for (const { unitId, sections } of allArticleSections()) {
      const hashes: string[] = [];
      for (const it of articleSpeech(sections, true).items) {
        const hash = textHash(it.text);
        hashes.push(hash);
        if (!seen.has(hash)) { seen.add(hash); all.push({ hash, text: it.text, chars: it.text.length, article: unitId }); }
      }
      byArticle.set(unitId, hashes);
    }
    g.ttsParas = { all, byArticle };
  }
  return g.ttsParas;
}

/* ---------- stan (settings.tts) ---------- */

async function loadState(now = new Date()): Promise<TtsState> {
  const { rows } = await query<{ value: string }>("SELECT value FROM settings WHERE key = 'tts'");
  let v: unknown = null;
  try { v = rows[0] ? JSON.parse(rows[0].value) : null; } catch {}
  return normalizeState(v, now);
}

async function saveState(s: TtsState) {
  await query(
    `INSERT INTO settings (key, value) VALUES ('tts', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(s)]);
}

/* ---------- Azure i magazyn plików ---------- */

class RateLimited extends Error {}

async function synthesize(text: string, voice: string): Promise<Buffer> {
  if (FAKE) return silentWav(Math.min(3, 0.2 + text.length / 400));
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
  const b = await put(`tts/${voice}/${hash}.mp3`, bytes, {
    access: "public", contentType: "audio/mpeg", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000,
  });
  return b.url;
}

async function remove(urls: string[]) {
  if (!urls.length || FAKE) return;
  for (let i = 0; i < urls.length; i += 100) await del(urls.slice(i, i + 100));
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

/* ---------- porcja nagrań ---------- */

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
  const state = await loadState(now);
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

  const budget = allowance(state, monthly(), now);
  const todo = all.filter((p) => !have.has(p.hash));
  const batch = pickBatch(todo, budget);
  let recorded = 0, chars = 0;
  // „budżet” – zostały akapity, które nie mieszczą się w dzisiejszej porcji znaków
  let stopped: string | null = batch.length < todo.length ? "budżet" : null;
  for (const p of batch) {
    if (Date.now() - started > seconds * 1000 - MIN_GAP_MS - 2000) { stopped = "czas"; break; }
    const t0 = Date.now();
    try {
      const bytes = await synthesize(p.text, state.voice);
      const url = await store(state.voice, p.hash, bytes);
      await query(
        `INSERT INTO tts_clips (hash, voice, article, chars, bytes, url) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (hash, voice) DO UPDATE SET url = EXCLUDED.url, bytes = EXCLUDED.bytes, created_at = now()`,
        [p.hash, state.voice, p.article, p.chars, bytes.length, url]);
      recorded++;
      chars += p.chars;
      state.used += p.chars;
      state.usedToday += p.chars;
      state.lastError = null;
    } catch (e) {
      state.lastError = (e as Error).message.slice(0, 300);
      stopped = e instanceof RateLimited ? "limit Azure" : "błąd";
      break;
    } finally {
      // zapis po każdym nagraniu – przerwana funkcja nie zgubi zużytych znaków
      if (recorded || state.lastError) await saveState({ ...state, lastRun: new Date().toISOString() });
    }
    if (!FAKE) await new Promise((r) => setTimeout(r, Math.max(0, MIN_GAP_MS - (Date.now() - t0))));
  }
  await saveState({ ...state, lastRun: new Date().toISOString() });
  return { recorded, chars, removed: stale.length, stopped, allowance: budget };
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

export interface TtsStatus {
  configured: boolean;
  missing: string[];
  voice: string;
  voices: typeof VOICES;
  monthly: number;
  used: number;
  month: string;
  allowanceNow: number;
  paragraphs: { done: number; total: number; chars: number; charsDone: number };
  articles: { done: number; total: number };
  bytes: number;
  lastRun: string | null;
  lastError: string | null;
}

export async function ttsStatus(): Promise<TtsStatus> {
  const now = new Date();
  const state = await loadState(now);
  const { all, byArticle } = paragraphs();
  const { rows } = await query<{ hash: string; bytes: number }>("SELECT hash, bytes FROM tts_clips WHERE voice = $1", [state.voice]);
  const done = new Set(rows.map((r) => r.hash));
  const conf = ttsConfigured();
  return {
    configured: conf.ok, missing: conf.missing, voice: state.voice, voices: VOICES, monthly: monthly(), used: state.used, month: state.month,
    allowanceNow: allowance(state, monthly(), now),
    paragraphs: {
      done: all.filter((p) => done.has(p.hash)).length, total: all.length,
      chars: all.reduce((s, p) => s + p.chars, 0), charsDone: all.filter((p) => done.has(p.hash)).reduce((s, p) => s + p.chars, 0),
    },
    articles: { done: [...byArticle.values()].filter((hs) => hs.every((h) => done.has(h))).length, total: byArticle.size },
    bytes: rows.reduce((s, r) => s + Number(r.bytes), 0),
    lastRun: state.lastRun, lastError: state.lastError,
  };
}

/** Zmiana głosu: kolejne porcje nagrywają wszystko od nowa; do tego czasu grają nagrania poprzednim głosem. */
export async function setVoice(voice: unknown) {
  if (!isVoice(voice)) throw new HttpError(400, "Nieznany głos.");
  const s = await loadState();
  await saveState({ ...s, voice });
}
