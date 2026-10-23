# Testy OWE

Strona do rozwiązywania testów z pytań z poprzednich edycji Olimpiady Wiedzy Ekonomicznej.
Next.js (App Router) + Postgres (Neon), gotowa do wdrożenia na Vercel.

## Zasady

| Typ | Punktacja |
|---|---|
| Jednokrotny wybór | +2 pkt za poprawną, −1 pkt za błędną, 0 bez odpowiedzi |
| Wielokrotny wybór | 4 pola A–D o poprawnym stanie (zaznaczone gdy poprawne, puste gdy błędne) – 2 pkt, 3 trafne pola – 1 pkt, mniej – 0 |

Test: 30 pytań → 40 minut, 50 pytań → 60 minut. Trzecia opcja, **Bez limitu**, losuje pytania z całej puli danego typu
bez limitu czasu; nie można się cofać ani przeskakiwać pytań, a do statystyk liczą się wyłącznie pytania sprawdzone
(„Sprawdź”) lub pominięte („Pomiń” = 0 z 2 pkt) – na bieżąco, nawet bez kliknięcia „Zakończ test”. Po kliknięciu „Sprawdź” widać, które odpowiedzi były dobre,
ile punktów przyznano i wyjaśnienie. Punktacja i limit czasu są liczone na serwerze.

Procent w podsumowaniu i statystykach to **procent poprawnych odpowiedzi**, a nie punktów: w jednokrotnym wyborze
poprawne pytania / wszystkie pytania, w wielokrotnym – zdobyte punkty / maks. punktów (2 na pytanie). W testach
30/50 pytań mianownikiem są wszystkie pytania testu (bez odpowiedzi = niepoprawne), w trybie „Bez limitu” – pytania
sprawdzone i pominięte. Punkty (+2/−1; 2/1/0) są pokazywane obok.
Dawne odpowiedzi (punktacja 0,5 pkt za pole) przelicza jednorazowo `lib/rescore.ts` (flaga `scoring_multi = v2` w `settings`).

Statystyki (`/stats`) sumują wyniki **wszystkich** testów wszystkich użytkowników i pokazują dwa wykresy postępu:
procent kolejnych testów oraz dokładność w blokach po N kolejnych sprawdzonych lub pominiętych pytań
(N do wyboru: 10, 20, 25, 40, 50, 100, 150, 200; domyślnie 100). Przełącznik „Oba typy / Jednokrotny / Wielokrotny”
zawęża wynik, historię i oba wykresy do wybranego typu; oba wybory zapamiętuje przeglądarka.
**Etap zawodów** (jednokrotny wybór OWE): w formularzu testu „Oba etapy / Etap szkolny / Etap okręgowy” z liczbą pytań (etap z id pytania:
`-s-` szkolny, `-o-` okręgowy; wybór w `tests.draw`, także przy dolosowaniu „bez limitu”). W statystykach karta „Jednokrotny wybór wg etapu”
(liczona z pytań każdego etapu, także w testach „oba etapy”) i przełącznik etapu dla wyniku, historii i wykresu bloków (`/api/stats?type=single&stage=s|o`).
(w wielokrotnym wyborze dokładność pytania to trafne pola / 4). Brak logowania.

## Pytania

Baza pytań to pliki w `data/questions/` – jeden plik na część testową jednego zestawu OWE
(np. `owe-21-okregowe.json` = XXI OWE, zawody okręgowe). Każdy nowy plik trzeba dopisać w `data/questions/index.ts`.
Format jednego pytania:

```json
{
  "id": "owe21-o-01",
  "type": "single",
  "edition": "XXI OWE (2007/2008), zawody okręgowe",
  "question": "Treść pytania",
  "options": ["A", "B", "C", "D"],
  "correct": [0],
  "explanation": "Wyjaśnienie z definicją"
}
```

`type`: `"single"` (dokładnie jedna poprawna) lub `"multi"`; `correct` to indeksy 0–3.
Po zmianie plików uruchom `npm run validate-questions` (sprawdza też, czy każdy plik jest zaimportowany).
Typ pytań, którego nie ma jeszcze w bazie, jest wyłączony na stronie głównej.
Jeśli pytań danego typu jest mniej niż 30/50, test zawiera wszystkie dostępne.

## Pytania ze słownika (zakładka „Słownik”)

Osobna baza pytań ułożonych na podstawie słownika pojęć `docs/slownik-owe.pdf`, z własnymi statystykami
(przełącznik „Pytania z olimpiad / Pytania ze słownika” na stronie statystyk; kolumna `tests.bank`).
Przy starcie testu można wybrać rodzaj pytań (ręczne, automatyczne lub oba) i dział słownika (albo wszystkie).

- `tools/slownik/glossary/` – źródła słownika (hasła w `s*.py`); PDF:
  `python3 -I tools/slownik/glossary/build.py tools/slownik/glossary . docs/slownik-owe.pdf`
  (wymaga `playwright-core`, Chromium, `pdftotext`).
- `data/slownik/auto.json` – pytania automatyczne (3400):
  `python3 -I tools/slownik/gen_questions.py tools/slownik/glossary data/slownik`.
  Dystraktory pochodzą tylko z haseł tego samego tematu kursu „Nauka” omawianych w tej samej lub wcześniejszej lekcji
  (kolejność z `data/nauka/course.json`); każde pytanie ma pole `pojecia` (hasło pytania i hasła dystraktorów).
- `data/slownik/manual.json` – pytania pisane ręcznie, składane z `tools/slownik/manual/m*.py`:
  `python3 -I tools/slownik/build_manual.py tools/slownik/manual data/slownik`.
- **Hasło przewodnie XL** („Gospodarka wobec wyzwań demograficznych”) – dział 15 Słownika: ponad 500 pytań ręcznych
  (`tools/slownik/manual/m15`, `m33`, `m40`–`m48`: mierniki i obliczenia, teorie, Polska, rynek pracy, polityka rodzinna,
  migracje, świat i UE, emerytury i finanse publiczne) oraz pytania algorytmiczne `data/slownik/theme_auto.json`:
  `python3 -I tools/slownik/gen_theme.py data/nauka/course.json data/slownik` – szablony T1–T4 (opis → hasło, hasło → opis,
  „które hasło nie należy do tematu”, „które należą”) dla wszystkich haseł tematu kursu z dystraktorami z tego samego
  tematu; przy nowym haśle przewodnim zmienia się stałą `THEME` w skrypcie. Nowe pytania (pole `th`) i pytania algorytmiczne liczą się
  w testach Słownika, „Wszystkich pytaniach” i statystykach, ale nie przestawiają lekcji kursu (`build_course.py`).
- **Rysunki w Podręczniku**: w pliku działu linia `::wykres <rodzaj> [opcje] | Podpis` pod akapitem dodaje rysunek SVG
  (`app/components/book-figure.tsx`): przesunięcia krzywych (`sd`, `adas`, `islm`, `praca`, `pieniadz`, `waluta`, `fundusze`,
  np. `sd D=+1`), krzywe kosztów, Phillipsa (`dlugi=1`), Laffera, Lorenza, KMP (`punkty=1`), monopol, piramida wieku
  (`typ=progresywna|ustabilizowana|regresywna`), przejście demograficzne, macierze (`preset=bcg|ansoff|ge|swot`), siatka Blake'a–Mouton.
  Rysunek należy do bloku powyżej, więc numeracja bloków (podkreślenia, nagrania) się nie zmienia. Każda sekcja ma `ch` – datę
  ostatniej zmiany tekstu; podkreślenia starsze od niej czytnik ukrywa (z informacją i przyciskiem „Usuń je”).
