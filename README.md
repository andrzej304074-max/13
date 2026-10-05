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
procent kolejnych testów oraz dokładność w blokach po 100 kolejnych sprawdzonych lub pominiętych pytań
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
