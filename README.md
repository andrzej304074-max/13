# Testy OWE

Strona do rozwiązywania testów z pytań z poprzednich edycji Olimpiady Wiedzy Ekonomicznej.
Next.js (App Router) + Postgres (Neon), gotowa do wdrożenia na Vercel.

## Zasady

| Typ | Punktacja |
|---|---|
| Jednokrotny wybór | +2 pkt za poprawną, −1 pkt za błędną, 0 bez odpowiedzi |
| Wielokrotny wybór | 0,5 pkt za każde z pól A–D o poprawnym stanie (zaznaczone gdy poprawne, puste gdy błędne), max 2 pkt |

Test: 30 pytań → 40 minut, 50 pytań → 60 minut. Po kliknięciu „Sprawdź” widać, które odpowiedzi były dobre,
ile punktów przyznano i wyjaśnienie. Punktacja i limit czasu są liczone na serwerze.

Statystyki (`/stats`) sumują wyniki **wszystkich** zakończonych testów wszystkich użytkowników
(procent zdobytych punktów względem możliwych do zdobycia) i pokazują wykres postępu. Brak logowania.

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

1. Zaimportuj repozytorium w Vercel (framework: Next.js, ustawienia domyślne).
2. W projekcie: **Storage → Create Database → Neon (Postgres)** i podłącz bazę do projektu —
   Vercel ustawi zmienną `DATABASE_URL`.
3. Zrób redeploy.

## Skrypty

- `npm test` — testy jednostkowe punktacji
- `npm run typecheck` — sprawdzenie typów
- `npm run validate-questions` — walidacja bazy pytań