- **Jakość definicji**: `python3 -I tools/slownik/quality.py` → `tools/slownik/JAKOSC.md` (za krótkie, ogólnikowe,
  powtarzające nazwę, bez przykładu). Przykłady i uzupełnienia definicji są w `tools/slownik/glossary/przyklady_s15.py`
  (hasło XL) i `przyklady_ogolne.py`; nanosi je `python3 -I tools/slownik/glossary/apply_examples.py` (bezpieczne do
  ponownego uruchomienia). Nowe hasła tematu mogą trafić do istniejącej lekcji przez `UNIT_OVERRIDES` w
  `tools/nauka/curriculum.py` – reszta kursu się nie przestawia.

## Pytania AI i zakładka „Wszystkie pytania”

Trzy źródła pytań testowych: **📜 Archiwum OWE** (prawdziwe pytania z olimpiad, `data/questions`), **🤖 Pytania AI
(sprawdzone)** (`data/ai/questions.json`) i **📘 Słownik** (`data/slownik`). Zakładka Testy → **Wszystkie pytania**
(`/testy/wszystkie`, `tests.bank = 'mix'`) losuje jeden test z wybranych źródeł; przy pytaniu widać jego źródło.

- **Pytania AI**: pytania z oznaczeniem „🤖 AI” wklejone przez użytkownika (eksport innej aplikacji, bez zaznaczonych
  odpowiedzi). `tools/pytania_ai/extract.py` wyciąga je do `surowe.json` (pomija „📜 OWE”, scala identyczne),
  `tools/pytania_ai/klucz.txt` to ręczny klucz: poprawna odpowiedź i wyjaśnienie każdego pytania, poprawki bełkotliwych
  sformułowań i odrzucenia (powtórzenia tego samego pytania innymi słowami), `tools/pytania_ai/build.py` buduje bank
  i raport `tools/pytania_ai/RAPORT.md` (550 unikalnych → 464 w banku).
- **Filtry** (wspólne dla Olimpiady, Wszystkich pytań i Słownika – `lib/question-meta.ts`): zakres edycji i etapy
  (szkolny/okręgowy/centralny – tylko Archiwum), dział (temat kursu), rodzaj haseł (pojęcia, wzory, osoby…; pytania
  obliczeniowe liczą się jako „wzory”), hasło przewodnie (Archiwum – hasło swojej edycji; AI i Słownik – demografia,
  hasło XL edycji). Liczby pytań dla filtrów: `POST /api/tests/pula`. Filtr zapisuje się przy teście (`tests.draw`),
  więc test „bez limitu” dolosowuje z tymi samymi filtrami.
- Dział i pojęcia każdego pytania: `data/nauka/{owe,slownik,ai}-stats.json` (`tools/nauka/build_course.py`).

## Zapisane filtry i losowanie zadań

- **Filtry zapamiętywane na koncie** (wspólne dla urządzeń): formularze testów, Zadania, Eseje, Tabela pojęć, Statystyki OWE,
  Pokrycie, Działy i pojęcia, Statystyki Nauki, Fiszki. Hook `usePrefSync` (`lib/prefs-client.ts`): od razu wartość
  z przeglądarki, potem z konta (`GET /api/ustawienia/filtry`); zmiana zapisuje się po 0,8 s albo przy wyjściu ze strony
  (`PUT /api/ustawienia/filtry/<klucz>`, tabela `user_prefs`, dozwolone klucze w `lib/prefs-core.ts`). Adres z jawnymi
  filtrami (np. link od kogoś) ma pierwszeństwo i nie nadpisuje zapisanych, dopóki nic nie zmienisz; podgląd admina nie zapisuje.
- **🎲 Losuj zadanie / esej** – na listach Zadań i Esejów (spośród pokazanych po filtrach) i na stronie Testy → Olimpiada
  (zakres edycji i etapy z filtrów testu); najpierw pozycje jeszcze nierozwiązane.

## Nauka (zakładka „Nauka” – kurs w stylu Duolingo)

Kurs zbudowany z haseł słownika (`docs/slownik-owe.pdf`) i wszystkich banków pytań:

- **7 tematów:** Mikroekonomia, Makroekonomia, Polityka gospodarcza, Podstawy finansów, Finanse przedsiębiorstw,
  Zarządzanie oraz temat przewodni „Gospodarka wobec wyzwań demograficznych”.
- **Hierarchia:** 88 działów → 910 lekcji: 446 lekcji haseł (do 6 haseł; 103 z nich to kolejne części lekcji z samymi pojęciami z pytań) i 464 lekcje
  „Zrozumienie” 🧠 → 3640 pod-lekcji.
- **Rodzaje treści** (filtr na stronie tematu): pojęcia, wzory, osoby, instytucje, daty, przepisy, zrozumienie.
- **Pod-lekcje:** 1. Poznaj, 2. Ćwicz, 3. Utrwal, 4. Sprawdzian (10 losowych pytań olimpijskich i słownikowych lekcji).
- **Wznawianie:** stan pod-lekcji w trakcie (kolejka, pozycja, odpowiedzi) zapisuje przeglądarka (`owe:lesson:<lekcja>:<sub>`, 7 dni),
  a serwer znacznik postępu (`learn_sessions.progress`, `PATCH /api/nauka/sessions/[id]`). Ścieżka pokazuje „⏸ w trakcie N/M”, wejście –
  „Kontynuuj / Zacznij od nowa”. Odpowiedzi liczą się do statystyk dopiero po ukończeniu pod-lekcji.
- **Sprawdzian pyta tylko o rzeczy omówione:** każde z 6342 pytań (1656 OWE, 1286 ręcznych, 3400 automatycznych)
  jest w dokładnie jednej lekcji – najpóźniejszej lekcji macierzystej pojęć, których dotyczy. Pojęcia z treści
  i ze wszystkich odpowiedzi, których uczeń nie poznał wcześniej w temacie, lekcja omawia w Poznaj, Ćwicz i Utrwal
  (karta „Nowe hasło · z pytań Sprawdzianu”); poznane wcześniej powtarza w Ćwicz i Utrwal (do 5 na podejście, najwyżej 30% ćwiczeń pod-lekcji, najsłabsze hasła użytkownika najpierw).
  Gdy hasła lekcji i nowe pojęcia przekraczają 12, lekcja ma kolejne części (cz. 2, 3…). Pojęcia w pytaniach OWE
  wykrywa `tools/nauka/pojecia_pytan.py` (ręczne korekty po przeglądzie wszystkich pytań XXI–XXXIX OWE:
  `tools/nauka/pojecia_pytan_poprawki.py`); raport przydziału: `tools/nauka/RAPORT-PYTANIA.md`.
- **Ćwiczenia:** nowe hasło, wybór hasła lub opisu, łączenie par, uzupełnianie luk, prawda/fałsz,
  wpisywanie (tolerancja polskich znaków i literówek), układanie chronologii, wzory, fiszki, pytania testowe.
  Błędnie rozwiązane ćwiczenie wraca na koniec pod-lekcji.
