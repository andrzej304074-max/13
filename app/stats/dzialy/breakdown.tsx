"use client";

import { useEffect, useState } from "react";
import { usePrefSync } from "@/lib/prefs-client";
import { OweFilterFields } from "@/app/pojecia/filters";
import { api, fmtPct, viewedUser, withUser } from "@/lib/client";
import { DEFAULT_MY_FILTER, myFilterFromParams, myFilterToParams, type MyFilter, type MyRow } from "@/lib/my-stats-core";
import type { MyItemAnswers, MyStatsPayload } from "@/lib/my-stats";
import { level } from "@/lib/owe-stats";
import { SkeletonRows } from "@/app/components/loading-page";
import { LoadError } from "@/app/components/load-error";
import { Why } from "@/app/components/why";

const KIND_ONE: Record<string, string> = { pojecie: "pojęcie", wzor: "wzór", osoba: "osoba", instytucja: "instytucja", data: "data", przepis: "przepis" };
const STEP = 30;

function Pct({ r }: { r: MyRow }) {
  const lv = level(r.correct, r.answers);
  return (
    <div className="my-pct">
      <div className={`pbar ${lv}`} aria-hidden><span style={{ width: `${r.percent}%` }} /></div>
      <strong>{fmtPct(r.percent)}</strong>
    </div>
  );
}

function Recent({ r }: { r: MyRow }) {
  return (
    <>
      {r.recent === null ? <span className="muted">–</span> : fmtPct(r.recent)}
      {r.trend !== null && r.trend !== 0 && (
        <small className={r.trend > 0 ? "trend-up" : "trend-down"} title="ostatnie 10 odpowiedzi względem wcześniejszych"> {r.trend > 0 ? "▲" : "▼"}{Math.abs(r.trend)}</small>
      )}
    </>
  );
}

const ago = (t: number) => (t ? new Date(t).toLocaleDateString("pl-PL") : "–");

/** Moje statystyki wg działów, zagadnień i pojęć – dla wybranej bazy pytań (OWE albo słownik). */
/** Parametry adresu z filtrami (myFilterToParams) – jawny link z filtrami ma pierwszeństwo przed zapisanymi. */
export const FILTER_KEYS = ["typ", "okres", "sort", "dzial", "rodzaj", "etap", "od", "do", "poch", "sekcja", "haslo"];

const SRC_TEXT = { owe: "z Archiwum OWE", ai: "AI (sprawdzonych)", slownik: "ze Słownika", xl: "o hasło XL" } as const;

