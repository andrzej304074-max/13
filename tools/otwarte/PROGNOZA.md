# Prognoza XL – własne eseje i zadania na XL OWE (2026/2027)

Plik generuje `python3 -I tools/otwarte/sprawdz_prognoze.py` (sprawdzenie + raport). Źródła treści: `tools/otwarte/prognoza/*.txt`,
zestawy JSON: `python3 -I tools/otwarte/build_prognoza.py`. W aplikacji – na listach Zadań i Esejów z etykietą „🔮 Prognoza XL (własne)”,
z filtrem źródła i osobnymi wierszami w statystykach.

## Co sprawdza skrypt

- każdy z 241 wyników liczbowych przeliczony niezależnie z danych zadania (`vars`) i wartości pośrednich (`lets`), zgodność z kluczem i tolerancją;
- sumy punktów (zadanie 15, esej 25 = teoria 15 + praktyka 10), rozwiązanie w każdym podpunkcie;
- tematy esejów: bez powtórzeń i różne od 80 tematów z kluczy OWE (podobieństwo < 0,8);
- podpowiedzi do każdego tematu (plan, typowe błędy, dane ze źródłem w nawiasie), podział etapów 17/17/16.

Hasło przewodnie XL („Gospodarka wobec wyzwań demograficznych”): **31 esejów** i **27 zadań** z 50.

Dane oznaczone w zadaniach jako umowne służą ćwiczeniom; liczby w podpowiedziach do esejów są zaokrąglone – przed użyciem warto sprawdzić najnowsze wydanie źródła.

## Etap szkolny

| Zestaw | Esej | Zadanie | Dział | Hasło |
|---|---|---|---|---|
| 01 | Starzenie się społeczeństwa – zagrożenie czy szansa dla gospodarki Polski? / Czy inflacja zawsze szkodzi gospodarce? | Struktura wieku i obciążenie demograficzne | Demografia / Demografia | 🎯 |
| 02 | Jak niska dzietność wpływa na gospodarkę i co może zrobić państwo? / Czy wolny handel jest korzystny dla wszystkich? | Współczynnik dzietności | Demografia / Demografia | 🎯 |
| 03 | Czy Polska może zastąpić brakujących pracowników imigrantami? / Rola małych i średnich przedsiębiorstw w gospodarce | Bilans repartycyjnego systemu emerytalnego | Demografia / Demografia | 🎯 |
| 04 | System emerytalny wobec starzenia się społeczeństwa / Ekonomia współdzielenia – moda czy trwała zmiana? | Emerytura w systemie zdefiniowanej składki | Demografia / Demografia | 🎯 |
| 05 | Srebrna gospodarka – jakie dobra i usługi zyskają na starzeniu się społeczeństwa? / Czy warto oszczędzać i inwestować od młodości? | Projekcja liczby ludności | Demografia / Demografia | 🎯 |
| 06 | Zdrowie jako czynnik rozwoju gospodarczego w starzejącym się społeczeństwie / Reklama – informacja czy manipulacja? | Zasoby pracy i aktywność zawodowa | Demografia / Demografia | 🎯 |
| 07 | Wyludnianie się małych miast i wsi – przyczyny, skutki i możliwe działania / Czy praca zdalna zmieni rynek pracy? | Rynek usług opiekuńczych | Demografia / Demografia | 🎯 |
| 08 | Rynek mieszkaniowy a decyzje o założeniu rodziny / Czy pieniądz gotówkowy zniknie? | Dywidenda demograficzna | Demografia / Demografia | 🎯 |
| 09 | Aktywność zawodowa osób starszych – korzyści i bariery / Konkurencja a monopol – co jest lepsze dla konsumenta? | Koszt świadczenia na dziecko | Demografia / Demografia | 🎯 |
| 10 | Czy automatyzacja i sztuczna inteligencja zrekompensują spadek liczby pracowników? / Banki – po co są gospodarce? | Popyt seniorów na usługi turystyczne | Demografia / Demografia | 🎯 |
| 11 | Bezrobocie – czy da się je całkowicie wyeliminować? / Państwo – lepszy czy gorszy przedsiębiorca niż prywatny właściciel? | Podatek akcyzowy na rynku | Makroekonomia / Mikroekonomia |  |
| 12 | Podatki – ile i jak powinno pobierać państwo? / Czy gospodarka może się rozwijać bez wzrostu konsumpcji zasobów? | PKB metodą wydatkową | Polityka gospodarcza / Makroekonomia |  |
| 13 | Polityka pieniężna – jak bank centralny wpływa na gospodarkę? / Czy warto być przedsiębiorcą? | Lokata, podatek i inflacja | Makroekonomia / Podstawy finansów |  |
| 14 | Transformacja energetyczna Polski – koszty i korzyści / Rola samorządu terytorialnego w gospodarce | Próg rentowności | Polityka gospodarcza / Finanse przedsiębiorstw |  |
| 15 | Dług publiczny – kiedy staje się problemem? / Etyka w biznesie – czy się opłaca? | Inflacja z koszyka cen | Makroekonomia / Makroekonomia |  |
| 16 | Kredyt – szansa czy pułapka? / Turystyka jako sektor gospodarki | Produkt krańcowy i zatrudnienie | Podstawy finansów / Mikroekonomia |  |
| 17 | Ceny maksymalne i minimalne – czy pomagają? / Wybory konsumenta – racjonalność czy emocje? | Mnożnik wydatków | Mikroekonomia / Polityka gospodarcza |  |

