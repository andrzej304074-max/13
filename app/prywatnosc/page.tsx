import Link from "next/link";

export const metadata = { title: "Polityka prywatności – Testy OWE" };

/** Szkic polityki prywatności – do weryfikacji prawnej przed publicznym udostępnieniem (pola w [nawiasach] do uzupełnienia). */
export default function PrivacyPage() {
  return (
    <article className="stack legal" data-testid="privacy">
      <h1>Polityka prywatności</h1>
      <p className="muted">Wersja z 24.10.2026. Szkic – wymaga sprawdzenia przez prawnika przed publicznym udostępnieniem.</p>
      <h2>1. Administrator danych</h2>
      <p>Administratorem danych jest [imię i nazwisko / nazwa], kontakt: [adres e-mail]. W sprawach danych osobowych można też użyć formularza „Zgłoś błąd” w aplikacji.</p>
      <h2>2. Jakie dane zbieramy</h2>
      <ul>
        <li>Konto: adres e-mail, skrót hasła (samego hasła nie znamy), rok urodzenia, data akceptacji regulaminu; u osób poniżej 16 lat – e-mail rodzica lub opiekuna i data oświadczenia o zgodzie.</li>
        <li>Logowanie: sesje (data, rodzaj urządzenia z nagłówka przeglądarki), klucze dostępu (klucz publiczny), sekret weryfikacji dwuetapowej (zaszyfrowany), identyfikator konta Google – jeśli logujesz się przez Google.</li>
        <li>Nauka: odpowiedzi w testach, wyniki zadań i esejów, postęp kursu i fiszek, notatki, podkreślenia, własne talie, ustawienia, XP i seria.</li>
        <li>Zgłoszenia błędów, głosy w ankietach, oceny treści (recenzenci).</li>
      </ul>
      <h2>3. Po co i na jakiej podstawie</h2>
      <p>Dane służą wyłącznie do działania aplikacji: logowania, zapisu postępów, statystyk i bezpieczeństwa (art. 6 ust. 1 lit. b RODO – świadczenie usługi; lit. f – ochrona przed nadużyciami). Nie wyświetlamy reklam i nie sprzedajemy danych. Ranking i statystyki świata pokazują wyniki innym tylko po Twojej zgodzie (opcja w Statystykach), pod wybranym pseudonimem.</p>
      <h2>4. Komu powierzamy dane</h2>
      <ul>
        <li>Hosting aplikacji i bazy danych: [Vercel Inc., dostawca bazy danych] – serwery w [region].</li>
        <li>Wysyłka e-maili (reset hasła, informacja dla rodzica): [dostawca SMTP].</li>
        <li>Nagrania lektora: Microsoft Azure (tylko tekst Podręcznika, bez danych użytkowników).</li>
        <li>Opcjonalnie: Google (logowanie przez Google), Cloudflare Turnstile (ochrona formularzy przed botami).</li>
      </ul>
      <h2>5. Jak długo</h2>
      <p>Do usunięcia konta. Po usunięciu konta dane konta i nauki są kasowane od razu; kopie zapasowe dostawcy bazy wygasają po [liczba] dniach.</p>
      <h2>6. Twoje prawa</h2>
      <p>Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia i sprzeciwu oraz skargi do Prezesa UODO. W <Link href="/konto/ustawienia">Ustawieniach konta</Link> możesz samodzielnie pobrać wszystkie swoje dane (plik JSON), zobaczyć i zakończyć sesje oraz usunąć konto.</p>
      <h2>7. Osoby poniżej 16 lat</h2>
      <p>Założenie konta przez osobę poniżej 16 lat wymaga zgody rodzica lub opiekuna (art. 8 RODO). Podczas rejestracji prosimy o e-mail rodzica, na który wysyłamy informację o założeniu konta.</p>
      <h2>8. Ciasteczka</h2>
      <p>Używamy wyłącznie niezbędnych ciasteczek: sesji logowania i jednorazowego ciasteczka logowania Google. Nie używamy ciasteczek analitycznych ani reklamowych.</p>
      <p><Link href="/regulamin">Regulamin →</Link></p>
    </article>
  );
}
