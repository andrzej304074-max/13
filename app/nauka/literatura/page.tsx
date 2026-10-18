import Link from "next/link";
import lit from "@/data/olimpiada/literatura.json";

export const metadata = { title: "Literatura – Testy OWE" };

type L = { label: string; u: string; internal?: boolean };
type Item = { a: string; t: string; pub: string; free?: L[]; alt?: L[] };

const Ext = ({ l }: { l: L }) => (l.internal || l.u.startsWith("/")
  ? <Link href={l.u}>{l.label} →</Link>
  : <a href={l.u} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>);
const bn = (it: Item) => `https://katalogi.bn.org.pl/discovery/search?query=any,contains,${encodeURIComponent(`${it.t} ${it.a.split(",")[0].split(" ").pop()}`)}&vid=48OMNIS_NLOP:48OMNIS_NLOP`;

/** Nauka → Literatura: wykaz XL OWE z bezpłatnymi źródłami, wykazy i informatory z poprzednich edycji. */
export default function LiteraturaPage() {
  return (
    <div className="stack olymp">
      <h1>📚 Literatura</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Wykaz zalecany w {lit.edition} edycji (<a href={lit.source} target="_blank" rel="noopener noreferrer">PDF na owe.pte.pl ↗</a>, stan na 18.10.2026).
        Przy każdej pozycji: bezpłatne wersje lub fragmenty, jeśli istnieją legalnie, i bezpłatne materiały o tym samym zakresie.
        Podręczniki z wykazu nie mają legalnych darmowych wersji – można je wypożyczyć (link do katalogu Biblioteki Narodowej przy pozycji).
      </p>

      {lit.groups.map((g) => (
        <section key={g.id} id={g.id} className="stack">
          <h2>{g.title}</h2>
          <ol className="lit-list">
            {(g.items as Item[]).map((it) => (
              <li key={it.t} className="card lit-item" data-testid="lit-item">
                <div><strong>{it.t}</strong></div>
                <div className="muted">{it.a} · {it.pub}</div>
                {it.free && it.free.length > 0 && (
                  <div className="lit-links"><span className="tag lit-free">bezpłatnie</span>{it.free.map((l) => <Ext key={l.u} l={l} />)}</div>
                )}
                {it.alt && it.alt.length > 0 && (
                  <div className="lit-links"><span className="tag">bezpłatne materiały</span>{it.alt.map((l) => <Ext key={l.u} l={l} />)}</div>
                )}
                <div className="lit-links"><a className="small muted" href={bn(it)} target="_blank" rel="noopener noreferrer">Szukaj w katalogu Biblioteki Narodowej ↗</a></div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section id="zrodla-haslo" className="stack">
        <h2>{lit.theme.title}</h2>
        <ul className="card olymp-list">{lit.theme.items.map((l) => <li key={l.u}><Ext l={l} /></li>)}</ul>
      </section>

      <section id="ogolne" className="stack">
        <h2>Bezpłatne źródła do całego programu</h2>
        <ul className="card olymp-list">{lit.general.map((l) => <li key={l.u}><Ext l={l} /></li>)}</ul>
        <p className="muted small" style={{ margin: 0 }}>Komitet zaleca też śledzenie bieżącej sytuacji społeczno-gospodarczej (prasa ekonomiczna, raporty NBP, GUS, KE, MFW).</p>
      </section>

      <section id="poprzednie" className="stack">
        <h2>Wykazy literatury i informatory z poprzednich edycji</h2>
        <div className="table-wrap card">
          <table className="olymp-themes" data-testid="lit-previous">
            <thead><tr><th>Edycja</th><th>Wykaz literatury</th><th>Informator</th></tr></thead>
            <tbody>
              {lit.previous.map((p) => (
                <tr key={p.ed}>
                  <td>{p.ed}</td>
                  <td>{"lit" in p && p.lit ? <a href={p.lit} target="_blank" rel="noopener noreferrer">PDF ↗</a> : <span className="muted">–</span>}</td>
                  <td>{"inf" in p && p.inf ? <a href={p.inf} target="_blank" rel="noopener noreferrer">PDF ↗</a> : <span className="muted">–</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small" style={{ margin: 0 }}>Zestawy pytań z kluczami: <a href={lit.archive} target="_blank" rel="noopener noreferrer">archiwum OWE ↗</a>.</p>
      </section>
    </div>
  );
}
