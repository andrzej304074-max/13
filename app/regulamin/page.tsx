import Link from "next/link";

export const metadata = { title: "Regulamin – Testy OWE" };

/** Szkic regulaminu – do weryfikacji prawnej przed publicznym udostępnieniem. */
export default function TermsPage() {
  return (
    <article className="stack legal" data-testid="terms">
      <h1>Regulamin</h1>
      <p className="muted">Wersja z 24.10.2026. Szkic – wymaga sprawdzenia przez prawnika przed publicznym udostępnieniem.</p>
      <h2>1. Czym jest aplikacja</h2>
      <p>Testy OWE to bezpłatna aplikacja do nauki ekonomii i przygotowania do Olimpiady Wiedzy Ekonomicznej. Nie jest oficjalną aplikacją organizatora olimpiady. Pytania archiwalne pochodzą z opublikowanych zawodów; pozostałe treści (kurs, Podręcznik, pytania własne) mogą zawierać błędy – zgłaszaj je przyciskiem „Zgłoś błąd”.</p>
      <h2>2. Konto</h2>
      <ul>
        <li>Konto zakłada się adresem e-mail (albo kontem Google). Konto aktywuje kod od administratora i jego zatwierdzenie.</li>
        <li>Osoby poniżej 16 lat potrzebują zgody rodzica lub opiekuna; osoby poniżej 10 lat nie mogą założyć konta.</li>
        <li>Nie udostępniaj hasła ani kodów zapasowych. Konto możesz w każdej chwili usunąć w Ustawieniach.</li>
      </ul>
      <h2>3. Zasady korzystania</h2>
      <ul>
        <li>Treści aplikacji służą do nauki własnej – nie wolno ich kopiować hurtowo, pobierać automatycznie ani publikować dalej.</li>
        <li>Zakazane jest obchodzenie zabezpieczeń, nabijanie wyników i podszywanie się pod innych.</li>
        <li>Pseudonim w rankingu nie może być obraźliwy ani wskazywać na inną osobę.</li>
      </ul>
      <h2>4. Odpowiedzialność</h2>
      <p>Aplikacja jest udostępniana „tak jak jest”. Dokładamy starań, żeby treści były poprawne, ale nie gwarantujemy wyniku w olimpiadzie ani ciągłości działania.</p>
      <h2>5. Zmiany i kontakt</h2>
      <p>O zmianach regulaminu informujemy ogłoszeniem w aplikacji. Kontakt: [adres e-mail].</p>
      <p><Link href="/prywatnosc">Polityka prywatności →</Link></p>
    </article>
  );
}
