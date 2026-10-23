"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, isNetworkError } from "@/lib/client";
import { EMPTY_INK, INK_MAX_H, INK_MIN_H, INK_W, INK_WIDTHS, MAX_NOTE_CARDS, NOTE_CARD_W, simplify, snapAngle, strokeNear, strokePolyline, type Ink, type NoteCard, type NoteKind, type Stroke } from "@/lib/notes-core";
import { useCardPool } from "@/app/fiszki/card-pool";
import { CardPicker, NoteCards } from "./note-cards";
import type { NoteRow } from "@/lib/notes";

/**
 * Edytor notatki / brudnopisu – jedna kartka: tekst z klawiatury i pismo rysikiem, palcem lub myszą w tym samym miejscu.
 * Tryb ⌨️ Tekst pisze od góry kartki, ✏️ Pióro rysuje po tekście. Rysunek jest w jednostkach logicznych (szerokość 1000),
 * a czcionka i linie kartki w jednostkach szerokości kartki (cqw) – tekst łamie się tak samo na każdym ekranie,
 * więc dopiski rysikiem zostają przy swoim tekście. Zapis automatyczny (800 ms po zmianie).
 * Kształty: 📏 Linia (przeciągnij od–do, Shift – kąt co 15°) i 〰️ Krzywa (przeciągnij, potem wygnij punktami kontrolnymi,
 * ✓ zatwierdza). ⛶ – pełny ekran (Fullscreen API, a na iPhonie nakładka na cały ekran).
 */

type Tool = "text" | "pen" | "eraser" | "scroll" | "line" | "curve";
const TOOL_KEY = "ne-tool";
/** Domyślne narzędzie: na urządzeniu z myszą – tekst, na dotykowym – pióro; potem ostatni wybór. */
function initialTool(): Tool {
  try {
    const t = localStorage.getItem(TOOL_KEY);
    if (t === "text" || t === "pen") return t;
  } catch {}
  return typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches ? "pen" : "text";
}
export type SaveState = "idle" | "saving" | "saved" | "error";

const COLOR_VARS = ["--ink-0", "--ink-1", "--ink-2", "--ink-3"];
const COLOR_NAMES = ["Czarny", "Niebieski", "Czerwony", "Zielony"];
const WIDTH_NAMES = ["Cienka", "Średnia", "Gruba"];
const ERASE_R = 14;
const HISTORY = 60;
/** Promień uchwytu krzywej w pikselach ekranu (palec). */
const HANDLE_PX = 16;

