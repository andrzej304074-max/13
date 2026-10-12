# Raport: statystyki pytań OWE (XXI–XXXIX)

Dane zakładki „Pojęcia → Statystyki pytań OWE” (`data/nauka/owe-stats.json`, generuje `tools/nauka/build_course.py`).

**Jak liczone:**
- dział i zagadnienie pytania – lekcja kursu, do której build przydziela pytanie (jedna na pytanie, więc procenty działów sumują się do 100);
- pojęcia pytania – hasła wykryte w treści i w poprawnych odpowiedziach (`tools/nauka/pojecia_pytan.py`, ręczne korekty w `pojecia_pytan_poprawki.py` z przeglądu wszystkich pytań XXI–XXXIX); pojęcia dodane do pytania tylko po to, by lekcja omówiła błędne odpowiedzi, nie liczą się;
- hasła ogólne, będące zwykle tłem pytania (`STAT_GENERIC`), liczą się tylko wtedy, gdy pytanie nie dotyczy niczego konkretniejszego: Autarkia, Bank centralny, Branża (sektor), Ceteris paribus, Czynniki wytwórcze (czynniki produkcji), Dochód osobisty i dochód rozporządzalny, Ekonomia, Inwestycje, Konsumpcja, Krótki okres i długi okres, Papier wartościowy, Pieniądz, Podatek, Podaż, Popyt, Transfery socjalne, Wykresy w ekonomii: nachylenie i układ współrzędnych;
- podobne pytania z różnych edycji liczą się osobno (3 pytania o to samo pojęcie = 3);
- gdzie automat się mylił, obowiązuje ręczna lista pojęć pytania (`STAT_FIX`, helper `stat()` w `pojecia_pytan_poprawki.py`); pierwsze pojęcie z listy wyznacza dział i zagadnienie pytania.

## Podsumowanie

- Pytań: 1656 (jednokrotnego wyboru: 1147, wielokrotnego: 509).
- Pytań bez rozpoznanego pojęcia: 0.
- Różnych pojęć, o które pytano: 867; średnio 1.59 pojęcia na pytanie.

## Weryfikacja ręczna (12.10.2026)

Przejrzano ręcznie wszystkie 1656 pytań, edycja po edycji (XXXIX → XXI): treść, wszystkie odpowiedzi z zaznaczeniem poprawnych, wykryte pojęcia oraz dział i zagadnienie. Poprawiono 958 pytań (58%); pozostałe automat przypisał dobrze.

| Edycja | Pytań | Poprawionych |
|---|---|---|
| XXXIX | 90 | 41 |
| XXXVIII | 90 | 50 |
| XXXVII | 90 | 50 |
| XXXVI | 59 | 33 |
| XXXV | 90 | 57 |
| XXXIV | 90 | 53 |
| XXXIII | 60 | 30 |
| XXXII | 90 | 55 |
| XXXI | 90 | 53 |
| XXX | 90 | 56 |
| XXIX | 90 | 56 |
| XXVIII | 90 | 51 |
| XXVII | 90 | 50 |
| XXVI | 89 | 54 |
| XXV | 89 | 50 |
| XXIV | 89 | 52 |
| XXIII | 90 | 60 |
| XXII | 95 | 54 |
| XXI | 95 | 53 |

**Nowe hasła** (pytania dotyczyły czegoś, czego nie było w słowniku; fakty potwierdzone w 2 źródłach – `tools/nauka/zrozum/WERYFIKACJA.md`, każde omówione w lekcji „Zrozumienie”):

- Postęp techniczny – 3 pyt.
- Deflacja długu (I. Fisher) – 1 pyt.
- Papiery dyskontowe – 2 pyt.
- Klasyczne podejście do zarządzania – 5 pyt.
- Program leniency (łagodzenia kar) – 1 pyt.

**Typowe błędy automatu:**
- pojęcia-tło z treści liczone jako temat pytania (np. NBP, „Skarb Państwa”, inflacja, stopa procentowa, równowaga rynkowa w zadaniach o czymś innym);
- pojęcie poboczne decydowało o dziale (np. pytanie o próg zamknięcia zaliczone do kosztów zmiennych, pytanie o histerezę do cyklu koniunkturalnego);
- ogólne hasło zamiast konkretnego (np. „Podatek” zamiast „Klin podatkowy”, „Popyt” zamiast „Czynniki kształtujące popyt”, „Inwestycje” zamiast „Krańcowa efektywność kapitału”);
- dopasowania słów w innym znaczeniu (np. „strategia parasola” → „Fundusz parasolowy”, „nadgodziny” → „Urlop wypoczynkowy i czas pracy” w pytaniu o krótki okres, „agent ubezpieczeniowy” → „Ubezpieczenie” w pytaniu o bezrobocie strukturalne).

