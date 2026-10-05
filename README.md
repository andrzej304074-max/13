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

Baza pytań: `data/questions.json`. Format jednego pytania:

```json
{
  "id": "s001",
  "type": "single",
  "edition": "LXVI (2022/2023), etap I",
  "question": "Treść pytania",
  "options": ["A", "B", "C", "D"],
  "correct": [1],
  "explanation": "Wyjaśnienie z definicją"
}
```

`type`: `"single"` (dokładnie jedna poprawna) lub `"multi"`; `correct` to indeksy 0–3.
Po zmianie pliku uruchom `npm run validate-questions`.
Jeśli w bazie jest mniej pytań danego typu niż 30/50, test zawiera wszystkie dostępne.

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
