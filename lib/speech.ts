"use client";

import { useSyncExternalStore } from "react";
import { splitChunks, type SpeechItem } from "./speech-text";

/**
 * Czytanie na głos. Jedna kolejka w karcie: lista elementów (artykuł → akapity, tabela → hasła…).
 * - Element z nagraniem (`audio`) albo nagrywany na bieżąco (`live` – akapit Podręcznika, POST /api/podrecznik/nagrania)
 *   gra z pliku przez <audio>: działa też po wyłączeniu ekranu, z przyciskami na ekranie blokady (Media Session).
 *   Kolejne nagrania są zamawiane z wyprzedzeniem; czekanie wypełnia cisza, żeby system nie zamknął sesji audio.
 * - Pozostałe elementy czyta syntezator przeglądarki (Web Speech API), dzielone na zdania.
 * iOS: sesja audio „playback” (mowa mimo przełącznika wyciszenia), bez speak() tuż po cancel() (WebKit gubi wypowiedź),
 * strażnik: brak startu wypowiedzi → powtórka bez wybranego głosu, potem podpowiedź w pasku.
 * Stan subskrybowany przez useSpeech (pasek odtwarzacza, podświetlenie czytanego elementu).
 */

export interface SpeechState {
  supported: boolean;
  /** Dostępne głosy polskie (pusta lista – brak polskiego głosu w systemie). */
  voices: { uri: string; name: string }[];
  voiceUri: string | null;
  rate: number;
  items: SpeechItem[];
  index: number;
  status: "idle" | "playing" | "paused";
  /** Skąd gra bieżący element: plik, syntezator albo czekanie na nagranie. */
  source: "audio" | "synth" | "wait" | null;
  /** Grupa (np. „artykul:makro-pkb”) – przycisk 🔊 wie, że to jego lista gra. */
  group: string | null;
  /** Czytać kolejne elementy po skończeniu bieżącego. */
  continuous: boolean;
  /** Podpowiedź w pasku (np. „nic nie słychać?”). */
  hint: string | null;
}

const KEY = "owe:speech";
const HINT_KEY = "owe:speech-hint";
const RATES = [0.8, 0.9, 1, 1.15, 1.3, 1.5];
export const SPEECH_RATES = RATES;

export const SILENT_HINT = "Nic nie słychać? Podgłośnij, a na iPhonie wyłącz tryb cichy (przełącznik z boku) – albo wybierz inny głos.";
const IOS_HINT = "Na iPhonie głos przeglądarki bywa wyciszony przełącznikiem z boku – wyłącz tryb cichy i podgłośnij. Z wyłączonym ekranem czytają tylko nagrania (☁️).";

let state: SpeechState = {
  supported: false, voices: [], voiceUri: null, rate: 1, items: [], index: 0, status: "idle", source: null, group: null, continuous: true, hint: null,
};
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
function set(p: Partial<SpeechState>) {
  const before = state.status;
  state = { ...state, ...p };
  if (state.status !== before) mediaState();
  emit();
}

let chunks: string[] = [];
let chunk = 0;
let token = 0;
let inited = false;
let gapTimer: ReturnType<typeof setTimeout> | null = null;
/** Pauza złapana w przerwie między elementami – wznowienie zaczyna następny element. */
let resumeNext = false;
/** Kiedy ostatnio przerwano syntezator – WebKit gubi speak() wywołane zaraz po cancel(). */
let cancelledAt = 0;
/** Wybrany głos nie startuje – czytamy domyślnym głosem dla pl-PL. */
let noVoice = false;
/** Ile wypowiedzi z rzędu skończyło się bez startu (cisza) – po 2 bez wybranego głosu, po kolejnych 2 podpowiedź. */
let silentRun = 0;
/** Podpowiedź o ciszy zamknięta w tej karcie – nie wraca. */
let silentHintClosed = false;
/** Krótka cisza z gestu kliknięcia odblokowuje dźwięk na iOS – nie przerywać jej. */
let unlocking = false;
/** Nagrania na bieżąco w tej kolejce: id elementu → URL (null – nie udało się). */
let live = new Map<string, Promise<string | null>>();

