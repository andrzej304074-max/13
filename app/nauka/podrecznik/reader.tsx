"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StarButton } from "@/app/components/star";
import { api, withUser, useViewedUser } from "@/lib/client";
import { loadData } from "@/lib/data-client";
import { segments } from "@/lib/notes-core";
import type { NoteRow } from "@/lib/notes";
import type { Block, Run } from "@/lib/podrecznik";
import { useStars } from "@/lib/stars-client";

/** Jedna sekcja czytnika: przegląd działu albo rozdział lekcji. */
export interface ReaderSection {
  /** Do „przeczytane” i gwiazdek: id działu (przegląd) albo id lekcji (rozdział). */
  ref: string;
  /** Klucz podkreśleń: <dział>:intro albo <dział>:<lekcja>. */
  hl: string;
  title: string;
  blocks: Block[];
  words: number;
  kicker?: string;
}

interface Highlight { id: string; article: string; block: number; start: number; end: number; color: string }
type Haslo = { id: string; t: string; d: string; w: string | null };

const SCALE_KEY = "owe:readerScale";
const SCALES = [0.9, 1, 1.1, 1.22, 1.36];
const HL_LABEL: Record<string, string> = { y: "żółty", g: "zielony", b: "niebieski" };

/** Tekst bloku jako jeden ciąg (przesunięcia podkreśleń liczone w nim). */
const runsText = (r: Run[]) => r.map((x) => x.s).join("");

/** Wysyła zdarzenie do szybkiego panelu notatek (app/components/notes/quick-notes.tsx). */
export function openQuickNote(noteId: string) {
  window.dispatchEvent(new CustomEvent("owe:quick-note", { detail: { noteId } }));
}