- **Bez blokad:** każdy temat, lekcja i pod-lekcja jest dostępna od razu.
- **Grywalizacja:**
  - XP: 10 za poprawną odpowiedź, +5 co 5 z rzędu, +10 za ukończenie, +10 bez błędu;
  - seria dni i dzienny cel XP (zapamiętany w przeglądarce);
  - korony 0–5 dla lekcji: koronę daje zaliczenie (≥ 80%) każdej z 4 pod-lekcji, wyższy poziom oznacza więcej wpisywania.
- **Powtórka słabych haseł:** hasła ze skutecznością poniżej 80%.
- **Statystyki nauki** (`/nauka/statystyki`): osobne od testów. Pokazują skuteczność, czas pod-lekcji i lekcji,
  podział na tematy, działy, lekcje, typy ćwiczeń i rodzaje treści, wykres dzienny i najsłabsze hasła.
  Filtry: temat, dział, lekcja, pod-lekcja, rodzaj treści, typ ćwiczenia, okres.

### Lekcje „Zrozumienie” 🧠

Uczą mechanizmów, obliczeń i zastosowań, a nie tylko definicji. Są wplecione w ścieżkę każdego działu:

- **Liczba lekcji:** 5 w każdym dziale pojęciowym (6–7 w działach tematu Demografia) i dziale „Wzory”, 5 w działach osób, instytucji, dat i przepisów
  z co najmniej 15 hasłami, 2 w mniejszych działach. Razem 464 lekcje, 9331 ćwiczeń ocenianych i 1878 kart wyjaśnień. Zakres sprawdzono z podręcznikami literatury podstawowej OWE: N.G. Mankiw, M.P. Taylor „Mikroekonomia” i „Makroekonomia” (PWE), B. Winiarski (red.) „Polityka gospodarcza” (PWN 2018), S. Owsiak „Finanse” (PWE 2015), W. Gabrusewicz „Metody analizy finansowej przedsiębiorstw” (PWE 2019) oraz R.W. Griffin „Podstawy zarządzania organizacjami” (PWN). Spisy treści potraktowano jako listę tematów: do każdego rozdziału zebrano pojęcia, modele, osoby, wzory, daty, instytucje i przepisy, sprawdzono je w bazie pytań OWE i zweryfikowano nowe fakty w dwóch źródłach – zob. `tools/nauka/MAPA-POJEC.md`. Każde hasło pojęciowe tematów Mikroekonomia, Makroekonomia, Polityka gospodarcza, Finanse, Firma i Zarządzanie ma lekcję „Zrozumienie”. Temat Demografia sprawdzono tak samo z literaturą hasła przewodniego XL OWE: C. Goodhart, M. Pradhan „Wielki zwrot demograficzny” (WEI 2024), J.A. Majcherek „Demograficzne wyzwania dla systemów społeczno-ekonomicznych” (Impuls 2024; według opisu wydawcy, bo spisu treści nie ma w sieci), M. Schwabe „Migracje zarobkowe. Wprowadzenie” (Wolters Kluwer 2025), N. Barr, P. Diamond „Reformy systemu emerytalnego” (PTE 2014) oraz M. Okólski, A. Fihel „Demografia. Współczesne zjawiska i teorie” (Scholar 2012); 25 nowych haseł z tej mapy ma lekcje „Zrozumienie”.
- **4 pod-lekcje:** Wyjaśnienie (karty krok po kroku z pytaniami sprawdzającymi), Mechanizmy (co się stanie, gdy…,
  łańcuchy przyczyn i skutków, sortowanie do kategorii, przesunięcia krzywych), Obliczenia (wynik wpisywany
  z tolerancją i rozwiązaniem krok po kroku), Zastosowanie (studia przypadków). Każda pod-lekcja ćwiczeń ma
  co najmniej 6 zadań ocenianych.
- **Źródła:** pod każdą lekcją lista źródeł z linkami i datą dostępu – podręczniki OpenStax (CC BY),
  akty prawne (ELI/ISAP, EUR-Lex), NBP, GUS, ZUS, MF, Eurostat, KE i inne.
- **Aktualne dane o Polsce** mają zapis „stan na …”. Każdą liczbę i datę z bieżących danych potwierdzono
  w dwóch niezależnych źródłach; rejestr jest w `tools/nauka/zrozum/WERYFIKACJA.md`.
  Dane bez dwóch źródeł są oznaczone jako „dane umowne”.

Treści są w `tools/nauka/zrozum/<id-działu>.py` (jeden plik na dział). `tools/nauka/build_zrozum.py`
(uruchamiany przez `build_course.py`) waliduje je i scala do `data/nauka/zrozum.json`:
przelicza każde zadanie liczbowe z wyrażenia `calc`, sprawdza opcje, łańcuchy, kategorie, odwołania do haseł,
źródła i powtórzenia względem banku pytań. Linki sprawdza:

```bash
python3 -I tools/nauka/check_links.py data/nauka/zrozum.json
```

Postęp i statystyki są wspólne dla wszystkich i zapisywane w tabelach `learn_sessions` i `learn_answers`.

Program kursu (`data/nauka/course.json`) generuje skrypt:

```bash
python3 -I tools/nauka/build_course.py tools/slownik/glossary . data/nauka
```

Przypisanie haseł do tematów i działów jest w `tools/nauka/curriculum.py`. Build kończy się błędem, jeśli któreś pojęcie
pytania lekcji nie jest omówione ani powtórzone w tej lekcji. Kolejność przy zmianie haseł: `build_course.py`,
`gen_questions.py` (dystraktory według kolejności lekcji), ponownie `build_course.py`. Przegląd pojęć w pytaniach:

```bash
python3 -I tools/nauka/pojecia_pytan.py dump 'owe-39-*'   # pytania z wykrytymi hasłami
python3 -I tools/nauka/pojecia_pytan.py stats
```

## Nawigacja i szybkość

- **5 działów** (`lib/nav.ts`): 📝 Testy (Olimpiada, Wszystkie pytania, Zadania, Eseje, Słownik), 🎓 Nauka (Kurs, Podręcznik, Fiszki, Moje talie, Powtórka), 📖 Pojęcia (Tabela,
  Statystyki OWE, Pokrycie olimpiad, Mapa myśli), 🗒️ Notatki (Notatki, Brudnopisy), 📊 Statystyki (Wyniki testów, Działy i pojęcia, Nauka). Na komputerze działy w nagłówku, na telefonie dolny pasek
  z ikonami; podzakładki działu nad treścią strony; konto (panel admina, ustawienia, wylogowanie) pod 👤. Przycisk „←” w nagłówku
  wraca do poprzedniej strony aplikacji i do miejsca, w którym się na niej było (pozycja przewinięcia, karta w feedzie fiszek –
  `app/components/back.tsx`, sessionStorage). Dolny pasek jest na telefonie na
  każdej stronie (także w teście i lekcji – panel odpowiedzi i „Sprawdź” stoją nad nim); podczas testu i lekcji ukryte są tylko podzakładki.
- **Dane haseł i statystyk OWE** nie są w HTML stron: `GET /api/dane/hasla` i `/api/dane/owe-stats` (ETag, pamięć przeglądarki),
  w karcie trzymane w pamięci (`lib/data-client.ts`) – przejścia między Pojęciami, Statystykami OWE, Pokryciem i Fiszkami nie pobierają ich
  ponownie; odpowiedzi są skompresowane (br/gzip, liczone raz na proces), a dane zakładek bieżącego działu pobierają się w tle,
  gdy przeglądarka jest bezczynna. To samo dla nazw lekcji w statystykach nauki (`/api/dane/nauka-meta`); strona główna Nauki pobiera
  sam postęp tematów (`/api/nauka/progress?lekcje=0`). Tabela pojęć renderuje hasła porcjami po 100; każdy dział ma szkielet
  ładowania (`loading.tsx`).