**Przypisania dyskusyjne** (brak osobnego hasła – za mało pytań lub brak 2 rzetelnych źródeł):
- owe31-o-22 „nowy konserwatyzm fiskalny” → Rola państwa w gospodarce, Funkcje finansów publicznych (Musgrave);
- owe31-c-05 „krzywa wykonalności” (Stiglitz) → Dobra publiczne, Krzywa możliwości produkcyjnych;
- owe24-o-09 „produkt globalny” → Wartość dodana, Metody liczenia PKB;
- owe22-c-27 „strategia parasola” (cenowa) → Strategie cenowe;
- owe21-c-16 „rezerwa rewaluacyjna NBP” → Bilans banku centralnego, Rezerwy walutowe.

## Działy

| Dział | Pytań | % | jednokrotny | wielokrotny |
|---|---|---|---|---|
| Mikroekonomia | 444 | 26.8% | 305 | 139 |
| Podstawy finansów | 383 | 23.1% | 262 | 121 |
| Makroekonomia | 354 | 21.4% | 248 | 106 |
| Zarządzanie | 246 | 14.9% | 174 | 72 |
| Polityka gospodarcza | 124 | 7.5% | 83 | 41 |
| Finanse przedsiębiorstw | 103 | 6.2% | 73 | 30 |
| Temat przewodni: Gospodarka wobec wyzwań demograficznych | 2 | 0.1% | 2 | 0 |

## Zagadnienia (30 najczęstszych)

| Zagadnienie | Dział | Pytań |
|---|---|---|
| Produkcja i koszty | Mikroekonomia | 115 |
| Struktury rynku i strategie firm | Mikroekonomia | 78 |
| Rynek finansowy i kapitałowy | Podstawy finansów | 68 |
| Konsumpcja, inwestycje i mnożnik | Makroekonomia | 62 |
| Rynek pracy i bezrobocie | Makroekonomia | 59 |
| Motywacja, przywództwo i zespoły | Zarządzanie | 59 |
| Fundusze, derywaty i ryzyko | Podstawy finansów | 55 |
| Planowanie i strategia | Zarządzanie | 54 |
| Popyt, podaż i równowaga | Mikroekonomia | 53 |
| Pieniądz i jego funkcje | Podstawy finansów | 52 |
| Polityka pieniężna | Polityka gospodarcza | 51 |
| Inflacja i ceny | Makroekonomia | 49 |
| Elastyczność i rodzaje dóbr | Mikroekonomia | 48 |
| Podatki | Podstawy finansów | 47 |
| Teoria konsumenta | Mikroekonomia | 44 |
| Rachunkowość i sprawozdania finansowe | Finanse przedsiębiorstw | 44 |
| Bilans płatniczy i kursy walut | Makroekonomia | 43 |
| Istota zarządzania i szkoły | Zarządzanie | 41 |
| Efektywność, zawodności rynku i państwa | Mikroekonomia | 39 |
| Finanse publiczne i budżet | Podstawy finansów | 39 |
| Podstawy ekonomii i wybór | Mikroekonomia | 39 |
| Rachunek narodowy i PKB | Makroekonomia | 38 |
| Banki i system bankowy | Podstawy finansów | 36 |
| Obligacje, procent i wartość pieniądza w czasie | Podstawy finansów | 32 |
| Instytucje | Podstawy finansów | 30 |
| Decyzje, kontrola i jakość | Zarządzanie | 29 |
| Integracja europejska i UE | Polityka gospodarcza | 27 |
| IS-LM, AD-AS i równowaga | Makroekonomia | 27 |
| Handel międzynarodowy | Makroekonomia | 25 |
| Organizowanie i struktury | Zarządzanie | 25 |

## Pojęcia (150 najczęstszych)