## Etap okręgowy

| Zestaw | Esej | Zadanie | Dział | Hasło |
|---|---|---|---|---|
| 18 | Finanse publiczne w starzejącym się społeczeństwie – jak utrzymać ich stabilność? | Analiza wskaźnikowa prywatnego domu opieki | Polityka gospodarcza / Finanse przedsiębiorstw | 🎯 |
| 19 | Kurczący się zasób pracy – jak gospodarka może odpowiedzieć na niedobór pracowników? | Ocena inwestycji w dom seniora | Demografia / Finanse przedsiębiorstw | 🎯 |
| 20 | Dywidenda demograficzna – jak struktura wieku sprzyja lub szkodzi wzrostowi gospodarczemu? | Wartość oszczędności w PPK | Demografia / Podstawy finansów | 🎯 |
| 21 | Polityka rodzinna – transfery pieniężne czy usługi publiczne? | Wypłata kapitału emerytalnego w ratach | Polityka gospodarcza / Podstawy finansów | 🎯 |
| 22 | Opieka długoterminowa nad osobami starszymi – rynek, państwo czy rodzina? | Kredyt hipoteczny młodej rodziny | Demografia / Podstawy finansów | 🎯 |
| 23 | Wpływ starzenia się społeczeństwa na inflację, stopy procentowe i politykę pieniężną | Dźwignia operacyjna i finansowa producenta sprzętu rehabilitacyjnego | Makroekonomia / Finanse przedsiębiorstw | 🎯 |
| 24 | Swoboda przepływu pracowników w UE – korzyści i koszty dla Polski | Obligacje skarbowe a koszt finansowania długu | Demografia / Podstawy finansów | 🎯 |
| 25 | Oszczędzanie na emeryturę – rola państwa i obywatela | Analiza Du Ponta sieci aptek | Podstawy finansów / Finanse przedsiębiorstw | 🎯 |
| 26 | Kobiety na rynku pracy a decyzje prokreacyjne | Cykl konwersji gotówki agencji opiekunek | Demografia / Finanse przedsiębiorstw | 🎯 |
| 27 | Zarządzanie wiekiem w przedsiębiorstwie – jak firmy mogą wykorzystać pracowników w różnym wieku? | Zadłużenie dwóch spółek energetycznych | Zarządzanie / Finanse przedsiębiorstw | 🎯 |
| 28 | System edukacji w czasach niżu demograficznego | Leasing czy zakup za gotówkę | Demografia / Finanse przedsiębiorstw | 🎯 |
| 29 | Nowe reguły fiskalne UE a rosnące wydatki na obronność | Wycena akcji modelem Gordona | Polityka gospodarcza / Podstawy finansów |  |
| 30 | Sztuczna inteligencja a rynek pracy | Przepływy pieniężne metodą pośrednią | Makroekonomia / Finanse przedsiębiorstw |  |
| 31 | Fragmentacja handlu światowego – koniec globalizacji? | Zabezpieczenie ryzyka walutowego eksportera | Makroekonomia / Podstawy finansów |  |
| 32 | Konkurencyjność gospodarki europejskiej – diagnoza i recepty | Amortyzacja i tarcza podatkowa | Polityka gospodarcza / Finanse przedsiębiorstw |  |
| 33 | Edukacja finansowa młodzieży – po co i jak? | Średni ważony koszt kapitału i decyzja inwestycyjna | Podstawy finansów / Finanse przedsiębiorstw |  |
| 34 | Odporność łańcuchów dostaw – nowe wyzwanie zarządzania | Analiza dynamiki przychodów i kosztów | Zarządzanie / Finanse przedsiębiorstw |  |

