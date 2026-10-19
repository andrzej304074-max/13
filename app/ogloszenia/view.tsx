"use client";

import { useEffect, useState } from "react";
import { annChanged } from "@/app/components/announce-bell";
import { SkeletonRows } from "@/app/components/loading-page";
import { LoadError } from "@/app/components/load-error";
import { api, fmtPct } from "@/lib/client";
import type { Announcement, PollView } from "@/lib/announce";

const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" }) : "");

/** Treść ogłoszenia: zwykły tekst, akapity z pustych linii, pojedyncze nowe linie zachowane. */
export function AnnBody({ text }: { text: string }) {
  return (
    <div className="ann-body">
      {text.split(/\n\s*\n/).map((p, i) => (
        <p key={i}>{p.split("\n").map((l, k) => <span key={k}>{k > 0 && <br />}{l}</span>)}</p>
      ))}
    </div>
  );
}

/** Wyniki ankiety: słupki, liczba głosów i procent głosujących; moja odpowiedź wyróżniona. */
export function PollResults({ poll, results, mine }: { poll: Pick<PollView, "options" | "multi">; results: NonNullable<PollView["results"]>; mine?: number[] | null }) {
  const max = Math.max(1, ...results.counts);
  return (
    <div className="poll-opts" data-testid="poll-results">
      {poll.options.map((o, i) => (
        <div key={i} className={`poll-res${mine?.includes(i) ? " mine" : ""}`}>
          <span>{o}{mine?.includes(i) ? " ✓" : ""}</span>
          <span className="share-val"><strong>{fmtPct(results.pct[i])}</strong> <small>({results.counts[i]})</small></span>
          <span className="share-bar"><span style={{ width: `${(results.counts[i] / max) * 100}%` }} /></span>
        </div>
      ))}
      <p className="muted small" style={{ margin: 0 }}>
        Głosujących: {results.voters}{poll.multi ? " · można było wybrać kilka odpowiedzi – procenty nie sumują się do 100" : ""}
      </p>
    </div>
  );
}

function Poll({ poll, onVoted }: { poll: PollView; onVoted: (p: PollView) => void }) {
  const [pick, setPick] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggle = (i: number) => setPick((p) => (poll.multi ? (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]) : [i]));
  async function send() {
    setBusy(true);
    setError(null);
    try {
      onVoted(await api<PollView>(`/api/ankiety/${poll.id}/glos`, { method: "POST", body: JSON.stringify({ choices: pick }) }));
      annChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <li className={`card stack ann-item${poll.read ? "" : " unread"}`} data-testid="poll">
      <div className="ann-meta">
        <span>📊 Ankieta</span><span>{fmt(poll.published_at)}</span>
        {!poll.read && <span className="ann-new">nowa</span>}
        {poll.closed ? <span>· zamknięta</span> : poll.closes_at ? <span>· do {fmt(poll.closes_at)}</span> : null}
        <span>· {poll.anonymous ? "anonimowa" : "jawna dla administratorów"}</span>
      </div>
      <h2 style={{ margin: 0 }}>{poll.question}</h2>
      {poll.mine === null && !poll.closed ? (
        <>
          <fieldset className="poll-opts" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="muted small">{poll.multi ? "Możesz wybrać kilka odpowiedzi." : "Wybierz jedną odpowiedź."}</legend>
            {poll.options.map((o, i) => (
              <label key={i} className="check poll-opt">
                <input type={poll.multi ? "checkbox" : "radio"} name={`poll-${poll.id}`} checked={pick.includes(i)} onChange={() => toggle(i)} data-testid="poll-option" />
                <span>{o}</span>
              </label>
            ))}
          </fieldset>
          {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
          <div><button className="btn" onClick={send} disabled={busy || !pick.length} data-testid="poll-vote">{busy ? "Wysyłanie…" : "Zagłosuj"}</button></div>
          <p className="muted small" style={{ margin: 0 }}>Głos można oddać raz. {poll.results_after === "close" ? "Wyniki pokażemy po zamknięciu ankiety." : "Wyniki zobaczysz po oddaniu głosu."}</p>
        </>
      ) : poll.results ? (
        <PollResults poll={poll} results={poll.results} mine={poll.mine} />
      ) : (
        <p className="muted" style={{ margin: 0 }} data-testid="poll-wait">
          {poll.mine ? "Dziękujemy za głos! " : ""}Wyniki pojawią się po zamknięciu ankiety{poll.closes_at ? ` (${fmt(poll.closes_at)})` : ""}.
        </p>
      )}
    </li>
  );
}

export function AnnouncementsView() {
  const [data, setData] = useState<{ announcements: Announcement[]; polls: PollView[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ announcements: Announcement[]; polls: PollView[] }>("/api/ogloszenia")
      .then((d) => {
        setData(d);
        // otwarcie strony = przeczytane (oznaczenie „nowe” zostaje widoczne do następnej wizyty)
        const ids = [...d.announcements, ...d.polls].filter((x) => !x.read).map((x) => x.id);
        if (ids.length) api("/api/ogloszenia/przeczytane", { method: "POST", body: JSON.stringify({ ids }) }).then(annChanged).catch(() => {});
      })
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <LoadError message={error} />;
  return (
    <div className="stack">
      <h1>🔔 Ogłoszenia</h1>
      <p className="muted" style={{ marginTop: -8 }}>Informacje od administratorów aplikacji i ankiety – Twoje zdanie pomaga ją rozwijać.</p>
      {!data ? <SkeletonRows rows={3} height={90} label="Ładowanie ogłoszeń" /> : <>
        {data.polls.length > 0 && <>
          <h2>Ankiety</h2>
          <ul className="ann-list" data-testid="poll-list">
            {data.polls.map((p) => (
              <Poll key={p.id} poll={p} onVoted={(n) => setData((d) => d && { ...d, polls: d.polls.map((x) => (x.id === n.id ? { ...n, read: x.read } : x)) })} />
            ))}
          </ul>
        </>}
        <h2>Ogłoszenia</h2>
        {data.announcements.length === 0 ? <p className="muted">Brak ogłoszeń.</p> : (
          <ul className="ann-list" data-testid="ann-list">
            {data.announcements.map((a) => (
              <li key={a.id} className={`card stack ann-item${a.read ? "" : " unread"}`} data-testid="ann-item">
                <div className="ann-meta">
                  {a.pinned && <span>📌 przypięte</span>}<span>{fmt(a.published_at)}</span>
                  {!a.read && <span className="ann-new">nowe</span>}
                </div>
                <h2 style={{ margin: 0 }}>{a.title}</h2>
                <AnnBody text={a.body} />
              </li>
            ))}
          </ul>
        )}
      </>}
    </div>
  );
}