const synth = () => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);
const ua = () => (typeof navigator === "undefined" ? "" : navigator.userAgent);
const isIOS = () => /iphone|ipad|ipod/i.test(ua()) || (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isMobile = () => isIOS() || /android/i.test(ua());

/* ---------- <audio>: nagrania i cisza ---------- */

let audioEl: HTMLAudioElement | null = null;
const audio = () => {
  if (!audioEl && typeof Audio !== "undefined") { audioEl = new Audio(); audioEl.preload = "auto"; }
  return audioEl;
};

let silenceUri: string | null = null;
/** 0,5 s ciszy (WAV 8 kHz) jako data: URI – do odblokowania dźwięku i wypełnienia czekania na nagranie. */
function silence(): string {
  if (!silenceUri) {
    const n = 4000;
    const b = new Uint8Array(44 + n);
    const v = new DataView(b.buffer);
    const str = (o: number, s: string) => [...s].forEach((c, i) => (b[o + i] = c.charCodeAt(0)));
    str(0, "RIFF"); v.setUint32(4, 36 + n, true); str(8, "WAVE"); str(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
    v.setUint16(32, 1, true); v.setUint16(34, 8, true); str(36, "data"); v.setUint32(40, n, true); b.fill(128, 44);
    let bin = "";
    b.forEach((x) => (bin += String.fromCharCode(x)));
    silenceUri = `data:audio/wav;base64,${btoa(bin)}`;
  }
  return silenceUri;
}

function stopAudio() {
  if (!audioEl || unlocking) return;
  audioEl.onended = audioEl.onerror = null;
  audioEl.loop = false;
  audioEl.pause();
  audioEl.removeAttribute("src");
  audioEl.load();
}

/** iOS: sesja „playback” – dźwięk mimo przełącznika wyciszenia (Safari 17+); starsze – krótka cisza z <audio> w geście. */
function unlockAudio(withSilence: boolean) {
  try {
    const as = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (as && as.type !== "playback") as.type = "playback";
  } catch {}
  if (!withSilence || !isIOS()) return;
  const a = audio();
  if (!a) return;
  unlocking = true;
  a.loop = false;
  a.src = silence();
  a.onended = () => { unlocking = false; };
  a.play().catch(() => { unlocking = false; });
  setTimeout(() => { unlocking = false; }, 1200);
}

/* ---------- Media Session: ekran blokady, słuchawki ---------- */

function mediaInit() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  const ms = navigator.mediaSession;
  const on = (a: MediaSessionAction, f: () => void) => { try { ms.setActionHandler(a, f); } catch {} };
  on("play", () => resume());
  on("pause", () => pause());
  on("nexttrack", () => next());
  on("previoustrack", () => prev());
  on("stop", () => stop());
}

function mediaItem(item: SpeechItem) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
  try { navigator.mediaSession.metadata = new MediaMetadata({ title: item.title, artist: "Testy OWE", album: "Czytanie na głos" }); } catch {}
}

function mediaState() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state.status === "playing" ? "playing" : state.status === "paused" ? "paused" : "none";
    if (state.status === "idle") navigator.mediaSession.metadata = null;
  } catch {}
}

/* ---------- głosy i ustawienia ---------- */

/** Głosy polskie: na telefonie lokalne najpierw (sieciowe bywają nieme), na komputerze naturalne (sieciowe) najpierw. */
function polishVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  const mobile = isMobile();
  const score = (v: SpeechSynthesisVoice) =>
    (mobile ? (v.localService ? 8 : 0) : (/natural|neural|online|wavenet/i.test(v.name) ? 4 : 0) + (v.localService ? 0 : 1)) +
    (/google/i.test(v.name) ? 2 : 0) + (/zosia|paulina|marek|ewa|agnieszka|zofia/i.test(v.name) ? 1 : 0);
  return s.getVoices().filter((v) => /^pl(-|_|$)/i.test(v.lang)).sort((a, b) => score(b) - score(a));
}

function init() {
  if (inited || typeof window === "undefined") return;
  inited = true;
  const s = synth();
  let saved: { voiceUri?: string; rate?: number } = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch {}
  const load = () => {
    const vs = polishVoices();
    set({
      supported: !!s, voices: vs.map((v) => ({ uri: v.voiceURI, name: v.name })),
      voiceUri: vs.find((v) => v.voiceURI === saved.voiceUri)?.voiceURI ?? vs[0]?.voiceURI ?? null,
      rate: RATES.includes(saved.rate ?? 1) ? saved.rate ?? 1 : 1,
    });
  };
  load();
  s?.addEventListener?.("voiceschanged", load);
  mediaInit();
  // zamknięcie karty / przejście na stronę logowania – cisza
  window.addEventListener("pagehide", () => stop());
}

function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify({ voiceUri: state.voiceUri, rate: state.rate })); } catch {}
}

const hintDismissed = () => { try { return localStorage.getItem(HINT_KEY) === "1"; } catch { return false; } };