export function MyBreakdown({ bank }: { bank: "owe" | "ai" | "slownik" | "xl" }) {
  const [f, setF] = useState<MyFilter | null>(null);
  const [data, setData] = useState<MyStatsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  // ostatnie odpowiedzi przy pojęciu – pobierane dopiero po rozwinięciu (bez nich tabela waży ok. 1/3)
  const [itemAns, setItemAns] = useState<Record<string, MyItemAnswers | "err">>({});
  const [limit, setLimit] = useState(STEP);

  const [explicit] = useState(() => typeof window !== "undefined"
    && FILTER_KEYS.some((k) => new URLSearchParams(window.location.search).has(k)));
  useEffect(() => setF(myFilterFromParams(new URLSearchParams(window.location.search))), []);
  // filtry zapamiętane na koncie (osobno dla pytań z olimpiad i ze słownika)
  usePrefSync(bank === "owe" ? "stats-dzialy" : bank === "ai" ? "stats-dzialy-ai" : bank === "xl" ? "stats-dzialy-xl" : "stats-dzialy-slownik", f ? myFilterToParams(f) : null,
    (v) => setF(myFilterFromParams(new URLSearchParams(v))), { load: explicit, save: !!viewedUser() });
  useEffect(() => {
    if (!f) return;
    const q = myFilterToParams(f);
    const p = new URLSearchParams(window.location.search);
    for (const k of FILTER_KEYS) p.delete(k);
    for (const [k, v] of new URLSearchParams(q)) p.set(k, v);
    p.set("bank", bank);
    window.history.replaceState(null, "", `/stats/dzialy${p.size ? `?${p}` : ""}`);
    setData(null);
    setItemAns({});
    let live = true;
    api<MyStatsPayload>(withUser(`/api/stats/dzialy?bank=${bank}${q ? `&${q}` : ""}`))
      .then((d) => { if (live) setData(d); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [f, bank]);
  useEffect(() => {
    if (!f || !open || itemAns[open]) return;
    const q = myFilterToParams(f), id = open;
    let live = true;
    api<MyItemAnswers>(withUser(`/api/stats/dzialy?bank=${bank}${q ? `&${q}` : ""}&pojecie=${encodeURIComponent(id)}`))
      .then((a) => { if (live) setItemAns((m) => ({ ...m, [id]: a })); })
      .catch(() => { if (live) setItemAns((m) => ({ ...m, [id]: "err" })); });
    return () => { live = false; };
  }, [f, bank, open, itemAns]);

  if (error) return <LoadError message={error} />;
  if (!f) return null;
  const set = (o: Partial<MyFilter>) => { setF({ ...f, ...o }); setLimit(STEP); setOpen(null); };
  const N = data?.names;

  return (
    <div className="stack" data-testid="my-breakdown">
      
      <p className="muted">
        Twoja skuteczność w pytaniach {SRC_TEXT[bank]}, według działów, zagadnień i pojęć, o które pytają – ze wszystkich testów,
        także z zakładki „Wszystkie pytania”.
        „Ostatnio” – ostatnie 30 dni; strzałka – zmiana ostatnich 10 odpowiedzi względem wcześniejszych (w punktach procentowych).
        Kolory: <span className="lv good">≥ 80%</span> <span className="lv mid">50–79%</span> <span className="lv weak">&lt; 50%</span>.
      </p>
      <Why>
        Liczymy każdą Twoją sprawdzoną lub pominiętą odpowiedź na pytanie z tego źródła (Archiwum OWE, Pytania AI albo Słownik) – źródło
        rozpoznajemy po pytaniu, więc wliczają się też testy mieszane. Skuteczność: jednokrotny wybór – trafione albo nie, wielokrotny –
        punkty / 2. Dział i zagadnienie to przydział pytania w kursie; pojęcia to hasła, o które pytanie pyta – jedno pytanie liczy się
        przy każdym swoim pojęciu, dlatego suma przy pojęciach bywa większa niż liczba odpowiedzi. Pytania obliczeniowe liczą się jako
        rodzaj „wzory”.{bank !== "slownik" && " Hasło przewodnie: w Archiwum – pytania o hasło swojej edycji, w Pytaniach AI – dział „Demografia” (hasło XL)."}
      </Why>
      <div className="card stack filters-card">
        <OweFilterFields
          f={f} set={set} editions={bank === "owe"} theme={bank === "owe" || bank === "ai"}
          topics={Object.entries(N?.topics ?? {}).map(([id, name]) => ({ id, name }))}
          kinds={N?.kinds ?? []}
        >
          {(bank === "slownik" || bank === "xl") && <>
            <label className="filters">Pochodzenie
              <select className="select" value={f.origin ?? ""} onChange={(e) => set({ origin: (e.target.value || null) as MyFilter["origin"] })}>
                <option value="">ręczne i automatyczne</option>
                <option value="m">ręczne</option>
                <option value="a">automatyczne</option>
              </select>
            </label>
            {bank === "slownik" && <label className="filters">Dział słownika
              <select className="select" value={f.sec ?? ""} onChange={(e) => set({ sec: Number(e.target.value) || null })}>
                <option value="">wszystkie</option>
                {(N?.sections ?? []).map((s) => <option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}
              </select>
            </label>}
          </>}
          <label className="filters">Okres
            <select className="select" value={f.range} onChange={(e) => set({ range: e.target.value as MyFilter["range"] })}>
              <option value="all">cały czas</option>
              <option value="30d">ostatnie 30 dni</option>
              <option value="7d">ostatnie 7 dni</option>
            </select>
          </label>
          <label className="filters">Kolejność
            <select className="select" value={f.sort} onChange={(e) => set({ sort: e.target.value as MyFilter["sort"] })}>
              <option value="weak">najsłabsze najpierw</option>
              <option value="strong">najmocniejsze najpierw</option>
              <option value="count">najwięcej odpowiedzi</option>
            </select>
          </label>
        </OweFilterFields>
        <div className="row">
          {data && <p className="muted" style={{ margin: 0 }} data-testid="my-total">Odpowiedzi spełniających filtry: <strong>{data.total.answers}</strong>{data.total.answers ? ` · ${fmtPct(data.total.percent)} poprawnych` : ""}</p>}
          <span className="spacer" />
          {myFilterToParams(f) && <button className="btn small secondary" onClick={() => set(DEFAULT_MY_FILTER)}>Wyczyść filtry</button>}
        </div>
      </div>

      {!data ? <SkeletonRows rows={4} height={64} /> : data.total.answers === 0 && data.topics.length === 0 ? (
        <div className="empty-state"><span aria-hidden>🔍</span><p>Brak odpowiedzi na pytania {SRC_TEXT[bank]} dla tych filtrów.</p></div>
      ) : <>
        <h3>Działy</h3>
        <div className="card table-wrap" data-testid="my-topics">
          <table className="stat-table">
            <thead><tr><th>Dział</th><th className="num">Odp.</th><th>Skuteczność</th><th className="num">Ostatnio</th></tr></thead>
            <tbody>
              {data.topics.map((r) => (
                <tr key={r.id} className={`clickable ${f.topic === r.id ? "selected-row" : ""}`} onClick={() => set({ topic: f.topic === r.id ? null : r.id })} title="Zawęź zagadnienia i pojęcia do tego działu">
                  <td>{N!.topics[r.id] ?? r.id}</td><td className="num">{r.answers}</td><td><Pct r={r} /></td><td className="num"><Recent r={r} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Zagadnienia {f.topic && <span className="muted">– {N!.topics[f.topic]}</span>}</h3>
        <div className="card table-wrap" data-testid="my-units">
          <table className="stat-table">
            <thead><tr><th>Zagadnienie</th><th className="num">Odp.</th><th>Skuteczność</th><th className="num">Ostatnio</th></tr></thead>
            <tbody>
              {data.units.map((r) => (
                <tr key={r.id}><td>{N!.units[r.id] ?? r.id}</td><td className="num">{r.answers}</td><td><Pct r={r} /></td><td className="num"><Recent r={r} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Pojęcia</h3>
        <p className="muted" style={{ marginTop: -8 }}>Kliknij pojęcie, aby zobaczyć Twoje ostatnie odpowiedzi na pytania o nie.</p>
        <div className="card table-wrap" data-testid="my-items">
          <table className="stat-table">
            <thead><tr><th>Pojęcie</th><th className="num">Odp.</th><th>Skuteczność</th><th className="num">Ostatnio</th><th className="num hide-sm">Ostatnia</th></tr></thead>
            <tbody>
              {data.items.slice(0, limit).flatMap((r) => {
                const m = N!.items[r.id];
                const main = (
                  <tr key={r.id} className="clickable" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id} data-testid="my-item">
                    <td><span className="item-name">{open === r.id ? "▾" : "▸"} {m?.title ?? r.id}</span>
                      <div className="concept-tags"><span className="tag">{KIND_ONE[m?.kind] ?? m?.kind}</span>{!f.topic && <span className="tag">{N!.topics[m?.topic]}</span>}</div></td>
                    <td className="num">{r.answers}</td><td><Pct r={r} /></td><td className="num"><Recent r={r} /></td><td className="num muted hide-sm">{ago(r.last)}</td>
                  </tr>
                );
                if (open !== r.id) return [main];
                const ia = itemAns[r.id];
                return [main, (
                  <tr key={`${r.id}-a`} className="q-list-row"><td colSpan={5}>
                    {!ia ? <SkeletonRows rows={2} height={48} /> : ia === "err" ? <p className="error">Nie udało się wczytać odpowiedzi.</p> : (
                      <ol className="q-list" data-testid="my-item-answers">
                        {ia.answers.map((a, k) => (
                          <li key={k}>
                            <div className="muted q-meta">{ia.questions[a.q]?.edition} · {new Date(a.at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}</div>
                            <div>{ia.questions[a.q]?.question}</div>
                            <div className={a.acc >= 1 ? "ok-msg" : a.acc > 0 ? "" : "error"}>{a.acc >= 1 ? "✓ poprawnie" : a.acc > 0 ? `częściowo (${Math.round(a.acc * 100)}%)` : "✗ błędnie"}</div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </td></tr>
                )];
              })}
            </tbody>
          </table>
          {data.items.length === 0 && <p className="muted">Brak pojęć dla wybranych filtrów.</p>}
          {data.items.length > limit && (
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn small secondary" onClick={() => setLimit(limit + STEP)}>Pokaż kolejne {STEP}</button>
              <button className="btn small secondary" onClick={() => setLimit(data.items.length)}>Pokaż wszystkie ({data.items.length})</button>
            </div>
          )}
        </div>
      </>}
    </div>
  );
}
