"use client";

import { useEffect, useState } from "react";
import { SkeletonRows } from "@/app/components/loading-page";
import { AnnBody, PollResults } from "@/app/ogloszenia/view";
import { annChanged } from "@/app/components/announce-bell";
import { api } from "@/lib/client";
import type { AdminPoll, Announcement } from "@/lib/announce";
import { ANN_LIMITS } from "@/lib/announce-core";

type AdminAnn = Announcement & { reads: number };
type Data = { announcements: AdminAnn[]; polls: AdminPoll[]; users: number };
type AnnForm = { id?: string; title: string; body: string; pinned: boolean; published: boolean; expires_at: string };
type PollForm = { id?: string; question: string; options: string; multi: boolean; anonymous: boolean; results_after: "vote" | "close"; published: boolean; closes_at: string };

const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }) : "");
/** Wartość pola datetime-local (czas lokalny admina, bez strefy) → ISO z UTC – serwer liczy w UTC, nie w strefie admina. */
const iso = (v: string) => (v ? new Date(v).toISOString() : null);
/** ISO → wartość pola datetime-local (czas lokalny). */
const local = (s: string | null) => {
  if (!s) return "";
  const d = new Date(s);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const EMPTY_ANN: AnnForm = { title: "", body: "", pinned: false, published: true, expires_at: "" };
const EMPTY_POLL: PollForm = { question: "", options: "", multi: false, anonymous: true, results_after: "vote", published: true, closes_at: "" };

/** Panel admina: ogłoszenia (przypięte, szkice, wygasanie) i ankiety (wyniki, kto głosował w jawnych). */
export function AnnounceCard() {
  const [tab, setTab] = useState<"ann" | "poll">("ann");
  const [data, setData] = useState<Data | null>(null);
  const [ann, setAnn] = useState<AnnForm>(EMPTY_ANN);
  const [poll, setPoll] = useState<PollForm>(EMPTY_POLL);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reload = () => api<Data>("/api/admin/ogloszenia").then(setData).catch((e) => setError(e.message));
  useEffect(() => { reload(); }, []);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true); setError(null); setMsg(null);
    try {
      await fn();
      setMsg(ok);
      await reload();
      annChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const saveAnn = () => run(async () => {
    const body = JSON.stringify({ ...ann, expires_at: iso(ann.expires_at) });
    await api(ann.id ? `/api/admin/ogloszenia/${ann.id}` : "/api/admin/ogloszenia", { method: ann.id ? "PATCH" : "POST", body });
    setAnn(EMPTY_ANN);
  }, ann.id ? "Zapisano zmiany ogłoszenia." : ann.published ? "Opublikowano ogłoszenie." : "Zapisano szkic ogłoszenia.");
  const savePoll = () => run(async () => {
    const body = JSON.stringify({ ...poll, closes_at: iso(poll.closes_at) });
    await api(poll.id ? `/api/admin/ankiety/${poll.id}` : "/api/admin/ankiety", { method: poll.id ? "PATCH" : "POST", body });
    setPoll(EMPTY_POLL);
  }, poll.id ? "Zapisano zmiany ankiety." : poll.published ? "Opublikowano ankietę." : "Zapisano szkic ankiety.");
  const remove = (kind: "ogloszenia" | "ankiety", id: string, what: string) => {
    if (!window.confirm(`Usunąć ${what}? Tego nie da się cofnąć.`)) return;
    run(() => api(`/api/admin/${kind}/${id}`, { method: "DELETE" }), "Usunięto.");
  };
  const togglePub = (a: AdminAnn) => run(() => api(`/api/admin/ogloszenia/${a.id}`, {
    method: "PATCH", body: JSON.stringify({ title: a.title, body: a.body, pinned: a.pinned, expires_at: a.expires_at, published: !a.published_at }),
  }), a.published_at ? "Wycofano ogłoszenie (szkic)." : "Opublikowano ogłoszenie.");
  const editPoll = (p: AdminPoll) => {
    setPoll({ id: p.id, question: p.question, options: p.options.join("\n"), multi: p.multi, anonymous: p.anonymous, results_after: p.results_after, published: !!p.published_at, closes_at: local(p.closes_at) });
    window.scrollTo({ top: document.querySelector('[data-testid="ann-admin"]')?.getBoundingClientRect().top! + window.scrollY - 80, behavior: "smooth" });
  };
  const closePoll = (p: AdminPoll) => run(() => api(`/api/admin/ankiety/${p.id}`, {
    method: "PATCH",
    body: JSON.stringify({ question: p.question, options: p.options, multi: p.multi, anonymous: p.anonymous, results_after: p.results_after, published: !!p.published_at, closes_at: new Date().toISOString() }),
  }), "Zamknięto ankietę – wyniki widzą wszyscy.");

  return (
    <div className="card stack" data-testid="ann-admin">
      <div className="seg" role="group" aria-label="Rodzaj">
        <button className={tab === "ann" ? "active" : ""} aria-pressed={tab === "ann"} onClick={() => setTab("ann")} data-testid="ann-tab">Ogłoszenia · {data?.announcements.length ?? 0}</button>
        <button className={tab === "poll" ? "active" : ""} aria-pressed={tab === "poll"} onClick={() => setTab("poll")} data-testid="poll-tab">Ankiety · {data?.polls.length ?? 0}</button>
      </div>
      {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
      {msg && <p className="ok-msg" role="status" style={{ margin: 0 }}>{msg}</p>}

      {tab === "ann" ? <>
        <form className="ann-admin-form" onSubmit={(e) => { e.preventDefault(); saveAnn(); }} data-testid="ann-form">
          <strong>{ann.id ? "Edycja ogłoszenia" : "Nowe ogłoszenie"}</strong>
          <label className="field"><span>Tytuł</span>
            <input value={ann.title} maxLength={ANN_LIMITS.title} required onChange={(e) => setAnn({ ...ann, title: e.target.value })} data-testid="ann-title" />
          </label>
          <label className="field"><span>Treść (zwykły tekst; pusta linia – nowy akapit)</span>
            <textarea value={ann.body} maxLength={ANN_LIMITS.body} required onChange={(e) => setAnn({ ...ann, body: e.target.value })} data-testid="ann-body" />
          </label>
          <label className="field"><span>Wygasa (opcjonalnie)</span>
            <input type="datetime-local" value={ann.expires_at} onChange={(e) => setAnn({ ...ann, expires_at: e.target.value })} />
          </label>
          <label className="check"><input type="checkbox" checked={ann.pinned} onChange={(e) => setAnn({ ...ann, pinned: e.target.checked })} data-testid="ann-pinned-check" /> przypnij (pasek nad treścią stron)</label>
          <label className="check"><input type="checkbox" checked={ann.published} onChange={(e) => setAnn({ ...ann, published: e.target.checked })} /> opublikuj (bez zaznaczenia – szkic)</label>
          <div className="row">
            <button className="btn" disabled={busy || !ann.title.trim() || !ann.body.trim()} data-testid="ann-save">{ann.id ? "Zapisz zmiany" : ann.published ? "Opublikuj" : "Zapisz szkic"}</button>
            {ann.id && <button type="button" className="btn secondary" onClick={() => setAnn(EMPTY_ANN)}>Anuluj edycję</button>}
          </div>
        </form>
        {!data ? <SkeletonRows rows={2} height={70} label="Ładowanie ogłoszeń" /> : data.announcements.length === 0 ? <p className="muted">Brak ogłoszeń.</p> : (
          <ul className="ann-list">
            {data.announcements.map((a) => (
              <li key={a.id} className="card ann-admin-item" data-testid="ann-admin-item">
                <div className="ann-meta">
                  <span>{a.published_at ? `opublikowane ${fmt(a.published_at)}` : "szkic"}</span>
                  {a.pinned && <span>· 📌 przypięte</span>}
                  {a.expires_at && <span>· wygasa {fmt(a.expires_at)}</span>}
                  <span>· przeczytało {a.reads} z {data.users}</span>
                </div>
                <strong>{a.title}</strong>
                <AnnBody text={a.body} />
                <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                  <button className="btn small secondary" onClick={() => setAnn({ id: a.id, title: a.title, body: a.body, pinned: a.pinned, published: !!a.published_at, expires_at: local(a.expires_at) })}>Edytuj</button>
                  <button className="btn small secondary" onClick={() => togglePub(a)} disabled={busy}>{a.published_at ? "Wycofaj" : "Opublikuj"}</button>
                  <button className="btn small danger" onClick={() => remove("ogloszenia", a.id, `ogłoszenie „${a.title}”`)} disabled={busy}>Usuń</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </> : <>
        <form className="ann-admin-form" onSubmit={(e) => { e.preventDefault(); savePoll(); }} data-testid="poll-form">
          <strong>{poll.id ? "Edycja ankiety" : "Nowa ankieta"}</strong>
          <label className="field"><span>Pytanie</span>
            <input value={poll.question} maxLength={ANN_LIMITS.question} required onChange={(e) => setPoll({ ...poll, question: e.target.value })} data-testid="poll-question" />
          </label>
          <label className="field"><span>Odpowiedzi – każda w osobnej linii ({ANN_LIMITS.minOptions}–{ANN_LIMITS.maxOptions})</span>
            <textarea value={poll.options} onChange={(e) => setPoll({ ...poll, options: e.target.value })} data-testid="poll-options" />
          </label>
          <label className="field"><span>Zamknięcie (opcjonalnie)</span>
            <input type="datetime-local" value={poll.closes_at} onChange={(e) => setPoll({ ...poll, closes_at: e.target.value })} />
          </label>
          <label className="field"><span>Wyniki dla użytkowników</span>
            <select className="select" value={poll.results_after} onChange={(e) => setPoll({ ...poll, results_after: e.target.value as PollForm["results_after"] })}>
              <option value="vote">po oddaniu głosu</option>
              <option value="close">dopiero po zamknięciu ankiety</option>
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={poll.multi} onChange={(e) => setPoll({ ...poll, multi: e.target.checked })} /> wielokrotny wybór</label>
          <label className="check"><input type="checkbox" checked={poll.anonymous} onChange={(e) => setPoll({ ...poll, anonymous: e.target.checked })} data-testid="poll-anon" /> anonimowa (bez listy głosujących)</label>
          <label className="check"><input type="checkbox" checked={poll.published} onChange={(e) => setPoll({ ...poll, published: e.target.checked })} /> opublikuj (bez zaznaczenia – szkic)</label>
          <div className="row">
            <button className="btn" disabled={busy || !poll.question.trim()} data-testid="poll-save">{poll.id ? "Zapisz zmiany" : poll.published ? "Opublikuj" : "Zapisz szkic"}</button>
            {poll.id && <button type="button" className="btn secondary" onClick={() => setPoll(EMPTY_POLL)}>Anuluj edycję</button>}
          </div>
        </form>
        {!data ? <SkeletonRows rows={2} height={70} label="Ładowanie ankiet" /> : data.polls.length === 0 ? <p className="muted">Brak ankiet.</p> : (
          <ul className="ann-list">
            {data.polls.map((p) => (
              <li key={p.id} className="card ann-admin-item" data-testid="poll-admin-item">
                <div className="ann-meta">
                  <span>{p.published_at ? `opublikowana ${fmt(p.published_at)}` : "szkic"}</span>
                  <span>· {p.closed ? "zamknięta" : p.closes_at ? `do ${fmt(p.closes_at)}` : "otwarta"}</span>
                  <span>· {p.anonymous ? "anonimowa" : "jawna"}{p.multi ? " · wielokrotny wybór" : ""}</span>
                </div>
                <strong>{p.question}</strong>
                <PollResults poll={p} results={p.results} />
                {p.voters && p.voters.length > 0 && (
                  <details className="ann-voters" data-testid="poll-voters">
                    <summary>Kto głosował ({p.voters.length})</summary>
                    <ul>{p.voters.map((v) => <li key={v.email}>{v.email}: {v.choices.map((c) => p.options[c]).join(", ")}</li>)}</ul>
                  </details>
                )}
                <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                  <button className="btn small secondary" onClick={() => editPoll(p)}>Edytuj</button>
                  {!p.closed && p.published_at && <button className="btn small secondary" onClick={() => closePoll(p)} disabled={busy}>Zamknij teraz</button>}
                  <button className="btn small danger" onClick={() => remove("ankiety", p.id, `ankietę „${p.question}”`)} disabled={busy}>Usuń</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>}
    </div>
  );
}
