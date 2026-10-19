# Raport wydajności (październik 2026)

Jak jeszcze przyspieszyć aplikację bez obniżania jakości. Rekomendacje 2, 4 i 5 są **wdrożone w etapie 7** (pomiary przed i po – sekcja „Etap 7” na końcu); pozostałe czekają na decyzję.

## Pomiary

Serwer produkcyjny (`next build` + `next start`) na lokalnej bazie Postgres, przeglądarka Chromium.

**Profile przeglądarki:**
- **telefon:** 430 px, procesor spowolniony 4×, sieć „szybkie 4G” (9 Mb/s, 60 ms RTT);
- **komputer:** 1280 px, bez spowolnienia.

Wartości to mediana z 3 wejść.

### Strony (LCP – największy element widoczny na ekranie)

| Trasa | LCP telefon | LCP komputer | HTML | Dane pobierane po wejściu |
|---|---:|---:|---:|---|
| `/` (Testy) | 256 ms | 60 ms | 10 KB | `/api/stats` 18 KB |
| `/nauka` | 240 ms | 76 ms | 37 KB | postęp 1 KB (+ hasła w tle) |
| `/nauka/mikro` | 728 ms | 132 ms | 155 KB | postęp 31 KB |
| lekcja | 648 ms | 180 ms | 59 KB | – |
| `/fiszki` | **1132 ms** | 228 ms | 11 KB | hasła 562 KB, opanowanie 50 KB |
| `/fiszki/talie` | 252 ms | 72 ms | 12 KB | talie |
| `/pojecia` | 872 ms | 204 ms | 11 KB | hasła 562 KB, owe-stats 277 KB |
| `/pojecia/mapa` | 868 ms | 152 ms | 11 KB | hasła, mapa 363 KB, owe-stats |
| `/pojecia/statystyki` | 700 ms | 200 ms | 12 KB | owe-stats, hasła |
| `/stats` | 772 ms | 192 ms | 11 KB | stats 18 KB, nauka-meta 122 KB |
| `/stats/dzialy` | 456 ms | 64 ms | 12 KB | 255 KB |
| `/nauka/statystyki` | 548 ms | 164 ms | 11 KB | 11 KB |
| `/nauka/podrecznik` | 748 ms | 132 ms | 135 KB | – |
| artykuł Podręcznika | 692 ms | 96 ms | 69 KB | – |
| rozdział Podręcznika | 320 ms | 72 ms | 25 KB | – |
| `/notatki`, `/admin` | ~250 ms | ~65 ms | 11–12 KB | małe |

- Wszystkie trasy mieszczą się w progu „dobrze” Google (LCP < 2,5 s), nawet na spowolnionym telefonie.
- CLS (przesunięcia układu) wynosi ≤ 0,02 wszędzie – próg „dobrze” to 0,1.
- Wolniejsze są strony, które przed pierwszym obrazem czekają na duże dane: hasła (fiszki, pojęcia) i długie spisy (temat, Podręcznik).

### JavaScript
- **Wspólny JS:** ~486 KB po rozpakowaniu, w tym React DOM 234 KB i środowisko Next.js 166 KB. Przez sieć ~150 KB (brotli).
- **Kod stron:** 0–40 KB na trasę.
- Wspólny kod aplikacji (menu, blokady, czytanie na głos, szybkie notatki) to 36 KB – bez potrzeby dzielenia.

### Dane statyczne `/api/dane/*` (brotli, pamięć przeglądarki 5 min + odświeżanie w tle przez 24 h)

| Plik | Rozpakowany | Przez sieć |
|---|---:|---:|
| `hasla` | 540 KB | **150 KB** |
| `mapa` | 363 KB | 49 KB |
| `owe-stats` | 277 KB | 39 KB |
| `nauka-meta` | 122 KB | 26 KB |

Same tytuły haseł, bez definicji i wzorów, to 164 KB rozpakowane i **34 KB** przez sieć.

