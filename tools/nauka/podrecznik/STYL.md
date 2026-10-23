# Jak piszemy artykuły Podręcznika (wzorzec: Mankiw i Taylor)

Wzorem jest **sposób pisania** „Ekonomii” N. G. Mankiwa i M. P. Taylora, a nie jej treść. Treść bierzemy z naszych haseł
(`tools/slownik/glossary`) i z faktów potwierdzonych w `WERYFIKACJA.md`. Nie dopisujemy nowych dat, nazwisk ani danych
bez dwóch źródeł.

## Tok rozdziału (≈ 300–450 słów)

1. **Pytanie z życia** – 1–3 zdania, które czytelnik zna z własnego doświadczenia: sklepik, kieszonkowe, rodzina, wiadomości.
   Nie zaczynamy od definicji.
2. **Intuicja** – odpowiedź zwykłymi słowami, zanim padnie termin. Jedno zdanie = jedna myśl.
3. **Pojęcie** – termin pogrubiony z odnośnikiem `**[[Hasło|hasło]]**` i definicja w jednym zdaniu, zgodna ze słownikiem.
4. **Przykład liczbowy** – ramka `> Przykład:` z małymi, okrągłymi liczbami i rachunkiem do sprawdzenia w głowie.
   Wynik zawsze z jednostką i z komentarzem („czyli…”).
5. **Co z tego wynika** – 2–4 zdania: po co to pojęcie, komu pomaga podjąć decyzję, jak łączy się z resztą działu.
6. **Pułapka OWE** – ramka `> Uwaga:` z jednym typowym błędem z pytań olimpijskich (myląca para pojęć, zły kierunek zmiany).
7. **Zapamiętaj** – ramka `> Zapamiętaj:` z jedną myślą do powtórki (najwyżej dwa zdania).

Śródtytuły (`##`) mówią coś o treści („Dlaczego zgony spadają pierwsze”), a nie tylko ją nazywają („Definicja”).

## Język

- Krótkie zdania (średnio 12–16 słów), strona czynna, „ty” zamiast „należy”.
- Najpierw konkret, potem uogólnienie. Wyliczanki tylko wtedy, gdy elementy są naprawdę równoległe (rodzaje, fazy).
- Jedno pojęcie na akapit. Akapit ≤ 5 zdań.
- Bez żargonu bez wyjaśnienia; skróty rozwijamy przy pierwszym użyciu.
- Porównania i analogie (Mankiw: „ekonomia to nauka o wyborach”), ale bez infantylizowania.
- Liczby po polsku: przecinek dziesiętny, spacja tysięcy, „%” bez spacji, „p.p.” dla punktów procentowych.

## Elementy techniczne (build_podrecznik.py)

- Każde hasło lekcji i każde „extra” musi mieć odnośnik `[[…]]` w rozdziale (sprawdza `--strict`).
- Rysunek: `::wykres …` pod akapitem, który go omawia; podpis mówi, co czytelnik ma zobaczyć.
- „Na marginesie” – krótka lista haseł z pytań, które nie są głównym tematem lekcji, każde z jednym zdaniem objaśnienia.
- Zmiana tekstu sekcji ukrywa podkreślenia użytkowników zrobione przed zmianą (pole `ch`) – dlatego poprawiamy rozdział raz,
  porządnie, a nie po jednym zdaniu.

## Przykład

Zamiast:

> Przejście demograficzne ma cztery fazy: 1) wysoka rozrodczość i umieralność…

piszemy:

> Twoja prababcia mogła mieć ośmioro rodzeństwa, a ty masz może jedno. Co się stało po drodze? Najpierw ludzie przestali
> tak często umierać – dzięki szczepieniom, czystej wodzie i lepszemu jedzeniu. Rodziny długo jeszcze miały wiele dzieci,
> więc ludność rosła jak nigdy wcześniej. Dopiero później zmalała liczba urodzeń. Ten przebieg nazywamy
> **przejściem demograficznym**.