## Etap centralny

| Zestaw | Esej | Zadanie | Dział | Hasło |
|---|---|---|---|---|
| 35 | Czy wzrost gospodarczy jest możliwy przy kurczącej się liczbie ludności? | Model Solowa przy malejącej liczbie ludności | Makroekonomia / Makroekonomia | 🎯 |
| 36 | Sprawiedliwość międzypokoleniowa – kto zapłaci za starzenie się społeczeństwa? | Rachunkowość generacyjna i stopa zwrotu w systemie repartycyjnym | Polityka gospodarcza / Polityka gospodarcza | 🎯 |
| 37 | Demografia a rynki finansowe – czy starzenie się społeczeństw obniży stopy zwrotu z kapitału? | Dynamika długu publicznego przy rosnących wydatkach na emerytury | Makroekonomia / Polityka gospodarcza | 🎯 |
| 38 | Demografia jako bariera doganiania Europy Zachodniej przez Polskę | Tablica trwania życia i wartość renty dożywotniej | Makroekonomia / Podstawy finansów | 🎯 |
| 39 | Globalna nierównowaga demograficzna – starzejąca się Północ i młode Południe | Projekcja ludności metodą kohortową | Demografia / Demografia | 🎯 |
| 40 | Wiek emerytalny – sztywny próg czy elastyczne przejście? | Imigracja na rynku pracy – kto zyskuje? | Polityka gospodarcza / Makroekonomia | 🎯 |
| 41 | Ryzyko długowieczności – wyzwanie dla ubezpieczycieli, funduszy i państwa | Gospodarstwa domowe i popyt na mieszkania | Podstawy finansów / Demografia | 🎯 |
| 42 | Strategie przedsiębiorstw wobec kurczącego się rynku pracy | Reguła Taylora | Zarządzanie / Makroekonomia | 🎯 |
| 43 | Rynek nieruchomości mieszkaniowych w społeczeństwie, które się starzeje | Duopol Cournota i kartel | Podstawy finansów / Mikroekonomia | 🎯 |
| 44 | Polityka migracyjna Unii Europejskiej wobec wyzwań demograficznych | Monopol i strata martwa | Polityka gospodarcza / Mikroekonomia | 🎯 |
| 45 | Koszty energii a konkurencyjność przemysłu w Europie | Parytet siły nabywczej | Polityka gospodarcza / Makroekonomia |  |
| 46 | Inflacja po pandemii – czego nauczyły się banki centralne? | Mnożnik kreacji pieniądza | Makroekonomia / Podstawy finansów |  |
| 47 | Powrót polityki przemysłowej – szansa czy zagrożenie? | Rachunek wzrostu przy kurczącym się zasobie pracy | Polityka gospodarcza / Makroekonomia | 🎯 |
| 48 | Platformy cyfrowe i siła rynkowa – nowe wyzwanie dla polityki konkurencji | Wybór konsumenta i zmiana ceny | Mikroekonomia / Mikroekonomia |  |
| 49 | Czy Polska powinna przyjąć euro? | Dylemat reklamowy – teoria gier | Makroekonomia / Mikroekonomia |  |
| 50 | Ekonomia bezpieczeństwa – wydatki na obronność a rozwój gospodarczy | Krzywa Laffera | Polityka gospodarcza / Polityka gospodarcza |  |