## Wygląd i czcionki

- **Czcionki** (lokalnie w `public/fonts`, licencja SIL OFL, tylko podzbiory łaciński + polski, ~130 kB razem, pamięć podręczna rok):
  **Lexend** – cały tekst (zaprojektowana pod płynność czytania), **Atkinson Hyperlegible Next** – wzory, liczby, wyniki, kody
  (wyraźnie różne I/l/1, O/0). Czcionka tekstu ładowana z wyprzedzeniem (`preload` w `app/layout.tsx`); do czasu jej wczytania
  systemowa czcionka zastępcza ma dopasowane metryki (`size-adjust`), więc tekst nie przeskakuje.
- **Typografia**: 17 px bazowo (16 px na telefonie, pola ≥ 16 px), interlinia 1,6; definicje i wyjaśnienia maks. ~68 znaków w wierszu.
- **Kolory** – tokeny na górze `app/globals.css` (jasny i ciemny motyw); kontrast tekstu ≥ 14:1, tekstu wyciszonego ≥ 6,3:1,
  przycisków ≥ 5:1. Poprawne/błędne odpowiedzi oznaczone kolorem i znakiem ✓/✗.
- **Płynność**: przejścia 150–250 ms, delikatne wejście treści; wszystko wyłączone przy systemowym „ogranicz ruch”.

## Pojęcia – tabela i statystyki pytań OWE

- **Tabela pojęć** (`/pojecia`): wszystkie hasła kursu Nauka (bez lekcji „Zrozumienie”) w kolejności lekcji – nazwa z lewej,
  definicja (i wzór) z prawej; filtry działu i rodzaju (pojęcia, wzory, osoby, instytucje, daty, przepisy), wyszukiwanie,
  przycisk „↑ Do góry” i przy każdym haśle liczba pytań OWE, w których o nie pytano; gwiazdka przy haśle (wspólna z Fiszkami) i filtr ★;
  „🧠 mapa” odsunięte od pozostałych przycisków.
- **Statystyki pytań OWE** (`/pojecia/statystyki`): dla 1656 pytań XXI–XXXIX OWE – działy (procent pytań), zagadnienia i pojęcia
  (liczba pytań, osobno jednokrotny i wielokrotny wybór); filtry typu pytań, etapu (szkolny, okręgowy, centralny), zakresu
  edycji, działu i rodzaju haseł, sortowanie od największej lub najmniejszej liczby; kliknięcie pojęcia pokazuje jego pytania.
  Dane: `data/nauka/owe-stats.json` (generuje `tools/nauka/build_course.py`), opis metody i ręczna weryfikacja wszystkich 1656 pytań (958 poprawionych, 5 nowych haseł) –
  `tools/nauka/RAPORT-STATYSTYK.md` (`python3 -I tools/nauka/raport_statystyk.py`).

- **Pokrycie olimpiad** (`/pojecia/pokrycie`): dla każdej edycji XXI–XXXIX – jaka część pojęć (albo pytań) to powtórki z wcześniejszych
  edycji (wszystkich od XXI albo ostatnich 3/5), a jaka to nowe. Osobno wybiera się etap badanych pytań i etapy, z których liczą się
  powtórki (np. pytania szkolne ← szkolne i okręgowe wcześniejszych edycji), opcjonalnie także wcześniejsze etapy tej samej edycji;
  tabela 3×4 pokazuje naraz wszystkie pary etapów (kliknięcie komórki ustawia filtry); wykres słupkowy edycja po edycji (kliknięcie wybiera edycję),
  koło dla wybranego zakresu, odsetek pytań w całości o powtarzane pojęcia, listy najczęściej powtarzanych i nowych pojęć.
  Filtry jak w statystykach pytań OWE (wspólny komponent `app/pojecia/filters.tsx`, logika `coverage()` w `lib/owe-stats.ts`).

## Moje statystyki wg działów (Statystyki → Działy i pojęcia, `/stats/dzialy`)

Strona „Działy, zagadnienia i pojęcia – jak mi idzie” – osobno dla pytań z olimpiad i ze słownika
(przełącznik bazy): skuteczność w działach, zagadnieniach i pojęciach, skuteczność z ostatnich 30 dni, trend (ostatnie 10 odpowiedzi
względem wcześniejszych) i rozwinięcie pojęcia z ostatnimi odpowiedziami. Filtry: typ, etap, zakres edycji (OWE), pochodzenie i dział
słownika (słownik), dział, rodzaj haseł, okres, kolejność. API `GET /api/stats/dzialy`, agregacja `lib/my-stats-core.ts`.
Pytania słownikowe mają dział, zagadnienie i pojęcia w `data/nauka/slownik-stats.json` (generuje `build_course.py`).

## Fiszki (`/fiszki`)

Wszystkie hasła kursu (bez lekcji „Zrozumienie”) w dwóch trybach: **przewijanie** (pionowy feed jak w aplikacjach z krótkimi filmami,
dotknięcie odwraca kartę) i **klasyczne** (odwracanie, „Znam / Nie znam”, strzałki i spacja). Kolor obwódki – jak dobrze znasz hasło:
zielony ≥ 80%, żółty 50–79%, czerwony < 50%, szary – mniej niż 2 odpowiedzi. Liczone razem: ćwiczenia w Nauce, odpowiedzi testowe
(OWE i słownik – pytanie liczy się dla każdego swojego pojęcia) i oceny fiszek (tabela `flash_ratings`, nie wpływa na statystyki nauki).
Gwiazdka ☆/★ w prawym górnym rogu karty (nie odwraca jej; klawisz G w trybie klasycznym) – ten sam zbiór w Tabeli pojęć, na mapie
myśli, w taliach i na własnych fiszkach. Mapa myśli – małe „🧠” w pasku pod kartą z potwierdzeniem w dymku (nie da się wejść przypadkiem).
Filtry: źródło (wszystkie / z kursu / ✍️ moje), dział, rodzaj, kolor, gwiazdka (z / bez), tylko hasła z OWE, kolejność (lekcje / losowo /
najsłabsze najpierw) – także w nauce talii. API `/api/fiszki/opanowanie`, `/api/fiszki/ocena`.

## Moje talie (Nauka → Moje talie, `/fiszki/talie`)

- Własne talie fiszek: nazwa, wyszukiwarka haseł (podpowiedzi po tytule i definicji, filtry: temat, rodzaj, tylko z pytań OWE),
  dodanie kliknięciem albo Enterem – karta „wlatuje” do talii. Kolejność ustala się przeciąganiem za uchwyt ⠿ (mysz, palec, rysik;
  przy krawędzi ekranu strona sama się przewija) albo strzałkami ↑/↓ na uchwycie; usunięcie z „Cofnij”.
- „▶ Ucz się tej talii” – `/fiszki?talia=<id>`: tylko karty talii w jej kolejności (albo losowo). „＋ Do talii” na każdej fiszce i na mapie myśli.
- Tabele `decks`, `deck_cards` (limity: 50 talii, 500 kart w talii); API `/api/talie`, `/api/talie/[id]`, `/api/talie/[id]/karty`
  (POST dodaj, DELETE usuń, PUT kolejność). Podgląd admina tylko do odczytu.
