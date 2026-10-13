"use client";

import { dismissHint, next, pause, prev, resume, setRate, setVoice, SPEECH_RATES, stop, useSpeech } from "@/lib/speech";

/** Pasek odtwarzacza (nad dolnym paskiem na telefonie, w rogu na komputerze) – widoczny, gdy coś jest czytane. */
export function ReaderBar() {
  const sp = useSpeech();
  if (sp.status === "idle" || !sp.items.length) return null;
  const item = sp.items[sp.index];
  return (
    <div className="speech-bar" role="region" aria-label="Czytanie na głos" data-testid="speech-bar">
      <div className="speech-info">
        <span className="speech-now" aria-live="polite">{sp.status === "playing" ? "🔊" : "⏸"} {item?.title}</span>
        {sp.source === "audio" && <span className="speech-cloud" title="Nagranie głosem z chmury – gra też z wyłączonym ekranem" data-testid="speech-cloud">☁️</span>}
        {sp.source === "wait" && <span className="speech-cloud" title="Nagrywanie akapitu…" data-testid="speech-wait">⏳</span>}
        {sp.items.length > 1 && <span className="muted speech-pos">{sp.index + 1} / {sp.items.length}</span>}
      </div>
      <div className="speech-ctrl">
        <button type="button" onClick={prev} aria-label="Poprzedni (albo od początku)" title="Poprzedni">⏮</button>
        {sp.status === "playing"
          ? <button type="button" onClick={pause} aria-label="Pauza" data-testid="speech-pause">⏸</button>
          : <button type="button" onClick={resume} aria-label="Wznów" data-testid="speech-resume">▶</button>}
        <button type="button" onClick={next} disabled={sp.index + 1 >= sp.items.length} aria-label="Następny" title="Następny" data-testid="speech-next">⏭</button>
        <button type="button" onClick={stop} aria-label="Zatrzymaj" title="Zatrzymaj" data-testid="speech-stop">⏹</button>
        <select value={sp.rate} onChange={(e) => setRate(Number(e.target.value))} aria-label="Tempo czytania">
          {SPEECH_RATES.map((r) => <option key={r} value={r}>{r.toLocaleString("pl-PL")}×</option>)}
        </select>
        {sp.voices.length > 1 && (
          <select value={sp.voiceUri ?? ""} onChange={(e) => setVoice(e.target.value)} aria-label="Głos" className="speech-voice">
            {sp.voices.map((v) => <option key={v.uri} value={v.uri}>{v.name.replace(/^(Microsoft|Google)\s+/, "").replace(/\s*\(.*\)$/, "")}</option>)}
          </select>
        )}
      </div>
      {sp.hint && (
        <p className="speech-hint" role="status" data-testid="speech-hint">
          <span>🔇 {sp.hint}</span>
          <button type="button" onClick={dismissHint} aria-label="Zamknij podpowiedź">✕</button>
        </p>
      )}
    </div>
  );
}
