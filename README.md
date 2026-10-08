# Testy OWE

Strona do rozwiązywania testów z pytań z poprzednich edycji Olimpiady Wiedzy Ekonomicznej.
Next.js (App Router) + Postgres (Neon), gotowa do wdrożenia na Vercel.

## Zasady

| Typ | Punktacja |
|---|---|
| Jednokrotny wybór | +2 pkt za poprawną, −1 pkt za błędną, 0 bez odpowiedzi |
| Wielokrotny wybór | 0,5 pkt za każde z pól A–D o poprawnym stanie (zaznaczone gdy poprawne, puste gdy błędne), max 2 pkt |

Test: 30 pytań → 40 minut, 50 pytań → 60 minut. Trzecia opcja, **Bez limitu**, losuje pytania z całej puli danego typu
bez limitu czasu; nie można się cofać ani przeskakiwać pytań, a do statystyk liczą się wyłącznie pytania sprawdzone
(„Sprawdź”) lub pominięte („Pomiń” = 0 z 2 pkt) – na bieżąco, nawet bez kliknięcia „Zakończ test”. Po kliknięciu „Sprawdź” widać, które odpowiedzi były dobre,
ile punktów przyznano i wyjaśnienie. Punktacja i limit czasu są liczone na serwerze.

Procent w podsumowaniu i statystykach to **procent poprawnych odpowiedzi**, a nie punktów: w jednokrotnym wyborze
poprawne pytania / wszystkie pytania, w wielokrotnym – trafne pola A–D / wszystkie pola (4 na pytanie). W testach
30/50 pytań mianownikiem są wszystkie pytania testu (bez odpowiedzi = niepoprawne), w trybie „Bez limitu” – pytania
sprawdzone i pominięte. Punkty (+2/−1, 0,5 za pole) są pokazywane obok.

Statystyki (`/stats`) sumują wyniki **wszystkich** testów wszystkich użytkowników i pokazują dwa wykresy postępu:
procent kolejnych testów oraz dokładność w blokach po N kolejnych sprawdzonych lub pominiętych pytań
(N do wyboru: 10, 20, 25, 40, 50, 100, 150, 200; domyślnie 100). Przełącznik „Oba typy / Jednokrotny / Wielokrotny”
zawęża wynik, historię i oba wykresy do wybranego typu; oba wybory zapamiętuje przeglądarka.
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
- `data/slownik/auto.json` – pytania automatyczne:
  `python3 -I tools/slownik/gen_questions.py tools/slownik/glossary data/slownik`.
- `data/slownik/manual.json` – pytania pisane ręcznie, składane z `tools/slownik/manual/m*.py`:
  `python3 -I tools/slownik/build_manual.py tools/slownik/manual data/slownik`.

## Nauka (zakładka „Nauka” – kurs w stylu Duolingo)

Kurs zbudowany z haseł słownika (`docs/slownik-owe.pdf`) i wszystkich banków pytań:

- **7 tematów:** Mikroekonomia, Makroekonomia, Polityka gospodarcza, Podstawy finansów, Finanse przedsiębiorstw,
  Zarządzanie oraz temat przewodni „Gospodarka wobec wyzwań demograficznych”.
- **Hierarchia:** 84 działy → 683 lekcje: 296 lekcji haseł (po 1–6 haseł) i 387 lekcji „Zrozumienie” 🧠 → 2732 pod-lekcje.
- **Rodzaje treści** (filtr na stronie tematu): pojęcia, wzory, osoby, instytucje, daty, przepisy, zrozumienie.
- **Pod-lekcje:** 1. Poznaj, 2. Ćwicz, 3. Utrwal, 4. Sprawdzian (pytania olimpijskie i słownikowe dopasowane do haseł lekcji).
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

- **Liczba lekcji:** 5 w każdym dziale pojęciowym i dziale „Wzory”, 5 w działach osób, instytucji, dat i przepisów
  z co najmniej 15 hasłami, 2 w mniejszych działach. Razem 387 lekcji, 7774 ćwiczenia oceniane i 1553 karty wyjaśnień.
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

Przypisanie haseł do tematów i działów jest w `tools/nauka/curriculum.py`.

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

- `npm test` — testy jednostkowe punktacji
- `npm run typecheck` — sprawdzenie typów
- `npm run validate-questions` — walidacja bazy pytań