export interface EditorProps {
  note: NoteRow | null;
  kind: NoteKind;
  /** Brudnopis pytania/lekcji (owe:<id>, lekcja:<id>:<sub>, …). */
  refKey?: string | null;
  /** Mniejsze płótno i bez pola tytułu (brudnopis pod pytaniem, szybki panel). */
  compact?: boolean;
  showTitle?: boolean;
  readOnly?: boolean;
  onSaved?: (n: NoteRow) => void;
  placeholder?: string;
}

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, k: number, colors: string[]) {
  const p = s.p, base = INK_WIDTHS[s.w] ?? 2;
  ctx.strokeStyle = colors[s.c] ?? colors[0];
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (s.t) {
    ctx.lineWidth = Math.max(0.6, base * k);
    ctx.beginPath();
    ctx.moveTo(p[0] * k, p[1] * k);
    if (s.t === "l") ctx.lineTo(p[3] * k, p[4] * k);
    else ctx.bezierCurveTo(p[3] * k, p[4] * k, p[6] * k, p[7] * k, p[9] * k, p[10] * k);
    ctx.stroke();
    return;
  }
  if (p.length === 3) {
    ctx.beginPath();
    ctx.arc(p[0] * k, p[1] * k, (base * (0.5 + p[2] / 100) * k) / 2 + 0.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // odcinki ze zmienną grubością (nacisk), wygładzone krzywą przez środki odcinków
  for (let i = 3; i < p.length; i += 3) {
    const x0 = i >= 6 ? (p[i - 6] + p[i - 3]) / 2 : p[i - 3], y0 = i >= 6 ? (p[i - 5] + p[i - 2]) / 2 : p[i - 2];
    const x1 = (p[i - 3] + p[i]) / 2, y1 = (p[i - 2] + p[i + 1]) / 2;
    ctx.lineWidth = Math.max(0.6, base * (0.5 + (p[i - 1] + p[i + 2]) / 200) * k);
    ctx.beginPath();
    ctx.moveTo(x0 * k, y0 * k);
    ctx.quadraticCurveTo(p[i - 3] * k, p[i - 2] * k, (i + 3 >= p.length ? p[i] : x1) * k, (i + 3 >= p.length ? p[i + 1] : y1) * k);
    ctx.stroke();
  }
}

function hitStroke(s: Stroke, x: number, y: number): boolean {
  const r = ERASE_R + (INK_WIDTHS[s.w] ?? 2);
  return strokeNear(strokePolyline(s), x, y, r);
}

/** Uchwyty edytowanej krzywej: przerywane ramiona do punktów kontrolnych, kółka (końce puste, punkty kontrolne pełne). */
function drawHandles(ctx: CanvasRenderingContext2D, p: number[], k: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(p[0] * k, p[1] * k); ctx.lineTo(p[3] * k, p[4] * k);
  ctx.moveTo(p[9] * k, p[10] * k); ctx.lineTo(p[6] * k, p[7] * k);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(p[i * 3] * k, p[i * 3 + 1] * k, i === 1 || i === 2 ? 8 : 6, 0, Math.PI * 2);
    if (i === 1 || i === 2) ctx.fill(); else ctx.stroke();
  }
  ctx.restore();
}

export function NoteEditor({ note, kind, refKey = null, compact = false, showTitle = !compact, readOnly = false, onSaved, placeholder }: EditorProps) {
  const [id, setId] = useState<string | null>(note?.id ?? null);
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [ink, setInk] = useState<Ink>(note?.ink ?? EMPTY_INK);
  const [cards, setCards] = useState<NoteCard[]>(note?.cards ?? []);
  const [picker, setPicker] = useState(false);
  // dane fiszek pobierane dopiero, gdy na kartce jest fiszka albo otwarto wyszukiwarkę
  const pool = useCardPool(cards.length > 0 || picker);
  const poolById = useMemo(() => new Map((pool.rows ?? []).map((r) => [r.id, r])), [pool.rows]);
  const [tool, setToolState] = useState<Tool>("text");
  useEffect(() => { setToolState(initialTool()); }, []);
  const setTool = useCallback((t: Tool) => {
    setToolState(t);
    if (t === "text" || t === "pen") { try { localStorage.setItem(TOOL_KEY, t); } catch {} }
  }, []);
  const [textH, setTextH] = useState(0);
  const [color, setColor] = useState(0);
  const [width, setWidth] = useState(0);
  const [extra, setExtra] = useState(0);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const undo = useRef<Ink[]>([]);
  const redo = useRef<Ink[]>([]);
  const [, setHist] = useState(0);
  // krzywa w edycji (przed zatwierdzeniem): 4 punkty [x, y, 50, …] – ref do rysowania, stan do paska narzędzi
  const [curve, setCurveState] = useState<number[] | null>(null);
  const curveRef = useRef<number[] | null>(null);
  const setCurve = useCallback((c: number[] | null) => { curveRef.current = c; setCurveState(c); }, []);
  const [full, setFull] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [cssW, setCssW] = useState(0);
  const k = cssW / INK_W;
  // na wąskim ekranie kartka ma co najmniej ~360 px (brudnopis ~260 px) wysokości – puste miejsce, nie zmienia rysunku
  const minH = Math.max(compact ? 420 : INK_MIN_H, k ? Math.ceil((compact ? 260 : 360) / k) : 0);
  const cardsBottom = cards.reduce((m, c) => Math.max(m, c.y + 320), 0);
  const logicalH = Math.max(minH, ink.h + 160, textH + 120, cardsBottom) + extra;

  // --- zapis automatyczny ---
  const dirty = useRef(false);
  const latest = useRef({ title, body, ink, cards });
  latest.current = { title, body, ink, cards };
  const idRef = useRef(id);
  idRef.current = id;
  const saving = useRef<Promise<void> | null>(null);
  const cfg = useRef({ kind, refKey, onSaved });
  cfg.current = { kind, refKey, onSaved };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // identyfikator nowej notatki nadany tutaj – ponowiony POST po zgubionej odpowiedzi nie tworzy kopii
  const cid = useRef<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const flush = useCallback(async (keepalive = false) => {
    if (readOnly || !dirty.current) return;
    if (saving.current) { await saving.current; if (!dirty.current) return; }
    dirty.current = false;
    const { title: t, body: b, ink: i, cards: cs } = latest.current;
    setSave("saving");
    const run = (async () => {
      try {
        if (!idRef.current) cid.current ??= crypto.randomUUID();
        const payload = JSON.stringify(idRef.current ? { title: t, body: b, ink: i, cards: cs } : { kind: cfg.current.kind, ref: cfg.current.refKey, cid: cid.current, title: t, body: b, ink: i, cards: cs });
        const n = idRef.current
          ? await api<NoteRow>(`/api/notatki/${idRef.current}`, { method: "PATCH", body: payload, keepalive })
          : await api<NoteRow>("/api/notatki", { method: "POST", body: payload, keepalive });
        if (!idRef.current) { idRef.current = n.id; setId(n.id); }
        setSave(dirty.current ? "saving" : "saved");
        setError(null);
        cfg.current.onSaved?.(n);
      } catch (e) {
        dirty.current = true;
        setSave("error");
        setError((e as Error).message);
        // bez sieci albo chwilowy błąd serwera: ponowienie za 5 s (i od razu po powrocie sieci – efekt niżej).
        // Błąd trwały (np. 400, 403 – sekcja zablokowana, 413) – bez ponawiania; zapis spróbuje przy kolejnej zmianie.
        // Po zamknięciu edytora – też bez ponawiania (zapis przy wyjściu był ostatnią próbą).
        const st = e instanceof ApiError ? e.status : 0;
        const transient = isNetworkError(e) || st >= 500 || st === 429;
        if (timer.current) clearTimeout(timer.current);
        if (transient && mounted.current) timer.current = setTimeout(() => void flushRef.current(), 5000);
      }
    })();
    saving.current = run;
    await run;
    saving.current = null;
  }, [readOnly]);

  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => {
    const on = () => { if (dirty.current) void flushRef.current(); };
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, []);

  const touch = useCallback(() => {
    if (readOnly) return;
    dirty.current = true;
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 800);
  }, [flush, readOnly]);

  // zapis przy wyjściu ze strony / zamknięciu karty / odmontowaniu (np. przejście do następnego pytania)
  useEffect(() => {
    const out = () => { if (timer.current) clearTimeout(timer.current); void flush(true); };
    window.addEventListener("pagehide", out);
    const vis = () => document.visibilityState === "hidden" && out();
    document.addEventListener("visibilitychange", vis);
    return () => { window.removeEventListener("pagehide", out); document.removeEventListener("visibilitychange", vis); out(); };
  }, [flush]);

  // --- tekst na kartce: wysokość treści (w jednostkach logicznych) wydłuża kartkę ---
  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta || !cssW) return;
    const prev = ta.style.height;
    ta.style.height = "0px";
    const h = ta.scrollHeight;
    ta.style.height = prev;
    setTextH(Math.ceil(h / (cssW / INK_W)));
  }, [body, cssW]);

  // przełączenie na tekst – kursor od razu w polu (na końcu)
  const focusText = useCallback((append = "") => {
    const ta = taRef.current;
    if (!ta || readOnly) return;
    ta.focus({ preventScroll: true });
    if (append) {
      const v = ta.value + append;
      setBody(v);
      touch();
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = v.length; });
    }
  }, [readOnly, touch]);

  // --- płótno ---
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCssW(el.clientWidth));
    ro.observe(el);
    setCssW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const colors = useRef<string[]>([]);
  const styleRef = useRef({ color: 0, width: 0 });
  // Zatwierdzony rysunek w osobnej warstwie (canvas poza ekranem) – przy przeciąganiu linii albo uchwytu krzywej
  // tylko kopiujemy tę warstwę i dorysowujemy podgląd, zamiast rysować od nowa wszystkie kreski przy każdym ruchu.
  const base = useRef<{ c: HTMLCanvasElement; ink: Ink | null; key: string } | null>(null);
  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !cssW) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const h = Math.round(logicalH * k);
    const W = Math.round(cssW * dpr), H = Math.round(h * dpr);
    if (c.width !== W || c.height !== H) {
      c.width = W;
      c.height = H;
      c.style.height = `${h}px`;
    }
    const cs = getComputedStyle(c);
    colors.current = COLOR_VARS.map((v) => cs.getPropertyValue(v).trim() || "#222");
    const key = `${W}x${H}:${k}:${colors.current.join(",")}`;
    base.current ??= { c: document.createElement("canvas"), ink: null, key: "" };
    const b = base.current;
    if (b.ink !== latest.current.ink || b.key !== key) {
      b.c.width = W;
      b.c.height = H;
      const bx = b.c.getContext("2d")!;
      bx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bx.clearRect(0, 0, cssW, h);
      for (const s of latest.current.ink.s) drawStroke(bx, s, k, colors.current);
      b.ink = latest.current.ink;
      b.key = key;
    }
    const ctx = c.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(b.c, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cv = curveRef.current;
    if (cv) {
      drawStroke(ctx, { c: styleRef.current.color, w: styleRef.current.width, p: cv, t: "b" }, k, colors.current);
      drawHandles(ctx, cv, k, cs.getPropertyValue("--accent").trim() || "#2563eb");
    }
  }, [cssW, k, logicalH]);
  styleRef.current = { color, width };
  useEffect(() => { redraw(); }, [redraw, ink, curve, color, width]);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", redraw);
    return () => mq.removeEventListener("change", redraw);
  }, [redraw]);

  const commit = useCallback((next: Ink) => {
    undo.current = [...undo.current.slice(-HISTORY + 1), latest.current.ink];
    redo.current = [];
    setHist((h) => h + 1);
    setInk(next);
    touch();
  }, [touch]);

  /** Zatwierdza edytowaną krzywą jako kreskę rysunku. */
  const commitCurve = useCallback(() => {
    const cv = curveRef.current;
    if (!cv) return;
    setCurve(null);
    const maxY = Math.max(cv[1], cv[4], cv[7], cv[10]);
    commit({ h: Math.max(latest.current.ink.h, Math.min(INK_MAX_H, maxY + 40)), s: [...latest.current.ink.s, { c: styleRef.current.color, w: styleRef.current.width, p: cv, t: "b" }] });
  }, [commit, setCurve]);
  // zmiana narzędzia zatwierdza krzywą
  useEffect(() => { if (tool !== "curve") commitCurve(); }, [tool, commitCurve]);

  // kształt w trakcie przeciągania (linia albo nowa krzywa) i przeciągany uchwyt krzywej
  const shape = useRef<{ pid: number; ax: number; ay: number; bx: number; by: number } | null>(null);
  const handle = useRef<{ pid: number; i: number } | null>(null);
  const clampPt = (x: number, y: number): [number, number] => [Math.min(INK_W, Math.max(0, x)), Math.min(INK_MAX_H, Math.max(0, y))];

  const cur = useRef<{ pid: number; pts: number[]; erased: boolean; base: Ink } | null>(null);
  const penSeen = useRef(false);
  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * INK_W), Math.round(((e.clientY - r.top) / r.width) * INK_W)];
  };
  const pressure = (e: React.PointerEvent) => (e.pointerType === "pen" && e.pressure > 0 ? Math.round(e.pressure * 100) : 50);

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || tool === "scroll" || tool === "text") return;
    e.currentTarget.focus({ preventScroll: true });
    if (e.pointerType === "pen") penSeen.current = true;
    // rysik w użyciu: dotyk dłoni opartej o ekran nie rysuje
    if (e.pointerType === "touch" && penSeen.current) return;
    if (cur.current || shape.current || handle.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = pos(e);
    if (tool === "line" || tool === "curve") {
      const cv = curveRef.current;
      if (tool === "curve" && cv) {
        // najbliższy uchwyt w zasięgu palca – przeciąganie; dotknięcie obok zatwierdza krzywą i zaczyna nową
        const r = HANDLE_PX / (k || 1);
        let best = -1, bd = Infinity;
        for (let i = 0; i < 4; i++) { const d = Math.hypot(cv[i * 3] - x, cv[i * 3 + 1] - y); if (d <= r && d < bd) { best = i; bd = d; } }
        if (best >= 0) { handle.current = { pid: e.pointerId, i: best }; return; }
        commitCurve();
      }
      shape.current = { pid: e.pointerId, ax: x, ay: y, bx: x, by: y };
      return;
    }
    // gumka końcówki rysika (przycisk „eraser”) też ściera
    const erasing = tool === "eraser" || e.button === 5 || (e.buttons & 32) !== 0;
    cur.current = { pid: e.pointerId, pts: [x, y, pressure(e)], erased: erasing, base: latest.current.ink };
    if (erasing) eraseAt(x, y);
    else {
      const ctx = canvasRef.current!.getContext("2d")!;
      drawStroke(ctx, { c: color, w: width, p: cur.current.pts }, k, colors.current);
    }
  };

  const eraseAt = (x: number, y: number) => {
    const ink0 = latest.current.ink;
    const kept = ink0.s.filter((s) => !hitStroke(s, x, y));
    if (kept.length !== ink0.s.length) {
      latest.current = { ...latest.current, ink: { ...ink0, s: kept } };
      setInk(latest.current.ink);
    }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const h = handle.current, sh = shape.current;
    if (h && h.pid === e.pointerId && curveRef.current) {
      e.preventDefault();
      const [x, y] = clampPt(...(pos(e) as [number, number]));
      const cv = [...curveRef.current];
      cv[h.i * 3] = x; cv[h.i * 3 + 1] = y;
      // podczas przeciągania tylko ref + szybkie przerysowanie; stan (przyciski ✓/✕) – po puszczeniu uchwytu
      curveRef.current = cv;
      redraw();
      return;
    }
    if (sh && sh.pid === e.pointerId) {
      e.preventDefault();
      let [x, y] = clampPt(...(pos(e) as [number, number]));
      if (e.shiftKey) [x, y] = clampPt(...snapAngle(sh.ax, sh.ay, x, y));
      sh.bx = x; sh.by = y;
      redraw();
      const ctx = canvasRef.current!.getContext("2d")!;
      drawStroke(ctx, { c: color, w: width, p: [sh.ax, sh.ay, 50, x, y, 50], t: "l" }, k, colors.current);
      return;
    }
    const s = cur.current;
    if (!s || s.pid !== e.pointerId) return;
    e.preventDefault();
    const evs = typeof e.nativeEvent.getCoalescedEvents === "function" ? e.nativeEvent.getCoalescedEvents() : [];
    const list = evs.length ? evs : [e.nativeEvent];
    const r = canvasRef.current!.getBoundingClientRect();
    const ctx = canvasRef.current!.getContext("2d")!;
    for (const ev of list) {
      const x = Math.round(((ev.clientX - r.left) / r.width) * INK_W), y = Math.round(((ev.clientY - r.top) / r.width) * INK_W);
      if (s.erased) {
        // szybki ruch gumki: sprawdzaj też punkty pośrednie, żeby nie przeskoczyć kreski
        const lx = s.pts[s.pts.length - 3], ly = s.pts[s.pts.length - 2];
        const steps = Math.max(1, Math.ceil(Math.hypot(x - lx, y - ly) / (ERASE_R / 2)));
        for (let j = 1; j <= steps; j++) eraseAt(lx + ((x - lx) * j) / steps, ly + ((y - ly) * j) / steps);
        s.pts.push(x, y, 50);
        continue;
      }
      const n = s.pts.length;
      if (Math.abs(s.pts[n - 3] - x) + Math.abs(s.pts[n - 2] - y) < 2) continue;
      s.pts.push(x, y, ev.pointerType === "pen" && ev.pressure > 0 ? Math.round(ev.pressure * 100) : 50);
      const tail = s.pts.slice(-9);
      drawStroke(ctx, { c: color, w: width, p: tail }, k, colors.current);
    }
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (handle.current?.pid === e.pointerId) { handle.current = null; if (curveRef.current) setCurve(curveRef.current); return; }
    const sh = shape.current;
    if (sh && sh.pid === e.pointerId) {
      shape.current = null;
      if (Math.hypot(sh.bx - sh.ax, sh.by - sh.ay) < 6) { redraw(); return; }
      if (tool === "curve") {
        // nowa krzywa: prosta z punktami kontrolnymi w 1/3 i 2/3 – do wygięcia uchwytami
        const t = (u: number) => [Math.round(sh.ax + (sh.bx - sh.ax) * u), Math.round(sh.ay + (sh.by - sh.ay) * u), 50];
        setCurve([sh.ax, sh.ay, 50, ...t(1 / 3), ...t(2 / 3), sh.bx, sh.by, 50]);
        return;
      }
      commit({ h: Math.max(latest.current.ink.h, Math.max(sh.ay, sh.by) + 40), s: [...latest.current.ink.s, { c: color, w: width, p: [sh.ax, sh.ay, 50, sh.bx, sh.by, 50], t: "l" }] });
      return;
    }
    const s = cur.current;
    if (!s || s.pid !== e.pointerId) return;
    cur.current = null;
    if (s.erased) {
      if (latest.current.ink.s.length !== s.base.s.length) {
        const next = latest.current.ink;
        latest.current = { ...latest.current, ink: s.base };
        commit(next);
      }
      return;
    }
    const p = simplify(s.pts);
    const maxY = p.reduce((m, v, i) => (i % 3 === 1 ? Math.max(m, v) : m), 0);
    commit({ h: Math.max(latest.current.ink.h, maxY + 40), s: [...latest.current.ink.s, { c: color, w: width, p }] });
  };

  const doUndo = () => {
    if (curveRef.current) { setCurve(null); return; }
    const prev = undo.current.pop();
    if (!prev) return;
    redo.current.push(latest.current.ink);
    setHist((h) => h + 1);
    setInk(prev);
    touch();
  };
  const doRedo = () => {
    const next = redo.current.pop();
    if (!next) return;
    undo.current.push(latest.current.ink);
    setHist((h) => h + 1);
    setInk(next);
    touch();
  };
  const clear = () => {
    if (!latest.current.ink.s.length || !confirm("Wyczyścić cały rysunek? (można cofnąć)")) return;
    commit({ h: 0, s: [] });
  };

  // Ctrl+Z / Ctrl+Y w obrębie edytora (w polu tekstu – natywne cofanie tekstu);
  // zwykły znak z klawiatury w trybie pióra/gumki przełącza na tekst i trafia na koniec tekstu
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && full) { e.stopPropagation(); void toggleFull(false); return; }
    if (e.key === "Enter" && curveRef.current && (e.target as HTMLElement).tagName !== "TEXTAREA") { e.preventDefault(); commitCurve(); return; }
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "TEXTAREA" || tag === "INPUT" || tag === "BUTTON") return;
    if (!readOnly && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || e.key === "Enter")) {
      e.preventDefault();
      setTool("text");
      focusText(e.key === "Enter" ? "\n" : e.key);
      return;
    }
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); }
    if (e.key.toLowerCase() === "y") { e.preventDefault(); doRedo(); }
  };

  // --- pełny ekran: Fullscreen API na edytorze, a gdy go brak (iPhone) – nakładka na cały ekran (klasa ne-full) ---
  const toggleFull = useCallback(async (on: boolean) => {
    setFull(on);
    const el = rootRef.current;
    try {
      if (on && el?.requestFullscreen && !document.fullscreenElement) await el.requestFullscreen();
      else if (!on && document.fullscreenElement) await document.exitFullscreen();
    } catch {}
  }, []);
  useEffect(() => {
    const h = () => { if (!document.fullscreenElement) setFull(false); };
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  useEffect(() => {
    if (!full) return;
    document.documentElement.classList.add("ne-full-open");
    return () => document.documentElement.classList.remove("ne-full-open");
  }, [full]);

  const status = readOnly ? "tylko podgląd" : save === "saving" ? "Zapisywanie…" : save === "saved" ? "Zapisano ✓" : save === "error" ? "Nie zapisano" : "";

  return (
    <div ref={rootRef} className={`notes-editor${compact ? " compact" : ""}${full ? " ne-full" : ""}`} onKeyDown={onKeyDown} data-testid="notes-editor">
      {showTitle && !compact && <h1 className="sr-only">{title || "Notatka"}</h1>}
      {showTitle && (
        <input className="ne-title" value={title} placeholder="Tytuł notatki" maxLength={120} readOnly={readOnly}
          onChange={(e) => { setTitle(e.target.value); touch(); }} aria-label="Tytuł" />
      )}
      {!readOnly && (
        <div className="ne-tools" role="toolbar" aria-label="Narzędzia rysowania">
          <div className="ne-group">
            <button type="button" className={tool === "text" ? "on" : ""} aria-pressed={tool === "text"} onClick={() => { setTool("text"); focusText(); }} title="Tekst z klawiatury – na tej samej kartce">⌨️<span className="ne-lbl"> Tekst</span></button>
            <button type="button" className={tool === "pen" ? "on" : ""} aria-pressed={tool === "pen"} onClick={() => setTool("pen")} title="Pióro">✏️<span className="ne-lbl"> Pióro</span></button>
            <button type="button" className={tool === "line" ? "on" : ""} aria-pressed={tool === "line"} onClick={() => setTool("line")} title="Linia prosta – przeciągnij od początku do końca (Shift: kąt co 15°)" data-testid="tool-line">📏<span className="ne-lbl"> Linia</span></button>
            <button type="button" className={tool === "curve" ? "on" : ""} aria-pressed={tool === "curve"} onClick={() => setTool("curve")} title="Krzywa – przeciągnij, potem wygnij punktami kontrolnymi i zatwierdź ✓" data-testid="tool-curve">〰️<span className="ne-lbl"> Krzywa</span></button>
            <button type="button" className={tool === "eraser" ? "on" : ""} aria-pressed={tool === "eraser"} onClick={() => setTool("eraser")} title="Gumka – ściera całe kreski">🧽<span className="ne-lbl"> Gumka</span></button>
            <button type="button" className={tool === "scroll" ? "on" : ""} aria-pressed={tool === "scroll"} onClick={() => setTool("scroll")} title="Przewijanie palcem – płótno nie rysuje">✋<span className="ne-lbl"> Przewijaj</span></button>
          </div>
          <div className="ne-group" aria-label="Kolor">
            {COLOR_VARS.map((v, i) => (
              <button key={v} type="button" className={`ne-color${color === i ? " on" : ""}`} aria-pressed={color === i} title={COLOR_NAMES[i]}
                onClick={() => { setColor(i); if (tool !== "pen") setTool("pen"); }}>
                <i style={{ background: `var(${v})` }} aria-hidden /><span className="sr-only">{COLOR_NAMES[i]}</span>
              </button>
            ))}
          </div>
          <div className="ne-group" aria-label="Grubość">
            {INK_WIDTHS.map((w, i) => (
              <button key={w} type="button" className={`ne-width${width === i ? " on" : ""}`} aria-pressed={width === i} title={WIDTH_NAMES[i]}
                onClick={() => { setWidth(i); if (tool !== "pen") setTool("pen"); }}>
                <i style={{ width: 4 + w * 1.6, height: 4 + w * 1.6 }} aria-hidden /><span className="sr-only">{WIDTH_NAMES[i]}</span>
              </button>
            ))}
          </div>
          <div className="ne-group">
            <button type="button" onClick={doUndo} disabled={!undo.current.length && !curve} title="Cofnij (Ctrl+Z)" data-testid="ink-undo">↶<span className="sr-only">Cofnij</span></button>
            <button type="button" onClick={doRedo} disabled={!redo.current.length} title="Ponów (Ctrl+Y)" data-testid="ink-redo">↷<span className="sr-only">Ponów</span></button>
            <button type="button" onClick={clear} disabled={!ink.s.length} title="Wyczyść rysunek">🗑️<span className="sr-only">Wyczyść rysunek</span></button>
            <button type="button" className={picker ? "on" : ""} aria-pressed={picker} onClick={() => setPicker((v) => !v)} disabled={cards.length >= MAX_NOTE_CARDS}
              title="Wstaw fiszkę na kartkę – kwadrat do przesuwania" data-testid="note-card-add">🗂️<span className="ne-lbl"> Fiszka</span></button>
            <button type="button" className={full ? "on" : ""} aria-pressed={full} onClick={() => void toggleFull(!full)}
              title={full ? "Zamknij pełny ekran (Esc)" : "Pełny ekran"} data-testid="ink-full">{full ? "🗗" : "⛶"}<span className="sr-only">{full ? "Zamknij pełny ekran" : "Pełny ekran"}</span></button>
          </div>

        </div>
      )}
      {picker && !readOnly && (
        <CardPicker pool={pool} already={new Set(cards.map((c) => c.id))} onClose={() => setPicker(false)} onPick={(cid) => {
          // nowa fiszka na środku widocznej części kartki
          const r = wrapRef.current?.getBoundingClientRect();
          const visMid = r && k ? ((Math.min(window.innerHeight, r.bottom) + Math.max(0, r.top)) / 2 - r.top) / k : 200;
          const y = Math.max(0, Math.round(visMid - 120)) + cards.length * 24;
          setCards((cs) => [...cs, { id: cid, x: Math.round((INK_W - NOTE_CARD_W) / 2) + (cs.length % 3) * 20, y }]);
          setPicker(false);
          touch();
        }} />
      )}
      <div className="ne-sheet">
        <div ref={wrapRef} className={`ne-canvas-wrap tool-${readOnly ? "view" : tool}`}>
          <textarea ref={taRef} className="ne-text" value={body} readOnly={readOnly} spellCheck tabIndex={tool === "text" || readOnly ? 0 : -1}
            placeholder={readOnly ? "" : placeholder ?? (kind === "scratch" ? "Pisz tu z klawiatury (⌨️) albo rysikiem (✏️) – obliczenia, myśli…" : "Pisz tu z klawiatury (⌨️) albo rysikiem (✏️)…")}
            onChange={(e) => { setBody(e.target.value); touch(); }} aria-label="Tekst notatki" data-testid="sheet-text" />
          <canvas ref={canvasRef} className="ne-canvas" data-testid="ink-canvas" tabIndex={-1}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            aria-label="Kartka do pisania rysikiem lub palcem" />
          {curve && (
            // dymek przy krzywej (nie w pasku narzędzi – kartka nie przesuwa się pod palcem)
            <div className="ne-curve" role="group" aria-label="Edycja krzywej"
              style={{ left: Math.min(Math.max(curve[0], curve[9]) * k, Math.max(0, cssW - 230)), top: (Math.max(curve[1], curve[4], curve[7], curve[10]) + 24) * k }}>
              <span className="small">Przeciągnij ● punkty kontrolne</span>
              <button type="button" className="btn small" onClick={commitCurve} title="Zatwierdź krzywą (Enter)" data-testid="curve-ok">✓ Gotowe</button>
              <button type="button" className="btn small secondary" onClick={() => setCurve(null)} title="Odrzuć krzywą" data-testid="curve-cancel">✕</button>
            </div>
          )}
          <NoteCards cards={cards} byId={poolById} k={k} readOnly={readOnly} onChange={(cs) => { setCards(cs); touch(); }} />
        </div>
      </div>
      <div className="ne-foot">
        {!readOnly && <button type="button" className="linkbtn" onClick={() => setExtra((x) => x + 400)}>+ więcej miejsca</button>}
        <span className={`ne-status ${save}`} role="status" data-testid="save-status">{status}</span>
      </div>
      {error && <p className="error small">{error}</p>}
    </div>
  );
}
