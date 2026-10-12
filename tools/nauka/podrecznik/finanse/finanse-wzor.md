# intro | W skrócie: matematyka pieniądza

Finanse to dziedzina, w której liczby decydują o wszystkim. Ile odsetek przyniesie lokata? Ile jest warta obligacja? Ile pieniądza stworzą banki? Czy akcja jest droga, czy tania? Ten dział zbiera wzory z finansów i pokazuje, jak używać ich w zadaniach.

## Trzy grupy wzorów

- **pieniądz i banki** – baza monetarna, mnożnik kreacji pieniądza, podaż pieniądza, monetyzacja, model Baumola–Tobina;
- **wartość pieniądza w czasie** – procent prosty i składany, stopa efektywna, renta, perpetuita, obligacje zerokuponowe, stopa realna;
- **giełda i ryzyko** – EPS, P/E, P/BV, dywidenda, CAPM, wskaźnik Sharpe’a, tarcza podatkowa.

## Jak się nie pomylić

- procenty zamieniaj na ułamki dziesiętne: 5% = 0,05;
- przy procencie składanym potęguj, przy prostym – mnóż;
- dyskontowanie to odwrotność kapitalizacji: dzielisz zamiast mnożyć;
- sprawdzaj, czy wynik ma sens: obligacja zerokuponowa zawsze kosztuje mniej niż nominał (przy dodatniej stopie).

> Zapamiętaj: FV = PV(1 + r)ⁿ; PV = FV / (1 + r)ⁿ.

# finanse-wzor-1 | Pieniądz w liczbach

## Baza monetarna

**[[Baza monetarna (M0, pieniądz wielkiej mocy)|Baza monetarna]]**:

$ B = gotówka w obiegu + rezerwy banków

## Mnożnik kreacji pieniądza

**[[Mnożnik kreacji pieniądza|Mnożnik]]**:

$ m = 1 / r (bez gotówki)
$ m = (1 + g) / (r + g)

> Przykład: r = 5%, g = 0,15. m = 1,15 / 0,20 = 5,75. Baza 200 mld zł → podaż pieniądza 1 150 mld zł.

## Stopa realna

**[[Stopa procentowa nominalna i realna|Stopa realna]]**: r ≈ i − π; dokładnie 1 + r = (1 + i) / (1 + π).

> Przykład: i = 9%, π = 6%. r ≈ 3%; dokładnie 1,09 / 1,06 − 1 ≈ 2,83%.

## Kurs krzyżowy

**[[Kurs krzyżowy|Kurs krzyżowy]]**: USD/CHF = (GBP/CHF) / (GBP/USD).

> Przykład: EUR/PLN = 4,30, EUR/USD = 1,10. USD/PLN = 4,30 / 1,10 ≈ 3,91.

## Ile gotówki trzymać

**[[Model Baumola–Tobina (transakcyjny popyt na pieniądz)|Model Baumola–Tobina]]**:

$ M* = √(Y · F / (2i))

> Przykład: Y = 36 000 zł rocznie, F = 5 zł, i = 4%. M* = √(36 000 · 5 / 0,08) = √2 250 000 = 1 500 zł.

# finanse-wzor-2 | Monetyzacja, podaż pieniądza i akcje

## Monetyzacja

**[[Monetyzacja gospodarki|Wskaźnik monetyzacji]]**:

$ wskaźnik = M3 / PKB nominalny · 100%

> Przykład: M3 = 2 200 mld zł, PKB = 3 600 mld zł. Wskaźnik ≈ 61%.

## Podaż pieniądza

**[[Podaż pieniądza (nominalna i realna)|Podaż pieniądza]]**:

$ M = m · B
$ podaż realna = M / P

> Przykład: m = 4, B = 300 mld zł → M = 1 200 mld zł. Gdy poziom cen wzrośnie o 20% (P z 1 do 1,2), realna podaż = 1 000 mld zł.

## Dywidenda

**[[Dywidenda|Dywidenda]]**:

$ stopa dywidendy = DPS / cena akcji
$ wskaźnik wypłaty = dywidenda / zysk netto

> Przykład: zysk netto 50 mln zł, wypłacono 20 mln zł dywidendy na 10 mln akcji, cena 40 zł. DPS = 2 zł, stopa dywidendy = 5%, wskaźnik wypłaty = 40%.

## Obligacja zerokuponowa

**[[Obligacja zerokuponowa|Cena]]**: P = N / (1 + YTM)ⁿ.

> Przykład: N = 1 000 zł, YTM = 6%, n = 2. P = 1 000 / 1,1236 ≈ 890 zł.

## P/E

**[[Wskaźnik cena/zysk (P/E)|P/E]]** = cena / EPS.

> Przykład: cena 84 zł, EPS 7 zł → P/E = 12.

# finanse-wzor-3 | Wycena, ryzyko i czas

## P/BV i EPS

