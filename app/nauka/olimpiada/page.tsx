import Link from "next/link";
import { AS_OF, CALENDAR, CURRENT_THEME, GOALS, ORGANIZER, REWARDS, RULES, SOURCES, STAGES, THEME_SCOPE, THEMES, WHO } from "@/data/olimpiada/info";

export const metadata = { title: "Olimpiada – Testy OWE" };

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{children} ↗</a>
);

/** Nauka → Olimpiada: jak wygląda OWE – etapy, punktacja, kalendarium, kwalifikacja, uprawnienia, hasła przewodnie. */
export default function OlimpiadaPage() {
  return (
    <div className="stack olymp">
      <h1>🏆 Olimpiada Wiedzy Ekonomicznej</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        XL edycja ({CURRENT_THEME.year}) · hasło przewodnie: <strong>„{CURRENT_THEME.theme}”</strong>. Stan na {AS_OF}, na podstawie regulaminu
        i „Informatora o XL OWE” – <Ext href={SOURCES.site}>owe.pte.pl</Ext>.
      </p>

      <nav className="chips olymp-toc" aria-label="Spis treści">
        {[["etapy", "Etapy i punktacja"], ["kalendarium", "Kalendarium"], ["haslo", "Hasło XL"], ["zasady", "Zasady"], ["nagrody", "Uprawnienia i nagrody"], ["hasla", "Hasła edycji"], ["o-owe", "O olimpiadzie"]].map(([id, l]) => (
          <a key={id} className="chip" href={`#${id}`}>{l}</a>
        ))}
      </nav>

      <section id="etapy" className="stack">
        <h2>Etapy i punktacja</h2>
        <div className="olymp-stages">
          {STAGES.map((s) => (
            <article key={s.id} className="card stack olymp-stage" data-testid="olymp-stage">
              <div className="olymp-stage-head"><span className="olymp-badge">{s.id}</span><h3>{s.name}</h3></div>
              <p className="muted small" style={{ margin: 0 }}>📅 {s.date} · 📍 {s.where}</p>
              <p style={{ margin: 0 }}><strong>Forma:</strong> {s.form}{s.time ? ` · czas: ${s.time}` : ""}</p>
              <table className="olymp-pts">
                <tbody>
                  {s.parts.map((p, i) => (
                    <tr key={i}>
                      <td>{p.label}{p.practice && <> <Link className="olymp-practice" href={p.practice.href}>ćwicz →</Link></>}</td>
                      <td className="num">{p.pts} pkt</td>
                    </tr>
                  ))}
                  <tr className="sum"><td>Razem</td><td className="num">{s.total} pkt</td></tr>
                </tbody>
              </table>
              {s.extra && <>
                <strong>{s.extra.title}</strong>
                <table className="olymp-pts">
                  <tbody>
                    {s.extra.parts.map((p, i) => <tr key={i}><td>{p.label}</td><td className="num">{p.pts} pkt</td></tr>)}
                    <tr className="sum"><td>Razem część ustna</td><td className="num">{s.extra.total} pkt</td></tr>
                    <tr className="sum"><td>Razem zawody centralne</td><td className="num">{s.total + s.extra.total} pkt</td></tr>
                  </tbody>
                </table>
                <p className="muted small" style={{ margin: 0 }}>{s.extra.note}</p>
              </>}
              <p className="olymp-next"><strong>Dalej:</strong> {s.next}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="kalendarium" className="stack">
        <h2>Kalendarium XL edycji</h2>
        <ol className="olymp-cal card">
          {CALENDAR.map((c) => (
            <li key={c.date + c.what} className={c.main ? "main" : ""}><span className="olymp-date">{c.date}</span><span>{c.what}</span></li>
          ))}
        </ol>
        <p className="muted small" style={{ margin: 0 }}>Źródło: <Ext href={SOURCES.kalendarium}>kalendarium na owe.pte.pl</Ext> – przed zawodami sprawdź aktualne daty.</p>
      </section>

      <section id="haslo" className="stack">
        <h2>Hasło przewodnie XL edycji</h2>
        <div className="card stack">
          <strong>„{CURRENT_THEME.theme}”</strong>
          <p style={{ margin: 0 }}>Pytania ogólne (eseje) w części pisemnej zawodów II i III stopnia koncentrują się wokół hasła; test obejmuje cały program Olimpiady. Zakres hasła:</p>
          <ul style={{ margin: 0 }}>{THEME_SCOPE.map((t) => <li key={t}>{t}</li>)}</ul>
          <p className="muted small" style={{ margin: 0 }}>
            Pełny opis: <Ext href={SOURCES.haslo}>opis hasła bieżącej edycji</Ext>. Lektury do hasła – <Link href="/nauka/literatura#haslo">Literatura</Link>.
          </p>
        </div>
      </section>

      <section id="zasady" className="stack">
        <h2>Zasady na zawodach</h2>
        <ul className="card olymp-list">{RULES.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>

      <section id="nagrody" className="stack">
        <h2>Uprawnienia i nagrody</h2>
        <ul className="card olymp-list">{REWARDS.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>

      <section id="hasla" className="stack">
        <h2>Hasła przewodnie wszystkich edycji</h2>
        <p className="muted" style={{ margin: 0 }}>Zestawy pytań z kluczami od XXI edycji są w <Ext href={SOURCES.archiwum}>archiwum Olimpiady</Ext>; w aplikacji – testy, zadania i eseje z XXVI–XXXIX.</p>
        <div className="table-wrap card">
          <table className="olymp-themes" data-testid="olymp-themes">
            <thead><tr><th>Edycja</th><th>Rok</th><th>Hasło przewodnie</th></tr></thead>
            <tbody>
              {[...THEMES].reverse().map((t) => (
                <tr key={t.ed} className={t.ed === CURRENT_THEME.ed ? "current" : ""}><td>{t.ed}</td><td>{t.year}</td><td>{t.theme}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="o-owe" className="stack">
        <h2>O olimpiadzie</h2>
        <div className="card stack">
          <p style={{ margin: 0 }}>{ORGANIZER}</p>
          <p style={{ margin: 0 }}><strong>Kto może startować:</strong> {WHO}</p>
          <div><strong>Cele OWE:</strong><ul style={{ margin: "4px 0 0" }}>{GOALS.map((g) => <li key={g}>{g}</li>)}</ul></div>
          <p className="muted small" style={{ margin: 0 }}>
            Źródła: <Ext href={SOURCES.regulamin}>regulamin XL OWE</Ext> · <Ext href={SOURCES.informator}>Informator o XL OWE (PDF)</Ext> · <Ext href={SOURCES.edycje}>poprzednie edycje</Ext>
          </p>
        </div>
      </section>
    </div>
  );
}