/** Zamknięcie podpowiedzi w pasku (na iPhonie zapamiętane). */
export function dismissHint() {
  if (state.hint === SILENT_HINT) silentHintClosed = true;
  else try { localStorage.setItem(HINT_KEY, "1"); } catch {}
  set({ hint: null });
}

/* ---------- syntezator ---------- */

function cancelSynth() {
  const s = synth();
  if (!s) return;
  if (s.speaking || s.pending || s.paused) {
    if (s.paused) s.resume();
    s.cancel();
    cancelledAt = Date.now();
  }
}

function speakChunk() {
  const s = synth();
  const item = state.items[state.index];
  if (!item) { stop(); return; }
  if (!s) { itemDone(); return; }
  if (chunk >= chunks.length) { itemDone(); return; }
  if (state.source !== "synth") set({ source: "synth" });
  if (isIOS() && !state.hint && !hintDismissed()) set({ hint: IOS_HINT });
  const u = new SpeechSynthesisUtterance(chunks[chunk]);
  u.lang = "pl-PL";
  u.rate = state.rate;
  const v = noVoice ? null : s.getVoices().find((x) => x.voiceURI === state.voiceUri);
  if (v) u.voice = v;
  const my = token;
  let started = false;
  u.onstart = () => { started = true; silentRun = 0; };
  u.onend = () => {
    if (my !== token) return;
    if (!started) noteSilent(!!v);
    chunk++;
    speakChunk();
  };
  u.onerror = (e) => { if (my !== token || e.error === "interrupted" || e.error === "canceled") return; chunk++; speakChunk(); };
  const go = () => {
    if (my !== token) return;
    s.speak(u);
    // strażnik: wypowiedź wisi bez startu – ponów ją (bez wybranego głosu, jeśli to on milczy)
    setTimeout(() => {
      if (my !== token || started || state.status !== "playing" || document.hidden) return;
      noteSilent(!!v);
      token++;
      cancelSynth();
      speakChunk();
    }, 3000);
  };
  const wait = 150 - (Date.now() - cancelledAt);
  if (wait > 0) setTimeout(go, wait);
  else go();
}

/** Wypowiedź bez startu: dwie z rzędu – czytamy bez wybranego głosu; dalej cisza – podpowiedź w pasku. */
function noteSilent(withVoice: boolean) {
  silentRun++;
  if (withVoice && !noVoice && silentRun >= 2) { noVoice = true; silentRun = 0; return; }
  if (silentRun >= 2 && !silentHintClosed && state.hint !== SILENT_HINT) set({ hint: SILENT_HINT });
}

/* ---------- nagrania ---------- */

/** Nagranie na bieżąco: POST z ponowieniem przy chwilowym limicie (429). */
async function fetchLive(hash: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch("/api/podrecznik/nagrania", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash }) }).catch(() => null);
    if (r?.ok) return ((await r.json()) as { url: string | null }).url;
    if (r?.status !== 429) return null;
    await new Promise((res) => setTimeout(res, 3500));
  }
  return null;
}

/** Zamówienie nagrania elementu `i` (raz na kolejkę); po nagraniu element dostaje `audio` (☁️ w pasku). */
function liveFor(i: number): Promise<string | null> | null {
  const item = state.items[i];
  if (!item || item.audio || !item.live) return null;
  let job = live.get(item.id);
  if (!job) {
    const items = state.items;
    job = fetchLive(item.live).then((url) => {
      if (url && state.items === items) set({ items: items.map((x, k) => (k === i ? { ...x, audio: url } : x)) });
      return url;
    });
    live.set(item.id, job);
  }
  return job;
}

function playUrl(url: string, my: number, fallback: () => void) {
  const a = audio();
  if (!a) { fallback(); return; }
  unlocking = false;
  a.onended = a.onerror = null;
  a.loop = false;
  a.src = url;
  a.defaultPlaybackRate = state.rate;
  a.playbackRate = state.rate;
  a.onended = () => { if (my === token) itemDone(true); };
  a.onerror = () => { if (my === token) fallback(); };
  set({ source: "audio" });
  if (state.status === "playing") a.play().catch((e: Error) => { if (e.name !== "AbortError" && my === token) fallback(); });
}

/** Czekanie na nagranie: cisza w pętli trzyma sesję audio (ekran wyłączony). */
function playSilenceLoop() {
  const a = audio();
  if (!a) return;
  unlocking = false;
  a.onended = a.onerror = null;
  a.loop = true;
  a.src = silence();
  if (state.status === "playing") a.play().catch(() => {});
}

/* ---------- kolejka ---------- */

