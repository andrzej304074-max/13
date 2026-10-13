"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { EMPTY_INK, INK_MIN_H, INK_W, INK_WIDTHS, simplify, strokeNear, type Ink, type NoteKind, type Stroke } from "@/lib/notes-core";
import type { NoteRow } from "@/lib/notes";

/**
 * Edytor notatki / brudnopisu – jedna kartka: tekst z klawiatury i pismo rysikiem, palcem lub myszą w tym samym miejscu.
 * Tryb ⌨️ Tekst pisze od góry kartki, ✏️ Pióro rysuje po tekście. Rysunek jest w jednostkach logicznych (szerokość 1000),
 * a czcionka i linie kartki w jednostkach szerokości kartki (cqw) – tekst łamie się tak samo na każdym ekranie,
 * więc dopiski rysikiem zostają przy swoim tekście. Zapis automatyczny (800 ms po zmianie).
 */

type Tool = "text" | "pen" | "eraser" | "scroll";
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
  return strokeNear(s.p, x, y, r);
}

export function NoteEditor({ note, kind, refKey = null, compact = false, showTitle = !compact, readOnly = false, onSaved, placeholder }: EditorProps) {
  const [id, setId] = useState<string | null>(note?.id ?? null);
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [ink, setInk] = useState<Ink>(note?.ink ?? EMPTY_INK);
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

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [cssW, setCssW] = useState(0);
  const k = cssW / INK_W;
  // na wąskim ekranie kartka ma co najmniej ~360 px (brudnopis ~260 px) wysokości – puste miejsce, nie zmienia rysunku
  const minH = Math.max(compact ? 420 : INK_MIN_H, k ? Math.ceil((compact ? 260 : 360) / k) : 0);
  const logicalH = Math.max(minH, ink.h + 160, textH + 120) + extra;

  // --- zapis automatyczny ---
  const dirty = useRef(false);
  const latest = useRef({ title, body, ink });
  latest.current = { title, body, ink };
  const idRef = useRef(id);
  idRef.current = id;
  const saving = useRef<Promise<void> | null>(null);
  const cfg = useRef({ kind, refKey, onSaved });
  cfg.current = { kind, refKey, onSaved };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async (keepalive = false) => {
    if (readOnly || !dirty.current) return;
    if (saving.current) { await saving.current; if (!dirty.current) return; }
    dirty.current = false;
    const { title: t, body: b, ink: i } = latest.current;
    setSave("saving");
    const run = (async () => {
      try {
        const payload = JSON.stringify(idRef.current ? { title: t, body: b, ink: i } : { kind: cfg.current.kind, ref: cfg.current.refKey, title: t, body: b, ink: i });
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
      }
    })();
    saving.current = run;
    await run;
    saving.current = null;
  }, [readOnly]);

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
  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !cssW) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const h = Math.round(logicalH * k);
    if (c.width !== Math.round(cssW * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(h * dpr);
      c.style.height = `${h}px`;
    }
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, h);
    const cs = getComputedStyle(c);
    colors.current = COLOR_VARS.map((v) => cs.getPropertyValue(v).trim() || "#222");
    for (const s of latest.current.ink.s) drawStroke(ctx, s, k, colors.current);
  }, [cssW, k, logicalH]);
  useEffect(() => { redraw(); }, [redraw, ink]);
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
    if (cur.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = pos(e);
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

  const status = readOnly ? "tylko podgląd" : save === "saving" ? "Zapisywanie…" : save === "saved" ? "Zapisano ✓" : save === "error" ? "Nie zapisano" : "";

  return (
    <div className={`notes-editor${compact ? " compact" : ""}`} onKeyDown={onKeyDown} data-testid="notes-editor">
      {showTitle && (
        <input className="ne-title" value={title} placeholder="Tytuł notatki" maxLength={120} readOnly={readOnly}
          onChange={(e) => { setTitle(e.target.value); touch(); }} aria-label="Tytuł" />
      )}
      {!readOnly && (
        <div className="ne-tools" role="toolbar" aria-label="Narzędzia rysowania">
          <div className="ne-group">
            <button type="button" className={tool === "text" ? "on" : ""} aria-pressed={tool === "text"} onClick={() => { setTool("text"); focusText(); }} title="Tekst z klawiatury – na tej samej kartce">⌨️<span className="ne-lbl"> Tekst</span></button>
            <button type="button" className={tool === "pen" ? "on" : ""} aria-pressed={tool === "pen"} onClick={() => setTool("pen")} title="Pióro">✏️<span className="ne-lbl"> Pióro</span></button>
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
            <button type="button" onClick={doUndo} disabled={!undo.current.length} title="Cofnij (Ctrl+Z)">↶<span className="sr-only">Cofnij</span></button>
            <button type="button" onClick={doRedo} disabled={!redo.current.length} title="Ponów (Ctrl+Y)">↷<span className="sr-only">Ponów</span></button>
            <button type="button" onClick={clear} disabled={!ink.s.length} title="Wyczyść rysunek">🗑️<span className="sr-only">Wyczyść rysunek</span></button>
          </div>
        </div>
      )}
      <div className="ne-sheet">
        <div ref={wrapRef} className={`ne-canvas-wrap tool-${readOnly ? "view" : tool}`}>
          <textarea ref={taRef} className="ne-text" value={body} readOnly={readOnly} spellCheck tabIndex={tool === "text" || readOnly ? 0 : -1}
            placeholder={readOnly ? "" : placeholder ?? (kind === "scratch" ? "Pisz tu z klawiatury (⌨️) albo rysikiem (✏️) – obliczenia, myśli…" : "Pisz tu z klawiatury (⌨️) albo rysikiem (✏️)…")}
            onChange={(e) => { setBody(e.target.value); touch(); }} aria-label="Tekst notatki" data-testid="sheet-text" />
          <canvas ref={canvasRef} className="ne-canvas" data-testid="ink-canvas" tabIndex={-1}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            aria-label="Kartka do pisania rysikiem lub palcem" />
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