### Serwer i baza
- **Zapytania na żądanie:**
  - zwykła strona: **2** (sesja w layoucie i sesja w stronie – `currentUser()` nie jest współdzielony w obrębie żądania);
  - `/api/stats`: 5;
  - `/api/fiszki/opanowanie`: 4;
  - `/api/nauka/stats`: **11** (sesja + 10 równoległych zapytań, a pula ma maks. 5 połączeń, więc idą w dwóch turach).
- **Zapytania SQL na dużej bazie testowej:** 300 kont, 675 tys. odpowiedzi w lekcjach, 270 tys. odpowiedzi w testach, 180 tys. ocen fiszek – razem ~160 MB. `EXPLAIN ANALYZE` dla jednego konta, wszystkie po indeksach:

  | Zapytanie | Czas |
  |---|---:|
  | opanowanie (lekcje) | 20 ms |
  | powtórka słabych haseł | 13 ms |
  | ćwiczenia w statystykach nauki | 12 ms |
  | odpowiedzi w testach | 5 ms |
  | wykres bloków | 5 ms |
  | oceny fiszek | 1 ms |

  Jedyny pełny przegląd tabeli to zbiorcza statystyka wszystkich kont (104 ms przy 675 tys. wierszy) – akceptowalne dla panelu.
- **Zimny start:**
  - serwer gotowy po 1,8 s;
  - pierwsze żądanie każdej trasy jest wolniejsze o 100–170 ms (wczytanie modułów i danych kursu), kolejne trwają ~20 ms;
  - przy starcie wykonywał się cały `SCHEMA_SQL` (42 polecenia `CREATE … IF NOT EXISTS` / `ALTER TABLE … ADD COLUMN IF NOT EXISTS`): lokalnie 2–5 ms i jedna podróż do bazy. Od etapu 7 – tylko po zmianie schematu.
- **Pamięć bazy:** ~0,5 MB na bardzo aktywne konto (150 lekcji, 30 testów). Darmowy Neon (0,5 GB) wystarczy na kilkaset takich kont – patrz karta „Baza danych” w panelu admina.

## Rekomendacje (od największego zysku przy najmniejszym ryzyku)

### 1. Funkcje Vercel w tym samym regionie co baza Neon + adres „pooled” – zysk największy, zero zmian w kodzie
- Każda strona robi 2 zapytania, każde API 1–11.
- Gdy funkcja działa w innym regionie niż baza (np. Vercel `iad1`, Neon we Frankfurcie), każda podróż do bazy kosztuje 80–100 ms. W tym samym regionie – 1–3 ms.
- **Do zrobienia:**
  - w Vercel → Settings → Functions → Region wybrać region Neon (np. `fra1` dla `eu-central-1`);
  - w `DATABASE_URL` użyć adresu z `-pooler` (PgBouncer Neon), żeby zimne starty nie zakładały nowych połączeń.
- **Zysk:** do ~200 ms na każdej stronie z bazą.

### 2. `currentUser()` raz na żądanie (`React.cache`) – mała zmiana, −1 zapytanie na każdą stronę
- Layout i strona sprawdzają sesję osobno.
- Owinięcie `currentUser` w `cache()` z `react` sprawia, że w jednym renderze zapytanie wykonuje się raz.
- **Zysk:** jedna podróż do bazy na stronę (1–3 ms w jednym regionie, 80–100 ms w różnych).
- **Ryzyko:** minimalne – `cache` działa tylko w obrębie jednego żądania.

### 3. Lekka lista haseł + definicje osobno – szybsze Fiszki i Pojęcia na telefonie
- **Zmiana:**
  - `/api/dane/hasla` (150 KB przez sieć) podzielić na indeks (id, tytuł, rodzaj, temat: 34 KB) i definicje (pobierane zaraz po pierwszym obrazie albo porcjami);
  - fiszki potrzebują od razu tylko bieżącej karty, Tabela – pierwszych 100 wierszy.