**[[Wskaźnik cena/wartość księgowa (P/BV)|P/BV]]** = cena / (kapitał własny / liczba akcji). **[[Zysk na akcję (EPS)|EPS]]** = zysk netto / liczba akcji.

> Przykład: kapitał własny 300 mln zł, 20 mln akcji, cena 30 zł, zysk 36 mln zł. Wartość księgowa na akcję = 15 zł, P/BV = 2; EPS = 1,80 zł.

## CAPM

**[[Model CAPM|CAPM]]**: E(R) = Rf + β · [E(Rm) − Rf].

> Przykład: Rf = 3%, E(Rm) = 9%, β = 0,8. E(R) = 3 + 0,8 · 6 = 7,8%.

## Czas

**[[Wartość pieniądza w czasie|Wartość pieniądza w czasie]]**:

$ FV = PV · (1 + r)ⁿ
$ PV = FV / (1 + r)ⁿ
$ kapitalizacja m razy w roku: FV = PV · (1 + r / m)ᵐⁿ

**[[Procent prosty i składany|Procent prosty]]**: FV = PV · (1 + r · n).

> Przykład: 5 000 zł na 2 lata, 6% rocznie, kapitalizacja kwartalna. FV = 5 000 · 1,015⁸ ≈ 5 000 · 1,1265 ≈ 5 632 zł. Przy procencie prostym: 5 000 · 1,12 = 5 600 zł.

# finanse-wzor-4 | Renty, Sharpe, podatki i Fisher

## Perpetuita

**[[Renta (annuity) i perpetuita|Perpetuita]]**: PV = C / r.

> Przykład: fundacja chce wypłacać stypendium 12 000 zł rocznie na zawsze. Przy stopie 4% potrzebuje 12 000 / 0,04 = 300 000 zł.

## Sharpe

**[[Wskaźnik Sharpe’a|Wskaźnik Sharpe’a]]**: S = (Rp − Rf) / σp.

> Przykład: Rp = 10%, Rf = 3%, σp = 14%. S = 7 / 14 = 0,5.

## Tarcza podatkowa

**[[Tarcza podatkowa|Tarcza]]** = koszt · stawka podatku.

> Przykład: amortyzacja 200 000 zł, CIT 19% → tarcza 38 000 zł.

## Stopy podatkowe

**[[Przeciętna i krańcowa stopa podatkowa|Stopa przeciętna]]** = T / Y; **krańcowa** = ΔT / ΔY.

> Przykład: przy dochodzie 100 000 zł podatek 8 400 zł, przy 101 000 zł – 8 520 zł. Stopa przeciętna = 8,4%; krańcowa = 120 / 1 000 = 12%.

## Fisher

**[[Stopa realna (Fisher)|Równanie Fishera]]**: 1 + i = (1 + r)(1 + π).

> Przykład: r = 2%, π = 4%. 1,02 · 1,04 = 1,0608, więc i = 6,08%.

# finanse-wzor-5 | Ściąga ze wzorów finansowych

Ten rozdział zbiera najważniejsze wzory w jednym miejscu.

## Pieniądz

**[[Mnożnik kreacji pieniądza – wzór|Mnożnik]]**: m = 1 / r; m = (1 + g) / (r + g); depozyty = rezerwa obowiązkowa / stopa rezerwy.

> Przykład: rezerwy obowiązkowe 35 mld zł przy stopie 3,5%. Depozyty = 35 / 0,035 = 1 000 mld zł.

**[[Model Baumola–Tobina – wzór|Baumol–Tobin]]**: liczba wypłat N* = √(i · Y / (2F)); przeciętna gotówka M* = Y / (2N*).

> Przykład: Y = 36 000, F = 5, i = 4%. N* = √(0,04 · 36 000 / 10) = √144 = 12 wypłat rocznie. M* = 36 000 / 24 = 1 500 zł – tyle samo co w poprzednim rozdziale.

## Czas

**[[Wartość pieniądza w czasie – wzory|Wzory]]**: FV = PV(1 + r)ⁿ; PV = FV / (1 + r)ⁿ; procent prosty FV = PV(1 + rn); stopa efektywna = (1 + r / m)ᵐ − 1.

**[[YTM obligacji zerokuponowej|YTM obligacji zerokuponowej]]**:

$ YTM = (N / P)^(1/n) − 1

> Przykład: obligacja o nominale 1 000 zł kosztuje 810 zł, wykup za 4 lata. YTM = (1 000 / 810)^(1/4) − 1 ≈ 1,2346^0,25 − 1 ≈ 5,4%.

## Giełda

**[[Wskaźniki giełdowe – wzory|Wskaźniki giełdowe]]**: EPS = zysk netto / liczba akcji; P/E = cena / EPS; P/BV = cena / wartość księgowa na akcję; DPS = dywidenda / liczba akcji; stopa dywidendy = DPS / cena.

> Zapamiętaj: wszystkie wskaźniki „na akcję” liczysz, dzieląc przez liczbę akcji – nie mieszaj kwot całkowitych z kwotami na akcję.
