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
      <div className="card lit-note" data-testid="lit-disclaimer">
        <strong>⚠️ Ważne:</strong> bezpłatne materiały przy pozycjach (oznaczone „bezpłatnie” i „bezpłatne materiały”) to nasz własny dobór.
        <strong> Organizator OWE ich nie wskazuje</strong> – na olimpiadzie obowiązuje zakres z oficjalnego wykazu literatury,
        a darmowe źródła pomagają go opanować, ale nie zastępują podręczników z wykazu.
      </div>
      <div className="card lit-note" data-testid="lit-scribd">
        <strong>📄 Scribd:</strong> część pozycji z wykazu (lub ich fragmenty, streszczenia, wcześniejsze wydania) bywa dostępna
        w serwisie{" "}<a href="https://www.scribd.com" target="_blank" rel="noopener noreferrer">Scribd ↗</a> – to serwis z płatną
        subskrypcją (zwykle z okresem próbnym). Pliki wgrywają tam użytkownicy, więc sprawdzaj wydanie i korzystaj zgodnie
        z prawem autorskim; pewniejsza jest biblioteka (szkolna, miejska, uczelniana) albo Academica (cyfrowe wypożyczenia BN).
      </div>

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

      <section id="jak-sie-uczyc" className="stack" data-testid="lit-howto">
        <h2>Jak się uczyć z tej literatury</h2>
        <ul className="card olymp-list">
          <li><strong>Nie rozumiesz fragmentu? Zapytaj AI.</strong> Przepisz zdanie lub nazwę pojęcia do czatu AI i poproś: „wyjaśnij jak licealiście”,
            „podaj przykład z życia”, „pokaż na liczbach”. Odpowiedź AI sprawdzaj w podręczniku – AI potrafi się mylić, zwłaszcza w liczbach i datach.</li>
          <li><strong>Tłumacz sobie własnymi słowami</strong> (technika Feynmana): po przeczytaniu podrozdziału zamknij książkę i wyjaśnij
            go na głos albo na kartce, jakbyś uczył kolegę. Miejsca, w których się zacinasz, to luki – wróć do nich.</li>
          <li><strong>Pytaj „dlaczego?” i „co z tego wynika?”.</strong> Przy każdej definicji szukaj przyczyny, skutku i przykładu – tak są
            budowane pytania olimpijskie.</li>
          <li><strong>Rysuj wykresy i licz.</strong> Krzywe (popyt–podaż, koszty, AD–AS) i wzory przerabiaj sam w <Link href="/notatki">notatkach</Link> –
            samo czytanie nie wystarcza.</li>
          <li><strong>Sprawdzaj się od razu.</strong> Po rozdziale zrób lekcję w <Link href="/nauka">kursie</Link>, test ze <Link href="/slownik">Słownika</Link> lub
            z <Link href="/">archiwum OWE</Link>; błędne odpowiedzi wracają w <Link href="/fiszki">fiszkach</Link> i powtórkach.</li>
          <li><strong>Wracaj do trudnych miejsc</strong> po kilku dniach – rozłożone powtórki utrwalają lepiej niż jedno długie czytanie.</li>
        </ul>
      </section>

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