- **✍️ Moje fiszki** – własne karty konta (hasło, definicja, wzór, dział = jeden z 7 tematów, kategoria = rodzaj hasła). Widzi je tylko
  właściciel; w Fiszkach mają znacznik „✍️ Moja fiszka” i przerywaną obwódkę, można je dodawać do talii, notatek i gwiazdek (id `u:<uuid>`).
  Oceny „znam / nie znam” trzymane w samej karcie – nie liczą się do Nauki ani statystyk. Tabela `own_cards` (limit 2000 na konto),
  API `/api/fiszki/moje`, `/api/fiszki/moje/[id]`.

## Mapa myśli (Pojęcia → Mapa myśli, `/pojecia/mapa?q=<id>`)

- Wpisz pojęcie (podpowiedzi) albo wybierz je z listy z filtrami (temat, rodzaj, tylko OWE, tylko fiszki z gwiazdką) – w środku mapy
  pojęcie, wokół 6–16 powiązanych (grubość linii = siła powiązania, kolor = temat), opcjonalnie 2 poziomy. Kliknięcie (albo Enter)
  przenosi hasło do środka z płynną animacją; „Wstecz” wraca; pojęcie, z którego przyszliśmy, ma pogrubioną obwódkę. Pod mapą: definicja, linki do Tabeli pojęć i Podręcznika, „＋ Do talii”,
  lista powiązanych z powodami.
- Dane: `python3 -I tools/nauka/build_mapa.py` → `data/nauka/mapa.json` (do 24 powiązań na hasło). Źródła i wagi: wspólne pytanie OWE (3),
  ten sam akapit Podręcznika bez części „Na marginesie” (2), opis wymienia tytuł innego hasła (3) albo nazwisko osoby (2, przy
  tych samych nazwiskach także inicjał), ta sama lekcja działu pojęciowego (1; dla haseł z < 3 powiązaniami także działy osób, dat itp. – 0,5).
  Pytania słownikowe nie są źródłem (ich zestawienia pojęć są losowe). API `/api/dane/mapa` (ETag, ładowane tylko na stronie mapy).

## Notatki i brudnopisy (`/notatki`, `/notatki/brudnopisy`)

- **Edytor – jedna kartka** (`app/components/notes/editor.tsx`): tekst z klawiatury i pismo rysikiem (nacisk), palcem lub myszą
  w tym samym miejscu. Tryby: ⌨️ Tekst (pisze od góry kartki), ✏️ Pióro (rysuje po tekście), 🧽 Gumka (usuwa całe kreski), ✋ Przewijaj;
  zwykły klawisz w trybie pióra przełącza na tekst; ostatni tryb zapamiętany (domyślnie: mysz – tekst, ekran dotykowy – pióro).
  Czcionka i linie kartki są w jednostkach szerokości kartki (`cqw`), więc tekst łamie się tak samo na telefonie i komputerze, a dopiski
  rysikiem zostają przy swoim tekście. Cofnij/ponów (Ctrl+Z / Ctrl+Y), 4 kolory, 3 grubości, „więcej miejsca”.
  Rysunek zapisany w jednostkach logicznych (szerokość 1000), kreski upraszczane (Douglas–Peucker, `lib/notes-core.ts`). Zapis
  automatyczny 0,8 s po zmianie, także przy zamknięciu karty.
- **Fiszka na kartce** – „🗂️ Fiszka” w pasku: wyszukiwarka haseł i własnych fiszek (filtry jak w talii); karta ląduje na środku widocznej
  części kartki, dotknięcie odwraca ją na definicję, przesuwa się ją tylko uchwytem ⠿ (albo strzałkami), więc pisanie pod nią działa
  normalnie; ✕ usuwa. Pozycje w `notes.cards` (jednostki rysunku, maks. 30 kart).
- **Brudnopis pod „Sprawdź”** w testach (jeden na pytanie: `owe:<id>`, `slownik:<id>`) i lekcjach (jeden na pod-lekcję); otwarty
  zostaje otwarty przy kolejnych pytaniach; trafia do Brudnopisów z treścią pytania. Skróty klawiszowe testów, lekcji i fiszek nie
  reagują podczas pisania (`isTyping` w `lib/client.ts`).
- **Szybkie notatki** – przycisk 🗒️ w nagłówku na każdej stronie: panel z boku (komputer) lub od dołu nad paskiem działów (telefon),
  zostaje otwarty przy przechodzeniu między stronami, minimalizacja (▁ / Esc) zachowuje treść.
- Gwiazdki i filtr (z / bez), wyszukiwanie. Admin widzi notatki użytkownika w podglądzie (`?user=`), bez możliwości zmian.
- Limity konta: 1000 notatek i brudnopisów, łącznie 25 MB treści z rysunkami, 5000 podkreśleń.
- Tabele `notes`, `stars`, `highlights`; API `/api/notatki`, `/api/notatki/[id]`, `/api/notatki/brudnopis`, `/api/gwiazdki`, `/api/podkreslenia`.

## Podręcznik (Nauka → Podręcznik, `/nauka/podrecznik`)

Ręcznie pisane artykuły prostym językiem: dla każdego działu przegląd „W skrócie” i rozdziały – jeden na każdą zwykłą lekcję kursu
(komplet: 88 działów, 446 rozdziałów, ok. 112 tys. słów; spójność z kursem pilnuje `tests/podrecznik.test.ts`).
Rozdział jest też osobnym artykułem lekcji (`/nauka/podrecznik/<dział>/<lekcja>`) i alternatywą dla „Poznaj”: przeczytany do końca
zalicza pod-lekcję 1 (sesja `learn_sessions.mode = 'artykul'`, bez odpowiedzi – nie zmienia skuteczności; najwyżej raz na 10 min).
Link „Czytaj artykuł zamiast Poznaj” w panelu lekcji na ścieżce i baner na początku „Poznaj”.

- **Czytnik** (`app/nauka/podrecznik/reader.tsx`): pasek postępu, spis treści, A−/A+, ramki „Przykład / Uwaga, pułapka / Zapamiętaj”,
  wzory w czcionce wzorów, hasła z dymkiem definicji (odnośnik do Tabeli pojęć `?q=`), znacznik „przeczytane”, gwiazdki działów i rozdziałów.
- **Podkreślanie**: zaznacz tekst → 3 kolory albo „Do notatki” (notatka z cytatem otwiera się w szybkim panelu); kliknięcie
  podkreślenia – usunięcie. Zapis: blok i zakres znaków (`highlights`), wspólny dla artykułu działu i lekcji.
- **Treść**: `tools/nauka/podrecznik/<temat>/<dział>.md` → `python3 -I tools/nauka/build_podrecznik.py [--strict]` →
  `data/nauka/podrecznik.json`. Format i kontrole (każda lekcja ma rozdział, każde hasło lekcji i hasło z pytań ma odnośnik `[[…]]`)
  opisane w nagłówku skryptu. Fakty spoza słownika – `tools/nauka/podrecznik/WERYFIKACJA.md`.

## Konta i panel admina

