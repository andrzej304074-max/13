"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SkeletonRows } from "@/app/components/loading-page";
import { StarButton, StarFilterSeg, type StarFilter } from "@/app/components/star";
import { api, viewedUser, withUser } from "@/lib/client";
import { useData } from "@/lib/data-client";
import { useStars } from "@/lib/stars-client";
import { OWN_LIMITS } from "@/lib/own-cards-core";
import type { OwnCard } from "@/lib/own-cards";

type Topic = { id: string; title: string; emoji: string };
type Kind = { id: string; title: string };
interface Form { t: string; d: string; w: string; topic: string; kind: string }
const EMPTY: Form = { t: "", d: "", w: "", topic: "", kind: "pojecie" };
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

/**
 * „✍️ Moje fiszki” w zakładce Moje talie: tworzenie, edycja i usuwanie własnych fiszek (hasło, definicja, wzór, dział, kategoria).
 * Własne fiszki są widoczne tylko dla konta, oznaczone w Fiszkach i nie liczą się do Nauki ani statystyk.
 */
export function OwnCards() {
  const { data } = useData<{ topics: Topic[]; kinds: Kind[] }>("/api/dane/hasla");
  const [cards, setCards] = useState<OwnCard[] | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState("");
  const [gw, setGw] = useState<StarFilter>("");
  const { stars, toggle } = useStars("fiszka");
  const preview = typeof window !== "undefined" && !!viewedUser();
  useEffect(() => { api<OwnCard[]>(withUser("/api/fiszki/moje")).then(setCards).catch((e) => setError(e.message)); }, []);

  const topicName = useMemo(() => Object.fromEntries((data?.topics ?? []).map((t) => [t.id, `${t.emoji} ${t.title.replace(/^Temat przewodni: /, "")}`])), [data]);
  const kindName = useMemo(() => Object.fromEntries((data?.kinds ?? []).map((k) => [k.id, k.title])), [data]);
  const shown = useMemo(() => {
    const nq = norm(q.trim());
    return (cards ?? []).filter((c) => (!topic || c.topic === topic) && (!kind || c.kind === kind)
      && (!gw || stars.has(c.id) === (gw === "1")) && (!nq || norm(`${c.t} ${c.d} ${c.w ?? ""}`).includes(nq)));
  }, [cards, q, topic, kind, gw, stars]);

  function startNew() {
    setEditing(null);
    setForm({ ...EMPTY, topic: form.topic || data?.topics[0]?.id || "" });
    setOpen(true);
    setError(null);
  }
  function startEdit(c: OwnCard) {
    setEditing(c.id);
    setForm({ t: c.t, d: c.d, w: c.w ?? "", topic: c.topic, kind: c.kind });
    setOpen(true);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const body = JSON.stringify(form);
      if (editing) {
        const c = await api<OwnCard>(`/api/fiszki/moje/${encodeURIComponent(editing)}`, { method: "PATCH", body });
        setCards((all) => all && [c, ...all.filter((x) => x.id !== c.id)]);
      } else {
        const c = await api<OwnCard>("/api/fiszki/moje", { method: "POST", body });
        setCards((all) => [c, ...(all ?? [])]);
      }
      // po dodaniu formularz zostaje otwarty z tym samym działem i kategorią – szybkie dodawanie kolejnych
      setForm((f) => ({ ...EMPTY, topic: f.topic, kind: f.kind }));
      if (editing) { setEditing(null); setOpen(false); }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: OwnCard) {
    if (!confirm(`Usunąć fiszkę „${c.t}”? Zniknie też z talii.`)) return;
    try {
      await api(`/api/fiszki/moje/${encodeURIComponent(c.id)}`, { method: "DELETE" });
      setCards((all) => all && all.filter((x) => x.id !== c.id));
      if (editing === c.id) { setEditing(null); setOpen(false); }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <section className="stack own-cards" data-testid="own-cards">
      <div className="row" style={{ flexWrap: "wrap", gap: 8, alignItems: "baseline" }}>
        <h2 style={{ margin: 0 }}>✍️ Moje fiszki</h2>
        <span className="muted">{cards ? `${cards.length}` : ""}</span>
        <span className="spacer" />
        {cards && cards.length > 0 && <Link className="btn small secondary" href={withUser("/fiszki?zrodlo=moje")}>▶ Ucz się moich fiszek</Link>}
        {!preview && !open && <button className="btn small" onClick={startNew} data-testid="own-new">＋ Nowa fiszka</button>}
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Własne fiszki widzi tylko Twoje konto. W Fiszkach mają znacznik „✍️ Moja fiszka” i przerywaną obwódkę; możesz je dodawać do talii.
        Oceny „znam / nie znam” nie liczą się do Nauki ani statystyk.
      </p>

      {open && !preview && (
        <form className="card stack own-form" onSubmit={save} data-testid="own-form">
          <strong>{editing ? "Edycja fiszki" : "Nowa fiszka"}</strong>
          <label className="field"><span>Hasło</span>
            <input value={form.t} onChange={set("t")} maxLength={OWN_LIMITS.t} required data-testid="own-t" placeholder="np. Koszt utopiony" />
          </label>
          <label className="field"><span>Definicja</span>
            <textarea value={form.d} onChange={set("d")} maxLength={OWN_LIMITS.d} required rows={4} data-testid="own-d" />
          </label>
          <label className="field"><span>Wzór (opcjonalnie)</span>
            <input value={form.w} onChange={set("w")} maxLength={OWN_LIMITS.w} data-testid="own-w" placeholder="np. MR = MC" />
          </label>
          <div className="filter-grid">
            <label className="filters">Dział
              <select className="select" value={form.topic} onChange={set("topic")} required data-testid="own-topic">
                <option value="" disabled>wybierz…</option>
                {(data?.topics ?? []).map((t) => <option key={t.id} value={t.id}>{topicName[t.id]}</option>)}
              </select>
            </label>
            <label className="filters">Kategoria
              <select className="select" value={form.kind} onChange={set("kind")} required data-testid="own-kind">
                {(data?.kinds ?? []).map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
              </select>
            </label>
          </div>
          {error && <p className="error small" style={{ margin: 0 }}>{error}</p>}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" disabled={busy} data-testid="own-save">{editing ? "Zapisz zmiany" : "＋ Dodaj fiszkę"}</button>
            <button type="button" className="btn secondary" onClick={() => { setOpen(false); setEditing(null); }}>Zamknij</button>
          </div>
        </form>
      )}

      {!cards ? <SkeletonRows rows={2} height={64} label="Ładowanie własnych fiszek" /> : cards.length === 0 ? (
        !open && <div className="empty-state"><span aria-hidden>✍️</span><p>Nie masz jeszcze własnych fiszek – dodaj pierwszą przyciskiem „＋ Nowa fiszka”.</p></div>
      ) : <>
        <div className="row own-filters" style={{ flexWrap: "wrap", gap: 8 }}>
          <input className="select" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj w moich fiszkach…" aria-label="Szukaj w moich fiszkach" style={{ flex: "1 1 200px" }} />
          <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Dział">
            <option value="">wszystkie działy</option>
            {(data?.topics ?? []).map((t) => <option key={t.id} value={t.id}>{topicName[t.id]}</option>)}
          </select>
          <select className="select" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kategoria">
            <option value="">wszystkie kategorie</option>
            {(data?.kinds ?? []).map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
          </select>
          <StarFilterSeg value={gw} onChange={setGw} />
        </div>
        <ul className="own-list" data-testid="own-list">
          {shown.map((c) => (
            <li key={c.id} className="card own-item" data-testid="own-item">
              <div className="own-head">
                <strong>{c.t}</strong>
                <StarButton on={stars.has(c.id)} onToggle={() => toggle(c.id)} label="fiszkę do ulubionych" disabled={preview} />
              </div>
              <div className="concept-tags">
                <span className="tag own">✍️ Moja fiszka</span><span className="tag">{kindName[c.kind] ?? c.kind}</span><span className="tag">{topicName[c.topic]}</span>
                {c.n > 0 && <span className="tag">znam {c.c}/{c.n}</span>}
              </div>
              <p className="own-def">{c.d}</p>
              {c.w && <pre className="formula">{c.w}</pre>}
              {!preview && (
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn small secondary" onClick={() => startEdit(c)} data-testid="own-edit">Edytuj</button>
                  <button className="btn small danger" onClick={() => remove(c)} data-testid="own-del">Usuń</button>
                </div>
              )}
            </li>
          ))}
          {shown.length === 0 && <li className="muted">Brak fiszek dla wybranych filtrów.</li>}
        </ul>
      </>}
    </section>
  );
}