- **Zysk:** szacunkowo LCP `/fiszki` z ~1,1 s do ~0,6 s na telefonie, mniej pracy przy parsowaniu JSON na słabych telefonach.
- **Ryzyko:** średnie – zmiana w 6 komponentach. Wyszukiwanie w definicjach musi poczekać na drugą część.

### 4. Statystyki nauki: 10 zapytań → 2
- `getNaukaStats` (`lib/nauka.ts`) wysyła 10 zapytań, a pula ma 5 połączeń.
- **Zmiana:** zebrać sumy w jedno zapytanie z `GROUPING SETS` (po pod-lekcji, temacie, ćwiczeniu, rodzaju) i jedno dla historii z dniami. Wynik ten sam, test porównawczy na danych testowych.
- **Zysk:** ~1 podróż do bazy zamiast 2 tur, mniej połączeń z Neon.

### 5. Schemat tylko przy zmianie wersji
- `ensureSchema()` przy każdym zimnym starcie wykonuje wszystkie `ALTER TABLE … IF NOT EXISTS`.
- `ALTER TABLE` bierze na chwilę blokadę wyłączną tabeli, nawet gdy kolumna istnieje. Przy dużym ruchu zimny start może więc czekać na trwające zapytania (i odwrotnie).
- **Zmiana:** numer wersji schematu w `settings` – pełny `SCHEMA_SQL` tylko gdy wersja się różni; w przeciwnym razie jedno szybkie `SELECT`.

### 6. Dane kursu jako pliki z wersją w nazwie (do rozważenia)
- `/api/dane/*` są takie same dla wszystkich i zmieniają się tylko przy wdrożeniu.
- Obecnie są w pamięci przeglądarki 5 min (z odświeżaniem w tle), a każde konto i każdy telefon pobiera je z funkcji.
- **Zmiana:** jako pliki z hashem w nazwie (`immutable`, rok w pamięci, z CDN Vercel) znikną z kosztów funkcji i ładują się od razu przy kolejnych wizytach.
- **Decyzja:** dane kursu byłyby wtedy dostępne bez logowania (dziś proxy wymaga sesji). To decyzja o dostępie, nie tylko o szybkości.

### 7. Drobne, opcjonalne
- **React Compiler** (`reactCompiler: true`): mniej zbędnych przerysowań w długich listach (tabela pojęć, fiszki, mapa). Wymaga pełnej regresji.
- **Zbiorcze statystyki dla admina:** przy dziesiątkach tysięcy kont – tabela podsumowań odświeżana raz na dobę zamiast liczenia z 675 tys.+ wierszy.
- **Czego nie robić:** dzielenie wspólnego JS (36 KB kodu aplikacji – zysk znikomy); zmiana czcionek (jedna, ładowana z wyprzedzeniem, CLS = 0); wyłączanie animacji.

## Skrót – 5 najważniejszych
1. Region funkcji = region bazy + adres `-pooler` w `DATABASE_URL` (największy zysk, bez kodu).
2. `cache(currentUser)` – jedno zapytanie mniej na każdą stronę.
3. Lekki indeks haseł (34 KB zamiast 150 KB) – Fiszki i Pojęcia szybsze na telefonie.
4. Statystyki nauki: 10 zapytań → 2.
5. Migracja schematu tylko przy zmianie wersji – bez blokad przy zimnym starcie.

## Etap 7: wdrożone optymalizacje – pomiary przed i po (19.10.2026)