- **Konto:** e-mail i hasło (min. 8 znaków). Bez zalogowania widać tylko ekrany konta (`/konto/...`).
- **Pierwsze konto** założone w aplikacji jest kontem właściciela: od razu aktywne, z rolą administratora, nie da się go usunąć.
  Przejmuje wszystkie wyniki testów i postęp w Nauce sprzed wprowadzenia kont.
- **Kod aktywacji (5 cyfr) + zatwierdzenie:** każde kolejne konto wpisuje kod (przy rejestracji albo na ekranie aktywacji),
  a potem czeka, aż administrator zatwierdzi je w panelu. Odrzucenie usuwa konto. Kod generuje i zmienia administrator
  w panelu; zmiana kodu nie wyłącza kont już aktywnych.
  Po 5 błędnych kodach konto jest blokowane na 15 minut (dodatkowo ogólny limit 50 błędnych prób na 15 minut).
- **Panel admina** (`/admin`): sekcje „Czekają na zatwierdzenie” (nowe konta i prośby o rolę admina – Zatwierdź/Odrzuć),
  „Administratorzy” (Odbierz admina, Usuń), „Użytkownicy” (Usuń) i „Bez kodu aktywacji”; przy kontach liczba testów, wynik,
  sesje nauki i XP oraz podgląd ich statystyk testów, postępu i statystyk nauki (`?user=<id>`); generowanie kodu aktywacji
  i jednorazowych kodów administratora. Konta właściciela nie da się usunąć ani odebrać mu roli.
- **Dostęp do sekcji** (karta w panelu i przycisk „Dostęp” przy każdym koncie): blokada całego działu (Testy, Nauka, Pojęcia,
  Notatki, Statystyki) albo pojedynczej podzakładki (np. Nauka → Podręcznik, Fiszki → Moje talie).
  - **Zakresy:** „Wszyscy” (także admini), „Oprócz adminów” i blokady konkretnego konta – sumują się.
  - **Wygląd zablokowanych pozycji w menu:** „Ukryj” albo „Pokaż z kłódką 🔒”. Ustawienie globalne można nadpisać dla konta.
  - **Egzekwowanie:**
    - po stronie serwera: strony pokazują ekran blokady, API zwraca 403;
    - szybkie notatki, brudnopis pod pytaniem i „＋ Do talii” znikają razem ze swoją sekcją;
    - panelu admina i ustawień konta nie da się zablokować.
  - **Gdzie w kodzie:** logika w `lib/access-core.ts` (testy: `tests/access.test.ts`).
- **Kolejni administratorzy:** zalogowany admin generuje jednorazowy kod (ważny 24 h, widoczny tylko w panelu); użytkownik
  wpisuje go raz w Ustawieniach konta, a rolę dostaje po zatwierdzeniu prośby w panelu (odrzucenie – zostaje użytkownikiem).
- **Zmiana hasła:** w Ustawieniach (obecne + nowe hasło) albo „Nie pamiętam hasła” – link ważny 60 minut wysyłany mailem
  przez Gmail. Po zmianie hasła pozostałe sesje są wylogowane.

Konfiguracja maili (Vercel → Settings → Environment Variables, potem Redeploy):
1. Na koncie Google włącz weryfikację dwuetapową, a potem utwórz **hasło aplikacji**
   (Konto Google → Bezpieczeństwo → Hasła aplikacji).
2. Ustaw `GMAIL_USER` (adres Gmail) i `GMAIL_APP_PASSWORD` (hasło aplikacji, bez spacji).
3. Opcjonalnie `APP_URL` – adres strony w linkach z maili (domyślnie adres produkcyjny Vercel).

Po pierwszym wdrożeniu od razu załóż swoje konto – pierwsze konto zostaje właścicielem.

## Bezpieczeństwo i ochrona treści

- **Logowanie:**
  - po 8 nieudanych próbach na konto w ciągu 15 minut logowanie na to konto jest wstrzymane (także z poprawnym hasłem); reset hasła zdejmuje blokadę;
  - limit 60 nieudanych prób na adres IP w 15 minut – luźniejszy, bo cała klasa w szkole często ma jeden adres;
  - nieznany e-mail jest obsługiwany tak samo i trwa tyle samo – po odpowiedzi nie da się poznać, czy konto istnieje.
  - kompromis: ktoś, kto zna cudzy e-mail, może celowo wstrzymać logowanie na to konto na 15 minut – reset hasła mailem działa nadal.
- **Limity na adres IP:** rejestracja 30 na godzinę, reset hasła 20 na godzinę.
- **Hasła:** scrypt (N = 2^16, r = 8, sól 16 B). Starsze hasze (N = 2^14) są przeliczane przy najbliższym logowaniu.
  Sesja: losowy token w ciasteczku `HttpOnly`, `SameSite=Lax`, `Secure` na produkcji; w bazie tylko skrót. Nowa sesja przy każdym logowaniu.
- **Limity pobrań treści** (na konto; admini zwolnieni):

  | Co | Limit w 10 minut | Limit na dobę |
  |---|---:|---:|
  | start testu | 40 | 300 |
  | zadania i eseje | 30 | 200 |
  | pytania z kluczem przy haśle | 60 | 400 |
  | pliki danych `/api/dane/*` | 120 | 1000 |

  Do limitu plików danych liczą się tylko pełne pobrania – odpowiedzi 304 (przeglądarka ma aktualną wersję) nie.
  Przekroczenie limitu daje błąd 429 i wpis „masowe pobieranie” w dzienniku.
- **Dziennik bezpieczeństwa** (panel admina → Bezpieczeństwo): nieudane logowania, blokady, przekroczenia limitów; ostatnie 90 dni.
- **Nagłówki:**
  - CSP z jednorazowym nonce – skrypty tylko z aplikacji, bez ramek i wtyczek;
  - HSTS, `X-Frame-Options: DENY`, `nosniff`, COOP i CORP `same-origin`;
  - bez indeksowania: `X-Robots-Tag`, `robots.txt`, meta `noindex`.
- **Inne zabezpieczenia:**
  - **CSRF:** zapytania zmieniające dane z obcego `Origin` (albo `Sec-Fetch-Site: cross-site`) są odrzucane (403) – obok `SameSite` ciasteczka;
  - **rozmiar danych:** ciało zapytania JSON do 4 MB (413);
  - **zadanie cykliczne:** sekret porównywany w stałym czasie.
- **Gdzie w kodzie:** `proxy.ts` i `lib/security-core.ts` (CSRF, CSP), `lib/security.ts` (limity, dziennik), `next.config.ts` (nagłówki).
- **Utrudnienie kopiowania** (`app/components/copy-guard.tsx`):
  - poza polami edycji (notatki, brudnopisy, formularze) nie da się zaznaczać ani kopiować tekstu; menu kontekstowe, przeciąganie i skróty Ctrl/Cmd+C/X/A/S/P/U są wyłączone;
  - w Podręczniku zaznaczanie działa – podkreślenia i „Do notatki” mają własne menu – ale zaznaczenia nie da się skopiować;
  - drukowanie pokazuje tylko informację, że jest wyłączone.

  **Uczciwie:** blokady w przeglądarce utrudniają kopiowanie, ale go nie uniemożliwiają (narzędzia deweloperskie, zrzut ekranu, wyłączenie skryptów).
  Realną ochroną są serwer i limity: pytania z kluczem tylko w ramach testu lub zadania, rozwiązania dopiero po odpowiedzi,
  wszystko tylko dla zalogowanych i z limitem pobrań.