| # | Pojęcie | Rodzaj | Dział | Razem | jedn. | wiel. |
|---|---|---|---|---|---|---|
| 1 | Konkurencja doskonała | pojecie | Mikroekonomia | 31 | 23 | 8 |
| 2 | Monopol | pojecie | Mikroekonomia | 29 | 19 | 10 |
| 3 | Koszt krańcowy (MC) | pojecie | Mikroekonomia | 26 | 18 | 8 |
| 4 | Koszt całkowity (TC) i przeciętny koszt całkowity (ATC) | pojecie | Mikroekonomia | 26 | 19 | 7 |
| 5 | Koszty zmienne (VC) | pojecie | Mikroekonomia | 21 | 16 | 5 |
| 6 | Koszty stałe (FC) | pojecie | Mikroekonomia | 21 | 19 | 2 |
| 7 | Utarg (przychód) całkowity, przeciętny i krańcowy | pojecie | Mikroekonomia | 21 | 18 | 3 |
| 8 | Narodowy Bank Polski (NBP) | instytucja | Podstawy finansów | 19 | 13 | 6 |
| 9 | Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS) | pojecie | Makroekonomia | 18 | 11 | 7 |
| 10 | Zysk ekonomiczny (nadzwyczajny) | pojecie | Mikroekonomia | 17 | 9 | 8 |
| 11 | Produkt krajowy brutto (PKB) | pojecie | Makroekonomia | 17 | 15 | 2 |
| 12 | Krzywa obojętności | pojecie | Mikroekonomia | 16 | 8 | 8 |
| 13 | Konkurencja monopolistyczna | pojecie | Mikroekonomia | 16 | 13 | 3 |
| 14 | Polityka pieniężna – cele i instrumenty | pojecie | Polityka gospodarcza | 15 | 10 | 5 |
| 15 | Warunek maksymalizacji zysku | pojecie | Mikroekonomia | 14 | 10 | 4 |
| 16 | Elastyczność cenowa popytu | pojecie | Mikroekonomia | 14 | 9 | 5 |
| 17 | Obligacja | pojecie | Podstawy finansów | 13 | 11 | 2 |
| 18 | Typy struktur organizacyjnych | pojecie | Zarządzanie | 12 | 10 | 2 |
| 19 | Podaż pieniądza (nominalna i realna) | pojecie | Podstawy finansów | 12 | 9 | 3 |
| 20 | Linia ograniczenia budżetowego | pojecie | Mikroekonomia | 12 | 7 | 5 |
| 21 | Koszt alternatywny (koszt utraconych możliwości) | pojecie | Mikroekonomia | 12 | 5 | 7 |
| 22 | Izokwanta | pojecie | Mikroekonomia | 11 | 5 | 6 |
| 23 | Krzywa Phillipsa | pojecie | Makroekonomia | 11 | 8 | 3 |
| 24 | Rada Polityki Pieniężnej (RPP) | instytucja | Podstawy finansów | 11 | 9 | 2 |
| 25 | Krzywa możliwości produkcyjnych (granica możliwości produkcyjnych) | pojecie | Mikroekonomia | 11 | 7 | 4 |
| 26 | Aprecjacja i deprecjacja | pojecie | Makroekonomia | 11 | 9 | 2 |
| 27 | Naturalna stopa bezrobocia | pojecie | Makroekonomia | 11 | 7 | 4 |
| 28 | Metody liczenia PKB | pojecie | Makroekonomia | 11 | 10 | 1 |
| 29 | Czynniki kształtujące podaż (determinanty podaży) | pojecie | Mikroekonomia | 10 | 7 | 3 |
| 30 | Produkt potencjalny i luka PKB (popytowa) | pojecie | Makroekonomia | 10 | 4 | 6 |
| 31 | Oszczędności narodowe (prywatne i publiczne) | pojecie | Makroekonomia | 10 | 5 | 5 |
| 32 | Mnożnik (inwestycyjny, wydatkowy) | pojecie | Makroekonomia | 10 | 7 | 3 |
| 33 | Naukowe zarządzanie (F.W. Taylor) | pojecie | Zarządzanie | 10 | 8 | 2 |
| 34 | Zysk normalny | pojecie | Mikroekonomia | 9 | 3 | 6 |
| 35 | Dobra publiczne | pojecie | Mikroekonomia | 9 | 6 | 3 |
| 36 | Produkt całkowity, przeciętny i krańcowy | pojecie | Mikroekonomia | 9 | 7 | 2 |
| 37 | Krótki okres i długi okres | pojecie | Mikroekonomia | 9 | 7 | 2 |
| 38 | Zagregowany popyt (AD) | pojecie | Makroekonomia | 9 | 7 | 2 |
| 39 | Polityka fiskalna (budżetowa) | pojecie | Polityka gospodarcza | 9 | 8 | 1 |
| 40 | Opcja | pojecie | Podstawy finansów | 9 | 4 | 5 |
| 41 | Akcja | pojecie | Podstawy finansów | 9 | 7 | 2 |
| 42 | Teoria ilościowa pieniądza (równanie wymiany Fishera) | pojecie | Makroekonomia | 9 | 8 | 1 |
| 43 | Współczynnik Giniego i krzywa Lorenza | pojecie | Makroekonomia | 9 | 6 | 3 |
| 44 | Równowaga konsumenta (II prawo Gossena) | pojecie | Mikroekonomia | 8 | 5 | 3 |
| 45 | Dywidenda | pojecie | Podstawy finansów | 8 | 4 | 4 |
| 46 | Substytuty | pojecie | Mikroekonomia | 8 | 5 | 3 |
| 47 | Deficyt budżetowy i deficyt sektora finansów publicznych | pojecie | Podstawy finansów | 8 | 7 | 1 |
| 48 | Rezerwa obowiązkowa | pojecie | Polityka gospodarcza | 8 | 3 | 5 |
| 49 | Bilans handlowy | pojecie | Makroekonomia | 8 | 5 | 3 |
| 50 | Efekty zewnętrzne (externalities) | pojecie | Mikroekonomia | 8 | 4 | 4 |
| 51 | Popyt na pieniądz (preferencja płynności) | pojecie | Podstawy finansów | 8 | 6 | 2 |
| 52 | Amortyzacja | pojecie | Finanse przedsiębiorstw | 8 | 4 | 4 |
| 53 | Funkcja konsumpcji (keynesowska) | pojecie | Makroekonomia | 8 | 3 | 5 |
| 54 | Kurs walutowy | pojecie | Makroekonomia | 8 | 7 | 1 |
| 55 | Inwestycje | pojecie | Makroekonomia | 8 | 6 | 2 |
| 56 | Bezrobocie strukturalne | pojecie | Makroekonomia | 8 | 3 | 5 |
| 57 | Operacje otwartego rynku (OOR) | pojecie | Polityka gospodarcza | 8 | 5 | 3 |
| 58 | Zagregowana podaż (AS) | pojecie | Makroekonomia | 8 | 6 | 2 |
| 59 | Hierarchia potrzeb Maslowa | pojecie | Zarządzanie | 8 | 6 | 2 |
| 60 | Ścieżka dochód–konsumpcja i krzywa Engla | pojecie | Mikroekonomia | 8 | 6 | 2 |
| 61 | Agregaty pieniężne (NBP) | pojecie | Podstawy finansów | 7 | 3 | 4 |
| 62 | Ludność aktywna zawodowo (zasób siły roboczej) | pojecie | Makroekonomia | 7 | 5 | 2 |
| 63 | Metody twórczego rozwiązywania problemów | pojecie | Zarządzanie | 7 | 5 | 2 |
| 64 | Czynniki kształtujące popyt (determinanty popytu) | pojecie | Mikroekonomia | 7 | 6 | 1 |
| 65 | Bezrobocie frykcyjne | pojecie | Makroekonomia | 7 | 4 | 3 |
| 66 | Baza monetarna (M0, pieniądz wielkiej mocy) | pojecie | Podstawy finansów | 7 | 5 | 2 |
| 67 | Giełda Papierów Wartościowych w Warszawie (GPW) | instytucja | Podstawy finansów | 7 | 7 | 0 |
| 68 | Zarządzanie administracyjne (teoria administracji) | pojecie | Zarządzanie | 7 | 5 | 2 |
| 69 | Produkt narodowy brutto (PNB, DNB) | pojecie | Makroekonomia | 7 | 5 | 2 |
| 70 | Obligacja zerokuponowa | pojecie | Podstawy finansów | 7 | 4 | 3 |
| 71 | Stopy procentowe NBP | pojecie | Polityka gospodarcza | 7 | 5 | 2 |
| 72 | Dług publiczny | pojecie | Podstawy finansów | 7 | 5 | 2 |
| 73 | Użyteczność | pojecie | Mikroekonomia | 7 | 4 | 3 |
| 74 | Cło | pojecie | Podstawy finansów | 7 | 4 | 3 |
| 75 | Elastyczność dochodowa popytu | pojecie | Mikroekonomia | 7 | 5 | 2 |
| 76 | Dobro niższego rzędu (podrzędne) | pojecie | Mikroekonomia | 7 | 5 | 2 |
| 77 | Dyskryminacja (różnicowanie) cenowa | pojecie | Mikroekonomia | 7 | 4 | 3 |
| 78 | Keynesizm | pojecie | Makroekonomia | 7 | 7 | 0 |
| 79 | Polityka ekspansywna i restrykcyjna | pojecie | Polityka gospodarcza | 7 | 5 | 2 |
| 80 | Bilans | pojecie | Finanse przedsiębiorstw | 7 | 6 | 1 |
| 81 | Podatek progresywny, proporcjonalny (liniowy) i regresywny | pojecie | Podstawy finansów | 7 | 5 | 2 |
| 82 | Efekt substytucyjny i efekt dochodowy | pojecie | Mikroekonomia | 7 | 1 | 6 |
| 83 | Bilans płatniczy | pojecie | Makroekonomia | 7 | 4 | 3 |
| 84 | Dobro normalne | pojecie | Mikroekonomia | 7 | 6 | 1 |
| 85 | Friedman Milton | osoba | Makroekonomia | 7 | 5 | 2 |
| 86 | Motywacja | pojecie | Zarządzanie | 7 | 5 | 2 |
| 87 | Analiza fundamentalna i techniczna | pojecie | Podstawy finansów | 7 | 6 | 1 |
| 88 | Histereza bezrobocia | pojecie | Makroekonomia | 7 | 2 | 5 |
| 89 | Inflacja | pojecie | Makroekonomia | 7 | 7 | 0 |
| 90 | Koszty inflacji | pojecie | Makroekonomia | 7 | 5 | 2 |
| 91 | Zysk księgowy | pojecie | Mikroekonomia | 6 | 1 | 5 |
| 92 | Stagflacja i slumpflacja | pojecie | Makroekonomia | 6 | 3 | 3 |
| 93 | Rachunek przepływów pieniężnych (cash flow) | pojecie | Finanse przedsiębiorstw | 6 | 3 | 3 |
| 94 | Dobra komplementarne | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 95 | PKB per capita i parytet siły nabywczej (PPP) | pojecie | Makroekonomia | 6 | 5 | 1 |
| 96 | Dochody i wydatki budżetu państwa | pojecie | Podstawy finansów | 6 | 5 | 1 |
| 97 | Fundusz inwestycyjny | pojecie | Podstawy finansów | 6 | 6 | 0 |
| 98 | Otwarte fundusze emerytalne (OFE) | pojecie | Podstawy finansów | 6 | 4 | 2 |
| 99 | Macierz BCG | pojecie | Zarządzanie | 6 | 4 | 2 |
| 100 | Kontrakt terminowy (futures i forward) | pojecie | Podstawy finansów | 6 | 4 | 2 |
| 101 | Analiza SWOT | pojecie | Zarządzanie | 6 | 5 | 1 |
| 102 | Równowaga rynkowa | pojecie | Mikroekonomia | 6 | 2 | 4 |
| 103 | Elastyczność cenowa podaży | pojecie | Mikroekonomia | 6 | 3 | 3 |
| 104 | Saldo obrotów bieżących | pojecie | Makroekonomia | 6 | 3 | 3 |
| 105 | Samorząd terytorialny w Polsce | pojecie | Podstawy finansów | 6 | 2 | 4 |
| 106 | Elastyczność a utarg | pojecie | Mikroekonomia | 6 | 5 | 1 |
| 107 | Dobra mieszane: klubowe i wspólne | pojecie | Mikroekonomia | 6 | 6 | 0 |
| 108 | Recesja i depresja | pojecie | Makroekonomia | 6 | 4 | 2 |
| 109 | Model IS-LM | pojecie | Makroekonomia | 6 | 4 | 2 |
| 110 | Automatyczne stabilizatory | pojecie | Polityka gospodarcza | 6 | 6 | 0 |
| 111 | Próg rentowności (BEP) | pojecie | Mikroekonomia | 6 | 6 | 0 |
| 112 | Nadwyżka konsumenta | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 113 | Krańcowa stopa technicznej substytucji (MRTS) | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 114 | Wartość krańcowego produktu pracy (VMPL) i przychód z krańcowego produktu (MRPL) | pojecie | Mikroekonomia | 6 | 2 | 4 |
| 115 | Odpływy kapitałowe netto (NCO) | pojecie | Makroekonomia | 6 | 3 | 3 |
| 116 | Stopa bezrobocia | pojecie | Makroekonomia | 6 | 5 | 1 |
| 117 | Krótkookresowe i długookresowe krzywe kosztów | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 118 | Kartel | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 119 | Dobro Veblena (efekt Veblena) | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 120 | Podatek akcyzowy (akcyza) | pojecie | Podstawy finansów | 6 | 4 | 2 |
| 121 | Rozkład ciężaru podatku (incydencja podatkowa) | pojecie | Mikroekonomia | 6 | 3 | 3 |
| 122 | Pasywa: kapitał własny i zobowiązania | pojecie | Finanse przedsiębiorstw | 6 | 5 | 1 |
| 123 | Otoczenie organizacji | pojecie | Zarządzanie | 6 | 4 | 2 |
| 124 | Strategia bezpośredniego celu inflacyjnego (BCI) | pojecie | Polityka gospodarcza | 6 | 6 | 0 |
| 125 | Wskaźniki rentowności (ROA, ROE, ROS) | pojecie | Finanse przedsiębiorstw | 6 | 5 | 1 |
| 126 | Zbędna strata społeczna (strata martwa, deadweight loss) | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 127 | Keynes John Maynard | osoba | Makroekonomia | 6 | 5 | 1 |
| 128 | Duopol | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 129 | Bony pieniężne NBP | pojecie | Polityka gospodarcza | 6 | 4 | 2 |
| 130 | Inflacja oczekiwana i nieoczekiwana | pojecie | Makroekonomia | 5 | 3 | 2 |
| 131 | Oligopol | pojecie | Mikroekonomia | 5 | 4 | 1 |
| 132 | Elastyczność mieszana (krzyżowa) popytu | pojecie | Mikroekonomia | 5 | 4 | 1 |
| 133 | Spółki osobowe (KSH) | pojecie | Finanse przedsiębiorstw | 5 | 3 | 2 |
| 134 | Podatki bezpośrednie i pośrednie | pojecie | Podstawy finansów | 5 | 4 | 1 |
| 135 | Klasyczne podejście do zarządzania | pojecie | Zarządzanie | 5 | 4 | 1 |
| 136 | Monopol naturalny | pojecie | Mikroekonomia | 5 | 4 | 1 |
| 137 | Próg zamknięcia (punkt zamknięcia) | pojecie | Mikroekonomia | 5 | 2 | 3 |
| 138 | Produkt narodowy netto (PNN) | pojecie | Makroekonomia | 5 | 3 | 2 |
| 139 | Wielkość popytu a popyt | pojecie | Mikroekonomia | 5 | 3 | 2 |
| 140 | Obligacje skarbowe (detaliczne i hurtowe) | pojecie | Podstawy finansów | 5 | 3 | 2 |
| 141 | Popyt na pracę | pojecie | Mikroekonomia | 5 | 2 | 3 |
| 142 | Krzywa Beveridge’a | pojecie | Makroekonomia | 5 | 1 | 4 |
| 143 | Cykl koniunkturalny | pojecie | Makroekonomia | 5 | 3 | 2 |
| 144 | Funkcje zarządzania | pojecie | Zarządzanie | 5 | 4 | 1 |
| 145 | Strategie konkurencji Portera | pojecie | Zarządzanie | 5 | 3 | 2 |
| 146 | Monopson | pojecie | Mikroekonomia | 5 | 5 | 0 |
| 147 | Wartość dodana | pojecie | Makroekonomia | 5 | 4 | 1 |
| 148 | Hiperinflacja | pojecie | Makroekonomia | 5 | 5 | 0 |
| 149 | System kursu płynnego i stałego | pojecie | Makroekonomia | 5 | 3 | 2 |
| 150 | Bony skarbowe | pojecie | Podstawy finansów | 5 | 4 | 1 |
