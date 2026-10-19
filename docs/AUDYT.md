# Audyt aplikacji (październik 2026)

Przegląd całej aplikacji pod kątem błędów merytorycznych, technicznych i graficznych. Poniżej: jak sprawdzano,
co poprawiono, co zostało świadomie bez zmian i sprawy do decyzji.

## Jak sprawdzano

| Obszar | Narzędzie | Zakres |
|---|---|---|
| Treści | `python3 -I tools/nauka/audyt_tresci.py` → `tools/nauka/AUDYT-TRESCI.md` | 1656 pytań OWE, 3400 pytań słownikowych (auto + ręczne), ~1700 haseł kursu, 88 artykułów Podręcznika |
| Trasy | crawler Playwright (zalogowany właściciel, wylogowany, podgląd admina `?user=`), 430 i 1280 px | 235 stron (telefon) i 135 (komputer) – wszystkie linki wewnętrzne, maks. 3 strony na wzorzec adresu |
| Wygląd | zrzuty ekranu wszystkich tras, 430/1024/1280 px, jasny i ciemny motyw | ocena wzrokowa |
| Kod | przegląd uprawnień, walidacji i obsługi błędów nowych funkcji; `npm audit --omit=dev` | rescore, talie, mapa, notatki, limity, blokady, czytanie |
| Awarie | zatrzymanie bazy w trakcie sesji | wszystkie główne strony |

Crawler sprawdza na każdej stronie: odpowiedzi HTTP ≥ 400 (także zapytań w tle), błędy JS i `console.error`,
poziome przewijanie, elementy wystające poza ekran, ucięty tekst w przyciskach i nagłówkach, przyciski i linki bez
nazwy, pola bez etykiety, obrazy bez `alt`, zduplikowane `id` i liczbę nagłówków `h1`.

## Poprawione