## Czytanie na głos 🔊

- **Gdzie jest przycisk 🔊:**
  - Podręcznik: cały artykuł, od rozdziału albo „Czytaj stąd” od akapitu – czytany akapit jest podświetlany;
  - pytanie testu z odpowiedziami (po sprawdzeniu – z wyjaśnieniem);
  - ćwiczenie w lekcji;
  - Tabela pojęć: jedno hasło albo „Czytaj wszystkie” wg filtrów;
  - fiszki: „Czytaj po kolei” – hasło, pauza, definicja;
  - mapa myśli i Moje talie.
- **Pasek odtwarzacza** (nad dolnym menu na telefonie): poprzedni, pauza, następny, stop, tempo 0,8–1,5×, wybór głosu.
- **Silnik:** wbudowany w przeglądarkę syntezator mowy (Web Speech API) – bez kluczy i kosztów.
  - **iPhone:** sesja audio „playback” – mowa gra mimo przełącznika wyciszenia (Safari 17+; starsze – krótka cisza z `<audio>` przy pierwszym kliknięciu).
  - **Strażnik ciszy:** gdy wypowiedzi kończą się bez startu, czytanie przechodzi na domyślny głos, a pasek podpowiada, co sprawdzić.
  - **Wyłączony ekran:** syntezator telefonu w tle milknie. Z wyłączonym ekranem czytają tylko nagrania (głos z chmury, niżej).
  - Głos wybierany automatycznie (polski, najlepszy dostępny). Głos i tempo zapamiętuje przeglądarka.
  - Bez polskiego głosu pojawia się instrukcja: Android – Ustawienia → Zamiana tekstu na mowę (Google), Windows – Ustawienia → Czas i język → Mowa → Dodaj głosy (polski), iPhone – Ustawienia → Dostępność → Mowa → Głosy.
- **Zapis matematyczny** zamieniany na mowę („%” → „procent”, „Δ” → „delta”, „≈” → „w przybliżeniu”…): `lib/speech-text.ts` (testy: `tests/speech.test.ts`). Kolejka i pasek: `lib/speech.ts`, `app/components/speech/`.

### Głosy z chmury (Azure) – Podręcznik, hasła i pytania

Akapity Podręcznika, hasła (fiszki, tabela, mapa, talie) i pytania (OWE i ze słownika – pytanie z odpowiedziami oraz osobno
wyjaśnienie) są nagrywane głosem neuronowym Azure AI Speech i zapisywane jako MP3 (32 kb/s) w **Cloudflare R2**
(darmowo 10 GB i 1 mln zapisów miesięcznie), a bez niego w Vercel Blob (Hobby: 1 GB i 2000 zapisów miesięcznie – wystarczy
najwyżej na część Podręcznika; aplikacja pilnuje limitu). Całość: ok. 22 tys. nagrań, 6,5 mln znaków, ok. 1,8 GB.
Teksty budują wspólne funkcje (`lib/speech-catalog.ts`, `lib/podrecznik-speech.ts`), więc nagranie pasuje do każdego
miejsca, w którym tekst jest czytany; teksty spoza katalogu (ćwiczenia w lekcji) czyta głos przeglądarki.

**Nagranie wszystkiego za kredyty Azure (warstwa S0, ok. 16 USD za 1 mln znaków → ok. 105 USD):**
1. Azure → zasób Speech → **Warstwa cenowa → S0**.
2. Panel admina → „Głosy z chmury”:
   - limit znaków na miesiąc np. 7 000 000;
   - zaznacz **Tryb szybki (S0)** (8 nagrań naraz, bez rozkładania na dni);
   - kliknij **⏩ Nagraj wszystko** i zostaw kartę otwartą (ok. 30–60 min; „Zatrzymaj” przerywa po bieżącej porcji).
3. Po zakończeniu:
   - w Azure z powrotem **Free F0**;
   - w panelu odznacz tryb szybki i ustaw limit 450 000 – nowe i zmienione teksty dalej nagrywają się powoli za darmo.

**Jak to działa**
- **Czytnik:** nagrany akapit gra z pliku (☁️ w pasku odtwarzacza).
  - **Brakujące akapity:** gdy ktoś słucha artykułu, są **nagrywane na bieżąco** (`POST /api/podrecznik/nagrania`, 2 akapity z wyprzedzeniem). Czytanie gra wtedy w całości z plików – także po wyłączeniu ekranu telefonu.
  - **Ekran blokady i słuchawki:** tytuł oraz przyciski ⏯ ⏭ ⏮ (Media Session).
  - **Limit konta:** dzienny limit nagrań na bieżąco na konto, `TTS_USER_DAILY`, domyślnie 60 tys. znaków.
  - **Głos przeglądarki:** czyta, gdy głos z chmury nie jest skonfigurowany albo limit jest wyczerpany. Pytania, definicje i fiszki zawsze czyta głos przeglądarki.
- **Budżet:**
  - miesięcznie `TTS_MONTHLY_CHARS` znaków (domyślnie 450 tys., zapas do darmowego progu 0,5 mln), wspólnie dla porcji w tle i nagrań na bieżąco; porcje w tle rozkładają resztę równo na pozostałe dni miesiąca;
  - zużycie liczone w tabeli `tts_usage` (dzień × źródło);
  - cały Podręcznik to ok. 815 tys. znaków (z nagłówkami), czyli ok. 2 miesiące;
  - w kolejnym miesiącu nagrywanie toczy się dalej, a potem nagrywane są tylko zmienione akapity (klucz nagrania to skrót tekstu); nieaktualne pliki są usuwane.
- **Tempo:** darmowy plan Azure przyjmuje 20 zapytań na minutę.
  - Vercel Cron (`vercel.json`, raz dziennie ok. 5:17) nagrywa ok. 80 akapitów na uruchomienie (do 5 min), więc całość zajmie ok. 3 miesiące.
  - Opcjonalny workflow `.github/workflows/tts.yml` uruchamia porcję co godzinę – wtedy ograniczeniem jest tylko budżet znaków (ok. 2 miesiące).
- **Panel admina → „Głosy z chmury”:** postęp (akapity, gotowe artykuły, rozmiar plików), zużycie w miesiącu (w tym nagrania na bieżąco), ostatni błąd, wybór głosu (Zofia, Marek, Agnieszka) i przycisk „Nagraj porcję teraz” (ok. 50 s).
- **Gdzie w kodzie:** `lib/tts.ts`, `lib/tts-core.ts` (testy: `tests/tts.test.ts`), `app/api/cron/tts`, `app/api/admin/tts`, `app/api/podrecznik/nagrania`.

