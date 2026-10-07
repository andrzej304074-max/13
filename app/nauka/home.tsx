"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { DAILY_GOALS, lastLesson, loadGoal, saveGoal } from "@/lib/nauka-client";
import type { Progress } from "@/lib/nauka";
import { SUBLESSONS, type CourseTopic } from "@/lib/nauka-types";

export interface TopicCard extends CourseTopic {
  units: number;
  lessons: number;
  items: number;
  kinds: Record<string, number>;
}

const DAY_NAMES = ["nd", "pn", "wt", "śr", "cz", "pt", "sb"];

export function NaukaHome({ topics, kinds, lessonIds }: { topics: TopicCard[]; kinds: { id: string; title: string }[]; lessonIds: string[] }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState<number | null>(null);
  const [last, setLast] = useState<{ lesson: string; sub: number } | null>(null);

  useEffect(() => {
    setGoal(loadGoal());
    setLast(lastLesson());
    api<Progress>("/api/nauka/progress").then(setProgress).catch((e) => setError(e.message));
  }, []);

  const s = progress?.summary;
  const goalPct = s && goal ? Math.min(100, (s.xpToday / goal) * 100) : 0;
  const maxWeek = Math.max(goal ?? 0, ...(s?.week.map((d) => d.xp) ?? [0]), 1);

  function randomLesson() {
    const id = lessonIds[Math.floor(Math.random() * lessonIds.length)];
    router.push(`/nauka/lekcja/${id}?sub=${1 + Math.floor(Math.random() * 4)}`);
  }

  return (
    <div className="stack">
      <h1>Nauka</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Kurs w stylu Duolingo zbudowany ze słownika pojęć i wszystkich pytań: 6 tematów programu OWE i temat przewodni. Każdy
        temat ma działy i lekcje, a każda lekcja 4 pod-lekcje ({SUBLESSONS.map((x) => x.title).join(" → ")}). Wszystko jest
        odblokowane – wybierz, od czego chcesz zacząć. Postęp i statystyki są wspólne dla wszystkich.
      </p>

      <div className="card learn-summary">
        <div className="learn-summary-stats">
          <div title="Seria dni z ukończoną pod-lekcją"><span className="big-emoji">{s?.todayDone ? "🔥" : "🕯️"}</span><b>{s?.streak ?? "–"}</b><small>dni serii</small></div>
          <div title="XP zdobyte dzisiaj"><span className="big-emoji">⚡</span><b>{s?.xpToday ?? "–"}</b><small>XP dziś</small></div>
          <div title="Wszystkie XP"><span className="big-emoji">💎</span><b>{s?.xpTotal ?? "–"}</b><small>XP łącznie</small></div>
        </div>
        <div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>Cel dzienny: {goal ?? "…"} XP</strong>
            <span className="muted">{s ? (s.xpToday >= (goal ?? 0) ? "✅ cel osiągnięty" : `brakuje ${(goal ?? 0) - s.xpToday} XP`) : ""}</span>
          </div>
          <div className="goal-bar"><div style={{ width: `${goalPct}%` }} /></div>
          <div className="seg" role="group" aria-label="Cel dzienny" style={{ marginTop: 8 }}>
            {DAILY_GOALS.map((g) => (
              <button key={g.xp} className={g.xp === goal ? "active" : ""} aria-pressed={g.xp === goal}
                onClick={() => { setGoal(g.xp); saveGoal(g.xp); }}>
                {g.label} · {g.xp}
              </button>
            ))}
          </div>
        </div>
        {s && (
          <div className="week" aria-label="XP w ostatnich 7 dniach">
            {s.week.map((d) => (
              <div key={d.day} title={`${d.day}: ${d.xp} XP`}>
                <div className="week-bar"><div style={{ height: `${(d.xp / maxWeek) * 100}%` }} className={goal && d.xp >= goal ? "hit" : ""} /></div>
                <small>{DAY_NAMES[new Date(`${d.day}T12:00:00`).getDay()]}</small>
              </div>
            ))}
          </div>
        )}
        {error && <p className="error" style={{ margin: 0 }}>Postęp niedostępny: {error}</p>}
      </div>

      <div className="row">
        {last && <Link className="btn" href={`/nauka/lekcja/${last.lesson}?sub=${last.sub}`}>▶ Kontynuuj ostatnią lekcję</Link>}
        <Link className="btn secondary" href="/nauka/powtorka">🔁 Powtórka słabych haseł</Link>
        <button className="btn secondary" onClick={randomLesson}>🎲 Losowa lekcja</button>
        <Link className="btn secondary" href="/nauka/statystyki">📈 Statystyki nauki</Link>
      </div>

      <h2>Tematy</h2>
      <div className="topic-grid">
        {topics.map((t) => {
          const tp = progress?.topics[t.id];
          const pct = tp ? Math.round((tp.crowned / tp.lessons) * 100) : 0;
          return (
            <Link key={t.id} href={`/nauka/${t.id}`} className="topic-card" style={{ ["--topic" as string]: t.color }}>
              <span className="topic-emoji">{t.emoji}</span>
              <strong>{t.title}</strong>
              <small className="muted">{t.units} działów · {t.lessons} lekcji · {t.lessons * 4} pod-lekcji · {t.items} haseł</small>
              <small className="muted">
                {kinds.filter((k) => t.kinds[k.id]).map((k) => `${k.title.toLowerCase()} ${t.kinds[k.id]}`).join(" · ")}
              </small>
              <div className="goal-bar thin"><div style={{ width: `${pct}%` }} /></div>
              <small className="muted">
                {tp ? `👑 ${tp.crowns} koron · ${tp.crowned}/${tp.lessons} lekcji z koroną · rozpoczęte ${tp.started}` : "…"}
              </small>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
