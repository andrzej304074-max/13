"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Progress } from "@/lib/nauka";
import { MAX_LEVEL, subsFor, type CourseTopic, type ItemKind } from "@/lib/nauka-types";

export interface UnitView {
  id: string;
  title: string;
  kind: ItemKind;
  count: number;
  zcount: number;
  lessons: { id: string; no: number; part?: number; title: string; type?: "zrozum"; goal?: string; items: string[]; extra?: string[]; questions: number }[];
}

const KIND_ICON: Record<string, string> = {
  pojecie: "💡", wzor: "🧮", osoba: "👤", instytucja: "🏢", data: "📅", przepis: "⚖️", zrozumienie: "🧠",
};
/** Przesunięcie węzłów ścieżki – zygzak jak w Duolingo. */
const OFFSETS = [0, 40, 70, 40, 0, -40, -70, -40];

export function TopicPath({ topic, units, kinds }: { topic: CourseTopic; units: UnitView[]; kinds: { id: ItemKind; title: string }[] }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<ItemKind | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    api<Progress>(`/api/nauka/progress?topic=${topic.id}`).then(setProgress).catch((e) => setError(e.message));
    const fromHash = decodeURIComponent(window.location.hash.slice(1));
    if (fromHash && units.some((u) => u.lessons.some((l) => l.id === fromHash))) {
      setOpen(fromHash);
      setTimeout(() => document.getElementById(fromHash)?.scrollIntoView({ block: "center" }), 50);
    }
    try {
      const k = localStorage.getItem(`owe:naukaKind:${topic.id}`);
      if (k && (k === "all" || kinds.some((x) => x.id === k))) setKind(k as ItemKind | "all");
    } catch {}
  }, [topic.id, units, kinds]);

  function chooseKind(k: ItemKind | "all") {
    setKind(k);
    try {
      localStorage.setItem(`owe:naukaKind:${topic.id}`, k);
    } catch {}
  }

  // licznik przy filtrze: hasła danego rodzaju, a dla „Zrozumienie” – liczba lekcji zrozumienia
  const counts = Object.fromEntries(kinds.map((k) => [
    k.id,
    k.id === "zrozumienie" ? units.reduce((n, u) => n + u.zcount, 0) : units.filter((u) => u.kind === k.id).reduce((n, u) => n + u.count, 0),
  ]));
  const visible = units
    .filter((u) => kind === "all" || u.kind === kind || (kind === "zrozumienie" && u.zcount > 0))
    .map((u) => ({
      ...u,
      termLessons: u.lessons.filter((l) => l.type !== "zrozum").length,
      lessons: u.lessons.filter((l) => kind === "all" || (kind === "zrozumienie" ? l.type === "zrozum" : l.type !== "zrozum")),
    }));
  const tp = progress?.topics[topic.id];

  return (
    <div className="stack" style={{ ["--topic" as string]: topic.color }}>
      <p className="muted" style={{ margin: 0 }}><Link href="/nauka">← Nauka</Link></p>
      <div className="topic-hero">
        <span className="topic-emoji">{topic.emoji}</span>
        <div>
          <h1 style={{ margin: 0 }}>{topic.title}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {units.length} działów · {units.reduce((n, u) => n + u.lessons.length - u.zcount, 0)} lekcji
            {counts.zrozumienie ? ` + 🧠 ${counts.zrozumienie}` : ""}
            {tp && ` · 👑 ${tp.crowns} koron · ${tp.crowned}/${tp.lessons} lekcji z koroną`}
          </p>
        </div>
      </div>
      {error && <p className="error">Postęp niedostępny: {error}</p>}

      <div className="seg" role="group" aria-label="Rodzaj treści">
        <button className={kind === "all" ? "active" : ""} aria-pressed={kind === "all"} onClick={() => chooseKind("all")}>Wszystko</button>
        {kinds.filter((k) => counts[k.id]).map((k) => (
          <button key={k.id} className={kind === k.id ? "active" : ""} aria-pressed={kind === k.id} onClick={() => chooseKind(k.id)}>
            {KIND_ICON[k.id]} {k.title} · {counts[k.id]}
          </button>
        ))}
      </div>
      <Link className="muted" style={{ fontSize: "0.9rem" }} href={`/nauka/statystyki?topic=${topic.id}`}>📈 Statystyki tego tematu</Link>

      {visible.map((u) => (
        <section key={u.id} className="unit">
          <div className="unit-head">
            <div>
              <small>{KIND_ICON[u.kind]} {u.kind === "pojecie" ? "Dział" : "Dział tematyczny"}</small>
              <h2 style={{ margin: 0 }}>{u.title}</h2>
            </div>
            <small>{u.count} haseł · {u.termLessons} lekcji{u.zcount ? ` · 🧠 ${u.zcount}` : ""}</small>
          </div>
          <div className="path">
            {u.lessons.map((l, i) => {
              const lp = progress?.lessons[l.id];
              const level = lp?.level ?? 0;
              const started = !!lp;
              const isOpen = open === l.id;
              return (
                <div key={l.id} id={l.id} className="path-step">
                  <button
                    className={`node ${l.type === "zrozum" ? "z" : ""} ${level >= MAX_LEVEL ? "gold" : level > 0 ? "done" : started ? "started" : ""}`}
                    style={{ transform: `translateX(${OFFSETS[i % OFFSETS.length]}px)` }}
                    onClick={() => setOpen(isOpen ? null : l.id)}
                    aria-expanded={isOpen}
                    aria-label={`${l.type === "zrozum" ? "Zrozumienie" : "Lekcja"} ${l.no}: ${l.title}`}
                  >
                    <span className="node-icon">{level >= MAX_LEVEL ? "🏆" : KIND_ICON[l.type === "zrozum" ? "zrozumienie" : u.kind]}</span>
                    {level > 0 && <span className="node-level">👑{level}</span>}
                  </button>
                  <div className="node-label" style={{ transform: `translateX(${OFFSETS[i % OFFSETS.length]}px)` }}>
                    {l.type === "zrozum" ? `🧠 ${l.title}` : `Lekcja ${l.no}${l.part ? ` · cz. ${l.part}` : ""}`}
                  </div>
                  {isOpen && (
                    <div className="lesson-panel card">
                      <strong>{l.type === "zrozum" ? `🧠 Zrozumienie ${l.no}` : `Lekcja ${l.no}${l.part ? ` · cz. ${l.part}` : ""}`}: {l.title}</strong>
                      {l.goal && <p style={{ margin: "4px 0 0", fontSize: "0.92rem" }}>🎯 {l.goal}</p>}
                      <p className="muted" style={{ margin: "4px 0 10px", fontSize: "0.9rem" }}>
                        {l.type === "zrozum" ? "Powiązane hasła" : "Hasła"}: {l.items.join(" · ") || "—"}
                        {l.extra?.length ? ` · nowe z pytań: ${l.extra.join(" · ")}` : ""}
                        {l.questions ? ` · ${l.questions} pytań do sprawdzianu` : ""}
                      </p>
                      <div className="crowns" aria-label={`Poziom ${level} z ${MAX_LEVEL}`}>
                        {Array.from({ length: MAX_LEVEL }, (_, k) => <span key={k} className={k < level ? "on" : ""}>👑</span>)}
                      </div>
                      <div className="subs">
                        {subsFor(l).map((s) => {
                          const sp = lp?.subs[s.no];
                          return (
                            <Link key={s.no} href={`/nauka/lekcja/${l.id}?sub=${s.no}`} className={`sub ${sp ? (sp.best >= 80 ? "ok" : "tried") : ""}`}>
                              <b>{s.no}. {s.title}</b>
                              <small>{s.hint}</small>
                              <small>{sp ? `najlepiej ${sp.best.toLocaleString("pl-PL")}% · ${sp.sessions}× · zaliczone ${sp.passes}×` : "jeszcze nie robione"}</small>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