/** Koniec elementu – następny albo koniec czytania. Po nagraniu następny startuje od razu (w tle timery są wstrzymywane). */
function itemDone(fromAudio = false) {
  if (state.continuous && state.index + 1 < state.items.length) {
    if (fromAudio) { startItem(state.index + 1); return; }
    const my = token;
    gapTimer = setTimeout(() => { gapTimer = null; if (my === token && state.status === "playing") startItem(state.index + 1); }, 450);
  } else stop();
}

function startItem(i: number) {
  token++;
  resumeNext = false;
  if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; }
  cancelSynth();
  const item = state.items[i];
  if (!item) { stop(); return; }
  chunks = splitChunks(item.text);
  chunk = 0;
  set({ index: i, status: "playing" });
  mediaItem(item);
  const my = token;
  // kolejne dwa nagrania zamawiane z wyprzedzeniem
  liveFor(i + 1);
  liveFor(i + 2);
  const toSynth = () => {
    if (my !== token) return;
    stopAudio();
    // wstrzymane w trakcie czekania – syntezator ruszy przy wznowieniu
    if (state.status !== "playing") { set({ source: "synth" }); return; }
    speakChunk();
  };
  if (item.audio) { playUrl(item.audio, my, toSynth); return; }
  const job = liveFor(i);
  if (job) {
    set({ source: "wait" });
    playSilenceLoop();
    const timer = setTimeout(toSynth, 20000);
    job.then((url) => {
      clearTimeout(timer);
      if (my !== token) return;
      if (url) playUrl(url, my, toSynth);
      else toSynth();
    });
    return;
  }
  stopAudio();
  speakChunk();
}

/** Czyta listę od elementu `start`; `continuous: false` – tylko ten jeden element. */
export function play(items: SpeechItem[], start = 0, opts: { group?: string; continuous?: boolean } = {}) {
  init();
  if ((!synth() && !items.some((x) => x.audio || x.live)) || !items.length) return;
  const first = items[Math.max(0, Math.min(items.length - 1, start))];
  // w geście kliknięcia: sesja audio (iOS); cisza tylko gdy pierwszy element czyta syntezator
  unlockAudio(!first.audio && !first.live);
  live = new Map();
  set({ items, group: opts.group ?? null, continuous: opts.continuous ?? true, status: "playing", hint: null });
  startItem(Math.max(0, Math.min(items.length - 1, start)));
}

export function pause() {
  if (state.status !== "playing") return;
  if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; resumeNext = true; }
  if (state.source === "audio" || state.source === "wait") audioEl?.pause();
  else synth()?.pause();
  set({ status: "paused" });
}

export function resume() {
  if (state.status !== "paused") return;
  set({ status: "playing" });
  if (resumeNext) { resumeNext = false; startItem(state.index + 1); return; }
  if (state.source === "audio" || state.source === "wait") { audioEl?.play().catch(() => {}); return; }
  const s = synth();
  if (!s) return;
  // część przeglądarek (Android) nie wznawia po pause() – zaczynamy bieżące zdanie od nowa
  if (s.paused) s.resume();
  if (!s.speaking) { token++; speakChunk(); }
}

export function stop() {
  token++;
  if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; }
  cancelSynth();
  unlocking = false;
  stopAudio();
  chunks = [];
  chunk = 0;
  if (state.status !== "idle" || state.items.length) set({ status: "idle", items: [], index: 0, group: null, source: null });
}

/** Zatrzymuje czytanie, jeśli gra grupa zaczynająca się od `prefix` (np. przejście do następnego pytania). */
export function stopGroup(prefix: string) {
  if (state.group?.startsWith(prefix)) stop();
}

export const next = () => { if (state.index + 1 < state.items.length) startItem(state.index + 1); };
export const prev = () => {
  const restart = state.source === "audio" ? (audioEl?.currentTime ?? 0) > 2 : chunk > 0;
  startItem(restart ? state.index : Math.max(0, state.index - 1));
};

export function setRate(r: number) {
  set({ rate: r });
  saveSettings();
  if (state.source === "audio" && audioEl) { audioEl.defaultPlaybackRate = r; audioEl.playbackRate = r; return; }
  if (state.status === "playing" && state.source === "synth") { token++; cancelSynth(); speakChunk(); }
}

export function setVoice(uri: string) {
  set({ voiceUri: uri, hint: null });
  noVoice = false;
  silentRun = 0;
  saveSettings();
  if (state.status === "playing" && state.source === "synth") { token++; cancelSynth(); speakChunk(); }
}

export function useSpeech(): SpeechState {
  return useSyncExternalStore(
    (f) => { init(); subs.add(f); return () => { subs.delete(f); }; },
    () => state,
    () => state,
  );
}