**Wdrożenie krok po kroku**
1. **Konto Azure:** [portal.azure.com](https://portal.azure.com) → załóż konto (Azure prosi o kartę; plan F0 jest darmowy).
2. **Zasób Speech:** „Create a resource” → wyszukaj **Speech** → Create:
   - Subscription: Twoja;
   - Resource group: nowa, np. `owe`;
   - Region: **West Europe**;
   - Name: dowolna;
   - Pricing tier: **Free F0**;

   potem Review + create → Create.
3. **Klucz:** po utworzeniu zasobu → „Keys and Endpoint” → skopiuj **KEY 1** i **Location/Region** (`westeurope`).
4. **Magazyn plików – Cloudflare R2:**
   - załóż konto na [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage** → włącz R2 (plan darmowy; Cloudflare prosi o kartę, w limitach 0 zł);
   - **Create bucket** → nazwa np. `owe-nagrania`, lokalizacja Automatic → Create;
   - w kubełku: **Settings → Public access → R2.dev subdomain → Allow** → skopiuj adres `https://pub-….r2.dev` (to `R2_PUBLIC_URL`);
   - R2 → **Manage API tokens** (Account details → API tokens) → **Create API token**: uprawnienia **Object Read & Write**, tylko ten kubełek → Create;
   - skopiuj **Access Key ID**, **Secret Access Key** i **Account ID** (widoczne na stronie R2 i w adresie `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).

   Zamiast R2 można użyć Vercel Blob (Vercel → Storage → Blob → `BLOB_READ_WRITE_TOKEN`), ale tylko na część Podręcznika.
5. **Zmienne:** Vercel → Settings → Environment Variables:
   - `AZURE_SPEECH_KEY` – KEY 1;
   - `AZURE_SPEECH_REGION` – `westeurope`;
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (nazwa kubełka), `R2_PUBLIC_URL` (adres `https://pub-….r2.dev`);
   - `CRON_SECRET` – długi losowy ciąg, np. wynik `openssl rand -hex 32`;
   - opcjonalnie `TTS_MONTHLY_CHARS`.
6. **Redeploy:** Deployments → ostatnie wdrożenie → ⋯ → Redeploy. Zadanie dzienne pojawi się w Settings → Cron Jobs.
7. **Sprawdzenie:** Panel admina → „Głosy z chmury”:
   - wybierz głos;
   - kliknij „🎙️ Nagraj porcję teraz”;
   - otwórz pierwszy artykuł Podręcznika (Mikroekonomia → Podstawy) i „Czytaj na głos” – przy nagranych akapitach widać ☁️.
8. **(Opcjonalnie) szybciej:** GitHub → repozytorium → Settings → Secrets and variables → Actions → New repository secret:
   - `APP_URL` – adres aplikacji, np. `https://….vercel.app`;
   - `CRON_SECRET` – ten sam co w Vercel.

   Workflow „Nagrania Podręcznika (TTS)” uruchamia się co godzinę (tylko z gałęzi domyślnej). Można go też odpalić ręcznie: Actions → Run workflow.
9. **Kontrola zużycia:** Azure → zasób Speech → Metrics → „Synthesized Characters” oraz Cloudflare → R2 → kubełek → Metrics (rozmiar plików, ok. 1,8 GB po nagraniu wszystkiego); w Azure → Cost Management – zużycie kredytów.

Zmiana głosu w panelu oznacza nagranie wszystkiego od nowa (kolejne ok. 2 miesiące darmowego limitu). Do tego czasu grają nagrania poprzednim głosem.

## Audyt i wydajność

- `docs/AUDYT.md` – audyt aplikacji: treści, trasy, wygląd, uprawnienia, awarie bazy; poprawki i sprawy do decyzji.
  Audyt treści można powtórzyć: `python3 -I tools/nauka/audyt_tresci.py` (raport: `tools/nauka/AUDYT-TRESCI.md`).
- `docs/RAPORT-WYDAJNOSCI.md` – pomiary (LCP, rozmiary danych, zapytania SQL na dużej bazie testowej, zimny start)
  i rekomendacje przyspieszenia uporządkowane wg zysku i ryzyka.

## Limity bazy i hostingu

Plan Free w Neon: **0,5 GB** danych na projekt i **100 CU-godzin** obliczeń na miesiąc (baza usypia po 5 min bez zapytań);
Vercel Hobby: 4 h aktywnego CPU, 1 mln wywołań funkcji, 100 GB transferu na miesiąc.

- **Ile zajmują dane** (pomiar na lokalnej bazie): odpowiedź w Nauce ok. 160 B, sesja Nauki ok. 0,2–0,8 KB, test 30 pytań ok. 0,6 KB
  + odpowiedzi po ok. 0,35 KB, test „bez limitu” ok. 1–2 KB (pytania dolosowywane porcjami po 100 – wcześniej cała pula, ok. 17 KB).
  Bardzo aktywny użytkownik (1000 lekcji, 200 testów) to ok. 5–6 MB, więc 0,5 GB wystarcza na kilkadziesiąt bardzo aktywnych
  albo kilkaset zwykłych kont.
- **Panel admina → Baza danych**: rozmiar bazy względem limitu (`DB_LIMIT_MB`, domyślnie 512), największe tabele, liczby kont,
  testów i odpowiedzi; ostrzeżenie od 70%. Sprzątanie (wygasłe sesje logowania, linki resetu hasła, stare błędne kody, wpisy limitów starsze niż 2 dni, dziennik bezpieczeństwa starszy niż 90 dni) raz na dobę
  przy logowaniu albo wejściu do panelu, także przyciskiem „Posprzątaj teraz” (`lib/db-usage.ts`).
- **Obliczenia (CU-godziny)**: aplikacja nie odpytuje serwera cyklicznie, więc baza usypia, gdy nikt nie korzysta. W Neon ustaw
  **Compute → maks. 0,25 CU** (wtedy 100 CU-h ≈ 400 godzin aktywnej bazy w miesiącu). Zużycie: Neon → Usage, Vercel → Usage.

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env.local   # ustaw DATABASE_URL (dowolny Postgres)
npm run dev
```

Tabele tworzą się automatycznie przy pierwszym zapytaniu.

## Wdrożenie na Vercel

1. Zaloguj się na [vercel.com](https://vercel.com) kontem GitHub.
2. **Add New… → Project**, wybierz to repozytorium i kliknij **Import**
   (framework wykryje się sam jako Next.js; nic nie zmieniaj). Pierwszy deploy może się nie udać
   z błędem o `DATABASE_URL` przy otwieraniu strony – to normalne, baza nie jest jeszcze podłączona.
3. W projekcie: **Storage → Create Database → Neon (Serverless Postgres)** → wybierz region
   (np. Frankfurt) → **Create**, a potem **Connect Project** z zaznaczonymi środowiskami
   Production/Preview/Development. Vercel ustawi m.in. zmienną `DATABASE_URL`.
4. **Deployments → ⋯ przy ostatnim wdrożeniu → Redeploy**, żeby aplikacja dostała nową zmienną.
5. Otwórz adres `*.vercel.app` – tabele utworzą się same przy pierwszym teście.

Każdy kolejny push na gałąź produkcyjną (Settings → Git → Production Branch) wdraża się automatycznie.

## Skrypty

- `npm test` — testy jednostkowe (vitest: punktacja, kurs, powtórki, statystyki, ogłoszenia, bezpieczeństwo i inne)
- `npm run typecheck` — sprawdzenie typów
- `npm run validate-questions` — walidacja bazy pytań
- `bash tests/e2e/run.sh [katalog-na-zrzuty] [log-serwera]` — pełna regresja e2e (Playwright, 32 skrypty: konta, testy,
  nauka, notatki, fiszki, mapa, podręcznik, zadania i eseje, ogłoszenia, zgłoszenia, wydajność danych, bezpieczeństwo,
  sondy wszystkich tras API, przejście po wszystkich stronach w obu motywach i szerokościach). **Tylko na lokalnej bazie
  testowej** – na początku czyści konta. Wymaga serwera produkcyjnego na porcie 3100 (instrukcja w nagłówku skryptu).
