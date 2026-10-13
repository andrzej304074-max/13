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
