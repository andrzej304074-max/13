# Raport: statystyki pytań OWE (XXI–XXXIX)

Dane zakładki „Pojęcia → Statystyki pytań OWE” (`data/nauka/owe-stats.json`, generuje `tools/nauka/build_course.py`).

**Jak liczone:**
- dział i zagadnienie pytania – lekcja kursu, do której build przydziela pytanie (jedna na pytanie, więc procenty działów sumują się do 100);
- pojęcia pytania – hasła wykryte w treści i w poprawnych odpowiedziach (`tools/nauka/pojecia_pytan.py`, ręczne korekty w `pojecia_pytan_poprawki.py` z przeglądu wszystkich pytań XXI–XXXIX); pojęcia dodane do pytania tylko po to, by lekcja omówiła błędne odpowiedzi, nie liczą się;
- hasła ogólne, będące zwykle tłem pytania (`STAT_GENERIC`), liczą się tylko wtedy, gdy pytanie nie dotyczy niczego konkretniejszego: Autarkia, Bank centralny, Branża (sektor), Ceteris paribus, Czynniki wytwórcze (czynniki produkcji), Dochód osobisty i dochód rozporządzalny, Ekonomia, Inwestycje, Konsumpcja, Krótki okres i długi okres, Papier wartościowy, Pieniądz, Podatek, Podaż, Popyt, Transfery socjalne, Wykresy w ekonomii: nachylenie i układ współrzędnych;
- podobne pytania z różnych edycji liczą się osobno (3 pytania o to samo pojęcie = 3).

**Kontrola ręczna (12.10.2026):** przejrzano próbki pytań dla 150 najczęstszych pojęć; poprawiono fałszywe dopasowania (m.in. „stopa procentowa ubezpieczenia” → składka, nie stopa procentowa; aktywa/pasywa w bilansie płatniczym) i dodano hasła-tło (np. „Autarkia” w zadaniach z modelem gospodarki, „Transfery socjalne” i „Dochód rozporządzalny” z opisów zmiennych).

## Podsumowanie

- Pytań: 1656 (jednokrotnego wyboru: 1147, wielokrotnego: 509).
- Pytań bez rozpoznanego pojęcia: 0.
- Różnych pojęć, o które pytano: 858; średnio 1.89 pojęcia na pytanie.

## Działy

| Dział | Pytań | % | jednokrotny | wielokrotny |
|---|---|---|---|---|
| Mikroekonomia | 455 | 27.5% | 307 | 148 |
| Podstawy finansów | 437 | 26.4% | 298 | 139 |
| Makroekonomia | 343 | 20.7% | 246 | 97 |
| Zarządzanie | 247 | 14.9% | 172 | 75 |
| Finanse przedsiębiorstw | 94 | 5.7% | 65 | 29 |
| Polityka gospodarcza | 80 | 4.8% | 59 | 21 |

## Zagadnienia (30 najczęstszych)

| Zagadnienie | Dział | Pytań |
|---|---|---|
| Struktury rynku i strategie firm | Mikroekonomia | 105 |
| Produkcja i koszty | Mikroekonomia | 103 |
| Rynek finansowy i kapitałowy | Podstawy finansów | 87 |
| Finanse publiczne i budżet | Podstawy finansów | 68 |
| Fundusze, derywaty i ryzyko | Podstawy finansów | 66 |
| Motywacja, przywództwo i zespoły | Zarządzanie | 65 |
| Banki i system bankowy | Podstawy finansów | 64 |
| Inflacja i ceny | Makroekonomia | 54 |
| Planowanie i strategia | Zarządzanie | 51 |
| Popyt, podaż i równowaga | Mikroekonomia | 48 |
| Pieniądz i jego funkcje | Podstawy finansów | 47 |
| Bilans płatniczy i kursy walut | Makroekonomia | 46 |
| Elastyczność i rodzaje dóbr | Mikroekonomia | 44 |
| Podatki | Podstawy finansów | 44 |
| Efektywność, zawodności rynku i państwa | Mikroekonomia | 43 |
| Teoria konsumenta | Mikroekonomia | 43 |
| Rynek pracy i bezrobocie | Makroekonomia | 43 |
| Handel międzynarodowy | Makroekonomia | 41 |
| Decyzje, kontrola i jakość | Zarządzanie | 40 |
| Konsumpcja, inwestycje i mnożnik | Makroekonomia | 39 |
| Rachunkowość i sprawozdania finansowe | Finanse przedsiębiorstw | 35 |
| Polityka pieniężna | Polityka gospodarcza | 34 |
| Podstawy ekonomii i wybór | Mikroekonomia | 31 |
| Formy prawne i prawo gospodarcze | Finanse przedsiębiorstw | 30 |
| Wzrost, rozwój i nierówności | Makroekonomia | 29 |
| Integracja europejska i UE | Polityka gospodarcza | 27 |
| Rachunek narodowy i PKB | Makroekonomia | 27 |
| Istota zarządzania i szkoły | Zarządzanie | 26 |
| Marketing | Zarządzanie | 25 |
| Szkoły i historia myśli ekonomicznej | Makroekonomia | 24 |