### Co zmieniono
- **Sesja raz na żądanie** – `currentUser()` w `cache()` z Reacta (`lib/auth.ts`): layout i strona nie pytają bazy osobno.
- **Schemat tylko po zmianie** – skrót `SCHEMA_SQL` zapisany w `settings` (`lib/db.ts`). Zimny start to jedno `SELECT`, pełna migracja tylko po zmianie schematu – bez blokad `ALTER TABLE` przy każdym starcie.
- **Statystyki testów** (`getStats`, `/api/stats` – strona startowa): 5 niezależnych zapytań wysyłanych równolegle zamiast jedno po drugim.
- **Statystyki nauki** (`getNaukaStats`): 10 zapytań → 5, sumy, podziały i ćwiczenia w jednym zapytaniu z `GROUPING SETS`. Mieści się w puli 5 połączeń, więc to jedna tura do bazy zamiast dwóch.
- **Postęp nauki** (`getProgress`): 3 zapytania równolegle; dzisiejsza data liczona w kodzie (strefa Europe/Warsaw) zamiast osobnego zapytania.
- **Licznik ogłoszeń 🔔** (wywoływany na każdej stronie): 1 zapytanie zamiast 2.

Wyniki nowych funkcji porównano ze starymi na danych testowych (54 pola statystyk nauki, statystyki testów dla wszystkich filtrów, postęp) – identyczne. Jedyna różnica to kolejność wierszy „wg rodzaju”, która wcześniej była przypadkowa (brak `ORDER BY`).

### Pomiar
- **Metoda:**
  - ten sam serwer produkcyjny i baza co wyżej;
  - liczba poleceń SQL z logu Postgresa (`log_statement = all`);
  - czasy z bazą „zdalną” zmierzono przez lokalny pośrednik TCP dodający 10 ms w każdą stronę (RTT 20 ms – typowe dla bazy w innej strefie dostępności, a nawet mało przy innym regionie);
  - mediana z 7 wywołań.
- **Lokalnie** (baza w tym samym kontenerze, podróż < 0,1 ms) TTFB i LCP stron zmieniły się w granicach szumu pomiaru (±20%): zysk z mniejszej liczby podróży do bazy widać dopiero przy prawdziwej sieci.

| Dane | Zapytania SQL przed → po | Tury do bazy przed → po | Czas przy RTT 20 ms przed → po |
|---|---:|---:|---:|
| strona (layout + strona, sesja) | 2 → 1 | 2 → 1 | ~40 → ~20 ms |
| `/api/stats` (strona startowa, statystyki) | 7 → 7 | 7 → 3 | **219 → 70 ms** |
| `/api/nauka/stats` | 11 → 6 | 3 → 2 | 163 → 96 ms |
| `/api/nauka/progress` (Nauka, tematy) | 5 → 4 | 5 → 2 | **149 → 52 ms** |
| `/api/ogloszenia/licznik` (każda strona) | 3 → 2 | 3 → 2 | 44 → 23 ms |
| zimny start (migracja schematu) | ~60 poleceń → 1 | 1 → 1 | 64 → 22 ms, bez blokad tabel |

Liczba zapytań przy pełnym wejściu na stronę (strona + dane pobierane po załadowaniu), komputer: `/` 18 → 16, `/nauka` 16 → 13, `/nauka/mikro` 16 → 13, lekcja „Utrwal” 17 → 14, `/fiszki` 19 → 17, `/stats` 19 → 17, `/admin` 36 → 33.

### Czego nie wdrożono i dlaczego
- **Lekki indeks haseł (rek. 3):** wszyscy odbiorcy `/api/dane/hasla` (fiszki, tabela, mapa, czytnik) pokazują definicje od pierwszego ekranu, więc podział wymagałby przebudowy 6 komponentów. Dane są pobierane raz i trzymane w pamięci przeglądarki (ETag, 304 przy kolejnych wejściach) – zysk dotyczy tylko pierwszej wizyty. Zostaje jako rekomendacja.
- **Region i adres `-pooler` (rek. 1):** ustawienie hostingu, nie kodu – nadal największy możliwy zysk.
- **Pliki z wersją w nazwie (rek. 6):** decyzja o dostępie bez logowania – sprzeczna z ochroną treści w etapie 8.
