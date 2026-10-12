"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PreviewBanner } from "@/app/components/preview-banner";
import { StarButton, StarFilterSeg, type StarFilter } from "@/app/components/star";
import { api, withUser, useViewedUser } from "@/lib/client";
import type { BookIndex } from "@/lib/podrecznik";
import { useStars } from "@/lib/stars-client";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

/** Spis Podręcznika: tematy → działy (artykuł działu) → rozdziały (artykuły lekcji), z postępem czytania i gwiazdkami. */
export function BookIndexView({ index }: { index: BookIndex }) {
  const preview = useViewedUser();
  const [topic, setTopic] = useState("");
  const [gw, setGw] = useState<StarFilter>("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [reads, setReads] = useState<Record<string, string>>({});
  const { stars, toggle } = useStars("artykul");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("temat");
    if (t && index.topics.some((x) => x.id === t)) setTopic(t);
    api<Record<string, string>>(withUser("/api/podrecznik/przeczytane")).then(setReads).catch(() => {});
  }, [index]);

  const nq = norm(q.trim());
  const topics = useMemo(() => index.topics
    .filter((t) => !topic || t.id === topic)
    .map((t) => ({
      ...t,
      units: t.units.map((u) => {
        const chapters = u.chapters.filter((c) =>
          (!nq || norm(`${c.title} ${u.title}`).includes(nq)) && (!gw || stars.has(c.lesson) === (gw === "1") || (gw === "1" && stars.has(u.id))));
        const unitHit = (!nq || norm(u.title).includes(nq)) && (!gw || stars.has(u.id) === (gw === "1"));
        return { ...u, shown: chapters, visible: u.words > 0 && (unitHit || chapters.length > 0) };
      }).filter((u) => u.visible),
    }))
    .filter((t) => t.units.length), [index, topic, nq, gw, stars]);

  const total = index.topics.reduce((n, t) => n + t.units.reduce((m, u) => m + u.lessons, 0), 0);
  const written = index.topics.reduce((n, t) => n + t.units.reduce((m, u) => m + u.chapters.length, 0), 0);
  const readCount = Object.keys(reads).filter((r) => index.topics.some((t) => t.units.some((u) => u.chapters.some((c) => c.lesson === r)))).length;

  return (
    <div className="stack wide book">
      <PreviewBanner />
      <div className="page-head">
        <h1>📖 Podręcznik</h1>
        <p className="muted">
          Artykuły tłumaczące każdy dział i każdą lekcję kursu prostym językiem – do czytania zamiast albo przed „Poznaj”.
          Przeczytany do końca rozdział zalicza „Poznaj” w swojej lekcji. Zaznacz tekst, żeby go podkreślić albo przenieść do notatki.
        </p>
        <p className="small muted" data-testid="book-stats">Napisane rozdziały: {written} z {total} lekcji · przeczytane: {readCount}</p>
      </div>
      <div className="notes-toolbar">
        <input className="select" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj działu lub rozdziału…" aria-label="Szukaj" />
        <StarFilterSeg value={gw} onChange={setGw} />
      </div>
      <div className="seg" role="group" aria-label="Temat">
        <button type="button" className={!topic ? "active" : ""} aria-pressed={!topic} onClick={() => setTopic("")}>Wszystkie tematy</button>
        {index.topics.map((t) => (
          <button key={t.id} type="button" className={topic === t.id ? "active" : ""} aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>
            {t.emoji} {t.title.replace(/^Temat przewodni: /, "")}
          </button>
        ))}
      </div>

      {topics.length === 0 ? (
        <div className="empty-state"><span aria-hidden>{gw === "1" ? "⭐" : "🔍"}</span>
          <p>{gw === "1" ? "Nie masz jeszcze artykułów z gwiazdką – dodaj ☆ przy dziale albo rozdziale." : "Nic nie pasuje do wyszukiwania."}</p></div>
      ) : topics.map((t) => (
        <section key={t.id} className="book-topic" style={{ ["--topic" as string]: t.color }}>
          <h2>{t.emoji} {t.title}</h2>
          <div className="book-units">
            {t.units.map((u) => {
              const read = u.chapters.filter((c) => reads[c.lesson]).length;
              const isOpen = open[u.id] ?? Boolean(nq || gw);
              return (
                <article key={u.id} className="book-unit card" data-testid="book-unit">
                  <div className="book-unit-head">
                    <Link href={`/nauka/podrecznik/${u.id}`} className="book-unit-link">
                      <h3>{u.title}</h3>
                      <span className="muted small">
                        {u.minutes} min · {u.chapters.length} rozdz.{u.chapters.length < u.lessons ? ` (z ${u.lessons})` : ""}
                        {read > 0 && ` · przeczytane ${read}/${u.chapters.length}`}
                      </span>
                    </Link>
                    <StarButton on={stars.has(u.id)} onToggle={() => toggle(u.id)} label="dział do ulubionych" disabled={!!preview} />
                  </div>
                  <div className="pbar" aria-hidden><span style={{ width: `${u.chapters.length ? (read / u.chapters.length) * 100 : 0}%`, background: "var(--topic)" }} /></div>
                  <button type="button" className="linkbtn small" onClick={() => setOpen((o) => ({ ...o, [u.id]: !isOpen }))} aria-expanded={isOpen}>
                    {isOpen ? "Zwiń rozdziały ▴" : "Rozdziały ▾"}
                  </button>
                  {isOpen && (
                    <ol className="book-chapters">
                      {u.intro && <li><Link href={`/nauka/podrecznik/${u.id}#r-${u.id}`}>{u.intro.title}</Link>{reads[u.id] && <span className="read-ok"> ✓</span>}</li>}
                      {u.shown.map((c) => (
                        <li key={c.lesson}>
                          <Link href={`/nauka/podrecznik/${u.id}/${c.lesson}`}>{c.title}</Link>
                          {reads[c.lesson] && <span className="read-ok" title="Przeczytane"> ✓</span>}
                          <StarButton on={stars.has(c.lesson)} onToggle={() => toggle(c.lesson)} label="rozdział do ulubionych" disabled={!!preview} className="small" />
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