## Pojęcia (150 najczęstszych)

| # | Pojęcie | Rodzaj | Dział | Razem | jedn. | wiel. |
|---|---|---|---|---|---|---|
| 1 | Produkt krajowy brutto (PKB) | pojecie | Makroekonomia | 53 | 41 | 12 |
| 2 | Koszt krańcowy (MC) | pojecie | Mikroekonomia | 45 | 30 | 15 |
| 3 | Inflacja | pojecie | Makroekonomia | 44 | 33 | 11 |
| 4 | Koszt całkowity (TC) i przeciętny koszt całkowity (ATC) | pojecie | Mikroekonomia | 38 | 31 | 7 |
| 5 | Stopa procentowa nominalna i realna | pojecie | Podstawy finansów | 38 | 21 | 17 |
| 6 | Narodowy Bank Polski (NBP) | instytucja | Podstawy finansów | 36 | 24 | 12 |
| 7 | Utarg (przychód) całkowity, przeciętny i krańcowy | pojecie | Mikroekonomia | 34 | 27 | 7 |
| 8 | Akcja | pojecie | Podstawy finansów | 34 | 21 | 13 |
| 9 | Polityka pieniężna – cele i instrumenty | pojecie | Polityka gospodarcza | 34 | 19 | 15 |
| 10 | Równowaga rynkowa | pojecie | Mikroekonomia | 33 | 20 | 13 |
| 11 | Konkurencja doskonała | pojecie | Mikroekonomia | 32 | 21 | 11 |
| 12 | Monopol | pojecie | Mikroekonomia | 30 | 20 | 10 |
| 13 | Obligacja | pojecie | Podstawy finansów | 24 | 16 | 8 |
| 14 | Koszty zmienne (VC) | pojecie | Mikroekonomia | 24 | 18 | 6 |
| 15 | Stopa bezrobocia | pojecie | Makroekonomia | 21 | 15 | 6 |
| 16 | Budżet państwa | pojecie | Podstawy finansów | 19 | 15 | 4 |
| 17 | Ubezpieczenie | pojecie | Podstawy finansów | 19 | 10 | 9 |
| 18 | Elastyczność cenowa popytu | pojecie | Mikroekonomia | 18 | 12 | 6 |
| 19 | Pasywa: kapitał własny i zobowiązania | pojecie | Finanse przedsiębiorstw | 18 | 15 | 3 |
| 20 | Konkurencja monopolistyczna | pojecie | Mikroekonomia | 17 | 14 | 3 |
| 21 | Podaż pieniądza (nominalna i realna) | pojecie | Podstawy finansów | 17 | 11 | 6 |
| 22 | Zysk ekonomiczny (nadzwyczajny) | pojecie | Mikroekonomia | 16 | 8 | 8 |
| 23 | Popyt | pojecie | Mikroekonomia | 16 | 10 | 6 |
| 24 | Koszty stałe (FC) | pojecie | Mikroekonomia | 16 | 14 | 2 |
| 25 | Oszczędności narodowe (prywatne i publiczne) | pojecie | Makroekonomia | 16 | 7 | 9 |
| 26 | Krzywa obojętności | pojecie | Mikroekonomia | 15 | 7 | 8 |
| 27 | Bank komercyjny (uniwersalny) | pojecie | Podstawy finansów | 15 | 10 | 5 |
| 28 | Giełda Papierów Wartościowych w Warszawie (GPW) | instytucja | Podstawy finansów | 15 | 13 | 2 |
| 29 | Użyteczność | pojecie | Mikroekonomia | 14 | 8 | 6 |
| 30 | Wielkość popytu a popyt | pojecie | Mikroekonomia | 14 | 9 | 5 |
| 31 | Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS) | pojecie | Makroekonomia | 13 | 8 | 5 |
| 32 | Motywacja | pojecie | Zarządzanie | 13 | 9 | 4 |
| 33 | Fundusz inwestycyjny | pojecie | Podstawy finansów | 12 | 8 | 4 |
| 34 | Recesja i depresja | pojecie | Makroekonomia | 12 | 6 | 6 |
| 35 | Samorząd terytorialny w Polsce | pojecie | Podstawy finansów | 12 | 5 | 7 |
| 36 | Deficyt budżetowy i deficyt sektora finansów publicznych | pojecie | Podstawy finansów | 12 | 9 | 3 |
| 37 | Naukowe zarządzanie (F.W. Taylor) | pojecie | Zarządzanie | 12 | 10 | 2 |
| 38 | Podaż | pojecie | Mikroekonomia | 12 | 8 | 4 |
| 39 | Opcja | pojecie | Podstawy finansów | 12 | 6 | 6 |
| 40 | Kurs walutowy | pojecie | Makroekonomia | 12 | 8 | 4 |
| 41 | Dywidenda | pojecie | Podstawy finansów | 11 | 6 | 5 |
| 42 | Krzywa Phillipsa | pojecie | Makroekonomia | 11 | 8 | 3 |
| 43 | Aprecjacja i deprecjacja | pojecie | Makroekonomia | 11 | 9 | 2 |
| 44 | Spółki kapitałowe (KSH) | pojecie | Finanse przedsiębiorstw | 11 | 5 | 6 |
| 45 | Organizowanie i struktura organizacyjna | pojecie | Zarządzanie | 11 | 9 | 2 |
| 46 | Unia Europejska – historia | pojecie | Polityka gospodarcza | 11 | 8 | 3 |
| 47 | Dług publiczny | pojecie | Podstawy finansów | 11 | 7 | 4 |
| 48 | Warunek maksymalizacji zysku | pojecie | Mikroekonomia | 11 | 8 | 3 |
| 49 | Naturalna stopa bezrobocia | pojecie | Makroekonomia | 10 | 6 | 4 |
| 50 | Produkt potencjalny i luka PKB (popytowa) | pojecie | Makroekonomia | 10 | 4 | 6 |
| 51 | Rachunek przepływów pieniężnych (cash flow) | pojecie | Finanse przedsiębiorstw | 10 | 4 | 6 |
| 52 | Obligacje skarbowe (detaliczne i hurtowe) | pojecie | Podstawy finansów | 10 | 5 | 5 |
| 53 | Rada Polityki Pieniężnej (RPP) | instytucja | Podstawy finansów | 10 | 8 | 2 |
| 54 | Krzywa możliwości produkcyjnych (granica możliwości produkcyjnych) | pojecie | Mikroekonomia | 10 | 7 | 3 |
| 55 | Rezerwa obowiązkowa | pojecie | Polityka gospodarcza | 10 | 5 | 5 |
| 56 | Keynesizm | pojecie | Makroekonomia | 10 | 10 | 0 |
| 57 | Linia ograniczenia budżetowego | pojecie | Mikroekonomia | 10 | 5 | 5 |
| 58 | Rynek kapitałowy | pojecie | Podstawy finansów | 10 | 7 | 3 |
| 59 | Koszt alternatywny (koszt utraconych możliwości) | pojecie | Mikroekonomia | 10 | 6 | 4 |
| 60 | Zagregowany popyt (AD) | pojecie | Makroekonomia | 10 | 7 | 3 |
| 61 | Sektor finansów publicznych | pojecie | Podstawy finansów | 10 | 8 | 2 |
| 62 | Izokwanta | pojecie | Mikroekonomia | 9 | 4 | 5 |
| 63 | Zysk normalny | pojecie | Mikroekonomia | 9 | 3 | 6 |
| 64 | Dobra publiczne | pojecie | Mikroekonomia | 9 | 6 | 3 |
| 65 | Popyt na pieniądz (preferencja płynności) | pojecie | Podstawy finansów | 9 | 6 | 3 |
| 66 | Aktywa trwałe i obrotowe | pojecie | Finanse przedsiębiorstw | 9 | 5 | 4 |
| 67 | Stopy procentowe NBP | pojecie | Polityka gospodarcza | 9 | 6 | 3 |
| 68 | Planowanie | pojecie | Zarządzanie | 9 | 6 | 3 |
| 69 | Otoczenie organizacji | pojecie | Zarządzanie | 9 | 5 | 4 |
| 70 | Teoria ilościowa pieniądza (równanie wymiany Fishera) | pojecie | Makroekonomia | 9 | 8 | 1 |
| 71 | Podejmowanie decyzji | pojecie | Zarządzanie | 9 | 7 | 2 |
| 72 | Współczynnik Giniego i krzywa Lorenza | pojecie | Makroekonomia | 9 | 6 | 3 |
| 73 | Obligacja zerokuponowa | pojecie | Podstawy finansów | 8 | 4 | 4 |
| 74 | Upadłość i restrukturyzacja | pojecie | Finanse przedsiębiorstw | 8 | 4 | 4 |
| 75 | Produkt całkowity, przeciętny i krańcowy | pojecie | Mikroekonomia | 8 | 6 | 2 |
| 76 | Pożyczka a kredyt | pojecie | Podstawy finansów | 8 | 5 | 3 |
| 77 | Podatek | pojecie | Podstawy finansów | 8 | 7 | 1 |
| 78 | Bilans handlowy | pojecie | Makroekonomia | 8 | 6 | 2 |
| 79 | Style kierowania: autokratyczny, demokratyczny, liberalny | pojecie | Zarządzanie | 8 | 5 | 3 |
| 80 | Typy struktur organizacyjnych | pojecie | Zarządzanie | 8 | 6 | 2 |
| 81 | Polityka fiskalna (budżetowa) | pojecie | Polityka gospodarcza | 8 | 6 | 2 |
| 82 | Cło | pojecie | Podstawy finansów | 8 | 5 | 3 |
| 83 | Innowacja | pojecie | Zarządzanie | 8 | 3 | 5 |
| 84 | Cykl koniunkturalny | pojecie | Makroekonomia | 8 | 5 | 3 |
| 85 | Krótkookresowe i długookresowe krzywe kosztów | pojecie | Mikroekonomia | 8 | 4 | 4 |
| 86 | Hierarchia potrzeb Maslowa | pojecie | Zarządzanie | 8 | 6 | 2 |
| 87 | Ścieżka dochód–konsumpcja i krzywa Engla | pojecie | Mikroekonomia | 8 | 6 | 2 |
| 88 | Mnożnik (inwestycyjny, wydatkowy) | pojecie | Makroekonomia | 8 | 6 | 2 |
| 89 | Zysk księgowy | pojecie | Mikroekonomia | 7 | 2 | 5 |
| 90 | Agregaty pieniężne (NBP) | pojecie | Podstawy finansów | 7 | 3 | 4 |
| 91 | Punkt procentowy a procent | pojecie | Mikroekonomia | 7 | 6 | 1 |
| 92 | Ludność aktywna zawodowo (zasób siły roboczej) | pojecie | Makroekonomia | 7 | 5 | 2 |
| 93 | Rynek międzybankowy | pojecie | Podstawy finansów | 7 | 4 | 3 |
| 94 | Pieniądz gotówkowy i bezgotówkowy (bankowy) | pojecie | Podstawy finansów | 7 | 6 | 1 |
| 95 | PKB per capita i parytet siły nabywczej (PPP) | pojecie | Makroekonomia | 7 | 6 | 1 |
| 96 | Otwarte fundusze emerytalne (OFE) | pojecie | Podstawy finansów | 7 | 5 | 2 |
| 97 | Substytuty | pojecie | Mikroekonomia | 7 | 4 | 3 |
| 98 | Kontrakt terminowy (futures i forward) | pojecie | Podstawy finansów | 7 | 5 | 2 |
| 99 | Efekty zewnętrzne (externalities) | pojecie | Mikroekonomia | 7 | 4 | 3 |
| 100 | Amortyzacja | pojecie | Finanse przedsiębiorstw | 7 | 4 | 3 |
| 101 | Produkt narodowy brutto (PNB, DNB) | pojecie | Makroekonomia | 7 | 4 | 3 |
| 102 | Polityka ekspansywna i restrykcyjna | pojecie | Polityka gospodarcza | 7 | 5 | 2 |
| 103 | Euro | pojecie | Polityka gospodarcza | 7 | 7 | 0 |
| 104 | Bilans | pojecie | Finanse przedsiębiorstw | 7 | 6 | 1 |
| 105 | Spekulacja | pojecie | Podstawy finansów | 7 | 5 | 2 |
| 106 | Podatek progresywny, proporcjonalny (liniowy) i regresywny | pojecie | Podstawy finansów | 7 | 5 | 2 |
| 107 | Wynik finansowy – poziomy | pojecie | Finanse przedsiębiorstw | 7 | 4 | 3 |
| 108 | Efekt substytucyjny i efekt dochodowy | pojecie | Mikroekonomia | 7 | 1 | 6 |
| 109 | Bilans płatniczy | pojecie | Makroekonomia | 7 | 4 | 3 |
| 110 | Strategie konkurencji Portera | pojecie | Zarządzanie | 7 | 4 | 3 |
| 111 | Dobra komplementarne | pojecie | Mikroekonomia | 7 | 5 | 2 |
| 112 | Friedman Milton | osoba | Makroekonomia | 7 | 5 | 2 |
| 113 | Analiza fundamentalna i techniczna | pojecie | Podstawy finansów | 7 | 5 | 2 |
| 114 | Zagregowana podaż (AS) | pojecie | Makroekonomia | 7 | 5 | 2 |
| 115 | Histereza bezrobocia | pojecie | Makroekonomia | 7 | 2 | 5 |
| 116 | Szok podażowy i popytowy | pojecie | Makroekonomia | 7 | 3 | 4 |
| 117 | Stagflacja i slumpflacja | pojecie | Makroekonomia | 6 | 3 | 3 |
| 118 | Metody twórczego rozwiązywania problemów | pojecie | Zarządzanie | 6 | 3 | 3 |
| 119 | Marketing | pojecie | Zarządzanie | 6 | 3 | 3 |
| 120 | Bezrobocie frykcyjne | pojecie | Makroekonomia | 6 | 4 | 2 |
| 121 | Gotówka w obiegu | pojecie | Podstawy finansów | 6 | 5 | 1 |
| 122 | Baza monetarna (M0, pieniądz wielkiej mocy) | pojecie | Podstawy finansów | 6 | 5 | 1 |
| 123 | Przedsiębiorstwo państwowe i Skarb Państwa | pojecie | Finanse przedsiębiorstw | 6 | 5 | 1 |
| 124 | Zarządzanie zasobami ludzkimi (HRM) | pojecie | Zarządzanie | 6 | 5 | 1 |
| 125 | Macierz BCG | pojecie | Zarządzanie | 6 | 4 | 2 |
| 126 | Analiza SWOT | pojecie | Zarządzanie | 6 | 5 | 1 |
| 127 | Saldo obrotów bieżących | pojecie | Makroekonomia | 6 | 3 | 3 |
| 128 | Funkcja konsumpcji (keynesowska) | pojecie | Makroekonomia | 6 | 3 | 3 |
| 129 | Dystrybucja | pojecie | Zarządzanie | 6 | 4 | 2 |
| 130 | Dobro niższego rzędu (podrzędne) | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 131 | Model IS-LM | pojecie | Makroekonomia | 6 | 4 | 2 |
| 132 | Automatyczne stabilizatory | pojecie | Polityka gospodarcza | 6 | 6 | 0 |
| 133 | Przywództwo | pojecie | Zarządzanie | 6 | 4 | 2 |
| 134 | Próg rentowności (BEP) | pojecie | Mikroekonomia | 6 | 6 | 0 |
| 135 | Nadwyżka konsumenta | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 136 | Faktura VAT i KSeF | pojecie | Podstawy finansów | 6 | 4 | 2 |
| 137 | Teorie krótkookresowej podaży zagregowanej (lepkie płace, lepkie ceny, błędne postrzeganie) | pojecie | Makroekonomia | 6 | 3 | 3 |
| 138 | Produkcja (funkcja produkcji) | pojecie | Mikroekonomia | 6 | 6 | 0 |
| 139 | Dobro Veblena (efekt Veblena) | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 140 | Podatek od towarów i usług (VAT) | pojecie | Podstawy finansów | 6 | 4 | 2 |
| 141 | Podatek akcyzowy (akcyza) | pojecie | Podstawy finansów | 6 | 4 | 2 |
| 142 | Ubezpieczenia społeczne (ZUS) | pojecie | Podstawy finansów | 6 | 4 | 2 |
| 143 | Podejście sytuacyjne | pojecie | Zarządzanie | 6 | 2 | 4 |
| 144 | Krótki okres i długi okres | pojecie | Mikroekonomia | 6 | 6 | 0 |
| 145 | Operacje otwartego rynku (OOR) | pojecie | Polityka gospodarcza | 6 | 4 | 2 |
| 146 | Zarządzanie administracyjne (teoria administracji) | pojecie | Zarządzanie | 6 | 4 | 2 |
| 147 | Wskaźniki rentowności (ROA, ROE, ROS) | pojecie | Finanse przedsiębiorstw | 6 | 5 | 1 |
| 148 | Zbędna strata społeczna (strata martwa, deadweight loss) | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 149 | Duopol | pojecie | Mikroekonomia | 6 | 4 | 2 |
| 150 | Koszty inflacji | pojecie | Makroekonomia | 6 | 5 | 1 |