export function Reader({ sections, unitId, heading, crumbs, footer, lessonMode = false }: {
  sections: ReaderSection[];
  unitId: string;
  heading: { title: string; sub?: string; starRef: string };
  crumbs: { href: string; label: string }[];
  footer?: React.ReactNode;
  lessonMode?: boolean;
}) {
  const preview = useViewedUser();
  const [scale, setScale] = useState(1);
  const [hls, setHls] = useState<Highlight[]>([]);
  const [reads, setReads] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [pop, setPop] = useState<{ x: number; y: number; sec: number; block: number; start: number; end: number; text: string } | null>(null);
  const [markPop, setMarkPop] = useState<{ x: number; y: number; id: string } | null>(null);
  const [term, setTerm] = useState<{ x: number; y: number; id: string } | null>(null);
  const [hasla, setHasla] = useState<Record<string, Haslo> | null>(null);
  const { stars, toggle } = useStars("artykul");
  const bodyRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const started = useRef(Date.now());
  const sent = useRef(new Set<string>());

  const hlKey = lessonMode ? sections[0].hl : unitId;

  useEffect(() => {
    try { const v = Number(localStorage.getItem(SCALE_KEY)); if (SCALES.includes(v)) setScale(v); } catch {}
    api<Highlight[]>(withUser(`/api/podkreslenia?artykul=${encodeURIComponent(hlKey)}`)).then(setHls).catch(() => {});
    api<Record<string, string>>(withUser("/api/podrecznik/przeczytane")).then(setReads).catch(() => {});
  }, [hlKey]);

  const setScaleSaved = (v: number) => {
    setScale(v);
    try { localStorage.setItem(SCALE_KEY, String(v)); } catch {}
  };

  // pasek postępu czytania (bez re-renderu – styl ustawiany bezpośrednio)
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = bodyRef.current, bar = progRef.current;
        if (!el || !bar) return;
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight * 0.6;
        const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
        bar.style.transform = `scaleX(${p})`;
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  // „przeczytane”: koniec sekcji widoczny na ekranie
  useEffect(() => {
    if (preview) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const ref = (e.target as HTMLElement).dataset.ref!;
        if (sent.current.has(ref)) continue;
        sent.current.add(ref);
        api<{ credited: boolean; level?: number }>("/api/podrecznik/przeczytane", { method: "POST", body: JSON.stringify({ ref, ms: Date.now() - started.current }) })
          .then((r) => {
            setReads((x) => ({ ...x, [ref]: new Date().toISOString() }));
            if (r.credited) { setToast("✓ Przeczytane – „Poznaj” w tej lekcji zaliczone"); setTimeout(() => setToast(null), 3500); }
          })
          .catch(() => sent.current.delete(ref));
      }
    }, { rootMargin: "0px 0px -15% 0px" });
    bodyRef.current?.querySelectorAll<HTMLElement>("[data-end]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [preview, sections]);

  // zaznaczenie tekstu → dymek „Podkreśl / Do notatki”
  const onSelect = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !bodyRef.current) { setPop(null); return; }
    const range = sel.getRangeAt(0);
    const pos = (node: Node, off: number) => {
      const el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element))?.closest<HTMLElement>("[data-o]");
      const blk = el?.closest<HTMLElement>("[data-b]");
      if (!el || !blk || !bodyRef.current!.contains(blk)) return null;
      const base = Number(el.dataset.o);
      // węzeł elementu (np. zaznaczenie zaczyna się na <mark>) – off to indeks dziecka
      const inner = node.nodeType === Node.TEXT_NODE ? off : 0;
      return { sec: Number(blk.dataset.s), block: Number(blk.dataset.b), off: base + inner };
    };
    const a = pos(range.startContainer, range.startOffset), b = pos(range.endContainer, range.endOffset);
    if (!a || !b) { setPop(null); return; }
    // zaznaczenie przez kilka bloków – podkreślamy w pierwszym, do jego końca
    let end = b.off;
    if (a.sec !== b.sec || a.block !== b.block) {
      const blk = bodyRef.current.querySelector<HTMLElement>(`[data-s="${a.sec}"][data-b="${a.block}"]`);
      end = Number(blk?.dataset.len ?? a.off);
    }
    if (end <= a.off) { setPop(null); return; }
    const rect = range.getBoundingClientRect();
    setMarkPop(null);
    setPop({ x: rect.left + rect.width / 2, y: rect.top, sec: a.sec, block: a.block, start: a.off, end, text: sel.toString().trim().slice(0, 1000) });
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const h = () => { clearTimeout(t); t = setTimeout(onSelect, 180); };
    document.addEventListener("selectionchange", h);
    // dymki chowają się dopiero po wyraźnym przewinięciu (płynne przewijanie strony daje jeszcze kilka zdarzeń po kliknięciu)
    let y0 = window.scrollY;
    const hide = () => {
      if (Math.abs(window.scrollY - y0) < 80) return;
      y0 = window.scrollY;
      setPop(null); setMarkPop(null); setTerm(null);
    };
    const reset = () => { y0 = window.scrollY; };
    window.addEventListener("scroll", hide, { passive: true });
    document.addEventListener("pointerup", reset);
    return () => { document.removeEventListener("selectionchange", h); window.removeEventListener("scroll", hide); document.removeEventListener("pointerup", reset); clearTimeout(t); };
  }, [onSelect]);

  const addHl = async (color: string) => {
    if (!pop || preview) return;
    const s = sections[pop.sec];
    const tmp: Highlight = { id: `tmp-${Date.now()}`, article: s.hl, block: pop.block, start: pop.start, end: pop.end, color };
    setHls((x) => [...x, tmp]);
    setPop(null);
    window.getSelection()?.removeAllRanges();
    try {
      const saved = await api<Highlight>("/api/podkreslenia", { method: "POST", body: JSON.stringify({ article: s.hl, block: tmp.block, start: tmp.start, end: tmp.end, color }) });
      setHls((x) => x.map((h) => (h.id === tmp.id ? saved : h)));
    } catch (e) {
      setHls((x) => x.filter((h) => h.id !== tmp.id));
      setToast((e as Error).message);
    }
  };

  const delHl = async (id: string) => {
    setMarkPop(null);
    const old = hls;
    setHls((x) => x.filter((h) => h.id !== id));
    await api(`/api/podkreslenia?id=${id}`, { method: "DELETE" }).catch(() => setHls(old));
  };

  const toNote = async () => {
    if (!pop || preview) return;
    const s = sections[pop.sec];
    const lesson = s.ref === unitId ? "" : `:${s.ref}`;
    setPop(null);
    try {
      const n = await api<NoteRow>("/api/notatki", {
        method: "POST",
        body: JSON.stringify({ kind: "note", title: `📖 ${s.title}`.slice(0, 120), body: `„${pop.text}”\n\n`, ref: `artykul:${unitId}${lesson}` }),
      });
      window.getSelection()?.removeAllRanges();
      openQuickNote(n.id);
    } catch (e) {
      setToast((e as Error).message);
    }
  };

  const openTerm = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTerm({ x: r.left + r.width / 2, y: r.bottom, id });
    if (!hasla) loadData<{ rows: Haslo[] }>("/api/dane/hasla").then((d) => setHasla(Object.fromEntries(d.rows.map((x) => [x.id, x])))).catch(() => {});
  };

  const byBlock = useMemo(() => {
    const m = new Map<string, Highlight[]>();
    for (const h of hls) {
      const k = `${h.article}|${h.block}`;
      m.set(k, [...(m.get(k) ?? []), h]);
    }
    return m;
  }, [hls]);

  const renderRuns = (r: Run[], si: number, bi: number) => {
    const text = runsText(r);
    const hs = byBlock.get(`${sections[si].hl}|${bi}`) ?? [];
    const segs = segments(text.length, hs);
    // podział odcinków formatowania na granicach podkreśleń
    const out: React.ReactNode[] = [];
    let off = 0;
    r.forEach((run, ri) => {
      const a = off, b = off + run.s.length;
      off = b;
      const pieces: React.ReactNode[] = [];
      for (const sg of segs) {
        const s0 = Math.max(a, sg.start), s1 = Math.min(b, sg.end);
        if (s1 <= s0) continue;
        const txt = text.slice(s0, s1);
        pieces.push(sg.h
          ? <mark key={s0} className={`hl hl-${sg.h.color}`} data-o={s0} onClick={(e) => { e.stopPropagation(); const rc = e.currentTarget.getBoundingClientRect(); setPop(null); setMarkPop({ x: rc.left + rc.width / 2, y: rc.top, id: sg.h!.id }); }}>{txt}</mark>
          : <span key={s0} data-o={s0}>{txt}</span>);
      }
      let node: React.ReactNode = pieces;
      if (run.k) node = <a href={`/pojecia?q=${encodeURIComponent(run.s)}`} className="term" onClick={(e) => openTerm(e, run.k!)}>{node}</a>;
      if (run.i) node = <em>{node}</em>;
      if (run.b) node = <strong>{node}</strong>;
      out.push(<span key={ri}>{node}</span>);
    });
    return out;
  };

  const renderBlock = (b: Block, si: number, bi: number) => {
    const attrs = { "data-s": si, "data-b": bi };
    switch (b.t) {
      case "p": return <p key={bi} {...attrs} data-len={runsText(b.r).length}>{renderRuns(b.r, si, bi)}</p>;
      case "h": return <h3 key={bi} {...attrs} data-len={runsText(b.r).length}>{renderRuns(b.r, si, bi)}</h3>;
      case "ex": case "trap": case "key":
        return (
          <aside key={bi} className={`rbox rbox-${b.t}`} {...attrs} data-len={runsText(b.r).length}>
            <span className="rbox-label" aria-hidden>{b.t === "ex" ? "💡 Przykład" : b.t === "trap" ? "⚠️ Uwaga, pułapka" : "📌 Zapamiętaj"}</span>
            <span className="rbox-text">{renderRuns(b.r, si, bi)}</span>
          </aside>
        );
      case "ul": return <ul key={bi}>{b.items.map((it, k) => <li key={k} data-s={si} data-b={bi * 100 + k + 10000} data-len={runsText(it).length}>{renderRuns(it, si, bi * 100 + k + 10000)}</li>)}</ul>;
      case "f": return <pre key={bi} className="formula">{b.x}</pre>;
    }
  };

  const totalWords = sections.reduce((n, s) => n + s.words, 0);
  const minutes = Math.max(1, Math.round(totalWords / 180));
  const haslo = term && hasla?.[term.id];

  return (
    <div className="reader" style={{ ["--rscale" as string]: scale }}>
      <div className="reader-progress" aria-hidden><div ref={progRef} /></div>
      <nav className="reader-crumbs" aria-label="Ścieżka">
        {crumbs.map((c, i) => <span key={c.href}>{i > 0 && " › "}<Link href={c.href}>{c.label}</Link></span>)}
      </nav>
      <header className="reader-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>{heading.title}</h1>
          <p className="muted">{heading.sub ? `${heading.sub} · ` : ""}{minutes} min czytania</p>
        </div>
        <StarButton on={stars.has(heading.starRef)} onToggle={() => toggle(heading.starRef)} label="artykuł do ulubionych" disabled={!!preview} />
      </header>
      <div className="reader-tools" role="toolbar" aria-label="Wygląd tekstu">
        <button type="button" className="btn small secondary" onClick={() => setScaleSaved(SCALES[Math.max(0, SCALES.indexOf(scale) - 1)])} disabled={scale === SCALES[0]} aria-label="Mniejszy tekst">A−</button>
        <button type="button" className="btn small secondary" onClick={() => setScaleSaved(SCALES[Math.min(SCALES.length - 1, SCALES.indexOf(scale) + 1)])} disabled={scale === SCALES[SCALES.length - 1]} aria-label="Większy tekst">A+</button>
        <span className="muted small">Zaznacz tekst, żeby go podkreślić albo przenieść do notatki.</span>
      </div>

      {!lessonMode && sections.length > 1 && (
        <details className="reader-toc card" open>
          <summary>Spis treści</summary>
          <ol>
            {sections.map((s) => (
              <li key={s.ref}><a href={`#r-${s.ref}`}>{s.title}</a>{reads[s.ref] && <span className="read-ok" title="Przeczytane"> ✓</span>}</li>
            ))}
          </ol>
        </details>
      )}

      <div className="reader-body" ref={bodyRef} data-testid="reader-body">
        {sections.map((s, si) => (
          <section key={s.ref} id={`r-${s.ref}`} className="reader-section">
            {!lessonMode && (
              <div className="reader-sec-head">
                {s.kicker && <span className="learn-badge">{s.kicker}</span>}
                <h2>{s.title}{reads[s.ref] && <span className="read-ok" title="Przeczytane"> ✓</span>}</h2>
                {s.ref !== unitId && <StarButton on={stars.has(s.ref)} onToggle={() => toggle(s.ref)} label="rozdział do ulubionych" disabled={!!preview} />}
              </div>
            )}
            {s.blocks.map((b, bi) => renderBlock(b, si, bi))}
            <div className="reader-end" data-end data-ref={s.ref} aria-hidden />
            {!lessonMode && s.ref !== unitId && (
              <p className="reader-sec-links">
                <Link href={`/nauka/podrecznik/${unitId}/${s.ref}`}>Osobny artykuł</Link> · <Link href={`/nauka/lekcja/${s.ref}?sub=2`}>Ćwicz tę lekcję →</Link>
              </p>
            )}
          </section>
        ))}
      </div>
      {footer}

      {pop && !preview && (
        <div className="sel-pop" style={{ left: pop.x, top: pop.y }} role="toolbar" aria-label="Zaznaczony tekst" data-testid="sel-pop" onMouseDown={(e) => e.preventDefault()}>
          {(["y", "g", "b"] as const).map((c) => (
            <button key={c} type="button" className={`sel-color hl-${c}`} onClick={() => addHl(c)} title={`Podkreśl (${HL_LABEL[c]})`} data-testid={`hl-${c}`}><span className="sr-only">Podkreśl na {HL_LABEL[c]}</span></button>
          ))}
          <button type="button" onClick={toNote} data-testid="to-note">📝 Do notatki</button>
        </div>
      )}
      {markPop && !preview && (
        <div className="sel-pop" style={{ left: markPop.x, top: markPop.y }} role="toolbar">
          <button type="button" onClick={() => delHl(markPop.id)} data-testid="hl-del">✕ Usuń podkreślenie</button>
        </div>
      )}
      {term && (
        <div className="term-pop card" style={{ left: term.x, top: term.y }} role="dialog" aria-label="Hasło">
          {haslo ? <>
            <strong>{haslo.t}</strong>
            <p>{haslo.d}</p>
            {haslo.w && <pre className="formula">{haslo.w}</pre>}
            <div className="row"><Link href={`/pojecia?q=${encodeURIComponent(haslo.t)}`} className="small">W Tabeli pojęć →</Link><span className="spacer" /><button type="button" className="linkbtn small" onClick={() => setTerm(null)}>Zamknij</button></div>
          </> : <div className="skeleton" style={{ height: 80 }} />}
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