**Treści**
- **Pytania słownikowe:** 546 automatycznych pytań miało definicje ucięte w środku nawiasu lub cytatu, np. „…lub … (np.” albo „(art.”?”.
  - Generator (`tools/slownik/gen_questions.py`: `clip`, `first_sentence`) tnie teraz tylko w miejscu, gdzie nawiasy i cudzysłowy są domknięte. Za koniec zdania nie uznaje też inicjału w nawiasie („(A. Smith)”).
  - Identyfikatory i klucze odpowiedzi bez zmian, więc historia odpowiedzi i statystyki zostają.
- **Pytania OWE:** usunięta spacja przed „?” i „:” w 3 pytaniach (`owe22-s-29`, `owe31-o-28`, `owe32-s-19`).

**Technika i bezpieczeństwo**
- **Ekran błędu zamiast pustej strony.**
  - Wcześniej przy chwilowym braku bazy każda strona dawała pusty błąd 500.
  - Teraz `app/error.tsx` pokazuje komunikat z przyciskami „Spróbuj ponownie” i „Strona główna”, a `app/global-error.tsx` obsługuje awarię samego układu.
- **Polska strona 404** (`app/not-found.tsx`) zamiast domyślnej angielskiej, także dla nieistniejących lekcji, tematów i artykułów.
- **Nagłówki bezpieczeństwa** (`next.config.ts`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (brak osadzania w obcych ramkach), `Referrer-Policy`, `Permissions-Policy`.
- **Blokady sekcji:** `proxy.ts` nadpisuje nagłówek ścieżki `x-path` przy każdym żądaniu, także na ekranach konta, więc klient nie może podać własnej ścieżki.

**Dostępność**
- Pole wyboru działu słownika ma etykietę.
- Lekcja, Powtórka, edytor talii i edytor notatki mają nagłówek `h1` (ukryty wizualnie, czytany przez czytniki ekranu).

## Sprawdzone – bez zmian (fałszywe alarmy albo celowe)

- **Wyjaśnienia pytań wielokrotnego wyboru:** 89 miejsc wskazuje literę spoza klucza. Ręczny przegląd: każde z nich tłumaczy, dlaczego dana odpowiedź jest błędna („(B) to inne zjawisko”, „(D) dotyczy…”) – brak błędów.
- **4 wyjaśnienia z inną literą niż klucz:** „(C)” to tam symbol konsumpcji w definicji („konsumpcja (C)”), a nie odpowiedź.
- **9 krótkich opisów haseł:** to hasła typu „wzór” – opis jest podtytułem, a treść niesie wzór.
- **34 krótkie wyjaśnienia** w ręcznych pytaniach słownikowych: rachunki („PV = 10 000 / 1,04^5 ≈ 8219,27 zł”) albo pytania „wszystkie pary są poprawne”. Treść poprawna, zwięzłość celowa.
- **Podwójna spacja we wzorach** (`i ≈ r + πᵉ  (dokładnie …)`): celowy odstęp między wzorem a objaśnieniem.
- **Uprawnienia:**
  - podgląd admina (`?user=`) tylko czyta – wszystkie zapisy (notatki, talie, podkreślenia, gwiazdki, przeczytane) idą na konto zalogowanego;
  - cudze id daje 404;
  - blokady sekcji są sprawdzane po stronie serwera w `requireUser` i `requirePageUser` dla stron i API.
- **`npm audit --omit=dev`:** 0 podatności.

## Do decyzji

1. **Content-Security-Policy.** Pełna CSP wymaga nonce dla skryptów Next.js i wyłącza część cache CDN. Przy obecnym ryzyku (brak treści od użytkowników renderowanej jako HTML) zostawiam bez CSP. Do rozważenia, jeśli pojawią się treści współdzielone między kontami.
2. **Status 200 dla „nie ma takiej strony” w zagnieżdżonych trasach.** Dotyczy np. `/nauka/xyz`. Strona jest strumieniowana, więc status idzie przed treścią; użytkownik widzi poprawny ekran 404. Do zmiany tylko przez rezygnację ze strumieniowania tych tras – nie warto.
3. **Krótkie wyjaśnienia ręcznych pytań słownikowych** (34) można rozbudować o jedno zdanie kontekstu. To praca redakcyjna, nie błąd.

---

# Przegląd po zgłoszeniu „Load failed” (październik 2026)

Zgłoszenie z iPhone'a: w trakcie testu cały ekran zamienił się w czerwony napis „Load failed”.
To komunikat Safari, gdy zapytanie w ogóle nie dojdzie do serwera (zmiana sieci, powrót aplikacji z tła).

## Jak sprawdzano

**Testy e2e (Playwright)** – od etapu 9 w repozytorium: `tests/e2e/` (uruchomienie: `bash tests/e2e/run.sh`):
- `offline.mjs` (20 sprawdzeń):
  - test 30 pytań: „Sprawdź” i „Zakończ” bez sieci;
  - odpowiedź HTTP zgubiona po zapisie na serwerze;
  - wczytanie testu bez sieci;
  - koniec lekcji bez sieci, zamknięcie i powrót;
  - lekcja zaczęta bez sieci;
  - błąd wczytania statystyk.
- `crawl.mjs` – 27 adresów × jasny/ciemny motyw × 390/1280 px (108 stron; od etapu 9 – 35 adresów, 140 stron): błędy JS, odpowiedzi 4xx/5xx, poziome przewijanie, komunikaty błędów na stronie.
- `probes.mjs` (41 sprawdzeń API):
  - walidacja własnych fiszek, notatek z kartami i testów z etapem;
  - dostęp drugiego konta do cudzych fiszek, talii, notatek, testów i sesji nauki;
  - usunięcie własnej fiszki – czyszczenie talii i gwiazdek.

**Pozostałe:**
- Zrzuty nowych ekranów na telefonie.
- Logi serwera z całej regresji.
- Testy jednostkowe `api()` (`tests/client-api.test.ts`).

## Poprawione

1. **Błąd sieci zastępował cały test** (`app/test/[id]/page.tsx`). Jeden stan `error` dla wszystkiego: nieudane „Sprawdź” chowało test bez możliwości powrotu.
   - Teraz błąd wczytania pokazuje ekran z „Spróbuj ponownie”.
   - Błąd odpowiedzi lub zakończenia pojawia się pod pytaniem i test zostaje.
   - Po powrocie sieci albo aplikacji z tła stan synchronizuje się z serwerem.
   - Odpowiedź zapisana mimo zgubionej odpowiedzi HTTP jest pokazywana zamiast błędu (wcześniej ponowienie dawało „już odpowiedziano”).
   - Zakończenie po czasie bez sieci nie ponawia się co 0,5 s.
2. **`api()` bez ponawiania i z angielskim komunikatem przeglądarki** (`lib/client.ts`).
   - GET jest ponawiany 2× przy błędzie sieci i przy 5xx bez JSON.
   - Zapisy nie są ponawiane automatycznie (mogły dojść do serwera).
   - Polskie komunikaty; `ApiError` ze statusem i flagą `network`.
3. **Wynik lekcji przepadał bez sieci** (`app/nauka/lekcja/player.tsx`). Stan był usuwany z przeglądarki przed zapisem wyniku, a nieudany zapis nie miał ponowienia.
   - Teraz stan zostaje do udanego zapisu, a ponownie otwarta lekcja sama zapisuje wynik.
   - Doszły „Spróbuj ponownie” i zapis po powrocie sieci.
   - 409 (wynik już zapisany) jest traktowany jak sukces.
   - Lekcja zaczęta bez sieci też zachowuje postęp; sesja jest zakładana przy zapisie wyniku.
4. **Zakończenie sesji nauki nie było atomowe** (`lib/nauka.ts`). Zerwane połączenie mogło zostawić sesję „zakończoną” bez odpowiedzi. Teraz jedna transakcja.
5. **Autozapis notatki nie ponawiał się po błędzie** (`app/components/notes/editor.tsx`) aż do kolejnej zmiany. Teraz ponowienie po 5 s i po powrocie sieci.
6. **Błąd gwiazdki lub usuwania notatki zastępował stronę z edytorem** (`app/notatki/[id]/view.tsx`). Teraz komunikat pod nagłówkiem.
7. **Błędy wczytania bez wyjścia** (statystyki, działy, fiszki, tabela, mapa, pokrycie, statystyki OWE i nauki). Wspólny `LoadError` z „Spróbuj ponownie” i ponowieniem po powrocie sieci.
8. **Gwiazdka na fiszce stała obok karty, a nie w jej rogu.** Reguła `.star-btn { position: relative }` stała później w CSS i nadpisywała `position: absolute`. Na telefonie zwężało to kartę. Położenie i szerokość sprawdza `tests/e2e/stars.mjs`.
9. **Dymek „🧠” ucinany przy prawej krawędzi feedu.** Położenie jest teraz liczone względem kontenera, a nie okna.
10. **„🧠 mapa” w Tabeli pojęć** po zawinięciu miało przypadkowe wcięcie; teraz stoi przy prawej krawędzi.
11. **Tymczasowy skrypt testu trafił do repozytorium.** Usunięty; wzorzec `.*.tmp.mjs` dodany do `.gitignore`.

## Sprawdzone – bez zmian

- **„Destination stream closed early” w logu serwera** – zapytania przerwane przez przeglądarkę w testach bez sieci; nie jest to błąd aplikacji.
- **PATCH cudzej fiszki zwraca 400 zamiast 404.** Walidacja idzie przed sprawdzeniem właściciela, a zapis jest ograniczony do kart konta, więc nic się nie zmienia.
- **PATCH postępu cudzej sesji odpowiada „ok”.** Zapis jest ograniczony do sesji konta (sprawdzone, że dane się nie zmieniają); to zapis w tle, bez komunikatów.
- **Panel admina lokalnie pokazuje „Brak konfiguracji Azure/R2”** – oczekiwane bez kluczy; w Vercelu są ustawione.


# Debug końcowy – etapy 1–8 (październik 2026)

Przegląd po rozbudowie o:
- zgłoszenia błędów;
- Olimpiadę i Literaturę;
- zadania i eseje;
- hasło przewodnie;
- ogłoszenia i ankiety;
- powtórki;
- wydajność;
- bezpieczeństwo.

## Jak sprawdzano
- **Przegląd kodu** (`/code-review`, poziom wysoki) zmian w `app/`, `lib/`, `proxy.ts`, `next.config.ts` od etapu 1 oraz ponowny przegląd poprzedniego audytu.
- **Pełna regresja e2e:** 32 skrypty; od tego etapu w repozytorium (`tests/e2e/`, `bash tests/e2e/run.sh`). Nowe skrypty:
  - `security.mjs` – nagłówki, CSP, CSRF, limity, blokada logowania, kopiowanie, druk;
  - `authsweep.mjs` – wszystkie 67 tras API: bez logowania, z fałszywą sesją, zwykłe konto do tras admina.
- **Crawl:** 35 adresów × 2 motywy × 2 szerokości, w tym nowe ekrany: Zadania, Eseje, Olimpiada, Literatura, Ogłoszenia, Zgłoszenia.
- **Pozostałe:** testy jednostkowe (vitest), zrzuty nowych ekranów na telefonie, `npm audit` (0 podatności).

## Poprawione
1. **Blokady sekcji po dodaniu podzakładek** (`lib/access-core.ts`).
   - Wspólne zasoby działu – test (`/test/…`, `/api/tests`) oraz lekcje i postęp (`/api/nauka`) – były blokowane, gdy zablokowano wszystkie podzakładki działu.
   - Nowe podzakładki (Zadania, Eseje, Olimpiada, Literatura) nie były na niczyich listach blokad. Konto z zablokowaną Olimpiadą i Słownikiem znów mogło więc rozwiązywać testy.
   - Teraz zasób wiąże się z podzakładkami, które z niego korzystają.
2. **Sprawdzanie zadania lub eseju poza limitem pobrań** (`/api/otwarte/[id]/sprawdz`). Zwraca rozwiązanie albo schemat odpowiedzi, a nie liczyło się do limitu. Teraz się liczy.
3. **Test „bez limitu” jako furtka do całej bazy pytań.** Każda odpowiedź zwraca klucz i następne pytanie, a limit liczył tylko start testu. Doszedł limit odpowiedzi: 200 w 10 min, 2000 na dobę.
4. **Blokada logowania nie była atomowa** (`lib/security.ts`).
   - Liczenie prób przed hasłem i zapis porażki po nim przepuszczały równoległe próby; 200 naraz – 200 haseł zamiast 8.
   - Teraz próba jest zapisywana razem ze sprawdzeniem limitu, jednym zapytaniem, przed kosztownym scrypt.
   - Udane logowanie zdejmuje swoją próbę.
5. **Daty ogłoszeń i ankiet w strefie serwera.** Wartość z pola daty (bez strefy) serwer czytał w UTC, czyli przesuniętą o 1–2 h względem czasu admina. Teraz przeglądarka wysyła czas z UTC.
6. **Autozapis notatki** (`app/components/notes/editor.tsx`, `lib/notes.ts`).
   - Ponawiał co 5 s bez końca, także błędy trwałe (400, 403, 413) i po zamknięciu edytora. Teraz ponawia tylko błędy sieci i 5xx/429, póki edytor jest otwarty.
   - Ponowiony pierwszy zapis po zgubionej odpowiedzi tworzył kopię notatki. Teraz przeglądarka nadaje identyfikator (`cid`), więc ponowienie aktualizuje tę samą notatkę i nie liczy się do limitu jako nowa.
7. **Wynik lekcji – podwójny zapis albo cicha utrata** (`app/nauka/lekcja/player.tsx`, `lib/nauka.ts`).
   - Sesja zakładana przy zapisie wyniku nie trafiała do stanu w przeglądarce. Po zamknięciu karty ponowienie zakładało drugą sesję i liczyło wynik i XP dwa razy.
   - Zgubiona odpowiedź na założenie sesji zostawiała sesje-sieroty.
   - Każda odpowiedź 409 była traktowana jak „już zapisane”, także dla sesji cudzej albo nieistniejącej. Odpowiedzi znikały, a pokazywany był wynik policzony w przeglądarce.
   - Teraz:
     - sesja ma identyfikator z przeglądarki, a ponowienie zwraca tę samą;
     - serwer odróżnia 409 (własna, zakończona) od 404 (nie ma albo cudza);
     - przy 404 odpowiedzi trafiają do nowej sesji;
     - stan lekcji jest przypisany do konta, więc na wspólnym urządzeniu cudzy stan nie jest proponowany.
8. **Synchronizacja testu gubiła odpowiedź** (`app/test/[id]/page.tsx`). Migawka z serwera pobrana przed zapisem odpowiedzi mogła ją nadpisać po powrocie do karty. Teraz odpowiedzi są sumowane; stan zakończonego testu z serwera jest ostateczny.
9. **Ekran błędu przeładowywał stronę przy każdej zmianie sieci** (`app/components/load-error.tsx`), nawet przy błędzie trwałym (blokada, 404). Teraz ponawia sam tylko błędy sieci i chwilowe błędy serwera.
10. **Limity w bazie:**
    - limit treści sprawdzany jednym zapytaniem zamiast dwóch po kolei;
    - adres IP z `X-Forwarded-For` – ostatni, a nie pierwszy, który klient może podać sam.
11. **Drobne:**
    - typ powtórek to `Mastery`, a nie jego kopia;
    - jedna funkcja `isUuid`;
    - zależność `playwright-core` zapisana w `package.json`.
12. **Wyścigi w testach e2e:**
    - `decks.mjs` sprawdzał pustą listę talii przed jej wczytaniem;
    - `offline.mjs` otwierał lekcję ponownie, zanim zapis po powrocie sieci się wykonał;
    - `security.mjs` – podstawianie „$” przez powłokę w zapytaniu SQL.

## Sprawdzone – świadomie bez zmian
- **Blokada logowania na cudzy e-mail.** Kto zna e-mail, może na 15 minut wstrzymać logowanie na to konto. Reset hasła mailem działa nadal i zdejmuje blokadę (opisane w README).
- **Serwer bez pośrednika** (poza Vercelem, bez `x-real-ip`): wszyscy dzielą jeden licznik IP. Wdrożenie poza Vercelem powinno ustawiać `x-real-ip`.
- **Blokada kopiowania w przeglądarce** jest tylko utrudnieniem; realną ochroną są limity i serwer (README).

## Do decyzji
- **Pytania z kluczem przy haśle** (`/api/pojecia/pytania`, rozwinięcie wiersza w Tabeli pojęć) pokazują poprawne odpowiedzi bez rozwiązywania testu. Mają limit 60 w 10 min i 400 na dobę. Można ukryć klucz całkiem, ale wtedy rozwinięcie traci wartość do nauki.
