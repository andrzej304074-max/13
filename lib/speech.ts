"use client";

import { useSyncExternalStore } from "react";
import { splitChunks, type SpeechItem } from "./speech-text";

/**
 * Czytanie na głos przez syntezator mowy przeglądarki (Web Speech API) – bez kluczy i opłat;
 * elementy z nagraniem (`audio` – akapity Podręcznika nagrane głosem Azure, lib/tts.ts) grają z pliku.
 * Jedna kolejka w karcie: lista elementów (artykuł → akapity, tabela → hasła…), każdy dzielony na zdania.
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
  /** Grupa (np. „artykul:makro-pkb”) – przycisk 🔊 wie, że to jego lista gra. */
  group: string | null;
  /** Czytać kolejne elementy po skończeniu bieżącego. */
  continuous: boolean;
}

const KEY = "owe:speech";
const RATES = [0.8, 0.9, 1, 1.15, 1.3, 1.5];
export const SPEECH_RATES = RATES;

let state: SpeechState = { supported: false, voices: [], voiceUri: null, rate: 1, items: [], index: 0, status: "idle", group: null, continuous: true };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const set = (p: Partial<SpeechState>) => { state = { ...state, ...p }; emit(); };

let chunks: string[] = [];
let chunk = 0;
let token = 0;
let inited = false;
let gapTimer: ReturnType<typeof setTimeout> | null = null;
/** Pauza złapana w przerwie między elementami – wznowienie zaczyna następny element. */
let resumeNext = false;

/** Odtwarzacz nagrań (jeden na kartę). */
let audioEl: HTMLAudioElement | null = null;
const audio = () => {
  if (!audioEl && typeof Audio !== "undefined") audioEl = new Audio();
  return audioEl;
};
const playingAudio = () => !!state.items[state.index]?.audio && !!audioEl && !!audioEl.src && !audioEl.ended;

const synth = () => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);

/** Głosy polskie, lepsze (naturalne, sieciowe) najpierw. */
function polishVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|neural|online|wavenet/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (/zosia|paulina|marek|ewa|agnieszka/i.test(v.name) ? 1 : 0) + (v.localService ? 0 : 1);
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
  // zamknięcie karty / przejście na stronę logowania – cisza
  window.addEventListener("pagehide", () => stop());
}

function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify({ voiceUri: state.voiceUri, rate: state.rate })); } catch {}
}

function speakChunk() {
  const s = synth();
  if (!s) return;
  const item = state.items[state.index];
  if (!item) { stop(); return; }
  if (chunk >= chunks.length) { itemDone(); return; }
  const u = new SpeechSynthesisUtterance(chunks[chunk]);
  u.lang = "pl-PL";
  u.rate = state.rate;
  const v = s.getVoices().find((x) => x.voiceURI === state.voiceUri);
  if (v) u.voice = v;
  const my = token;
  u.onend = () => { if (my !== token) return; chunk++; speakChunk(); };
  u.onerror = (e) => { if (my !== token || e.error === "interrupted" || e.error === "canceled") return; chunk++; speakChunk(); };
  s.speak(u);
}

/** Koniec elementu – następny (krótka pauza) albo koniec czytania. */
function itemDone() {
  if (state.continuous && state.index + 1 < state.items.length) {
    const my = token;
    gapTimer = setTimeout(() => { gapTimer = null; if (my === token && state.status === "playing") startItem(state.index + 1); }, 450);
  } else stop();
}

function silenceAll() {
  const s = synth();
  if (s) { if (s.paused) s.resume(); s.cancel(); }
  if (audioEl) { audioEl.onended = audioEl.onerror = null; audioEl.pause(); audioEl.removeAttribute("src"); audioEl.load(); }
}

function startItem(i: number) {
  token++;
  resumeNext = false;
  if (gapTimer) clearTimeout(gapTimer);
  silenceAll();
  const item = state.items[i];
  if (!item) { stop(); return; }
  chunks = splitChunks(item.text);
  chunk = 0;
  set({ index: i, status: "playing" });
  const a = item.audio ? audio() : null;
  if (a && item.audio) {
    const my = token;
    a.src = item.audio;
    a.playbackRate = state.rate;
    a.onended = () => { if (my === token) itemDone(); };
    // plik niedostępny (sieć, usunięte nagranie) – ten element czyta syntezator
    const fallback = () => { if (my !== token) return; a.onended = a.onerror = null; a.removeAttribute("src"); speakChunk(); };
    a.onerror = fallback;
    a.play().catch((e: Error) => { if (e.name !== "AbortError") fallback(); });
    return;
  }
  speakChunk();
}

/** Czyta listę od elementu `start`; `continuous: false` – tylko ten jeden element. */
export function play(items: SpeechItem[], start = 0, opts: { group?: string; continuous?: boolean } = {}) {
  init();
  if ((!synth() && !items.some((x) => x.audio)) || !items.length) return;
  set({ items, group: opts.group ?? null, continuous: opts.continuous ?? true });
  startItem(Math.max(0, Math.min(items.length - 1, start)));
}

export function pause() {
  if (state.status !== "playing") return;
  if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; resumeNext = true; }
  if (playingAudio()) audioEl!.pause();
  else synth()?.pause();
  set({ status: "paused" });
}

export function resume() {
  if (state.status !== "paused") return;
  set({ status: "playing" });
  if (resumeNext) { resumeNext = false; startItem(state.index + 1); return; }
  if (playingAudio()) { audioEl!.play().catch(() => {}); return; }
  const s = synth();
  if (!s) return;
  // część przeglądarek (Android) nie wznawia po pause() – zaczynamy bieżące zdanie od nowa
  if (s.paused) s.resume();
  if (!s.speaking) { token++; speakChunk(); }
}

export function stop() {
  token++;
  if (gapTimer) clearTimeout(gapTimer);
  silenceAll();
  chunks = [];
  chunk = 0;
  if (state.status !== "idle" || state.items.length) set({ status: "idle", items: [], index: 0, group: null });
}

/** Zatrzymuje czytanie, jeśli gra grupa zaczynająca się od `prefix` (np. przejście do następnego pytania). */
export function stopGroup(prefix: string) {
  if (state.group?.startsWith(prefix)) stop();
}

export const next = () => { if (state.index + 1 < state.items.length) startItem(state.index + 1); };
export const prev = () => startItem((playingAudio() ? audioEl!.currentTime > 2 : chunk > 0) ? state.index : Math.max(0, state.index - 1));

export function setRate(r: number) {
  set({ rate: r });
  saveSettings();
  if (playingAudio()) { audioEl!.playbackRate = r; return; }
  if (state.status === "playing") { token++; synth()?.cancel(); speakChunk(); }
}

export function setVoice(uri: string) {
  set({ voiceUri: uri });
  saveSettings();
  if (state.status === "playing" && !playingAudio()) { token++; synth()?.cancel(); speakChunk(); }
}

export function useSpeech(): SpeechState {
  return useSyncExternalStore(
    (f) => { init(); subs.add(f); return () => { subs.delete(f); }; },
    () => state,
    () => state,
  );
}
