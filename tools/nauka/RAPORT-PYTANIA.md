# Raport: pytania Sprawdzianu i pojęcia w lekcjach

Każde pytanie (OWE, ręczne i automatyczne ze słownika) jest w dokładnie jednej lekcji: najpóźniejszej lekcji macierzystej pojęć, których dotyczy (pojęcia z treści i poprawnych odpowiedzi; pojęcia przed osobami, instytucjami i datami). Pojęcia z treści i ze wszystkich odpowiedzi, których uczeń nie poznał wcześniej w temacie, lekcja omawia w Poznaj, Ćwicz i Utrwal (kolumna „Nowe z pytań”); poznane wcześniej powtarza w Ćwicz i Utrwal (kolumna „Powtórka”). Gdy hasła lekcji i nowe pojęcia przekraczają 12, lekcja ma kolejne części (cz. 2, 3…). Build kursu (`tools/nauka/build_course.py`) kończy się błędem, jeśli któreś pojęcie pytania nie jest omówione ani powtórzone w jego lekcji.

Pojęcia w pytaniach wykrywa `tools/nauka/pojecia_pytan.py` (ręczne korekty w `pojecia_pytan_poprawki.py`, przegląd wszystkich pytań XXI–XXXIX OWE); pytania automatyczne niosą listę swoich pojęć (`pojecia`), a ich dystraktory pochodzą tylko z bieżącej lub wcześniejszych lekcji tematu.

## Podsumowanie

- Pytań w lekcjach: 6336 (słownik – automatyczne: 3394, OWE: 1656, słownik – ręczne: 1286).
- Lekcji haseł: 444, w tym kolejnych części: 103.
- Lekcji z nowymi pojęciami z pytań: 318; nowych pojęć łącznie: 1556.
- Pytań OWE przeniesionych do innej lekcji niż w poprzednim przydziale: 1170 z 1656.
- Nowe hasła słownika dodane po przeglądzie pytań: 45 (lista na końcu; źródła w `tools/nauka/zrozum/WERYFIKACJA.md`).

## Mikroekonomia

| Lekcja | Hasła | Pytań | Nowe z pytań | Powtórka (liczba) |
|---|---|---|---|---|
| mikro-podstawy-1 | Ekonomia · Ekonomia pozytywna · Ekonomia normatywna · Mikroekonomia · Rzadkość · Koszt alternatywny | 15 | Ubóstwo skrajne, relatywne i ustawowe · Polityka gospodarcza · Makroekonomia · Koszty utopione · Ostrom Elinor | 0 |
| mikro-podstawy-1-cz2 (cz. 2) | – | 3 | Koszty według rodzajów · Rachunek zysków i strat · Kahneman Daniel · Krugman Paul · Smith Adam · Thaler Richard | 3 |
| mikro-podstawy-2 | Krzywa możliwości produkcyjnych · Czynniki wytwórcze · Ceteris paribus · Dobro wolne · Dobro ekonomiczne · Dobro konsumpcyjne, pośrednie i inwestycyjne | 27 | Ryzyko, niepewność i wartość oczekiwana · Obligacje komunalne i przychodowe · Prawo malejących przychodów · Wzrost gospodarczy · Akcja · Monopol prawny: patenty i prawa autorskie | 6 |
| mikro-podstawy-2-cz2 (cz. 2) | – | 2 | Krótki okres i długi okres · Podaż pracy · Dobro Veblena · Elastyczność cenowa popytu · Popyt · Wykresy w ekonomii: nachylenie i układ współrzędnych | 4 |
| mikro-podstawy-3 | Pieniądz a czas wolny – koszt alternatywny czasu · Gospodarka rynkowa, centralnie planowana i mieszana · Niewidzialna ręka rynku · Laissez-faire · Homo oeconomicus · Model ruchu okrężnego | 15 | Dobro luksusowe · Pożyczka a kredyt · Produkt krajowy brutto · Ordoliberalizm i społeczna gospodarka rynkowa | 12 |
| mikro-podstawy-3-cz2 (cz. 2) | – | 3 | Friedman Milton · Keynes John Maynard · Stiglitz Joseph · Hayek Friedrich von · Walras Léon · Etatyzm i polityka gospodarcza II RP · Keynesizm · Merkantylizm · Rola państwa w gospodarce | 4 |
| mikro-podstawy-4 | Punkt procentowy a procent · Metoda naukowa w ekonomii: dedukcja, indukcja, falsyfikowalność · Spory ekonomistów – źródła · Problem ekonomiczny: co, jak i dla kogo produkować · Model, teoria i prawo ekonomiczne · Podział pracy i specjalizacja | 13 | Podejście systemowe · Biurokracja · Ustroje społeczno-ekonomiczne i systemy gospodarcze | 11 |
| mikro-podstawy-4-cz2 (cz. 2) | – | 1 | Drucker Peter · Fayol Henri · Taylor Frederick Winslow · Weber Max | 1 |
| mikro-podstawy-5 | Agregacja · Dziesięć zasad ekonomii · Bodźce w ekonomii · Myślenie krańcowe · Efektywność a sprawiedliwość · Ekonomista jako naukowiec i doradca polityki | 12 | Pieniądz · Prawo popytu · Ceny zaporowe i ceny drapieżne · Goodhart Charles · Optimum Pareto | 17 |
| mikro-podstawy-6 | Wykresy w ekonomii: nachylenie i układ współrzędnych · Korelacja a przyczynowość · Mezoekonomia · Branża · Metoda idealizacji · Ekonomia pozytywna a postulatywna – spór | 10 | Recesja i depresja | 8 |
| mikro-rynek-1 | Popyt · Prawo popytu · Wielkość popytu a popyt · Podaż · Prawo podaży · Równowaga rynkowa | 32 | Podatek · Popyt doskonale elastyczny / doskonale nieelastyczny · Zarządzanie zasobami ludzkimi · Podatek progresywny, proporcjonalny i regresywny · Cło · Dumping | 16 |
| mikro-rynek-1-cz2 (cz. 2) | – | 6 | Płace efektywnościowe · Zachowania w miejscu pracy · Dobro niższego rzędu · Dobro normalne · Pułapka maltuzjańska · Wydajność pracy i jej czynniki · Cło ad valorem i specyficzne · Prawo Kopernika–Greshama · Prawo Saya · Inflacja · Popyt na pieniądz · Stopa procentowa nominalna i realna | 9 |
| mikro-rynek-1-cz3 (cz. 3) | – | 4 | Krańcowy koszt pracy · Utarg całkowity, przeciętny i krańcowy · Wartość krańcowego produktu pracy i przychód z krańcowego produktu · Czynniki kształtujące podaż · Czynniki kształtujące popyt · Akcelerator · Deficyt budżetowy i deficyt sektora finansów publicznych · Inflacja i indeksy cen · Stopa bezrobocia · Fisher Irving · Prawo Okuna · Prawo malejącej użyteczności krańcowej | 6 |
| mikro-rynek-1-cz4 (cz. 4) | – | 2 | Jevons William Stanley · Marshall Alfred · Pigou Arthur Cecil · Samuelson Paul · Hipoteza rynku efektywnego · Koszty transakcyjne · Krzywa Phillipsa · Nash John | 4 |
| mikro-rynek-2 | Nadwyżka · Niedobór · Cena maksymalna · Cena minimalna · Nadwyżka konsumenta · Nadwyżka producenta | 28 | Wartość pieniądza w czasie · Motywacja · Struktura wieku: wiek przedprodukcyjny, produkcyjny i poprodukcyjny · Marketing mix | 23 |
| mikro-rynek-3 | Zbędna strata społeczna · Trójkąt Harbergera · Rozkład ciężaru podatku · Podaż pracy · Ceny jako sygnały · Popyt indywidualny i rynkowy | 18 | Wielki zwrot demograficzny · Izokoszta · Konsumpcja · Płaca minimalna · Skutki starzenia się dla rynku pracy i finansów publicznych | 28 |
| mikro-rynek-4 | Ceny względne i nominalne · Model pajęczyny · Subsydium do produkcji – skutki rynkowe · Czynniki kształtujące popyt · Czynniki kształtujące podaż · Podaż indywidualna i rynkowa | 25 | Subwencja i dotacja | 31 |
| mikro-rynek-5 | Analiza zmian równowagi – trzy etapy · Kontrola czynszów · Skłonność do płacenia · Nadwyżka całkowita i efektywność rynku · Cena światowa a korzyści z handlu | 8 | Skutki cła | 15 |
| mikro-elastycznosc-1 | Elastyczność cenowa popytu · Czynniki elastyczności popytu · Elastyczność a utarg · Elastyczność dochodowa popytu · Elastyczność mieszana popytu · Elastyczność cenowa podaży | 43 | – | 30 |
| mikro-elastycznosc-2 | Popyt doskonale elastyczny / doskonale nieelastyczny · Funkcja o stałej elastyczności · Substytuty · Dobra komplementarne · Dobro normalne · Dobro luksusowe | 33 | Dobro Giffena · Podatek akcyzowy · Efekt substytucyjny i efekt dochodowy · Krzywa obojętności · Linia ograniczenia budżetowego · Równowaga konsumenta | 30 |
| mikro-elastycznosc-2-cz2 (cz. 2) | – | 1 | Produkty bankowe dla klientów · Umowy w kodeksie cywilnym | 2 |
| mikro-elastycznosc-3 | Dobro niższego rzędu · Dobro Giffena · Dobro Veblena · Efekt owczego pędu · Efekt snoba · Dobra pozycyjne i wyścig pozycyjny | 23 | Użyteczność · Cykle koniunkturalne – typy | 40 |
| mikro-elastycznosc-4 | Metoda punktu środkowego · Elastyczność wzdłuż liniowej krzywej popytu · Paradoks rolnictwa · Elastyczność a polityka antynarkotykowa | 14 | – | 18 |
| mikro-konsument-1 | Użyteczność · Prawo malejącej użyteczności krańcowej · Równowaga konsumenta · Krzywa obojętności · Mapa obojętności · Krańcowa stopa substytucji | 41 | Dobro neutralne i dobro niechciane | 39 |
| mikro-konsument-2 | Dobro neutralne i dobro niechciane · Linia ograniczenia budżetowego · Ścieżka dochód–konsumpcja i krzywa Engla · Ścieżka cena–konsumpcja · Paradoks wody i diamentu · Użyteczność kardynalna i porządkowa | 39 | Preferencje konsumenta – założenia · Inwestycje · Paradoks Leontiefa · Solow Robert | 46 |
| mikro-konsument-3 | Preferencje konsumenta – założenia · Funkcja użyteczności · Teoria ujawnionych preferencji · Efekt Slutsky’ego i Hicksa · Ryzyko, niepewność i wartość oczekiwana · Wybór międzyokresowy | 21 | Arrow Kenneth · Dywersyfikacja · Teoria kontraktów implicytnych · Rozpiętość kierowania · Różnorodność i wielokulturowość w organizacji | 39 |
| mikro-produkcja-1 | Produkcja · Krótki okres i długi okres · Produkt całkowity, przeciętny i krańcowy · Prawo malejących przychodów · Izokwanta · Izokoszta | 53 | Koszt całkowity i przeciętny koszt całkowity · Krańcowa stopa technicznej substytucji · Histereza bezrobocia · Urlop wypoczynkowy i czas pracy · Funkcja Cobba-Douglasa · Krzywa Beveridge’a | 58 |
| mikro-produkcja-1-cz2 (cz. 2) | – | 8 | Produkt potencjalny i luka PKB · Szok podażowy i popytowy · Koszty stałe · Hipoteza Easterlina · Koszt krańcowy · Monopol · Polityka pieniężna – cele i instrumenty · Stagflacja i slumpflacja · Wiek emerytalny w Polsce · Współczynnik dzietności · Inflacja oczekiwana i nieoczekiwana · Podaż pieniądza | 6 |
| mikro-produkcja-2 | Krańcowa stopa technicznej substytucji · Optimum producenta · Funkcja Cobba-Douglasa · Przychody skali · Korzyści skali · Minimalna skala efektywna | 26 | Koszty zmienne · Zysk ekonomiczny · Krzywa doświadczenia | 36 |
| mikro-produkcja-3 | Koszty stałe · Koszty zmienne · Koszt całkowity i przeciętny koszt całkowity · Koszt krańcowy · Optimum techniczne i optimum ekonomiczne · Koszty jawne i ukryte | 63 | Innowacja · Kontyngent · Krótkookresowe i długookresowe krzywe kosztów · Produkt przeciętny i krańcowy, optimum czynników – wzory · Dźwignia operacyjna i finansowa · Rachunek kosztów pełnych i zmiennych | 47 |
| mikro-produkcja-3-cz2 (cz. 2) | – | 2 | Amortyzacja · Leasing · Wynik finansowy – poziomy | 4 |
| mikro-produkcja-4 | Koszty utopione · Koszty transakcyjne · Utarg całkowity, przeciętny i krańcowy · Zysk księgowy · Zysk ekonomiczny · Zysk normalny | 39 | Logistyka i łańcuch dostaw · Negocjacje · Coase Ronald · Simon Herbert · Williamson Oliver · Acemoglu Daron, Johnson Simon, Robinson James | 44 |
| mikro-produkcja-5 | Warunek maksymalizacji zysku · Próg rentowności · Próg zamknięcia · Krańcowy koszt pracy · Koszt społeczny · Cele przedsiębiorstwa i teorie firmy | 29 | Pasywa: kapitał własny i zobowiązania | 47 |
| mikro-produkcja-6 | Krótkookresowe i długookresowe krzywe kosztów · Ścieżka ekspansji przedsiębiorstwa · Fazy produkcji · Zysk jako dochód przedsiębiorcy · Neoklasyczna teoria przedsiębiorstwa | 16 | – | 33 |
| mikro-struktury-1 | Struktura rynku · Konkurencja doskonała · Krzywa podaży firmy doskonale konkurencyjnej · Monopol · Monopol naturalny · Bariery wejścia | 87 | Reklama – spory ekonomiczne i sygnał jakości · Dyskryminacja cenowa · Efekty zewnętrzne · Oligopol · Polityka cenowa państwa i ceny administrowane · Nadwyżka mocy produkcyjnych | 69 |
| mikro-struktury-1-cz2 (cz. 2) | – | 4 | Efekt sieciowy · Konkurencja monopolistyczna · Hipoteza dochodu względnego i efekt rygla · Duopol · Model Bertranda | 16 |
| mikro-struktury-2 | Dyskryminacja cenowa · Konkurencja monopolistyczna · Oligopol · Duopol · Model Bertranda · Model Cournota | 47 | Dystrybucja · Równowaga Nasha · Monopson · Model Stackelberga · Kartel | 51 |
| mikro-struktury-3 | Załamana krzywa popytu · Kartel · Lider cenowy · Monopson · Monopol dwustronny · Teoria gier | 27 | Strategie konkurencyjne według pozycji rynkowej · Teorie krótkookresowej podaży zagregowanej · Konstytucja RP – przepisy gospodarcze · Urząd Ochrony Konkurencji i Konsumentów | 41 |
| mikro-struktury-3-cz2 (cz. 2) | – | 1 | Międzynarodowy Fundusz Walutowy · OPEC · Porozumienia regionalne · Światowa Organizacja Handlu | 1 |
| mikro-struktury-4 | Strategia dominująca · Równowaga Nasha · Dylemat więźnia · Gry powtarzalne i kooperacja · Ceny zaporowe i ceny drapieżne · Ekonomia supergwiazd | 21 | – | 40 |
| mikro-struktury-5 | Siła rynkowa i wskaźnik Lernera · Wskaźniki koncentracji rynku · Model Stackelberga · Oligopol zmowy i oligopol niekooperacyjny · Rynki kontestowalne · Nadwyżka mocy produkcyjnych | 28 | Nieuczciwa konkurencja · Herfindahl Orris, Hirschman Albert O. · Polityka państwa wobec monopoli · Komisja Nadzoru Finansowego · Najwyższa Izba Kontroli · Rzecznik Finansowy | 48 |
| mikro-struktury-5-cz2 (cz. 2) | – | 1 | Formy monopolizacji · Należności i zobowiązania · Strategia · Zarządzanie kapitałem obrotowym | 4 |
| mikro-struktury-6 | Formy monopolizacji · Wejście i wyjście z rynku w długim okresie · Długookresowa krzywa podaży gałęzi · Monopol prawny: patenty i prawa autorskie · Polityka państwa wobec monopoli · Narzucanie cen odsprzedaży | 20 | Uwarunkowania rozpoczęcia działalności gospodarczej · Prawo własności przemysłowej · Własność intelektualna · Licencja i know-how | 40 |
| mikro-struktury-7 | Sprzedaż wiązana · Reklama – spory ekonomiczne i sygnał jakości · Ekonomia przemysłowa · Monopol handlu zagranicznego | 13 | – | 20 |
| mikro-czynniki-1 | Popyt pochodny · Wartość krańcowego produktu pracy i przychód z krańcowego produktu · Renta ekonomiczna · Dochód transferowy · Renta gruntowa · Kapitał ludzki | 29 | Popyt na pracę · Dochód osobisty i dochód rozporządzalny · Becker Gary · Phelps Edmund | 62 |
| mikro-czynniki-1-cz2 (cz. 2) | – | 1 | Endogeniczne teorie wzrostu · Kurs walutowy · Lucas Robert E. · Romer Paul | 2 |
| mikro-czynniki-2 | Kapitał społeczny · Amoralny familizm · Płaca nominalna i realna · Związki zawodowe a rynek pracy · Kapitał jako czynnik produkcji i stopa zwrotu · Teoria krańcowej produktywności | 29 | Podatek od towarów i usług · Inwestycje bezpośrednie i portfelowe · Bank centralny · Federalizm fiskalny · Teoria optymalnego obszaru walutowego | 63 |
| mikro-czynniki-2-cz2 (cz. 2) | – | 3 | Zagregowana podaż · Zagregowany popyt · Model insiderów–outsiderów · Neutralność pieniądza i dychotomia klasyczna · Fukuyama Francis · Kalecki Michał · Ricardo David | 10 |
| mikro-czynniki-3 | Wyrównawcze różnice płac · Zdolności, wysiłek i przypadek a płace · Ekonomia dyskryminacji na rynku pracy · Popyt na pracę | 19 | Ludność aktywna zawodowo · Naturalna stopa bezrobocia | 48 |
| mikro-zawodnosci-1 | Pogoń za rentą · Optimum Pareto · Zawodność rynku · Efekty zewnętrzne · Internalizacja efektów zewnętrznych · Podatek Pigou | 35 | Przewaga komparatywna · Polityka konkurencji · Asymetria informacji · Dochody i wydatki budżetu państwa · Podatek dochodowy od osób fizycznych | 61 |
| mikro-zawodnosci-1-cz2 (cz. 2) | – | 1 | Podatek od zysków kapitałowych · Q Tobina | 3 |
| mikro-zawodnosci-2 | Twierdzenie Coase’a · Dobra publiczne · Dobra mieszane: klubowe i wspólne · Dobra prywatne · Problem gapowicza · Tragedia wspólnego pastwiska | 46 | Ubezpieczenie · Twierdzenie o wyborcy medianowym · Negatywna selekcja · Pokusa nadużycia · Samorząd terytorialny w Polsce | 76 |
| mikro-zawodnosci-2-cz2 (cz. 2) | – | 1 | Prawa własności i stabilność polityczna a wzrost · Świadczenia społeczne w Polsce | 3 |
| mikro-zawodnosci-3 | Asymetria informacji · Negatywna selekcja · Pokusa nadużycia · Problem pryncypała i agenta · Sygnalizacja i odsiewanie · Przełowienie i dekapitalizacja zasobów | 35 | Faktura VAT i KSeF · Rynek pracy · Dobra społecznie pożądane · Rzeczywista roczna stopa oprocentowania · Akerlof George · Pułapka średniego dochodu | 87 |
| mikro-zawodnosci-3-cz2 (cz. 2) | – | 5 | Cykl koniunkturalny · Demografia · Pułapka płynności · Wartość firmy · Spence Michael · Dywidenda · Podwójne opodatkowanie · Spółki kapitałowe · Kryzysy walutowe – generacje · Krzywa dochodowości | 10 |
| mikro-zawodnosci-4 | Kumoterstwo · Libertarianizm i libertariański paternalizm · Efektywność alokacyjna, produkcyjna i X-efektywność · Równowaga ogólna i cząstkowa · Zawodność państwa · Regulacja, deregulacja i przejęcie regulacyjne | 23 | Obligacja · Menger Carl · Pareto Vilfredo · Instrumenty polityki rodzinnej w Polsce · Przepisy dotyczące pracy cudzoziemców w Polsce | 70 |
| mikro-zawodnosci-4-cz2 (cz. 2) | – | 3 | Polityka podażowa · Transfery socjalne · Umowy bazylejskie · Unia Europejska – historia · Wskaźniki płynności · Grupy i zespoły · Lobbing · Uzasadnienie przymusu emerytalnego | 8 |
| mikro-zawodnosci-5 | Nacjonalizacja i prywatyzacja · Teorie sprawiedliwego podziału: utylitaryzm, liberalizm, libertarianizm · Zbywalne zezwolenia na zanieczyszczenia · Wykluczalność i rywalizacyjność · Efekt sieciowy · Oportunizm | 19 | Internacjonalizacja przedsiębiorstwa – formy · Przedsiębiorstwo państwowe i Skarb Państwa · Konsensus waszyngtoński · Williamson John · Planowanie gospodarcze w gospodarce rynkowej | 43 |
| mikro-publiczny-1 | Analiza kosztów i korzyści · Krańcowa i przeciętna stawka podatkowa · Podatek zryczałtowany · Zasada korzyści · Zasada zdolności do płacenia – sprawiedliwość pionowa i pozioma | 16 | – | 50 |
| mikro-publiczny-2 | Obciążenia administracyjne podatków · Mobilność ekonomiczna i dochód w cyklu życia · Negatywny podatek dochodowy · Transfery rzeczowe · Pułapka ubóstwa | 11 | – | 42 |
| mikro-publiczny-3 | Paradoks głosowania Condorceta · Twierdzenie Arrowa o niemożności · Twierdzenie o wyborcy medianowym | 6 | – | 18 |
| mikro-behawioralna-1 | Efekt substytucyjny i efekt dochodowy · Racjonalność ograniczona · Ekonomia behawioralna · Teoria perspektywy · Teoria szturchania · Księgowość mentalna | 37 | Zachowania finansowe gospodarstw domowych · Tversky Amos · Shiller Robert · Model administracyjny decyzji | 78 |
| mikro-behawioralna-1-cz2 (cz. 2) | – | 2 | Aprecjacja i deprecjacja · Bilans handlowy · Oszczędności narodowe · Maskin Eric · Szkoła austriacka · Tobin James | 10 |
| mikro-behawioralna-2 | Efekt posiadania · Efekt zakotwiczenia · Gospodarka współdzielenia i peer economy · Gra w ultimatum i preferencje sprawiedliwości · Niespójność czasowa preferencji · Heurystyki i efekt ramowania | 19 | Handel elektroniczny · Zarząd waluty · Reguły a uznaniowość · Zrównoważony rozwój | 49 |
| mikro-wzor-1 | Elastyczność cenowa popytu · Elastyczność dochodowa popytu · Elastyczność mieszana popytu · Elastyczność cenowa podaży · Użyteczność · Równowaga konsumenta | 0 | – | 0 |
| mikro-wzor-2 | Krańcowa stopa substytucji · Linia ograniczenia budżetowego · Produkt całkowity, przeciętny i krańcowy · Izokoszta · Krańcowa stopa technicznej substytucji · Optimum producenta | 0 | – | 0 |
| mikro-wzor-3 | Koszt całkowity i przeciętny koszt całkowity · Koszt krańcowy · Utarg całkowity, przeciętny i krańcowy · Zysk ekonomiczny · Warunek maksymalizacji zysku · Próg rentowności | 0 | – | 0 |
| mikro-wzor-4 | Monopol · Wartość krańcowego produktu pracy i przychód z krańcowego produktu · Ryzyko, niepewność i wartość oczekiwana · Siła rynkowa i wskaźnik Lernera · Wskaźniki koncentracji rynku · Płaca nominalna i realna | 0 | – | 0 |
| mikro-wzor-5 | Teoria krańcowej produktywności · Wykresy w ekonomii: nachylenie i układ współrzędnych · Metoda punktu środkowego · Nadwyżka całkowita i efektywność rynku · Krańcowa i przeciętna stawka podatkowa · Negatywny podatek dochodowy | 0 | – | 0 |
| mikro-wzor-6 | Wybór międzyokresowy · Popyt na pracę · Elastyczność cenowa popytu – wzór · Elastyczność dochodowa i mieszana – wzór · Równowaga rynkowa – obliczanie · Podatek na producentów – nowa równowaga | 4 | – | 11 |
| mikro-wzor-7 | Nadwyżka konsumenta i producenta – wzór · Utarg i jego maksimum · Koszty – zależności · Maksymalizacja zysku – monopol · Zysk ekonomiczny – wzór · Renta ekonomiczna i dochód transferowy – obliczanie | 6 | – | 15 |
| mikro-wzor-8 | Produkt przeciętny i krańcowy, optimum czynników – wzory · Strata martwa – wzór · Indeks Lernera i reguła odwrotnej elastyczności – wzór · Wskaźniki koncentracji CR i HHI – wzory · Równowaga konsumenta – wzory | 5 | – | 11 |
| mikro-osoba-1 | Akerlof George · Coase Ronald · Duesenberry James · Gossen Hermann Heinrich · Hardin Garrett · Kahneman Daniel | 6 | – | 0 |
| mikro-osoba-2 | Marshall Alfred · Menger Carl · Mill John Stuart · Nash John · Pareto Vilfredo · Pigou Arthur Cecil | 12 | – | 6 |
| mikro-osoba-3 | Smith Adam · Thaler Richard · Tversky Amos · Walras Léon · Maskin Eric · Milgrom Paul | 13 | – | 12 |
| mikro-osoba-4 | Axelrod Robert · Bain Joe · Frank Robert · Gorynia Marian · Rosen Sherwin · Williamson Oliver | 13 | – | 17 |
| mikro-osoba-5 | Slutsky Eugen · Stackelberg Heinrich von · Herfindahl Orris, Hirschman Albert O. · Lerner Abba · Baumol William · Stigler George | 16 | Galbraith John Kenneth | 23 |
| mikro-osoba-6 | Cyert Richard, March James · Leibenstein Harvey · Knight Frank · Clark John Bates · Rawls John · Nozick Robert | 17 | – | 24 |
| mikro-osoba-7 | Bentham Jeremy · Jevons William Stanley · Arrow Kenneth · Card David, Krueger Alan · Chamberlin Edward, Robinson Joan · Neumann John von, Morgenstern Oskar | 18 | – | 31 |
| mikro-osoba-8 | Ostrom Elinor · Spence Michael | 7 | – | 21 |
| mikro-instytucja-1 | Urząd Ochrony Konkurencji i Konsumentów | 3 | Ustawa o ochronie konkurencji i konsumentów · Giełda Papierów Wartościowych w Warszawie · Prezes NBP | 2 |
| mikro-data-1 | 1970 – „The Market for Lemons” G. Akerlofa · 1933 – teorie konkurencji monopolistycznej i niedoskonałej · 1944 – „Teoria gier i zachowań ekonomicznych” J. von Neumanna i O. Morgensterna · 1994 – badanie płacy minimalnej D. Carda i A. Kruegera | 1 | – | 0 |

## Makroekonomia

| Lekcja | Hasła | Pytań | Nowe z pytań | Powtórka (liczba) |
|---|---|---|---|---|
| makro-pkb-1 | Makroekonomia · Produkt krajowy brutto · Metody liczenia PKB · Wartość dodana · Produkt narodowy brutto | 20 | Punkt procentowy a procent · Podatki bezpośrednie i pośrednie · PKB – metoda wydatkowa · Świadczenia społeczne w Polsce · Bilans handlowy · Inwestycje | 0 |
| makro-pkb-1-cz2 (cz. 2) | – | 4 | Dochód narodowy · Ograniczenia PKB jako miary dobrobytu · Czynniki wytwórcze · Dobro konsumpcyjne, pośrednie i inwestycyjne · Amortyzacja · Konsumpcja autonomiczna · Naturalna stopa bezrobocia · Oszczędności narodowe · Wykresy w ekonomii: nachylenie i układ współrzędnych · Zagregowany popyt | 5 |
| makro-pkb-2 | Produkt narodowy netto · Dochód narodowy · Dochód osobisty i dochód rozporządzalny · PKB nominalny i realny · Deflator PKB | 24 | Transfery socjalne · Dług publiczny · Nadwyżka budżetowa | 8 |
| makro-pkb-3 | PKB per capita i parytet siły nabywczej · Ograniczenia PKB jako miary dobrobytu · Wskaźnik rozwoju społecznego · Szara strefa · Produkt potencjalny i luka PKB | 20 | Wzrost liczby ludności a wzrost gospodarczy · Przeciętne dalsze trwanie życia i tablice trwania życia · Współczynniki urodzeń, zgonów i przyrostu naturalnego · Wzrost gospodarczy · Ceteris paribus · Euro · Inflacja | 11 |
| makro-pkb-4 | Bogactwo narodowe · System rachunków narodowych · PKB metodą produkcyjną i dochodową · Model okrężnego obiegu w gospodarce otwartej z państwem · Zakupy rządowe a transfery w PKB | 11 | Podatek · Subsydium do produkcji – skutki rynkowe | 12 |
| makro-popyt-1 | Konsumpcja · Funkcja konsumpcji · Krańcowa skłonność do konsumpcji i oszczędzania · Przeciętna skłonność do konsumpcji · Konsumpcja autonomiczna · Hipoteza cyklu życia | 31 | Równowaga rynkowa · Ryzyko, niepewność i wartość oczekiwana · Bezrobocie cykliczne · Stopa bezrobocia · Stopa procentowa nominalna i realna | 20 |
| makro-popyt-1-cz2 (cz. 2) | – | 1 | Duesenberry James · Friedman Milton · Hicks John · Modigliani Franco, Miller Merton | 2 |
| makro-popyt-2 | Hipoteza dochodu względnego i efekt rygla · Efekt demonstracji · Paradoks zapobiegliwości · Inwestycje · Akcelerator · Q Tobina | 24 | Deficyt budżetowy i deficyt sektora finansów publicznych · Polityka inwestycyjna i prowzrostowa · Polityka pieniężna – cele i instrumenty · Efekt posiadania · Heurystyki i efekt ramowania | 30 |
| makro-popyt-2-cz2 (cz. 2) | – | 4 | Izokoszta · Model, teoria i prawo ekonomiczne · Pieniądz · Popyt · Akcja · Wartość firmy · Zasiłek dla bezrobotnych | 7 |
| makro-popyt-3 | Oszczędności narodowe · Odpływy kapitałowe netto · Wydatki autonomiczne · Mnożnik · Mnożnik podatkowy · Mnożnik zrównoważonego budżetu | 40 | Hipoteza dochodu permanentnego · Wartość pieniądza w czasie · Pasywa: kapitał własny i zobowiązania · Dochód rozporządzalny i oszczędności · Phelps Edmund · Reguła złotej zasady | 35 |
| makro-popyt-3-cz2 (cz. 2) | – | 3 | Easterlin Richard · Jevons William Stanley · Hiperinflacja · Naturalna stopa procentowa · Sekularna stagnacja · Krótki okres i długi okres · Starzenie się ludności i jego miary · Współczynnik dzietności | 7 |
| makro-popyt-4 | Odpływy z obiegu · Luka inflacyjna i deflacyjna · Hipoteza niestabilności finansowej · Akcelerator finansowy · Model Keynesa · Krańcowa skłonność do importu | 23 | Polityka dyskrecjonalna · Bernanke Ben · Keynes John Maynard · Milgrom Paul | 30 |
| makro-popyt-4-cz2 (cz. 2) | – | 1 | Nowoczesna teoria portfela · Prawo Okuna · Pułapka płynności | 1 |
| makro-popyt-5 | Hipoteza dochodu relatywnego · Krańcowa efektywność kapitału · Hipoteza Lindera · Inwestycje bezpośrednie i portfelowe · Hipoteza luki technologicznej | 3 | Obligacja · Instytucje UE · Polityka energetyczna i klimatyczna | 4 |
| makro-isldas-1 | Model IS-LM · Krzywa IS · Krzywa LM · Pułapka płynności · Pułapka inwestycyjna | 18 | Polityka fiskalna · Automatyczne stabilizatory · Popyt doskonale elastyczny / doskonale nieelastyczny · Popyt na pieniądz | 22 |
| makro-isldas-2 | Efekt wypychania · Zagregowany popyt · Efekt majątkowy · Zagregowana podaż · Szok podażowy i popytowy | 28 | Model ruchu okrężnego · Krzywa możliwości produkcyjnych · Podatek dochodowy od osób fizycznych · Krzywa Phillipsa · Prawo Kopernika–Greshama · Podaż pieniądza · Wartość krańcowego produktu pracy i przychód z krańcowego produktu | 44 |
| makro-isldas-3 | Prawo Saya · Pułapka średniego dochodu · Równowaga makroekonomiczna · Krzywa podaży Lucasa · Przegrzanie gospodarki | 11 | – | 24 |
| makro-isldas-4 | Efekt Pigou · Trzy fakty o wahaniach koniunktury · Nachylenie krzywej zagregowanego popytu · Teorie krótkookresowej podaży zagregowanej | 8 | Teoria twórczej destrukcji · Neutralność pieniądza i dychotomia klasyczna | 16 |
| makro-rynekpracy-1 | Rynek pracy · Ludność aktywna zawodowo · Stopa bezrobocia · Współczynnik aktywności zawodowej i wskaźnik zatrudnienia · Bezrobocie rejestrowane i BAEL · Bezrobocie frykcyjne | 35 | Struktura wieku: wiek przedprodukcyjny, produkcyjny i poprodukcyjny · Międzynarodowa Organizacja Pracy · Bezrobocie strukturalne · Cykl koniunkturalny · Saldo obrotów bieżących | 35 |
| makro-rynekpracy-1-cz2 (cz. 2) | – | 1 | Główny Urząd Statystyczny · Narodowy Bank Polski · Polityka dochodowa i społeczna · Ubezpieczenia społeczne | 1 |
| makro-rynekpracy-2 | Bezrobocie strukturalne · Bezrobocie cykliczne · Bezrobocie sezonowe · Bezrobocie dobrowolne i przymusowe · Bezrobocie ukryte · Naturalna stopa bezrobocia | 23 | Podaż pracy · Płaca minimalna · Ubezpieczenie · Polityka ekspansywna i restrykcyjna | 29 |
| makro-rynekpracy-2-cz2 (cz. 2) | – | 1 | Hildebrand Bruno · Kalecki Michał · Lange Oskar · List Friedrich · Marshall Alfred · Pigou Arthur Cecil | 4 |
| makro-rynekpracy-3 | NAIRU · Histereza bezrobocia · Model insiderów–outsiderów · Płace efektywnościowe · Model bumelowania · Krzywa Beveridge’a | 23 | Wydajność pracy i jej czynniki · Efekt bazy i efekty drugiej rundy · Kapitał ludzki · Podaż · Popyt na pracę | 46 |
| makro-rynekpracy-3-cz2 (cz. 2) | – | 1 | Layard Richard, Nickell Stephen, Jackman Richard · Smith Adam · Wicksell Knut | 2 |
| makro-rynekpracy-4 | Krzywa Phillipsa · Prawo Okuna · Teoria kontraktów implicytnych · Bezrobocie długotrwałe i koszty bezrobocia · Zasiłek dla bezrobotnych · Chomikowanie pracy | 29 | Kredyt obrotowy i inwestycyjny · Związki zawodowe a rynek pracy · Technologie informacyjne w zarządzaniu · Ekonomia · Podatek od towarów i usług · Stawki VAT w Polsce | 54 |
| makro-inflacja-1 | Inflacja · Deflacja i dezinflacja · Stagflacja i slumpflacja · Taksflacja · Hiperinflacja · Inflacja popytowa i kosztowa | 45 | Bilans płatniczy · Siła nabywcza pieniądza · Baza monetarna · HICP · Bank centralny · Wielki zwrot demograficzny | 50 |
| makro-inflacja-1-cz2 (cz. 2) | – | 11 | Ceny względne i nominalne · Aprecjacja i deprecjacja · Obligacje skarbowe · Cel inflacyjny NBP · OPEC · Polityka antyinflacyjna · Fisher Irving · Ceny jako sygnały · Recesja i depresja · Inflacja pełzająca, krocząca, galopująca · Kurs walutowy | 10 |
| makro-inflacja-1-cz3 (cz. 3) | – | 3 | Deficyt strukturalny i cykliczny · Sektor finansów publicznych · Dobro Giffena · Dobro niższego rzędu · Równowaga konsumenta · Podejmowanie decyzji · Reguła Taylora · Strategia bezpośredniego celu inflacyjnego | 7 |
| makro-inflacja-2 | Inflacja oczekiwana i nieoczekiwana · Inflacja bazowa · Inercja inflacji · Koszty inflacji · Wskaźnik cen towarów i usług konsumpcyjnych · HICP | 31 | Unia Europejska – historia · Polityka cenowa państwa i ceny administrowane · Krzywa dochodowości · Planowanie · Negatywna selekcja · Płaca nominalna i realna | 52 |
| makro-inflacja-2-cz2 (cz. 2) | – | 6 | Run na bank · Rating kredytowy · Hossa i bessa · Niedobór · PPI · Unia Gospodarcza i Walutowa · Rada Polityki Pieniężnej · Stopy procentowe NBP · Deficyty bliźniacze · Dewaluacja i rewaluacja · Globalizacja | 13 |
| makro-inflacja-3 | PPI · Indeks Laspeyresa i Paaschego · Ceny stałe i bieżące · Teoria ilościowa pieniądza · Neutralność pieniądza i dychotomia klasyczna · Efekt Fishera | 27 | Utarg całkowity, przeciętny i krańcowy · Równanie wymiany · Agregaty pieniężne · Tezauryzacja · Prędkość obiegu pieniądza · Wielkość popytu a popyt | 51 |
| makro-inflacja-3-cz2 (cz. 2) | – | 1 | Współczynnik Giniego i krzywa Lorenza | 5 |
| makro-inflacja-4 | Inflacja pełzająca, krocząca, galopująca · Inflacja importowana · Indeksacja · Obciążenia wskaźnika CPI · Przeliczanie kwot pieniężnych z różnych okresów · Złudzenie pieniądza | 12 | Negocjacje | 26 |
| makro-inflacja-5 | Prędkość obiegu pieniądza · Efekt bazy i efekty drugiej rundy | 6 | – | 16 |
| makro-cykl-1 | Cykl koniunkturalny · Recesja i depresja · Cykle koniunkturalne – typy · Teoria realnego cyklu koniunkturalnego · Wskaźniki wyprzedzające | 39 | Teorie cyklu koniunkturalnego · Innowacja · Krzywa Laffera · Dobro neutralne i dobro niechciane · Inflacja i indeksy cen · Upadłość i restrukturyzacja | 60 |
| makro-cykl-1-cz2 (cz. 2) | – | 2 | Kapitał jako czynnik produkcji i stopa zwrotu · Motywacja · Produkt całkowity, przeciętny i krańcowy · Demografia · Środki trwałe | 5 |
| makro-cykl-2 | Finansowanie zabezpieczone, spekulacyjne i Ponziego · Badania koniunktury GUS i indeks PMI · Teorie cyklu koniunkturalnego · Teoria cyklu życia produktu w handlu | 9 | – | 19 |
| makro-wzrost-1 | Wzrost gospodarczy · Rozwój gospodarczy · Model Solowa · Konwergencja · Reguła 70 · Endogeniczne teorie wzrostu | 37 | Koszty i korzyści przyjęcia euro · Kryteria konwergencji | 69 |
| makro-wzrost-1-cz2 (cz. 2) | – | 2 | Bank komercyjny · Europejski Bank Centralny · LTRO · Pakt fiskalny · Pożyczka a kredyt · Kuznets Simon · Lewis W. Arthur · Romer Paul · Simon Herbert · Solow Robert | 6 |
| makro-wzrost-2 | Choroba holenderska · Współczynnik Giniego i krzywa Lorenza · Wskaźnik decylowy · Ubóstwo skrajne, relatywne i ustawowe · Krzywa Kuznetsa · Dywidenda demograficzna | 40 | Minimum socjalne i minimum egzystencji · Dobro luksusowe · Giełda Papierów Wartościowych w Warszawie · Markowitz Harry · Model administracyjny decyzji | 52 |
| makro-wzrost-2-cz2 (cz. 2) | – | 4 | Branża · Monopol · Dywidenda · Przedsiębiorstwo państwowe i Skarb Państwa · Druga dywidenda demograficzna · Wiek emerytalny w Polsce · Nowa ekonomia klasyczna · Teoria gier · Wycena opcji: model Blacka–Scholesa i dwumianowy | 8 |
| makro-wzrost-3 | Teoria twórczej destrukcji · Przemysł 4.0 · Drenaż mózgów · Gospodarka cyrkularna · Zrównoważony rozwój · Rewolucje przemysłowe | 28 | Światowe Forum Ekonomiczne · Ford Henry · Cyrkulacja mózgów i migracje powrotne · Hume David · Ricardo David · Schumpeter Joseph A. | 55 |
| makro-wzrost-3-cz2 (cz. 2) | – | 2 | Kryzys subprime · Nacjonalizacja i prywatyzacja · Strategie konkurencyjne według pozycji rynkowej · Say Jean-Baptiste · Veblen Thorstein | 6 |
| makro-wzrost-4 | Deglobalizacja i regionalizacja · Gospodarki wschodzące i BRICS · Wydajność pracy i jej czynniki · Makroekonomiczna funkcja produkcji · Prawa własności i stabilność polityczna a wzrost · Wzrost liczby ludności a wzrost gospodarczy | 20 | – | 49 |
| makro-wzrost-5 | Polityka zorientowana na zewnątrz i do wewnątrz · Rachunek wzrostu i łączna produktywność czynników · Wskaźnik Hoovera | 7 | – | 19 |
| makro-handel-1 | Partnerzy handlowi Polski · Handel międzynarodowy · Przewaga absolutna · Przewaga komparatywna · Teoria Heckschera–Ohlina | 23 | Koszt alternatywny · Niewidzialna ręka rynku · Greenspan Alan · Hayek Friedrich von · Malthus Thomas · Mill John Stuart | 21 |
| makro-handel-1-cz2 (cz. 2) | – | 2 | Cykl życia produktu · Korzyści skali | 9 |
| makro-handel-2 | Paradoks Leontiefa · Handel wewnątrzgałęziowy · Diament Portera · Krzywa oferty · Wolny handel | 17 | Teoria wyboru publicznego · Porozumienia regionalne · Model Bertranda · Terms of trade · Warunek Marshalla–Lernera i krzywa J · Paradoks wody i diamentu · Prawo malejącej użyteczności krańcowej | 16 |
| makro-handel-2-cz2 (cz. 2) | – | 1 | Krugman Paul · Merkantylizm | 4 |
| makro-handel-3 | Protekcjonizm · Cło ad valorem i specyficzne · Skutki cła · Kontyngent · Bariery pozataryfowe | 18 | Cło · Rodrik Dani · Licencja i know-how · Interwencja walutowa · Krzywa doświadczenia · Regulacja, deregulacja i przejęcie regulacyjne · Subsydia eksportowe | 15 |
| makro-handel-4 | Dumping · Autarkia · Klauzula najwyższego uprzywilejowania · Globalizacja · Korporacja transnarodowa | 33 | Konkurencja doskonała · Formy monopolizacji · Dystrybucja · Style kierowania: autokratyczny, demokratyczny, liberalny · Fuzja i przejęcie · Bariery wejścia · Zamówienia publiczne | 32 |
| makro-handel-5 | Offshoring, outsourcing, nearshoring, reshoring · Internacjonalizacja przedsiębiorstwa – formy · Czebole i keiretsu · Twierdzenie Stolpera–Samuelsona · Subsydia eksportowe | 20 | Zarządzanie zasobami ludzkimi · Strategia · Franczyza · Organizowanie i struktura organizacyjna · Outsourcing · Efekty kreacji i przesunięcia handlu · Samuelson Paul | 22 |
| makro-handel-5-cz2 (cz. 2) | – | 1 | Delegowanie uprawnień · Doskonalenie organizacji · Zadłużenie zagraniczne | 1 |
| makro-kursy-1 | Zadłużenie zagraniczne · Saldo obrotów bieżących · Tożsamości gospodarki otwartej: NX = NCO i S = I + NCO · Ograniczenia parytetu siły nabywczej · Model gospodarki otwartej · Ucieczka kapitału | 15 | Cele, podmioty i instrumenty polityki gospodarczej | 46 |
| makro-kursy-2 | Indeks Big Maca · Bilans płatniczy · Dochody pierwotne i wtórne · Bilans handlowy · Międzynarodowa pozycja inwestycyjna netto · Rezerwy walutowe | 39 | Instrument pochodny · Swobodny przepływ pracowników w UE i emigracja z Polski po 2004 r. · Migracja zarobkowa · Przekazy pieniężne migrantów · Finansowanie deficytu · Produkty bankowe dla klientów | 62 |
| makro-kursy-2-cz2 (cz. 2) | – | 4 | Bank Rozrachunków Międzynarodowych · Bankowy Fundusz Gwarancyjny · Komitet Stabilności Finansowej · Deficyt pierwotny · Spread · Audyt wewnętrzny i biegły rewident · Bilans · Rachunek zysków i strat · Sprawozdanie finansowe | 8 |
| makro-kursy-3 | Kurs walutowy · Aprecjacja i deprecjacja · Kurs nominalny i realny · Parytet siły nabywczej – teoria kursu · Parytet stóp procentowych · System kursu płynnego i stałego | 49 | Rynek walutowy · Brexit · Transformacja systemowa i plan Balcerowicza · Ministerstwo Finansów · Mechanizm transmisji monetarnej · Paradoks rolnictwa | 64 |
| makro-kursy-3-cz2 (cz. 2) | – | 3 | Bony pieniężne NBP · Spekulacja · ERM II | 9 |
| makro-kursy-4 | Zarząd waluty · Euroizacja jednostronna · Trylemat Mundella–Fleminga · Model Mundella–Fleminga · Warunek Marshalla–Lernera i krzywa J · Kryzysy walutowe – generacje | 29 | Polityka gospodarcza · Elastyczność cenowa popytu · Plan Marshalla · Bank Światowy | 42 |
| makro-kursy-5 | Grzech pierworodny · Specjalne prawa ciągnienia · System z Bretton Woods · Standard złota · Akredytywa dokumentowa · Inkaso dokumentowe | 32 | Niezależność banku centralnego · OECD · Europejski Bank Odbudowy i Rozwoju · Międzynarodowy Fundusz Walutowy · Światowa Organizacja Handlu | 50 |
| makro-kursy-5-cz2 (cz. 2) | – | 2 | Pieniądz gotówkowy i bezgotówkowy · Zabezpieczenia kredytu · Zdolność kredytowa · Czek · Należności i zobowiązania · Weksel | 2 |
| makro-kursy-6 | Rezydent i nierezydent | 5 | – | 15 |
| makro-finanse-1 | Rynek funduszy pożyczkowych · Instytucje pośrednictwa finansowego · Niechęć do ryzyka · Podatek konsumpcyjny | 6 | – | 18 |
| makro-szkoly-1 | Merkantylizm · Fizjokratyzm · Szkoła klasyczna · Rewolucja marginalistyczna · Keynesizm · Monetaryzm | 40 | Ekonomia podaży · Budżet państwa · Szkoła austriacka · Rola państwa w gospodarce · Rynek finansowy · Użyteczność | 90 |
| makro-szkoly-1-cz2 (cz. 2) | – | 9 | Balcerowicz Leszek · Bank Rezerwy Federalnej · Marks Karol · Podział pracy i specjalizacja · Interwencjonizm państwowy · Laissez-faire · Mundell Robert, Fleming Marcus · Tobin James · Menger Carl · Lucas Robert E. · Owen Robert · Walras Léon | 18 |
| makro-szkoly-1-cz3 (cz. 3) | – | 1 | Fayol Henri · Mayo Elton · Taylor Frederick Winslow · Weber Max | 1 |
| makro-szkoly-2 | Nowa ekonomia klasyczna · Krytyka Lucasa · Oczekiwania adaptacyjne i racjonalne · Nowa ekonomia keynesowska · Szkoła austriacka · Instytucjonalizm i nowa ekonomia instytucjonalna | 36 | Kydland Finn, Prescott Edward · Kreacja pieniądza · Mises Ludwig von · Hipoteza rynku efektywnego · Minsky Hyman | 90 |
| makro-szkoly-2-cz2 (cz. 2) | – | 1 | Chamberlin Edward, Robinson Joan · Galbraith John Kenneth | 4 |
| makro-szkoly-3 | Ordoliberalizm i społeczna gospodarka rynkowa · Ekonomia heterodoksyjna · Konsensus waszyngtoński a kraje rozwijające się · Neoliberalizm · Eklektyzm · Instrumentalizm | 14 | Konstytucja RP – przepisy gospodarcze · Przedsiębiorca i działalność gospodarcza · Ustroje społeczno-ekonomiczne i systemy gospodarcze | 46 |
| makro-szkoly-4 | Paradygmat · Matematyzacja ekonomii – spór · Szkoły myśli ekonomicznej w polskiej ekonomii akademickiej | 8 | Biznes międzynarodowy i paradygmat eklektyczny · Internalizacja efektów zewnętrznych | 6 |
| makro-wzor-1 | Metody liczenia PKB · Produkt narodowy brutto · Produkt narodowy netto · Dochód osobisty i dochód rozporządzalny · PKB nominalny i realny · Deflator PKB | 0 | – | 0 |
| makro-wzor-2 | Funkcja konsumpcji · Krańcowa skłonność do konsumpcji i oszczędzania · Inwestycje · Q Tobina · Oszczędności narodowe · Odpływy kapitałowe netto | 0 | – | 0 |
| makro-wzor-3 | Mnożnik · Mnożnik podatkowy · Zagregowany popyt · Stopa bezrobocia · Prawo Okuna · Teoria ilościowa pieniądza | 0 | – | 0 |
| makro-wzor-4 | Efekt Fishera · Reguła 70 · Krańcowa skłonność do importu · Krzywa podaży Lucasa · Model okrężnego obiegu w gospodarce otwartej z państwem · Przeliczanie kwot pieniężnych z różnych okresów | 0 | – | 0 |
| makro-wzor-5 | Wydajność pracy i jej czynniki · Makroekonomiczna funkcja produkcji · Rynek funduszy pożyczkowych · Tożsamości gospodarki otwartej: NX = NCO i S = I + NCO · Teorie krótkookresowej podaży zagregowanej · Rachunek wzrostu i łączna produktywność czynników | 0 | – | 0 |
| makro-wzor-6 | Prędkość obiegu pieniądza · Indeks Big Maca · Kurs nominalny i realny · PKB – metoda wydatkowa · Dochód rozporządzalny i oszczędności · Równowaga w modelu mnożnikowym | 3 | – | 8 |
| makro-wzor-7 | Mnożniki – zestawienie · Inflacja i indeksy cen · Równanie wymiany · Prawo Okuna – obliczanie · Stopa bezrobocia i wskaźniki rynku pracy · Reguła 70 – wzór | 6 | – | 15 |
| makro-wzor-8 | Koszt alternatywny w handlu · Skutki cła w małym kraju – obliczanie · Kurs realny i parytet siły nabywczej – wzory · Współczynnik Giniego – wzór · Wartość dodana – sumowanie · Rachunek wzrostu – wzór | 6 | – | 13 |
| makro-osoba-1 | Beveridge William · Eichengreen Barry · Friedman Milton · Fukuyama Francis · Galbraith John Kenneth · Hayek Friedrich von | 7 | – | 1 |
| makro-osoba-2 | Hicks John · Keynes John Maynard · Kondratiew Nikołaj · Kornai János · Krugman Paul · Kuznets Simon | 13 | – | 8 |
| makro-osoba-3 | Layard Richard, Nickell Stephen, Jackman Richard · Leontief Wassily · List Friedrich · Lucas Robert E. · Marks Karol · Mises Ludwig von | 14 | – | 15 |
| makro-osoba-4 | Okun Arthur · Phillips Alban William · Putnam Robert · Quesnay François · Ricardo David · Samuelson Paul | 14 | – | 17 |
| makro-osoba-5 | Say Jean-Baptiste · Schumpeter Joseph A. · Solow Robert · Veblen Thorstein · Wicksell Knut · Hildebrand Bruno | 16 | – | 21 |
| makro-osoba-6 | Owen Robert · Watt James · Dunning John · Gomułka Stanisław · Kuhn Thomas · Nowak Leszek | 14 | – | 24 |
| makro-osoba-7 | Popper Karl · Posner Michael · Nordhaus William · Robertson Dennis · Barro Robert · Romer Paul | 22 | – | 31 |
| makro-osoba-8 | Acemoglu Daron, Johnson Simon, Robinson James · Mortensen Dale, Pissarides Christopher | 8 | – | 21 |
| makro-instytucja-1 | Światowa Organizacja Handlu · Międzynarodowy Fundusz Walutowy · Bank Światowy · Bank Rozrachunków Międzynarodowych · OECD | 17 | Grupa G7 i G20 · Swap walutowy | 25 |
| makro-instytucja-2 | OPEC · Główny Urząd Statystyczny · Międzynarodowa Organizacja Pracy · Światowe Forum Ekonomiczne | 6 | CEIDG i KRS | 8 |
| makro-data-1 | 1758 – „Tablica ekonomiczna” F. Quesnaya · 1776 – „Bogactwo narodów” A. Smitha · 1803 – „Traktat o ekonomii politycznej” J.B. Saya · 1817 – „Zasady ekonomii politycznej i opodatkowania” D. Ricardo · 1867 – „Kapitał” K. Marksa · 1871–1874 – rewolucja marginalistyczna | 3 | – | 0 |
| makro-data-2 | 1890 – „Zasady ekonomii” A. Marshalla · 1899 – „Teoria klasy próżniaczej” T. Veblena · 1929–1933 – Wielki Kryzys · 1936 – „Ogólna teoria” J.M. Keynesa · 1944 – konferencja w Bretton Woods · 1958 – krzywa Phillipsa | 7 | – | 4 |
| makro-data-3 | 1971 – koniec wymienialności dolara na złoto · 1973 – model Blacka–Scholesa i pierwszy szok naftowy · 2000 – płynny kurs złotego i bańka internetowa · 2008 – upadek Lehman Brothers · 2020 – pandemia COVID-19 | 7 | – | 9 |

## Polityka gospodarcza

| Lekcja | Hasła | Pytań | Nowe z pytań | Powtórka (liczba) |
|---|---|---|---|---|
| pol-podstawy-1 | Automatyczne stabilizatory · Polityka dyskrecjonalna · Polityka stabilizacyjna · Polityka ekspansywna i restrykcyjna · Opóźnienia polityki gospodarczej · Reguły a uznaniowość | 6 | Podatek dochodowy od osób fizycznych · Podatek progresywny, proporcjonalny i regresywny · Recesja i depresja | 0 |
| pol-podstawy-2 | Debaty o polityce makroekonomicznej · Polityka gospodarcza · Magiczny czworokąt polityki gospodarczej · Interwencjonizm państwowy · Etatyzm i polityka gospodarcza II RP · Planowanie gospodarcze w gospodarce rynkowej | 12 | Transformacja systemowa i plan Balcerowicza · Stawki VAT w Polsce · Stopa procentowa nominalna i realna | 6 |
| pol-podstawy-2-cz2 (cz. 2) | – | 2 | Friedman Milton · Hayek Friedrich von · Keynes John Maynard · Phelps Edmund · Galbraith John Kenneth · Mises Ludwig von | 2 |
| pol-podstawy-3 | Strategie rozwoju kraju · Cele, podmioty i instrumenty polityki gospodarczej · Policy mix · Nauka polityki gospodarczej i doktryny polityki gospodarczej · Reguła Tinbergena · Kolbertyzm | 3 | Płaca minimalna · Unia Europejska – historia · Marshall Alfred · Plan Marshalla · Równowaga rynkowa · Wzrost gospodarczy | 1 |
| pol-podstawy-4 | Dobra społecznie pożądane · Rola państwa w gospodarce · Picking the winners · Ekonomiczna teoria demokracji · Teoria wyboru publicznego | 5 | Konsumpcja · Popyt · Popyt indywidualny i rynkowy | 0 |
| pol-pieniezna-1 | Polityka kursowa · Problemy kontroli podaży pieniądza · Stopa poświęcenia · Dezinflacja Volckera i Thatcher · Strategia bezpośredniego celu inflacyjnego · Kotwica nominalna | 8 | Agregaty pieniężne · Bank centralny · Cel inflacyjny NBP · Narodowy Bank Polski · Kurs walutowy · Podaż pieniądza | 9 |
| pol-pieniezna-1-cz2 (cz. 2) | – | 2 | Wskaźnik cen towarów i usług konsumpcyjnych · Euro · Rada Polityki Pieniężnej | 3 |
| pol-pieniezna-2 | Cel operacyjny NBP · Stopy procentowe NBP · Korytarz stóp procentowych · Kredyt lombardowy · Kredyt refinansowy · Operacje otwartego rynku | 14 | Ministerstwo Finansów · Punkt procentowy a procent · Podatek · Rynek międzybankowy | 4 |
| pol-pieniezna-2-cz2 (cz. 2) | – | 1 | Rezerwa obowiązkowa · WIBOR i WIBID · Wartość pieniądza w czasie | 4 |
| pol-pieniezna-3 | Bony pieniężne NBP · Transakcja repo i reverse repo · Rezerwa obowiązkowa · Interwencja walutowa · Mechanizm transmisji monetarnej · Reguła Taylora | 20 | Polityka pieniężna – cele i instrumenty · Mnożnik · Obligacja · Przedsiębiorstwo państwowe i Skarb Państwa · Papier wartościowy · Weksel | 11 |
| pol-pieniezna-3-cz2 (cz. 2) | – | 2 | Inflacja · Produkt potencjalny i luka PKB · Podatek akcyzowy · Płaca nominalna i realna · Zasiłek dla bezrobotnych | 10 |
| pol-pieniezna-4 | Forward guidance · Luzowanie ilościowe · Zacieśnianie ilościowe · Strategia wyjścia · Ujemne stopy procentowe · Asymetria polityki pieniężnej | 14 | Europejski Bank Centralny · Rynek pierwotny i wtórny · Sekurytyzacja | 15 |
| pol-pieniezna-4-cz2 (cz. 2) | – | 1 | Akcept bankierski i certyfikat depozytowy · Bank inwestycyjny i bank uniwersalny · Indeksy światowe · Kryzys subprime · System Rezerwy Federalnej | 2 |
| pol-pieniezna-5 | Jastrzębie i gołębie · Niezależność banku centralnego · Monetyzacja długu publicznego · LTRO · Polityka pieniężna – cele i instrumenty · Kredyt wekslowy NBP | 30 | Rada Ministrów · POLONIA · Terminy transakcji międzybankowych · Haircut · Swap walutowy · Prezes NBP | 35 |
| pol-pieniezna-5-cz2 (cz. 2) | – | 9 | Teorie krótkookresowej podaży zagregowanej · Podatek od towarów i usług · Obligacje skarbowe · Giełda Papierów Wartościowych w Warszawie · Samorząd terytorialny w Polsce · Krótki okres i długi okres · Rezerwy walutowe · Zarząd NBP · Bank Gospodarstwa Krajowego · Produkty bankowe dla klientów · Wskaźniki koncentracji rynku | 20 |
| pol-pieniezna-5-cz3 (cz. 3) | – | 2 | Dewaluacja i rewaluacja · Unia Gospodarcza i Walutowa · Konstytucja RP – przepisy gospodarcze | 11 |
| pol-pieniezna-6 | Projekcja inflacji i PKB NBP · Polityka antyinflacyjna | 3 | Analiza ex ante i ex post | 12 |
| pol-fiskalna-1 | Niekeynesowskie efekty polityki fiskalnej · Ekonomia podaży · Krzywa Laffera · Polityka podażowa · Ekwiwalencja ricardiańska | 15 | Dług publiczny · Deficyt budżetowy i deficyt sektora finansów publicznych · Podatki bezpośrednie i pośrednie · Barro Robert | 16 |
| pol-fiskalna-2 | Progi ostrożnościowe i konstytucyjny limit długu · Stabilizująca reguła wydatkowa · Reguła złotej zasady · Konsolidacja fiskalna · Polityka fiskalna | 16 | Inwestycje · Produkt krajowy brutto · Autarkia · Krańcowa skłonność do konsumpcji i oszczędzania · Zagregowany popyt · Budżet państwa · Ustawa o finansach publicznych | 17 |
| pol-fiskalna-3 | Klauzula wyjścia · Procedura nadmiernego deficytu · Pakt fiskalny · Efekt Tanziego–Olivery · Prawo Wagnera | 13 | Deficyt strukturalny i cykliczny · Parlament Europejski · Sektor finansów publicznych | 10 |
| pol-spoleczna-1 | Flexicurity · Aktywna i pasywna polityka rynku pracy · Płaca minimalna · Klin podatkowy · Polityka dochodowa i społeczna | 17 | Branża · Ekonomia · Stopa efektywna · Szara strefa · Wynik finansowy – poziomy | 19 |
| pol-spoleczna-2 | Polityka cenowa państwa i ceny administrowane · Polityka rodzinna i mieszkaniowa; wykluczenie społeczne · Dialog społeczny i Rada Dialogu Społecznego · Układy zbiorowe pracy i regulacje rynku pracy · Minimum socjalne i minimum egzystencji | 10 | Regulacja, deregulacja i przejęcie regulacyjne · Instrumenty polityki rodzinnej w Polsce · Procedura budżetowa w Polsce · Płaca minimalna w Polsce | 19 |
| pol-sektorowa-1 | Polityka strukturalna i regionalna · Euroregiony i współpraca transgraniczna · Polityka ekologiczna · Polityka innowacyjna i naukowa · Polityka rolna i żywnościowa · Polityka inwestycyjna i prowzrostowa | 16 | Transfery socjalne · Specjalne strefy ekonomiczne i Polska Strefa Inwestycji · Grupa G7 i G20 | 22 |
| pol-sektorowa-2 | Polityka konkurencji · Pomoc publiczna · Polityka handlowa i wspieranie eksportu · Polityka energetyczna i klimatyczna · Wspólna Polityka Rolna · Specjalne strefy ekonomiczne i Polska Strefa Inwestycji | 12 | Narodowy Fundusz Zdrowia · Ubezpieczenia społeczne · Ubezpieczenie · Ubezpieczeniowy Fundusz Gwarancyjny | 15 |
| pol-sektorowa-3 | Kraje nowo uprzemysłowione · Biegun wzrostu · Narodowy system innowacji · Granice prywatyzacji · Polityka przemysłowa – horyzontalna i sektorowa | 9 | – | 10 |
| pol-ue-1 | Hipoteza dochodu permanentnego · Teoria optymalnego obszaru walutowego · Szok asymetryczny · Koszty i korzyści przyjęcia euro · Eurogrupa i unia fiskalna · Federalizm fiskalny | 18 | Hipoteza cyklu życia · Dochód osobisty i dochód rozporządzalny · Duesenberry James · Modigliani Franco, Miller Merton | 30 |
| pol-ue-1-cz2 (cz. 2) | – | 3 | Kalecki Michał · Minsky Hyman · Smith Adam · Bagehot Walter · Gesell Silvio · McKinnon Ronald, Kenen Peter · Ricardo David · Kuznets Simon · Laffer Arthur · Mundell Robert, Fleming Marcus · Simon Herbert | 3 |
| pol-ue-2 | Harmonizacja podatków w UE · Terms of trade · Integracja gospodarcza – formy · Efekty kreacji i przesunięcia handlu · Unia Europejska – historia · Cztery swobody rynku wewnętrznego UE | 30 | Instytucje UE · Inwestycje bezpośrednie i portfelowe · 2002 – gotówka euro · Współczynnik obciążenia demograficznego · Europejski Urząd Statystyczny · Współczynnik dzietności | 26 |
| pol-ue-2-cz2 (cz. 2) | – | 10 | Kreacja pieniądza · Negocjacje · Aprecjacja i deprecjacja · Cykl koniunkturalny · HICP · Migracja zarobkowa · Strefa Schengen · Europejski Bank Inwestycyjny · Bilans handlowy · Cło · Paradoks rolnictwa · Społeczna odpowiedzialność biznesu | 19 |
| pol-ue-2-cz3 (cz. 3) | – | 8 | Przepisy dotyczące pracy cudzoziemców w Polsce · Uchodźcy i ochrona międzynarodowa · Mnożnik zrównoważonego budżetu · Trylemat Mundella–Fleminga · Główny Urząd Statystyczny · Saldo migracji · Struktura instytucjonalna i zasady funkcjonowania UE · Europejski Bank Odbudowy i Rozwoju · Swobodny przepływ pracowników w UE i emigracja z Polski po 2004 r. · Europejski System Walutowy i ERM · Osoba fizyczna, prawna i jednostka organizacyjna | 11 |
| pol-ue-2-cz4 (cz. 4) | – | 4 | Podatek dochodowy od osób prawnych · Podatki lokalne · Skala podatkowa PIT · Kartel · Mała, średnia i mikrofirma · Urząd Ochrony Konkurencji i Konsumentów · Protekcjonizm · Warunek Marshalla–Lernera i krzywa J · 1993 – reguła Taylora i jednolity rynek UE · Pieniądz · Przedsiębiorczość | 7 |
| pol-ue-3 | Unia Gospodarcza i Walutowa · Euro · Kryteria konwergencji · ERM II · Europejski System Walutowy i ERM · Unia bankowa | 31 | Oszczędności narodowe · Pieniądz elektroniczny i karta płatnicza · Bank Rozrachunków Międzynarodowych · Finanse publiczne · Europejski System Banków Centralnych · 2010–2012 – kryzys zadłużeniowy w strefie euro | 31 |
| pol-ue-3-cz2 (cz. 2) | – | 8 | PKB per capita i parytet siły nabywczej · Pieniądz gotówkowy i bezgotówkowy · Spekulacja · Gwarancja depozytów BFG · Gwarancje de minimis · System kursu płynnego i stałego · Zarząd waluty · Europejski Mechanizm Stabilności · Fundusze europejskie · Stawki CIT · Upadłość i restrukturyzacja | 11 |
| pol-ue-4 | Fundusze europejskie · Porozumienia regionalne · Incoterms · Efekt cappuccino · Brexit · Struktura instytucjonalna i zasady funkcjonowania UE | 22 | Karta Polaka i Niebieska Karta UE · Bank Światowy · Fuzja i przejęcie · OPEC · Organizacja | 26 |
| pol-ue-5 | Strefa Schengen · Traktat akcesyjny i droga Polski do UE · Raport Delorsa | 9 | – | 16 |
| pol-transformacja-1 | Konsensus waszyngtoński · Gospodarka niedoboru · Transformacja systemowa i plan Balcerowicza · Gospodarka wojenna · Ustroje społeczno-ekonomiczne i systemy gospodarcze | 23 | Państwowy fundusz celowy · Nacjonalizacja i prywatyzacja · Rozwój gospodarczy | 43 |
| pol-transformacja-2 | Programy dostosowawcze MFW · Reformy gospodarcze w PRL w latach 80. i ustawa Wilczka · Okrągły Stół, prywatyzacja i NFI – etapy przemian w Polsce · Plan Marshalla · RWPG | 9 | OECD | 22 |
| pol-transformacja-3 | Terapia szokowa a gradualizm · Prywatyzacja bezpośrednia i akcjonariat pracowniczy · Popiwek | 4 | – | 11 |
| polityka-wzor-1 | Stopa poświęcenia · Reguła Taylora · Terms of trade · Reguła Taylora – wzór | 1 | – | 0 |
| polityka-osoba-1 | Balcerowicz Leszek · Kalecki Michał · Kydland Finn, Prescott Edward · Laffer Arthur · Lange Oskar · McKinnon Ronald, Kenen Peter | 9 | – | 1 |
| polityka-osoba-2 | Minsky Hyman · Mundell Robert, Fleming Marcus · Phelps Edmund · Rodrik Dani · Stiglitz Joseph · Taylor John B. | 13 | – | 6 |
| polityka-osoba-3 | Williamson John · Hume David · Buchanan James · Downs Anthony · Kwiatkowski Eugeniusz · Łaski Kazimierz | 14 | – | 12 |
| polityka-osoba-4 | Osiatyński Jerzy · Sadowski Zdzisław · Mazowiecki Tadeusz · Tinbergen Jan | 14 | – | 15 |
| polityka-instytucja-1 | Grupa G7 i G20 · Instytucje UE · Rada Ministrów · Komisja Europejska | 5 | Rada Unii Europejskiej i Rada Europejska | 12 |
| polityka-instytucja-2 | Rada Unii Europejskiej i Rada Europejska · Parlament Europejski · Europejski Urząd Statystyczny · Europejski Mechanizm Stabilności | 8 | – | 2 |
| polityka-data-1 | 1947 – GATT · 1951 – Europejska Wspólnota Węgla i Stali · 1957 – traktaty rzymskie · 1961 – OECD i teoria optymalnych obszarów walutowych · 1968 – unia celna EWG | 3 | – | 2 |
| polityka-data-2 | 1979 – Europejski System Walutowy i drugi szok naftowy · 1986 – Polska w MFW i Banku Światowym · 1989 – plan Balcerowicza i konsensus waszyngtoński · 1992 – traktat z Maastricht i czarna środa · 1993 – reguła Taylora i jednolity rynek UE | 5 | – | 5 |
| polityka-data-3 | 1995 – denominacja złotego i WTO · 1996 – Polska w OECD · 1997 – Konstytucja RP i ustawa o NBP · 1998 – powstanie RPP i EBC · 2004 – Polska w Unii Europejskiej | 6 | – | 8 |
| polityka-data-4 | 2010–2012 – kryzys zadłużeniowy w strefie euro · 2016 – 500+ i referendum w sprawie brexitu · 2017 – Krajowa Administracja Skarbowa i obniżenie wieku emerytalnego · 2019 – PPK i split payment · 2022 – Polski Ład i cykl podwyżek stóp | 5 | – | 5 |
| polityka-data-5 | 2023 – Chorwacja w strefie euro · 2024 – 800+, halving bitcoina, procedura nadmiernego deficytu wobec Polski · 2026 – Bułgaria w strefie euro i KSeF · 2011 – pełne otwarcie rynków pracy Niemiec i Austrii · 2013 – początek podnoszenia wieku emerytalnego do 67 lat | 5 | – | 7 |
| polityka-przepis-1 | Konstytucja RP – przepisy gospodarcze · Ustawa o ochronie konkurencji i konsumentów · Ustawa o prawach konsumenta · Płaca minimalna w Polsce | 1 | – | 0 |

## Podstawy finansów

| Lekcja | Hasła | Pytań | Nowe z pytań | Powtórka (liczba) |
|---|---|---|---|---|
| fin-podstawy-1 | Kategorie finansowe · Pożyczka a kredyt · Teoria bankowa i obiegowa · Model Baumola–Tobina · Monetyzacja gospodarki · Finanse behawioralne | 2 | – | 0 |
| fin-podstawy-2 | Finansjalizacja · Klasyczna i liberalna teoria finansów · Teoria finansowania antycyklicznego · Polityka finansowa · Sektory instytucjonalne gospodarki | 0 | – | 0 |
| fin-obligacje-1 | Obligacja · Obligacja zerokuponowa · Obligacje skarbowe · Bony skarbowe · Obligacje komunalne i przychodowe · Obligacje zamienne i z prawem pierwszeństwa | 17 | Rezydent i nierezydent · Upadłość i restrukturyzacja · Cena czysta i brudna obligacji · Inflacja · Oszczędności narodowe | 2 |
| fin-obligacje-1-cz2 (cz. 2) | – | 4 | Akcja · Stopa procentowa nominalna i realna · Przedsiębiorstwo państwowe i Skarb Państwa · Bank Gospodarstwa Krajowego · Ministerstwo Finansów · Narodowy Bank Polski · Bank hipoteczny i list zastawny · Kwity depozytowe · Srebrna gospodarka · Warrant | 3 |
| fin-obligacje-1-cz3 (cz. 3) | – | 1 | Akcept bankierski i certyfikat depozytowy · Bank centralny · Bank komercyjny · Sekurytyzacja | 3 |
| fin-obligacje-2 | Obligacje śmieciowe · TIPS · Rentowność do wykupu · Cena czysta i brudna obligacji · Duration · Krzywa dochodowości | 16 | Recesja i depresja · Wartość pieniądza w czasie · Ceteris paribus · Inwestycje | 9 |
| fin-obligacje-3 | Rating kredytowy · Spread · Wartość pieniądza w czasie · Procent prosty i składany · Stopa efektywna · Renta i perpetuita | 32 | Rachunek przepływów pieniężnych · Instrument pochodny · CDS · Agencje ratingowe · Fundusz inwestycyjny otwarty i zamknięty | 16 |
| fin-obligacje-3-cz2 (cz. 2) | – | 2 | Dywersyfikacja · Ryzyko systematyczne i specyficzne · Finansowanie zabezpieczone, spekulacyjne i Ponziego · Hipoteza niestabilności finansowej | 7 |
| fin-podatki-1 | Podatek od zysków kapitałowych · Udziały JST w podatkach dochodowych · Podatki lokalne · Podatek · Elementy konstrukcji podatku · Podatki bezpośrednie i pośrednie | 20 | Podatek progresywny, proporcjonalny i regresywny · Skala podatkowa PIT · Uproszczone formy ewidencji · Podatek dochodowy od osób prawnych · Polityka dochodowa i społeczna · Podatek akcyzowy | 11 |
| fin-podatki-1-cz2 (cz. 2) | – | 7 | Dochód osobisty i dochód rozporządzalny · Transfery socjalne · Kredyt obrotowy i inwestycyjny · Leasing · Krajowa Administracja Skarbowa · Terminy podatkowe i zeznania · Wynik finansowy – poziomy · Zysk ekonomiczny · Podatek dochodowy od osób fizycznych · Umowa o pracę i umowy cywilnoprawne · Wartość dodana · Podatek od towarów i usług | 7 |
| fin-podatki-1-cz3 (cz. 3) | – | 2 | Laffer Arthur · Okun Arthur · Phillips Alban William · Współczynnik Giniego i krzywa Lorenza · Komisja Nadzoru Finansowego · Najwyższa Izba Kontroli · Regionalne izby obrachunkowe · Ubezpieczenia społeczne | 3 |
| fin-podatki-2 | Podatek progresywny, proporcjonalny i regresywny · Stawka nominalna, przeciętna i krańcowa · Fiskalizm · Reguły podatkowe A. Smitha · Reguła edynburska · Podatek dochodowy od osób fizycznych | 31 | Automatyczne stabilizatory · Podatek od gier i podatek tonażowy · Związki zawodowe a rynek pracy · Podatek zryczałtowany · Limity kapitału zakładowego spółek · Globalizacja | 12 |
| fin-podatki-2-cz2 (cz. 2) | – | 6 | Składki na ubezpieczenia społeczne · WIG20 · Rezerwa obowiązkowa · Smith Adam · Teoria sprawiedliwości · Waloryzacja i emerytura minimalna · Zasiłek dla bezrobotnych · Branża · Operacje otwartego rynku · Subwencja i dotacja | 12 |
| fin-podatki-3 | Podatek dochodowy od osób prawnych · Podatek od towarów i usług · Odwrotne obciążenie VAT · Faktura VAT i KSeF · Podatek akcyzowy · Cło | 32 | Rozliczenia międzyokresowe · Stawki VAT w Polsce · Metody amortyzacji · Należności i zobowiązania · Polityka fiskalna · Samorząd terytorialny w Polsce | 17 |
| fin-podatki-3-cz2 (cz. 2) | – | 8 | Nadwyżka konsumenta · Popyt · Podatek od niektórych instytucji finansowych · Specjalne strefy ekonomiczne i Polska Strefa Inwestycji · Bilans · Pasywa: kapitał własny i zobowiązania · Unia Europejska – historia · Wspólny podatek UE i zasoby własne · Deficyt budżetowy i deficyt sektora finansów publicznych · Bariery pozataryfowe · Kontyngent · Polityka handlowa i wspieranie eksportu | 12 |
| fin-podatki-3-cz3 (cz. 3) | – | 1 | Krajowy System e-Faktur · Pracownicze Plany Kapitałowe · Rynek międzybankowy | 2 |
| fin-podatki-4 | Podatek od czynności cywilnoprawnych · Podatek od spadków i darowizn · Podatek od niektórych instytucji finansowych · Podatek od gier i podatek tonażowy · Podatek Tobina · Ordynacja podatkowa | 16 | – | 13 |
| fin-podatki-5 | Interpretacja indywidualna i ogólna · Abolicja podatkowa · Unikanie opodatkowania i optymalizacja podatkowa · Cienka kapitalizacja · Ceny transferowe · Podwójne opodatkowanie | 18 | Wartość nominalna, emisyjna, rynkowa i księgowa akcji · Spółki kapitałowe · Dystrybucja · Rola państwa w gospodarce | 25 |
| fin-podatki-5-cz2 (cz. 2) | – | 1 | Ekonomia normatywna · Ekonomia pozytywna · Handel międzynarodowy · Płaca minimalna | 4 |
| fin-podatki-6 | Tarcza podatkowa · Wspólny podatek UE i zasoby własne · Przeciętna i krańcowa stopa podatkowa · Podatek katastralny · Koszty uzyskania przychodów | 17 | Źródła finansowania przedsiębiorstwa · Stawki CIT · Bodźce w ekonomii · Księga wieczysta · Europejski Bank Centralny · Instytucje UE · Koszt kapitału własnego i obcego | 21 |
| fin-ubezpieczenia-1 | Ubezpieczenie · Ubezpieczenia obowiązkowe w Polsce · Autocasco i NNW · Franszyza integralna i redukcyjna · Suma ubezpieczenia, niedoubezpieczenie i nadubezpieczenie · Reasekuracja | 30 | Działy ubezpieczeń · Spółki osobowe i kapitałowe – wspólnicy · Urząd Ochrony Konkurencji i Konsumentów · Ubezpieczeniowy Fundusz Gwarancyjny · Narodowy Fundusz Zdrowia · Gwarancja depozytów BFG | 25 |
| fin-ubezpieczenia-1-cz2 (cz. 2) | – | 1 | Negatywna selekcja · Pokusa nadużycia | 3 |
| fin-ubezpieczenia-2 | Aktuariusz · Towarzystwo ubezpieczeń wzajemnych · Bezpośrednia likwidacja szkód · Ubezpieczeniowy fundusz kapitałowy · Działy ubezpieczeń · Ubezpieczenia społeczne | 24 | Spółki osobowe · Przeciętne dalsze trwanie życia i tablice trwania życia · Audyt wewnętrzny i biegły rewident · Rada Ministrów · DB, DC i NDC – formuły emerytalne · Kasa Rolniczego Ubezpieczenia Społecznego | 38 |
| fin-pieniadz-1 | Pieniądz · Pieniądz towarowy, kruszcowy i fiducjarny · Pieniądz gotówkowy i bezgotówkowy · Prawo Kopernika–Greshama · Tezauryzacja · Siła nabywcza pieniądza | 22 | Podaż pieniądza · Emisja banknotów i monet w Polsce · Hiperinflacja · Specjalne prawa ciągnienia · Prezes NBP · Papier wartościowy | 12 |
| fin-pieniadz-1-cz2 (cz. 2) | – | 2 | Aktywa trwałe i obrotowe · Wskaźniki płynności · Metody prognozowania · PKB per capita i parytet siły nabywczej · Produkt krajowy brutto · Wzrost gospodarczy | 2 |
| fin-pieniadz-2 | Denominacja · Dewaluacja i rewaluacja · Seigniorage · Agregaty pieniężne · Baza monetarna · Kreacja pieniądza | 20 | Stopy procentowe NBP · Gotówka w obiegu · Dług publiczny · Aprecjacja i deprecjacja · Rezerwy walutowe | 18 |
| fin-pieniadz-2-cz2 (cz. 2) | – | 2 | Inflacja i indeksy cen · Zadłużenie zagraniczne · 1924 – reforma W. Grabskiego i Bank Polski · Euro | 4 |
| fin-pieniadz-3 | Mnożnik kreacji pieniądza · Popyt na pieniądz · Stopa procentowa nominalna i realna · Naturalna stopa procentowa · Waluta cyfrowa banku centralnego · Kryptowaluta | 36 | Efekt wypychania · Koszt alternatywny · Wielkość popytu a popyt · Inflacja oczekiwana i nieoczekiwana · Brexit · Mechanizm transmisji monetarnej | 44 |
| fin-pieniadz-3-cz2 (cz. 2) | – | 6 | Podaż · Parytet stóp procentowych · Teoria gier · Model IS-LM · Polityka pieniężna – cele i instrumenty · Deflacja i dezinflacja · Teorie rynku dualnego, systemów światowych i sieci migracyjnych · Rada Polityki Pieniężnej · Zarząd NBP · Friedman Milton · Galbraith John Kenneth · Keynes John Maynard | 11 |
| fin-pieniadz-3-cz3 (cz. 3) | – | 4 | Diamond Douglas · Minsky Hyman · Produkt potencjalny i luka PKB · Reguła Taylora · Sektor finansów publicznych · Bank Rezerwy Federalnej · Strategia wyjścia · System Rezerwy Federalnej · Greenspan Alan · Wicksell Knut | 8 |
| fin-pieniadz-3-cz4 (cz. 4) | – | 1 | Efekt stadny · Internacjonalizacja i globalizacja finansów · Teorie krótkookresowej podaży zagregowanej | 2 |
| fin-pieniadz-4 | Bitcoin i halving · Blockchain · Stablecoin i altcoin · Pieniądz elektroniczny i karta płatnicza · Gotówka w obiegu · Emisja banknotów i monet w Polsce | 31 | Mała, średnia i mikrofirma · System z Bretton Woods · Bony pieniężne NBP · Ustawa o kryptoaktywach i MiCA | 29 |
| fin-pieniadz-5 | Pieniądz bankowy a gotówka w strukturze M3 · Kurs krzyżowy · Monety kolekcjonerskie i obiegowe okolicznościowe · Podaż pieniądza · Opcja w pieniądzu, przy pieniądzu, poza pieniądzem | 20 | Kurs walutowy · Mnożnik · Równowaga rynkowa | 35 |
| fin-banki-1 | Bank centralny · Pożyczkodawca ostatniej instancji · POLONIA · WIBOR i WIBID · Rynek międzybankowy · Bank komercyjny | 37 | Pułapka płynności · Outsourcing · Bank Anglii · Polityka rodzinna i mieszkaniowa; wykluczenie społeczne · Zagregowana podaż · Punkt procentowy a procent | 48 |
| fin-banki-1-cz2 (cz. 2) | – | 12 | Transakcja repo i reverse repo · Interwencja walutowa · Luzowanie ilościowe · Forward guidance · Polityka ekspansywna i restrykcyjna · Bankowy Fundusz Gwarancyjny · Unia Gospodarcza i Walutowa · Biura informacji gospodarczej · Bagehot Walter · Hayek Friedrich von · Bilans banku centralnego · Asymetria informacji | 30 |
| fin-banki-1-cz3 (cz. 3) | – | 4 | Wykresy w ekonomii: nachylenie i układ współrzędnych · Krótki okres i długi okres · Neutralność pieniądza i dychotomia klasyczna · Teoria ilościowa pieniądza · Korytarz stóp procentowych · Stopa bezrobocia · Konstytucja RP – przepisy gospodarcze · Prawo bankowe · Ustawa o Narodowym Banku Polskim · Ustawa o finansach publicznych | 11 |
| fin-banki-2 | Bank spółdzielczy · Bank hipoteczny i list zastawny · SKOK · Operacje bankowe czynne i bierne · Aktywa i pasywa banku · Bilans banku centralnego | 25 | Spółdzielnia · Cel inflacyjny NBP · Biuro Informacji Kredytowej | 40 |
| fin-banki-3 | Współczynnik wypłacalności · Umowy bazylejskie · Run na bank · Przymusowa restrukturyzacja · Bailout i bail-in · Zbyt duży, by upaść | 24 | Dzień trzech wiedźm | 32 |
| fin-banki-4 | Credit crunch · Kryzys subprime · Pakiet zaufania · Rozliczenia międzybankowe: SORBNET, Elixir, KIR · BLIK · Zdolność kredytowa | 24 | Bernanke Ben · Mises Ludwig von · Prawo malejącej użyteczności krańcowej · Ryzyko, niepewność i wartość oczekiwana · Wskaźnik Sharpe’a | 46 |
| fin-banki-5 | Rzeczywista roczna stopa oprocentowania · Kredyt konsumencki i odsetki maksymalne · Raty równe i malejące · Karencja i prolongata · Konsolidacja kredytów · Lokata antybelkowa | 27 | Fundusz inwestycyjny · Promesa kredytowa | 45 |
| fin-banki-6 | Polisolokata · Bancassurance · Cash back · Rachunek nostro i loro · Weksel · Czek | 28 | Bilans płatniczy · Produkty bankowe dla klientów · Zarządzanie zasobami ludzkimi | 45 |
| fin-banki-7 | Akcept bankierski i certyfikat depozytowy · Kredyty frankowe · Promesa kredytowa · Rekomendacja S · Pożyczki społecznościowe · Kredyt balonowy | 29 | Finansowanie mezzanine i kredyt rewolwingowy · House Robert · Rynek pierwotny i wtórny · Bank Rozrachunków Międzynarodowych · Europejski Bank Inwestycyjny | 53 |
| fin-banki-7-cz2 (cz. 2) | – | 1 | Follett Mary Parker · Mayo Elton · Naukowe zarządzanie · Taylor Frederick Winslow | 1 |
| fin-banki-8 | Czynności bankowe · Bank inwestycyjny i bank uniwersalny · Produkty bankowe dla klientów · System płatniczy · Instytucja pożyczkowa · Konosament | 13 | Zarząd waluty · Ryzyko walutowe i stopy procentowej w przedsiębiorstwie · Osoba fizyczna, prawna i jednostka organizacyjna · Emisja papierów wartościowych – przebieg · Fuzja i przejęcie | 26 |
| fin-rynek-1 | Rynek pieniężny · Terminy transakcji międzybankowych · Rynek finansowy · Rynek kapitałowy · Rynek pierwotny i wtórny · Rynek regulowany i ASO | 22 | OECD · Rzecznik Finansowy · FRA · Opcje binarne | 46 |
| fin-rynek-2 | Papier wartościowy · Dematerializacja · Akcja · Akcje uprzywilejowane · Wartość nominalna, emisyjna, rynkowa i księgowa akcji · Agio | 37 | Amortyzacja · Rynek walutowy · Wskaźniki wyprzedzające · Kapitał zakładowy, zapasowy i rezerwowy · Krajowy Depozyt Papierów Wartościowych · Zabezpieczenia kredytu | 59 |
| fin-rynek-2-cz2 (cz. 2) | – | 8 | Struktura kapitału i teorie jej wyboru · Korelacja a przyczynowość · Crowdfunding · Europejskie urzędy nadzoru · Giełda Papierów Wartościowych w Warszawie · Kontrakt terminowy · Demografia a inflacja i stopy procentowe · Skutki starzenia się dla rynku pracy i finansów publicznych | 15 |
| fin-rynek-3 | Prawo poboru · Prawo do akcji · Dywidenda · Split i scalenie akcji · Pierwsza oferta publiczna · Prospekt emisyjny | 39 | Komitet Stabilności Finansowej · Opcja · Model Gordona · Organy spółki akcyjnej · Wezwanie | 45 |
| fin-rynek-3-cz2 (cz. 2) | – | 1 | Wskaźnik cena/wartość księgowa · Wskaźnik cena/zysk | 1 |
| fin-rynek-4 | Spółka publiczna · Przymusowy wykup i odkup · Wezwanie · Wrogie przejęcie i metody obrony · NewConnect · Catalyst | 24 | Instytucje finansowe – rodzaje | 38 |
| fin-rynek-5 | Indeks giełdowy · WIG · WIG20 · Indeksy światowe · Blue chips · Hossa i bessa | 22 | Indeksy GPW – zestaw · Zysk na akcję · Analiza fundamentalna i techniczna · Fundusz hedgingowy | 31 |
| fin-rynek-6 | Zlecenia giełdowe na GPW · Notowania ciągłe i jednolite · Animator i market maker · Dzień trzech wiedźm · Krótka sprzedaż · Arbitraż | 22 | Spekulacja · Hedging | 33 |
| fin-rynek-7 | Spekulacja · Day trading i market timing · Analiza fundamentalna i techniczna · Wskaźnik cena/zysk · Wskaźnik cena/wartość księgowa · Zysk na akcję | 35 | Makroekonomia · Wskaźniki rentowności · Keynesizm · ERM II · Średni ważony koszt kapitału | 50 |
| fin-rynek-7-cz2 (cz. 2) | – | 3 | EBITDA · Wewnętrzna stopa zwrotu i MIRR · Deflator PKB · PPI · Wskaźnik cen towarów i usług konsumpcyjnych · Dobro niższego rzędu · Efekt substytucyjny i efekt dochodowy · Popyt doskonale elastyczny / doskonale nieelastyczny · Prawo popytu | 8 |
| fin-rynek-8 | Kapitalizacja giełdowa · Dźwignia finansowa · Hipoteza rynku efektywnego · Inwestor instytucjonalny i indywidualny · Indeksy GPW – zestaw · Formacje analizy technicznej | 23 | Insider trading · Inflacja pełzająca, krocząca, galopująca · Wycena przedsiębiorstwa – metody · Akerlof George · Fama Eugene · Shiller Robert | 42 |
| fin-rynek-9 | Window dressing · System finansowy – struktura i funkcje · Instytucje finansowe – rodzaje · Internacjonalizacja i globalizacja finansów · Rynek walutowy · Zachowania finansowe gospodarstw domowych | 26 | Badania marketingowe · Strategia bezpośredniego celu inflacyjnego · Czynniki kształtujące podaż · Nowoczesna teoria portfela · Kalecki Michał · Podatek Pigou | 58 |
| fin-rynek-10 | Instrument finansowy – istota i rodzaje · Pozabankowi pośrednicy finansowi · Fundusze powiernicze i towarzystwa funduszy inwestycyjnych · Pozycja walutowa · Kwity depozytowe | 4 | – | 11 |
| fin-inwestycje-1 | Swap walutowy · Hedging · Fundusz inwestycyjny · Fundusz inwestycyjny otwarty i zamknięty · Rodzaje funduszy wg polityki · ETF | 35 | Wycena zapasów · Licencja i know-how · Haircut · Fundusze private equity i venture capital · System emerytalny w Polsce | 72 |
| fin-inwestycje-2 | REIT · Fundusze private equity i venture capital · Fundusz hedgingowy · Instrument pochodny · Kontrakt terminowy · Opcja | 47 | Umowy w kodeksie cywilnym · Dźwignia operacyjna i finansowa · Problem pryncypała i agenta · Marka i rebranding | 71 |
| fin-inwestycje-3 | Strategie opcyjne: straddle i strangle · Wycena opcji: model Blacka–Scholesa i dwumianowy · Swap · FRA · CDS · Opcje binarne | 26 | Black Fischer, Scholes Myron, Merton Robert · Phelps Edmund · Q Tobina · Cox John, Ross Stephen, Rubinstein Mark · Modigliani Franco, Miller Merton | 55 |
| fin-inwestycje-3-cz2 (cz. 2) | – | 1 | French John i Raven Bertram · Sharpe William | 6 |
| fin-inwestycje-4 | CFD · Sekurytyzacja · Ryzyko inwestycyjne · Ryzyko systematyczne i specyficzne · Dywersyfikacja portfela · Nowoczesna teoria portfela | 32 | Markowitz Harry · Hipoteka · Model CAPM · Endogeniczne teorie wzrostu · Model, teoria i prawo ekonomiczne | 78 |
| fin-inwestycje-5 | Model CAPM · Bańka spekulacyjna · Insider trading · Dom maklerski · Faktoring · Forfaiting | 38 | Otwarte fundusze emerytalne · Franczyza · Incoterms · Akredytywa dokumentowa · Inkaso dokumentowe | 74 |
| fin-inwestycje-5-cz2 (cz. 2) | – | 3 | Podejmowanie decyzji · Progi znacznych pakietów akcji · Kahneman Daniel · Thaler Richard · Monopson · Teoria optymalnego obszaru walutowego | 11 |
| fin-inwestycje-6 | Leasing · Warrant · IRS i CIRS · Wskaźnik Sharpe’a · Efekt stadny · Fundusz parasolowy | 25 | Kredyt kupiecki · Dumping · Strategie wobec produktu w schyłku · Ustawa o kredycie konsumenckim · Środki trwałe | 54 |
| fin-inwestycje-7 | Państwowy fundusz celowy · Otwarte fundusze emerytalne · Krajowy Fundusz Drogowy i fundusze poza budżetem · Fundusz Pracy i Fundusz Gwarantowanych Świadczeń Pracowniczych | 11 | Urlop wypoczynkowy i czas pracy | 28 |
| fin-kryzysy-1 | Solvency II · Sieć bezpieczeństwa finansowego · Kryzys finansowy – istota i rodzaje · Mania tulipanowa · Bańki Kompanii Missisipi i Kompanii Mórz Południowych | 5 | – | 14 |
| fin-kryzysy-2 | Kryzys meksykański · Kryzys azjatycki · Haircut · Globalny system finansowy · EFSF i EFSM | 4 | – | 10 |
| fin-publiczne-1 | Finanse publiczne · Sektor finansów publicznych · Jednostka budżetowa i zakład budżetowy · Budżet państwa · Procedura budżetowa w Polsce · Prowizorium budżetowe | 37 | Polityka kursowa · Sprawozdanie finansowe · Efekty zewnętrzne · Ricardo David · Cykl koniunkturalny · Rezerwa ogólna i rezerwy celowe budżetu państwa | 55 |
| fin-publiczne-1-cz2 (cz. 2) | – | 4 | Stabilizująca reguła wydatkowa · Obsługa i zarządzanie długiem publicznym · Wiek emerytalny w Polsce · Działalność badawczo-rozwojowa · Fundacja i stowarzyszenie | 7 |
| fin-publiczne-2 | Zasady budżetowe · Dochody i wydatki budżetu państwa · Wydatki sztywne i elastyczne · Wpłata z zysku NBP · Deficyt budżetowy i deficyt sektora finansów publicznych · Nadwyżka budżetowa | 33 | Krzywa Laffera · Konsolidacja fiskalna · Efekt Tanziego–Olivery · Debaty o polityce makroekonomicznej · Procedura nadmiernego deficytu | 58 |
| fin-publiczne-2-cz2 (cz. 2) | – | 3 | Bilans handlowy · Taksflacja · Lerner Abba · Prawo Wagnera · Nacjonalizacja i prywatyzacja · Transformacja systemowa i plan Balcerowicza | 6 |
| fin-publiczne-3 | Deficyt strukturalny i cykliczny · Deficyt pierwotny · Deficyty bliźniacze · Finansowanie deficytu · Dług publiczny · Funkcje finansów publicznych | 44 | Reguła złotej zasady · Monetyzacja długu publicznego · Progi ostrożnościowe i konstytucyjny limit długu · Saldo obrotów bieżących · Polityka stabilizacyjna · Dobra publiczne | 76 |
| fin-publiczne-3-cz2 (cz. 2) | – | 8 | PKB nominalny i realny · Świadczenia społeczne w Polsce · Kodeks cywilny · Dochód narodowy · Regulacja, deregulacja i przejęcie regulacyjne · Innowacja · Kryzysy walutowe – generacje · System kursu płynnego i stałego · Niezależność banku centralnego · Polityka antyinflacyjna · Grupa G7 i G20 · Klub Paryski i Londyński | 21 |
| fin-publiczne-4 | Subwencja i dotacja · Samorząd terytorialny w Polsce · Janosikowe · Klasyfikacja wydatków COFOG · Partnerstwo publiczno-prywatne · Dyscyplina finansów publicznych | 44 | Zamówienia publiczne · Cena maksymalna · Społeczna odpowiedzialność biznesu · Pomoc publiczna · Urbanizacja i suburbanizacja · Warunek maksymalizacji zysku | 64 |
| fin-publiczne-4-cz2 (cz. 2) | – | 2 | Cena minimalna · Cło ad valorem i specyficzne · Depopulacja | 5 |
| fin-publiczne-5 | Zamówienia publiczne · Budżet zadaniowy i wieloletnia prognoza finansowa · Reguły finansowe JST · Obsługa i zarządzanie długiem publicznym · Rezerwa ogólna i rezerwy celowe budżetu państwa · Konwersja długu | 21 | Konsumpcja · PKB metodą produkcyjną i dochodową | 52 |
| fin-zabezpieczenie-1 | System emerytalny w Polsce · IKE, IKZE i PPE · Pracownicze Plany Kapitałowe · Wiek emerytalny w Polsce · Stopa zastąpienia | 41 | Obliczanie emerytury w polskim systemie · Polityka inwestycyjna i prowzrostowa · Krzywa możliwości produkcyjnych · Indeksacja · Wiek emerytalny a długość życia · System repartycyjny a kapitałowy · Popyt na pracę | 60 |
| fin-zabezpieczenie-1-cz2 (cz. 2) | – | 7 | Ryzyko długowieczności i renta dożywotnia · Hipoteza cyklu życia · Teoria cyklu życia · Prawa i obowiązki pracownicze · Współczynnik dzietności · Polski Fundusz Rozwoju · Rozwój gospodarczy · Cele systemu emerytalnego · Diamond Peter · Dyskryminacja cenowa · Polityka cenowa państwa i ceny administrowane · Teoria szturchania | 14 |
| fin-zabezpieczenie-2 | Modele systemów ochrony zdrowia · Świadczenia społeczne w Polsce · Dodatek aktywizacyjny · Transfery socjalne | 26 | Czynniki wytwórcze · Mnożnik zrównoważonego budżetu · Ubóstwo skrajne, relatywne i ustawowe · Instrumenty polityki rodzinnej w Polsce · Aktywna i pasywna polityka rynku pracy · Ludność aktywna zawodowo · Metody liczenia PKB · PKB – metoda wydatkowa | 56 |
| finanse-wzor-1 | Baza monetarna · Mnożnik kreacji pieniądza · Stopa procentowa nominalna i realna · Kurs krzyżowy · Model Baumola–Tobina | 0 | – | 0 |
| finanse-wzor-2 | Monetyzacja gospodarki · Podaż pieniądza · Dywidenda · Obligacja zerokuponowa · Wskaźnik cena/zysk | 0 | – | 0 |
| finanse-wzor-3 | Wskaźnik cena/wartość księgowa · Zysk na akcję · Model CAPM · Wartość pieniądza w czasie · Procent prosty i składany | 0 | – | 0 |
| finanse-wzor-4 | Renta i perpetuita · Wskaźnik Sharpe’a · Tarcza podatkowa · Przeciętna i krańcowa stopa podatkowa · Stopa realna | 1 | – | 3 |
| finanse-wzor-5 | Mnożnik kreacji pieniądza – wzór · Wartość pieniądza w czasie – wzory · YTM obligacji zerokuponowej · Wskaźniki giełdowe – wzory · Model Baumola–Tobina – wzór | 5 | – | 9 |
| finanse-osoba-1 | Bagehot Walter · Bernanke Ben · Black Fischer, Scholes Myron, Merton Robert · Cox John, Ross Stephen, Rubinstein Mark · Diamond Douglas | 4 | – | 0 |
| finanse-osoba-2 | Fama Eugene · Fisher Irving · Greenspan Alan · Gresham Thomas · Kopernik Mikołaj | 11 | – | 5 |
| finanse-osoba-3 | Markowitz Harry · Musgrave Richard · Sharpe William · Shiller Robert · Tobin James | 14 | Nash John · Ostrom Elinor | 10 |
| finanse-osoba-4 | Gesell Silvio · Belka Marek · Glapiński Adam · Law John | 13 | – | 15 |
| finanse-instytucja-1 | Narodowy Bank Polski · Prezes NBP · Rada Polityki Pieniężnej · Zarząd NBP · Bank Gospodarstwa Krajowego · Bankowy Fundusz Gwarancyjny | 18 | Balcerowicz Leszek | 32 |
| finanse-instytucja-2 | Bank Rezerwy Federalnej · Europejski Bank Centralny · Bank Anglii · Biuro Informacji Kredytowej · Giełda Papierów Wartościowych w Warszawie · Krajowy Depozyt Papierów Wartościowych | 14 | Krajowa Izba Rozliczeniowa · Związek Banków Polskich | 24 |
| finanse-instytucja-3 | Ubezpieczeniowy Fundusz Gwarancyjny · Rzecznik Finansowy · Krajowa Administracja Skarbowa · Narodowy Fundusz Zdrowia · Najwyższa Izba Kontroli · Regionalne izby obrachunkowe | 14 | – | 29 |
| finanse-instytucja-4 | Europejski Bank Odbudowy i Rozwoju · Europejski Bank Inwestycyjny · Klub Paryski i Londyński · Biura informacji gospodarczej · Komisja Nadzoru Finansowego · Komitet Stabilności Finansowej | 13 | Fundusze europejskie · Międzynarodowe instytucje ds. migracji | 17 |
| finanse-instytucja-5 | Krajowa Izba Rozliczeniowa · Kasa Rolniczego Ubezpieczenia Społecznego · Ministerstwo Finansów · Związek Banków Polskich · Europejski System Banków Centralnych · Europejskie urzędy nadzoru | 14 | Lange Oskar | 5 |
| finanse-instytucja-6 | System Rezerwy Federalnej · Bank Japonii i Bank Ludowy Chin · Agencje ratingowe · Klub Paryski · Europejska Rada ds. Ryzyka Systemowego · Rada Stabilności Finansowej | 15 | – | 9 |
| finanse-data-1 | 1526 – „Monetae cudendae ratio” M. Kopernika · 1694 – założenie Banku Anglii · 1873 – „Lombard Street” W. Bagehota · 1913 – utworzenie Systemu Rezerwy Federalnej · 1924 – reforma W. Grabskiego i Bank Polski · 1945 – Narodowy Bank Polski | 4 | – | 3 |
| finanse-data-2 | 1990 – pierwszy cel inflacyjny · 1991 – GPW i redukcja długu przez Klub Paryski · 1994 – WIG20 · 1999 – euro, reforma emerytalna i samorządowa w Polsce · 2002 – gotówka euro · 2006 – Komisja Nadzoru Finansowego | 6 | – | 5 |
| finanse-data-3 | 2007 – NewConnect i początek kryzysu subprime · 2009 – Catalyst, traktat lizboński, bitcoin · 2012 – likwidacja lokat antybelkowych i nadzór KNF nad SKOK · 2014 – zmiany w OFE i unia bankowa · 2015 – Komitet Stabilności Finansowej i QE w strefie euro · 2018 – Konstytucja biznesu i RODO | 6 | – | 7 |
| finanse-data-4 | 2021 – prosta spółka akcyjna · 1637 – krach na rynku tulipanów · 1720 – bańki Missisipi i Mórz Południowych · 1844 – ustawa bankowa R. Peela | 4 | – | 8 |
| finanse-przepis-1 | Ustawa o finansach publicznych · Ustawa o Narodowym Banku Polskim · Prawo bankowe · Ustawa o kredycie konsumenckim · Stawki VAT w Polsce · Skala podatkowa PIT | 9 | Dobro luksusowe | 3 |
| finanse-przepis-2 | Składki na ubezpieczenia społeczne · Gwarancja depozytów BFG · Cel inflacyjny NBP · Akcyza – przykładowe wyroby · Ustawa o kryptoaktywach i MiCA | 21 | Polityka gospodarcza | 14 |

## Finanse przedsiębiorstw

| Lekcja | Hasła | Pytań | Nowe z pytań | Powtórka (liczba) |
|---|---|---|---|---|
| firma-rachunkowosc-1 | Rachunkowość · Sprawozdanie finansowe · Bilans · Aktywa trwałe i obrotowe · Pasywa: kapitał własny i zobowiązania · Kapitał zakładowy, zapasowy i rezerwowy | 17 | Pozycja walutowa · Operacje bilansowe · Rachunek przepływów pieniężnych · Kapitał obrotowy netto · Wynik finansowy – poziomy · Należności i zobowiązania | 0 |
| firma-rachunkowosc-1-cz2 (cz. 2) | – | 2 | Kapitał stały i obrotowy netto · Obligacje skarbowe · Rozliczenia międzyokresowe · Środki trwałe | 3 |
| firma-rachunkowosc-2 | Kapitał stały i obrotowy netto · Złota reguła bilansowa · Rozliczenia międzyokresowe · Rachunek zysków i strat · Wynik finansowy – poziomy · EBITDA | 24 | Koszty bezpośrednie i pośrednie · Podatek · Dywidenda · Narodowy Bank Polski · Biznesplan · Akcja | 9 |
| firma-rachunkowosc-2-cz2 (cz. 2) | – | 1 | Dźwignia operacyjna i finansowa · Struktura kapitału – wskaźniki · Wskaźniki rentowności · Zasady budżetowe | 4 |
| firma-rachunkowosc-3 | Rachunek przepływów pieniężnych · Zasady rachunkowości · Polityka rachunkowości · Rok obrotowy · Księgi rachunkowe i konta · Operacje bilansowe | 25 | Wycena zapasów · Wskaźniki rotacji · Pieniądz gotówkowy i bezgotówkowy · Zarządzanie zasobami ludzkimi · Fuzja i przejęcie · Inwestycje | 15 |
| firma-rachunkowosc-3-cz2 (cz. 2) | – | 1 | Faktura VAT i KSeF · Pożyczka a kredyt · Zysk ekonomiczny | 3 |
| firma-rachunkowosc-4 | Inwentaryzacja · Uproszczone formy ewidencji · Środki trwałe · Wartości niematerialne i prawne · Wartość firmy · Amortyzacja | 20 | Produkt krajowy brutto · Leasing · Limity kapitału zakładowego spółek | 19 |
| firma-rachunkowosc-5 | Metody amortyzacji · Wycena zapasów · Wartość godziwa i koszt historyczny · Audyt wewnętrzny i biegły rewident · Sprawozdanie z działalności i raportowanie niefinansowe · Złota reguła finansowania | 21 | Ustawa o rachunkowości · Reklama – spory ekonomiczne i sygnał jakości · Progi znacznych pakietów akcji · Samorząd terytorialny w Polsce | 23 |
| firma-rachunkowosc-6 | Różnice kursowe | 2 | Euro | 4 |
| firma-koszty-1 | Koszty według rodzajów · Koszty bezpośrednie i pośrednie · Rachunek kosztów pełnych i zmiennych · Rachunek kosztów działań | 11 | – | 18 |
| firma-koszty-2 | Średni ważony koszt kapitału · Koszt kapitału własnego i obcego · Wskaźnik poziomu kosztów · Marża pokrycia | 9 | Wskaźnik cena/zysk · Zysk na akcję | 10 |
| firma-analiza-1 | Analiza wskaźnikowa · Wskaźniki płynności · Wskaźniki rentowności · Wskaźniki zadłużenia · Wskaźniki rotacji · Dźwignia operacyjna i finansowa | 36 | Źródła finansowania przedsiębiorstwa · Utarg całkowity, przeciętny i krańcowy · Cykl operacyjny i cykl konwersji gotówki · Kredyt kupiecki · Wartość pieniądza w czasie · Obsługa i zarządzanie długiem publicznym | 31 |
| firma-analiza-1-cz2 (cz. 2) | – | 2 | Dźwignia finansowa · Mnożnik | 4 |
| firma-analiza-2 | Analiza pozioma i pionowa · Modele wczesnego ostrzegania przed upadłością · Analiza finansowa – istota, przedmiot i rodzaje · Materiały źródłowe analizy finansowej · Metody porównań w analizie finansowej · Metody deterministyczne | 8 | – | 19 |
| firma-analiza-3 | Metody stochastyczne w analizie finansowej · Model Du Ponta · Analiza sprzedaży · Wskaźniki wydajności gotówkowej · Wskaźnik pokrycia odsetek · Analiza ex ante i ex post | 13 | – | 19 |
| firma-inwestycje-1 | Wartość bieżąca netto · Wewnętrzna stopa zwrotu i MIRR · Okres zwrotu · Cel finansowy przedsiębiorstwa – maksymalizacja wartości · EVA | 24 | Zysk księgowy · Koszty zmienne · Q Tobina · Wzrost gospodarczy | 31 |
| firma-inwestycje-2 | Struktura kapitału i teorie jej wyboru · Model Gordona · Ocena projektów inwestycyjnych – metody · Wycena przedsiębiorstwa – metody | 12 | Stawki CIT · Inflacja · Międzynarodowe aspekty finansów firmy · Hipoteza cyklu życia · Modigliani Franco, Miller Merton | 29 |
| firma-finansowanie-1 | Źródła finansowania przedsiębiorstwa · Kredyt kupiecki · Kredyt obrotowy i inwestycyjny · Zabezpieczenia kredytu · Gwarancje de minimis · Crowdfunding | 18 | Obligacja · Branża · Produkty bankowe dla klientów · Bank Gospodarstwa Krajowego · Kurs walutowy · Subwencja i dotacja | 27 |
| firma-finansowanie-2 | Project finance · Należności i zobowiązania · Upadłość i restrukturyzacja · Planowanie finansowe i budżet kasowy · Zarządzanie kapitałem obrotowym · Cykl operacyjny i cykl konwersji gotówki | 26 | Przedawnienie roszczeń · Podatek od towarów i usług · Prawo upadłościowe i restrukturyzacyjne · Nacjonalizacja i prywatyzacja · Zapasy i należności – wskaźniki szczegółowe | 38 |
| firma-finansowanie-2-cz2 (cz. 2) | – | 1 | Komisja Nadzoru Finansowego · Krajowa Administracja Skarbowa · Organy spółki akcyjnej | 2 |
| firma-finansowanie-3 | Emisja papierów wartościowych – przebieg · Finansowanie mezzanine i kredyt rewolwingowy · Łączenie spółek, wykupy LBO/MBO i synergia · Ryzyko walutowe i stopy procentowej w przedsiębiorstwie · Międzynarodowe aspekty finansów firmy · Inżynieria finansowa | 12 | Obligacja zerokuponowa · Opcja | 30 |
| firma-prawo-1 | Przedsiębiorca i działalność gospodarcza · Konstytucja biznesu · Jednoosobowa działalność gospodarcza · Spółka cywilna · Spółki osobowe · Spółki kapitałowe | 25 | Kodeks spółek handlowych · Gwarancja depozytów BFG · CEIDG i KRS · Płaca minimalna w Polsce · Bank spółdzielczy · SKOK | 42 |
| firma-prawo-1-cz2 (cz. 2) | – | 7 | Osoba fizyczna, prawna i jednostka organizacyjna · Spółki osobowe i kapitałowe – wspólnicy · Biuro Informacji Kredytowej · Subsydium do produkcji – skutki rynkowe · Fundusz inwestycyjny · Towarzystwo ubezpieczeń wzajemnych · Ordynacja podatkowa · Reformy gospodarcze w PRL w latach 80. i ustawa Wilczka · Fundusz inwestycyjny otwarty i zamknięty · Giełda Papierów Wartościowych w Warszawie · Kontrakt terminowy · Prawo poboru | 10 |
| firma-prawo-2 | Organy spółki akcyjnej · Prokura · Osoba fizyczna, prawna i jednostka organizacyjna · Zdolność prawna i zdolność do czynności prawnych · Spółdzielnia · Przedsiębiorstwo państwowe i Skarb Państwa | 20 | Ministerstwo Finansów · Koszty i korzyści przyjęcia euro · Ustawa o finansach publicznych | 42 |
| firma-prawo-3 | Fundacja i stowarzyszenie · Umowy w kodeksie cywilnym · Umowa o pracę i umowy cywilnoprawne · Prawa i obowiązki pracownicze · Mobbing · Sygnalista | 26 | Urlop wypoczynkowy i czas pracy · Role kierownicze · Ubezpieczenia społeczne · Składki na ubezpieczenia społeczne · Płaca minimalna | 40 |
| firma-prawo-3-cz2 (cz. 2) | – | 1 | Bank Rozrachunków Międzynarodowych · Bank Światowy | 1 |
| firma-prawo-4 | Prawa konsumenta · Nieuczciwa konkurencja · Własność intelektualna · Licencja i know-how · Franczyza · Hipoteka | 26 | Instrument pochodny · Monopol prawny: patenty i prawa autorskie · Urząd Patentowy RP · Weksel · Promocja | 43 |
| firma-prawo-4-cz2 (cz. 2) | – | 1 | Kultura organizacyjna · Motywacja · Zasoby organizacji: twarde i miękkie | 1 |
| firma-prawo-5 | Księga wieczysta · Własność i ograniczone prawa rzeczowe · Przedawnienie roszczeń · Odpowiedzialność kontraktowa i deliktowa · Kara umowna i zadatek · Corporate governance | 22 | Korporacja transnarodowa | 60 |
| firma-prawo-6 | RODO · Mała, średnia i mikrofirma · Spółki osobowe i kapitałowe – wspólnicy | 11 | – | 27 |
| firma-wzor-1 | Metody amortyzacji · Wskaźniki rentowności · Średni ważony koszt kapitału · Wartość bieżąca netto · EVA · Koszt kapitału własnego i obcego | 0 | – | 0 |
| firma-wzor-2 | Model Gordona · Cykl operacyjny i cykl konwersji gotówki · Złota reguła finansowania · Model Du Ponta · Wskaźnik poziomu kosztów · Marża pokrycia | 0 | – | 0 |
| firma-wzor-3 | Wskaźniki wydajności gotówkowej · Wskaźnik pokrycia odsetek · Próg rentowności – wzór · NPV i IRR – wzory · Rentowność – wzory · Tarcza podatkowa – wzór | 4 | – | 9 |
| firma-wzor-4 | Amortyzacja liniowa i degresywna – wzory · EOQ – wzór Wilsona · Wskaźnik pokrycia długu nadwyżką finansową · Kapitał obrotowy netto · Dźwignie DOL, DFL, DTL – wzory · Okres zwrotu i wskaźnik rentowności PI – wzory | 7 | – | 15 |
| firma-wzor-5 | Z-score Altmana – wzór · Wycena DCF i wartość rezydualna – wzory · Struktura majątku – wskaźniki · Stan i odnowa środków trwałych – wskaźniki · Wykorzystanie maszyn i czasu pracy – wskaźniki · Zapasy i należności – wskaźniki szczegółowe | 1 | – | 3 |
| firma-wzor-6 | Struktura kapitału – wskaźniki · Metoda kolejnych podstawień – wzór · Indeksy dynamiki – wzory · Wskaźniki obsługi zadłużenia – wzory | 3 | – | 8 |
| firma-osoba-1 | Modigliani Franco, Miller Merton · Myers Stewart · Gordon Myron J. · Altman Edward | 2 | – | 0 |
| firma-instytucja-1 | CEIDG i KRS · Polska Agencja Rozwoju Przedsiębiorczości · Polski Fundusz Rozwoju · Rzecznik Małych i Średnich Przedsiębiorców · Urząd Patentowy RP · Sądy gospodarcze | 8 | – | 4 |
| firma-przepis-1 | Kodeks spółek handlowych · Kodeks cywilny · Kodeks pracy · Prawo przedsiębiorców · Ustawa o rachunkowości · Ustawa o ofercie publicznej i o obrocie instrumentami finansowymi | 10 | Prawo bankowe | 4 |
| firma-przepis-2 | Prawo własności przemysłowej · Ustawa o prawie autorskim · Prawo upadłościowe i restrukturyzacyjne · Stawki CIT · Limity kapitału zakładowego spółek · Progi znacznych pakietów akcji | 15 | Stawki VAT w Polsce | 6 |
| firma-przepis-3 | Okresy wypowiedzenia umowy o pracę · Urlop wypoczynkowy i czas pracy · Terminy podatkowe i zeznania · Krajowy System e-Faktur · Rozporządzenie RODO | 14 | – | 12 |

## Zarządzanie

| Lekcja | Hasła | Pytań | Nowe z pytań | Powtórka (liczba) |
|---|---|---|---|---|
| zarz-podstawy-1 | Zarządzanie · Funkcje zarządzania · Sprawność, skuteczność i efektywność · Umiejętności kierownicze · Role kierownicze · Szczeble zarządzania | 10 | Akcja · Organy spółki akcyjnej | 0 |
| zarz-podstawy-2 | Naukowe zarządzanie · Zarządzanie administracyjne · Biurokracja · Podejście behawiorystyczne · Teoria X i teoria Y · Teoria Z | 22 | Kapitał społeczny · Maslow Abraham · McGregor Douglas · Hierarchia potrzeb Maslowa · Systemy motywacyjne i wynagrodzeń · Grupy i zespoły | 6 |
| zarz-podstawy-2-cz2 (cz. 2) | – | 6 | Organizacja mechanistyczna i organiczna · Weber Max · Rodzaje innowacji · Kontrolowanie · Organizowanie i struktura organizacyjna · Planowanie · Drucker Peter · Fayol Henri · Ford Henry · Griffin Ricky W. · Taylor Frederick Winslow · Urwick Lyndall | 8 |
| zarz-podstawy-2-cz3 (cz. 3) | – | 7 | Barnard Chester · Emerson Harrington · Gilbreth Frank i Lillian · Mayo Elton · Fukuyama Francis · Gantt Henry · Follett Mary Parker | 11 |
| zarz-podstawy-3 | Podejście systemowe · Podejście sytuacyjne · Organizacja · Zasoby organizacji: twarde i miękkie · Technologia a struktura · Prakseologia | 18 | Woodward Joan · Branża · Ekonomia | 13 |
| zarz-otoczenie-1 | Otoczenie organizacji · Niepewność otoczenia · Kultura organizacyjna · Społeczna odpowiedzialność biznesu · Interesariusze | 21 | Thompson James D. · ESG i zrównoważone finanse · Misja i wizja | 16 |
| zarz-otoczenie-2 | Etyka biznesu · Szklany sufit · Różnorodność i wielokulturowość w organizacji · Organizacje otoczenia biznesu · Kodeks etyczny, sygnaliści i greenwashing | 9 | Wydajność pracy i jej czynniki | 17 |
| zarz-otoczenie-3 | ESG i zrównoważone finanse · Modele skuteczności organizacji · Lobbing | 4 | – | 10 |
| zarz-strategia-1 | Planowanie · Misja i wizja · Cele SMART · Zarządzanie przez cele · Zarządzanie przez wyjątki i przez partycypację · Strategia | 23 | Motywacja · Krótki okres i długi okres · Marketing · Kotler Philip · Porter Michael E. | 21 |
| zarz-strategia-1-cz2 (cz. 2) | – | 1 | Delegowanie uprawnień · Podejmowanie decyzji | 3 |
| zarz-strategia-2 | Analiza SWOT · Pięć sił Portera · Strategie konkurencji Portera · Typologia strategii Milesa i Snowa · Macierz BCG · Macierz GE | 38 | Wycena przedsiębiorstwa – metody · Dywersyfikacja · Substytuty · Innowacja · Marketing mix · Zarządzanie zapasami | 23 |
| zarz-strategia-2-cz2 (cz. 2) | – | 6 | Mintzberg Henry · Regulacja, deregulacja i przejęcie regulacyjne · Metody twórczego rozwiązywania problemów · Bank centralny | 14 |
| zarz-strategia-3 | Macierz Ansoffa · Dywersyfikacja · Integracja pionowa i pozioma · Fuzja i przejęcie · Alians strategiczny i joint venture · Benchmarking | 25 | Obligacje śmieciowe · Wartość firmy · Podział pracy i specjalizacja · Wynik finansowy – poziomy · Logistyka i łańcuch dostaw · Przewaga konkurencyjna i konkurencyjność | 26 |
| zarz-strategia-3-cz2 (cz. 2) | – | 4 | Efekt sieciowy · Łączenie spółek, wykupy LBO/MBO i synergia · Segmentacja, targetowanie, pozycjonowanie · Wrogie przejęcie i metody obrony · Instytucje UE · Urząd Ochrony Konkurencji i Konsumentów · Dobro neutralne i dobro niechciane · Podatek · Wartość dodana | 4 |
| zarz-strategia-4 | Outsourcing · Strategie cenowe · Dyfuzja innowacji · Macierz ADL · Strategie wobec produktu w schyłku · Kompetencje wyróżniające | 18 | Popyt · Offshoring, outsourcing, nearshoring, reshoring · Dumping | 23 |
| zarz-strategia-5 | Zarządzanie strategiczne i analiza strategiczna · Łańcuch wartości · Planowanie scenariuszowe · Strategia błękitnego oceanu · Przewaga konkurencyjna i konkurencyjność · Przedsiębiorczość międzynarodowa i modele internacjonalizacji | 14 | Ansoff Igor · Handel międzynarodowy · Produkt – poziomy i asortyment · Strategie rozwoju kraju | 30 |
| zarz-strategia-6 | Strategie konkurencyjne według pozycji rynkowej · Biznes międzynarodowy i paradygmat eklektyczny · Inwestycje zagraniczne wychodzące · Konkurencyjność międzynarodowa przedsiębiorstwa i luka konkurencyjna | 2 | – | 5 |
| zarz-organizowanie-1 | Organizowanie i struktura organizacyjna · Grupowanie stanowisk · Rozpiętość kierowania · Centralizacja i decentralizacja · Delegowanie uprawnień | 17 | – | 18 |
| zarz-organizowanie-2 | Typy struktur organizacyjnych · Organizacja mechanistyczna i organiczna · Organizacja ucząca się · Projektowanie stanowisk pracy · Cykl życia organizacji | 28 | Prawa i obowiązki pracownicze · Rachunek przepływów pieniężnych | 21 |
| zarz-organizowanie-3 | Doskonalenie organizacji · Kontrola biurokratyczna i kontrola z udziałem pracowników · Kontrola budżetowa · Struktura płaska i smukła · Organizacja wirtualna i fraktalna | 8 | Heurystyki i efekt ramowania · Technologie informacyjne w zarządzaniu | 13 |
| zarz-ludzie-1 | Motywacja · Hierarchia potrzeb Maslowa · Teoria ERG · Dwuczynnikowa teoria Herzberga · Teoria potrzeb McClellanda · Teoria oczekiwań | 35 | Nowa ekonomia klasyczna · Bodźce w ekonomii · Teoria sprawiedliwości · Alderfer Clayton · Karta Polaka i Niebieska Karta UE · Przepisy dotyczące pracy cudzoziemców w Polsce | 32 |
| zarz-ludzie-1-cz2 (cz. 2) | – | 1 | Herzberg Frederick · McClelland David | 5 |
| zarz-ludzie-2 | Teoria sprawiedliwości · Systemy motywacyjne i wynagrodzeń · Przywództwo · Teorie cech przywódczych · Style kierowania: autokratyczny, demokratyczny, liberalny · Systemy zarządzania R. Likerta | 26 | Laissez-faire · Tannenbaum Robert, Schmidt Warren H. · French John i Raven Bertram | 34 |
| zarz-ludzie-3 | Siatka kierownicza · Model LPC F. Fiedlera · Teoria ścieżki do celu · Model Vrooma–Yettona–Jago · Teoria cyklu życia · Model LMX | 29 | Fiedler Fred · Vroom Victor | 43 |
| zarz-ludzie-4 | Przywództwo transformacyjne i charyzmatyczne · Wielka piątka · Cechy osobowości w organizacji · Percepcja i błędy percepcji · Stres w pracy · Grupy i zespoły | 30 | House Robert · Komunikacja interpersonalna – umiejętności · Dobra komplementarne | 38 |
| zarz-ludzie-5 | Myślenie grupowe · Konflikt w organizacji · Komunikacja w organizacji · Sieci komunikacyjne w małych grupach · Zarządzanie zasobami ludzkimi · Promocja | 37 | Dysonans poznawczy · Planowanie awaryjne i zarządzanie kryzysowe · Spółki kapitałowe · Reklama – spory ekonomiczne i sygnał jakości | 44 |
| zarz-ludzie-6 | Negocjacje · Concierge · Role zespołowe Belbina i team building · Komunikacja interpersonalna – umiejętności · Kontrakt psychologiczny i dopasowanie osoby do stanowiska · Zachowania w miejscu pracy | 11 | Światowa Organizacja Handlu · Bank komercyjny · Oszczędności narodowe | 19 |
| zarz-ludzie-7 | Upełnomocnienie · Badania przywództwa z Michigan i Ohio · Substytuty przywództwa · Teoria wyznaczania celów · Teoria wzmocnienia · Normy i spójność grupy | 10 | – | 25 |
| zarz-ludzie-8 | Kafeteryjny system wynagradzania · Dysonans poznawczy · Polityka personalna: model sita i model kapitału ludzkiego | 6 | Ubezpieczenie | 18 |
| zarz-decyzje-1 | Podejmowanie decyzji · Decyzje zaprogramowane i niezaprogramowane · Model administracyjny decyzji · Metody twórczego rozwiązywania problemów · Kontrolowanie · Zrównoważona karta wyników | 37 | Warunek maksymalizacji zysku · Ryzyko, niepewność i wartość oczekiwana · Teoria twórczej destrukcji · Intuicja w podejmowaniu decyzji · Unia Europejska – historia | 46 |
| zarz-decyzje-1-cz2 (cz. 2) | – | 2 | Koszt alternatywny · Koszty utopione · Acemoglu Daron, Johnson Simon, Robinson James · Chamberlin Edward, Robinson Joan · Demografia · Polityka pieniężna – cele i instrumenty · Starzenie się ludności i jego miary · Teoria gier | 2 |
| zarz-decyzje-2 | Fotografia dnia roboczego · Zarządzanie operacyjne · Just in time i lean management · Kaizen · Reengineering · Zarządzanie jakością | 28 | – | 55 |
| zarz-decyzje-3 | Normy ISO 9001 i HACCP · Six Sigma · Narzędzia jakości · Zarządzanie projektami · Zarządzanie zapasami · Logistyka i łańcuch dostaw | 32 | Szok podażowy i popytowy · Rachunkowość · Formy marketingu współczesnego · Konsumpcja · Stopa procentowa nominalna i realna | 58 |
| zarz-decyzje-4 | Systemy informatyczne zarządzania · Zarządzanie zmianą · Zarządzanie wiedzą · Krzywa doświadczenia · Eskalacja zaangażowania · Intuicja w podejmowaniu decyzji | 24 | Cel finansowy przedsiębiorstwa – maksymalizacja wartości · Koszt całkowity i przeciętny koszt całkowity · Korzyści skali · Krzywa możliwości produkcyjnych · Wzrost gospodarczy | 50 |
| zarz-decyzje-5 | Technologie informacyjne w zarządzaniu · Metody prognozowania · Techniki planistyczne: PERT/CPM, programowanie liniowe, symulacja · Macierz wypłat i drzewo decyzyjne · Planowanie awaryjne i zarządzanie kryzysowe | 5 | Gospodarka współdzielenia i peer economy · Instrument pochodny · Pieniądz · Pieniądz towarowy, kruszcowy i fiducjarny · Przemysł 4.0 | 11 |
| zarz-marketing-1 | Marketing · Marketing mix · Segmentacja, targetowanie, pozycjonowanie · Badania marketingowe · Produkt – poziomy i asortyment | 30 | Dystrybucja · Preferencje konsumenta – założenia · Nadwyżka producenta · Audyt wewnętrzny i biegły rewident · Inwestycje | 59 |
| zarz-marketing-2 | Cykl życia produktu · Marka i rebranding · Dystrybucja · Formy marketingu współczesnego · Lojalność klienta i CRM | 34 | Upadłość i restrukturyzacja · Teoria cyklu życia produktu w handlu · Podaż · Dobro luksusowe · Levitt Theodore · Solow Robert · Walras Léon | 52 |
| zarz-marketing-2-cz2 (cz. 2) | – | 3 | Krajowa Administracja Skarbowa · Podatek od towarów i usług · Stawki VAT w Polsce · Konkurencja doskonała · Konkurencja monopolistyczna · Monopol · Monopson · Płaca minimalna · Płace efektywnościowe · Równowaga rynkowa · Związki zawodowe a rynek pracy | 3 |
| zarz-marketing-3 | Wartość klienta, lejek sprzedażowy i doświadczenie klienta · Masowa kastomizacja · Handel elektroniczny · Pozycjonowanie stron internetowych | 12 | Czynniki wytwórcze · Internacjonalizacja przedsiębiorstwa – formy · Spółka cywilna · Spółki osobowe · Opcja · Prawa konsumenta | 22 |
| zarz-przedsiebiorczosc-1 | Przedsiębiorczość · Biznesplan · Model biznesowy i Business Model Canvas · Start-up i inkubator · Innowacja · Rodzaje innowacji | 32 | Analiza fundamentalna i techniczna · Cel inflacyjny NBP · Bank inwestycyjny i bank uniwersalny · Pożyczka a kredyt · Przedsiębiorstwo państwowe i Skarb Państwa | 67 |
| zarz-przedsiebiorczosc-1-cz2 (cz. 2) | – | 1 | Hiperinflacja · Pułapka średniego dochodu · Zadłużenie zagraniczne | 1 |
| zarz-przedsiebiorczosc-2 | Działalność badawczo-rozwojowa · Klaster i park technologiczny · Ekonomia współpracy a gig economy · Lean startup, MVP i design thinking · Uwarunkowania rozpoczęcia działalności gospodarczej | 17 | Koszty uzyskania przychodów | 53 |
| zarzadzanie-wzor-1 | Zarządzanie zapasami · Wartość klienta, lejek sprzedażowy i doświadczenie klienta | 0 | – | 0 |
| zarzadzanie-osoba-1 | Adams J. Stacy · Alderfer Clayton · Ansoff Igor · Barnard Chester · Blake Robert, Mouton Jane · Deming W. Edwards | 4 | – | 0 |
| zarzadzanie-osoba-2 | Drucker Peter · Emerson Harrington · Fayol Henri · Fiedler Fred · Follett Mary Parker · Gantt Henry | 13 | Kredyty frankowe | 8 |
| zarzadzanie-osoba-3 | Gilbreth Frank i Lillian · Griffin Ricky W. · Heider Fritz · Hersey Paul, Blanchard Kenneth · Herzberg Frederick · House Robert | 12 | – | 11 |
| zarzadzanie-osoba-4 | Kaplan Robert, Norton David · Kotler Philip · Levitt Theodore · Likert Rensis · Maslow Abraham · Mayo Elton | 13 | – | 15 |
| zarzadzanie-osoba-5 | McClelland David · McGregor Douglas · Miles Raymond, Snow Charles · Mintzberg Henry · Porter Michael E. · Senge Peter | 14 | – | 21 |
| zarzadzanie-osoba-6 | Simon Herbert · Tannenbaum Robert, Schmidt Warren H. · Taylor Frederick Winslow · Thompson James D. · Tuckman Bruce · Urwick Lyndall | 17 | – | 25 |
| zarzadzanie-osoba-7 | Vroom Victor · Weber Max · Woodward Joan · Ford Henry · Hofstede Geert · Kim W. Chan, Mauborgne Renée | 15 | – | 27 |
| zarzadzanie-osoba-8 | Belbin R. Meredith · Ries Eric · Freeman R. Edward · Johanson Jan, Vahlne Jan-Erik · Locke Edwin · Skinner Burrhus F. | 19 | – | 32 |
| zarzadzanie-osoba-9 | French John i Raven Bertram · Juran Joseph · Crosby Philip | 12 | – | 27 |
| zarzadzanie-data-1 | 1911 – „Zasady naukowego zarządzania” F.W. Taylora · 1916 – „Administracja przemysłowa i ogólna” H. Fayola · 1924–1932 – eksperymenty w Hawthorne · 1943 – teoria potrzeb A. Maslowa · 1959 – teoria dwuczynnikowa F. Herzberga · 1960 – OPEC i teoria X/Y | 3 | – | 0 |

## Temat przewodni: Gospodarka wobec wyzwań demograficznych

| Lekcja | Hasła | Pytań | Nowe z pytań | Powtórka (liczba) |
|---|---|---|---|---|
| demo-miary-1 | Demografia · Współczynnik dzietności · Zastępowalność pokoleń · Współczynniki urodzeń, zgonów i przyrostu naturalnego · Saldo migracji | 18 | Krótki okres i długi okres · Barr Nicholas · Diamond Peter · Goodhart Charles · Okólski Marek | 0 |
| demo-miary-2 | Przeciętne dalsze trwanie życia i tablice trwania życia · Struktura wieku: wiek przedprodukcyjny, produkcyjny i poprodukcyjny · Współczynnik obciążenia demograficznego · Starzenie się ludności i jego miary · Piramida wieku | 18 | Produkt krajowy brutto · Indeksacja · Podatek dochodowy od osób fizycznych · 2004 – Polska w Unii Europejskiej · 2020 – pandemia COVID-19 · Deflacja i dezinflacja · Unia Europejska – historia | 5 |
| demo-miary-3 | Wyż i niż demograficzny, echo wyżu · Prognoza ludności GUS · Depopulacja · Urbanizacja i suburbanizacja · Demografia a inflacja i stopy procentowe | 13 | Małżeńskość i rozwodowość · Podatek progresywny, proporcjonalny i regresywny · Świadczenia społeczne w Polsce · Główny Urząd Statystyczny · Samorząd terytorialny w Polsce · Polityka pieniężna – cele i instrumenty · Rynek kapitałowy | 11 |
| demo-miary-4 | Siatka Lexisa · Kohorta i analiza kohortowa · Standaryzacja współczynników demograficznych · Małżeńskość i rozwodowość | 4 | – | 8 |
| demo-teorie-1 | Przejście demograficzne · Drugie przejście demograficzne · Przejście epidemiologiczne i przejście migracyjne · Przejście struktury wieku · Druga dywidenda demograficzna | 9 | Pułapka maltuzjańska | 13 |
| demo-teorie-2 | Pułapka maltuzjańska · Ekonomiczna teoria płodności · Hipoteza Easterlina · Teoria optimum zaludnienia · Bliższe determinanty płodności | 6 | Inflacja · Kurs walutowy | 12 |
| demo-teorie-3 | Kompresja zachorowalności i teorie długowieczności · Paradoks ekonomiczno-demograficzny · Pułapka niskiej dzietności | 3 | – | 9 |
| demo-gospodarka-1 | Wielki zwrot demograficzny · Punkt zwrotny Lewisa · Sekularna stagnacja · Srebrna gospodarka · Skutki starzenia się dla rynku pracy i finansów publicznych · Opieka długoterminowa | 14 | Bank Japonii i Bank Ludowy Chin · Popyt · Płaca nominalna i realna · Stopa procentowa nominalna i realna · Podaż · Prawo Kopernika–Greshama | 17 |
| demo-gospodarka-1-cz2 (cz. 2) | – | 1 | Friedman Milton · Keynesizm · Ricardo David · Smith Adam | 2 |
| demo-gospodarka-2 | Polityka senioralna · Transfery międzypokoleniowe i rachunkowość pokoleniowa · Populizm ekonomiczny · Udział płac w dochodzie narodowym · Krzywa słonia · Automatyzacja a starzenie się ludności | 7 | Polityka fiskalna | 16 |
| demo-gospodarka-3 | Globalny nadmiar oszczędności · Dynamika długu publicznego i pułapka zadłużenia · Uprzywilejowanie podatkowe długu · Dominacja fiskalna | 5 | – | 12 |
| demo-emerytury-1 | Cele systemu emerytalnego · System repartycyjny a kapitałowy · DB, DC i NDC – formuły emerytalne · Obliczanie emerytury w polskim systemie · Waloryzacja i emerytura minimalna · Ryzyko długowieczności i renta dożywotnia | 12 | Ubezpieczenia społeczne · Ubezpieczenie · Szara strefa · Aaron Henry · Modigliani Franco, Miller Merton · Samuelson Paul | 16 |
| demo-emerytury-2 | Warunek Aarona · Mity reform emerytalnych · Wiek emerytalny a długość życia · Uzasadnienie przymusu emerytalnego · Neutralność aktuarialna emerytur · Luka emerytalna kobiet | 8 | – | 21 |
| demo-migracje-1 | Migracja zarobkowa · Teoria czynników wypychających i przyciągających · Neoklasyczna teoria migracji · Nowa ekonomia migracji zarobkowych · Teorie rynku dualnego, systemów światowych i sieci migracyjnych · Skutki migracji dla krajów pochodzenia i przyjmujących | 15 | Strategie konkurencyjne według pozycji rynkowej · Podatek · Neoklasyczna teoria przedsiębiorstwa · Przewaga komparatywna · Lee Everett · Podejście systemowe | 21 |
| demo-migracje-2 | Przekazy pieniężne migrantów · Cyrkulacja mózgów i migracje powrotne · Uchodźcy i ochrona międzynarodowa · Przepisy dotyczące pracy cudzoziemców w Polsce · Karta Polaka i Niebieska Karta UE · Swobodny przepływ pracowników w UE i emigracja z Polski po 2004 r. | 9 | Międzynarodowe instytucje ds. migracji · Drenaż mózgów | 20 |
| demo-migracje-3 | Polska jako kraj imigracji · Polityka migracyjna i integracja imigrantów · Bariery migracyjne i dystans · Selekcja migrantów · Bilans fiskalny imigracji | 6 | – | 16 |
| demo-polityka-1 | Polityka ludnościowa · Instrumenty polityki rodzinnej w Polsce · Regionalna polityka demograficzna · Gospodarstwo domowe i rodzina – nuklearyzacja · Kara za macierzyństwo | 13 | Mazowiecki Tadeusz · Unia Gospodarcza i Walutowa | 27 |
| demografia-wzor-1 | Współczynnik dzietności · Zastępowalność pokoleń · Współczynniki urodzeń, zgonów i przyrostu naturalnego · Saldo migracji · Współczynnik obciążenia demograficznego | 1 | – | 0 |
| demografia-wzor-2 | Starzenie się ludności i jego miary · Obliczanie emerytury w polskim systemie · Warunek Aarona · Dynamika długu publicznego i pułapka zadłużenia | 0 | – | 0 |
| demografia-osoba-1 | Malthus Thomas · Goodhart Charles · Pradhan Manoj · Barr Nicholas · Diamond Peter · Becker Gary | 6 | – | 0 |
| demografia-osoba-2 | Easterlin Richard · Notestein Frank · van de Kaa Dirk, Lesthaeghe Ron · Lee Everett · Ravenstein Ernst Georg · Stark Oded | 12 | – | 6 |
| demografia-osoba-3 | Piore Michael · Todaro Michael · Lewis W. Arthur · Aaron Henry · Kotlikoff Laurence · Hansen Alvin | 15 | – | 11 |
| demografia-osoba-4 | Summers Lawrence · Okólski Marek · Fihel Agnieszka · Lexis Wilhelm | 14 | – | 17 |
| demografia-instytucja-1 | Międzynarodowe instytucje ds. migracji | 1 | – | 3 |
| demografia-data-1 | 1798 – „Prawo ludności” T. Malthusa · 1885 – „prawa migracji” E.G. Ravensteina · 1966 – teoria push–pull E. Lee i warunek Aarona · 1972 – „Granice wzrostu” Klubu Rzymskiego · 1961 – umowa RFN–Turcja o rekrutacji pracowników · 1981 – kapitałowy system emerytalny w Chile | 3 | – | 0 |

## Pytania OWE przeniesione do innej lekcji

Poprzedni przydział (po słowach kluczowych, do 24 pytań na lekcję) mógł dawać to samo pytanie kilku lekcjom; „skąd” to wszystkie dawne lekcje pytania.

| Pytanie | Skąd | Dokąd |
|---|---|---|
| owe21-c-01 | mikro-podstawy-2 | mikro-rynek-4 |
| owe21-c-03 | – (nie było w żadnej lekcji) | mikro-zawodnosci-2 |
| owe21-c-04 | mikro-wzor-1 | mikro-konsument-2 |
| owe21-c-05 | mikro-produkcja-1, mikro-wzor-5 | mikro-czynniki-2 |
| owe21-c-07 | mikro-wzor-7 | mikro-struktury-2 |
| owe21-c-08 | – (nie było w żadnej lekcji) | mikro-struktury-1-cz2 |
| owe21-c-09 | makro-inflacja-2 | fin-publiczne-1 |
| owe21-c-10 | makro-wzor-2 | makro-isldas-2 |
| owe21-c-11 | – (nie było w żadnej lekcji) | fin-inwestycje-1 |
| owe21-c-13 | makro-inflacja-1 | makro-cykl-1 |
| owe21-c-15 | – (nie było w żadnej lekcji) | makro-rynekpracy-1 |
| owe21-c-16 | makro-kursy-2 | fin-pieniadz-2 |
| owe21-c-17 | fin-obligacje-2 | zarz-strategia-3 |
| owe21-c-19 | polityka-data-4, finanse-instytucja-3, firma-rachunkowosc-5 | firma-rachunkowosc-3 |
| owe21-c-22 | – (nie było w żadnej lekcji) | firma-finansowanie-2 |
| owe21-c-25 | – (nie było w żadnej lekcji) | fin-rynek-3 |
| owe21-c-26 | – (nie było w żadnej lekcji) | makro-handel-1 |
| owe21-c-28 | mikro-behawioralna-2, zarz-strategia-5 | zarz-decyzje-1 |
| owe21-c-29 | – (nie było w żadnej lekcji) | zarz-podstawy-1 |
| owe21-o-01 | – (nie było w żadnej lekcji) | mikro-elastycznosc-2 |
| owe21-o-02 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe21-o-03 | – (nie było w żadnej lekcji) | mikro-zawodnosci-2 |
| owe21-o-04 | mikro-wzor-2 | mikro-produkcja-1 |
| owe21-o-05 | mikro-elastycznosc-2, mikro-konsument-2 | mikro-konsument-1 |
| owe21-o-06 | mikro-wzor-3, mikro-wzor-7 | mikro-struktury-1 |
| owe21-o-07 | zarz-strategia-6 | mikro-struktury-5 |
| owe21-o-09 | makro-rynekpracy-4 | makro-inflacja-1 |
| owe21-o-10 | – (nie było w żadnej lekcji) | mikro-rynek-1-cz3 |
| owe21-o-11 | – (nie było w żadnej lekcji) | makro-rynekpracy-2 |
| owe21-o-13 | zarz-decyzje-2 | makro-wzrost-2 |
| owe21-o-14 | firma-rachunkowosc-4 | zarz-strategia-3 |
| owe21-o-15 | makro-kursy-5 | makro-kursy-5-cz2 |
| owe21-o-18 | – (nie było w żadnej lekcji) | fin-publiczne-2 |
| owe21-o-19 | – (nie było w żadnej lekcji) | fin-publiczne-5 |
| owe21-o-20 | – (nie było w żadnej lekcji) | fin-inwestycje-1 |
| owe21-o-21 | – (nie było w żadnej lekcji) | fin-inwestycje-7 |
| owe21-o-22 | finanse-instytucja-6 | finanse-instytucja-1 |
| owe21-o-23 | fin-rynek-7, finanse-wzor-2 | fin-rynek-3-cz2 |
| owe21-o-24 | fin-podstawy-1, fin-rynek-6 | fin-inwestycje-2 |
| owe21-o-27 | fin-inwestycje-7 | zarz-ludzie-5 |
| owe21-o-28 | – (nie było w żadnej lekcji) | makro-handel-5 |
| owe21-o-29 | – (nie było w żadnej lekcji) | zarz-strategia-3 |
| owe21-o-30 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe21-s-01 | fin-inwestycje-6 | mikro-produkcja-3-cz2 |
| owe21-s-02 | – (nie było w żadnej lekcji) | mikro-zawodnosci-2 |
| owe21-s-03 | mikro-struktury-6 | mikro-podstawy-2 |
| owe21-s-05 | mikro-podstawy-2 | mikro-rynek-4 |
| owe21-s-06 | mikro-elastycznosc-2 | mikro-struktury-1 |
| owe21-s-07 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe21-s-09 | – (nie było w żadnej lekcji) | makro-popyt-1 |
| owe21-s-13 | – (nie było w żadnej lekcji) | fin-publiczne-2 |
| owe21-s-14 | – (nie było w żadnej lekcji) | fin-pieniadz-2 |
| owe21-s-15 | – (nie było w żadnej lekcji) | makro-kursy-2 |
| owe21-s-16 | zarz-przedsiebiorczosc-2 | fin-publiczne-1-cz2 |
| owe21-s-18 | – (nie było w żadnej lekcji) | fin-zabezpieczenie-1 |
| owe21-s-20 | – (nie było w żadnej lekcji) | fin-inwestycje-2 |
| owe21-s-22 | – (nie było w żadnej lekcji) | firma-prawo-1 |
| owe21-s-23 | fin-ubezpieczenia-2, firma-rachunkowosc-5 | firma-prawo-1-cz2 |
| owe21-s-26 | zarz-organizowanie-3 | fin-publiczne-1 |
| owe21-s-27 | – (nie było w żadnej lekcji) | fin-publiczne-2 |
| owe21-s-28 | – (nie było w żadnej lekcji) | pol-pieniezna-3 |
| owe21-s-29 | – (nie było w żadnej lekcji) | fin-podatki-1 |
| owe21-s-31 | mikro-podstawy-3 | zarz-ludzie-2 |
| owe21-s-32 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe21-s-33 | fin-podstawy-2, zarzadzanie-osoba-2 | zarz-podstawy-2-cz2 |
| owe21-s-35 | firma-finansowanie-3 | zarz-ludzie-4 |
| owe22-c-01 | – (nie było w żadnej lekcji) | mikro-rynek-1 |
| owe22-c-02 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe22-c-03 | – (nie było w żadnej lekcji) | mikro-konsument-3 |
| owe22-c-05 | fin-publiczne-5, zarz-ludzie-6 | mikro-zawodnosci-2 |
| owe22-c-06 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe22-c-07 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe22-c-08 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe22-c-09 | – (nie było w żadnej lekcji) | fin-banki-1 |
| owe22-c-11 | fin-pieniadz-3 | mikro-rynek-1-cz2 |
| owe22-c-13 | fin-podatki-1 | makro-popyt-2 |
| owe22-c-14 | mikro-podstawy-2, makro-kursy-1 | makro-kursy-2 |
| owe22-c-15 | – (nie było w żadnej lekcji) | makro-isldas-2 |
| owe22-c-16 | – (nie było w żadnej lekcji) | firma-rachunkowosc-3 |
| owe22-c-17 | – (nie było w żadnej lekcji) | firma-prawo-1 |
| owe22-c-18 | – (nie było w żadnej lekcji) | fin-obligacje-3 |
| owe22-c-21 | – (nie było w żadnej lekcji) | fin-banki-5 |
| owe22-c-22 | – (nie było w żadnej lekcji) | fin-publiczne-4 |
| owe22-c-24 | – (nie było w żadnej lekcji) | fin-publiczne-3 |
| owe22-c-28 | – (nie było w żadnej lekcji) | zarz-marketing-2 |
| owe22-o-02 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe22-o-04 | mikro-elastycznosc-3 | mikro-konsument-2 |
| owe22-o-05 | mikro-wzor-7 | mikro-produkcja-4 |
| owe22-o-07 | mikro-rynek-3, mikro-wzor-7 | mikro-struktury-1 |
| owe22-o-08 | firma-analiza-2 | mikro-struktury-2 |
| owe22-o-09 | – (nie było w żadnej lekcji) | makro-pkb-1 |
| owe22-o-10 | – (nie było w żadnej lekcji) | makro-szkoly-1 |
| owe22-o-11 | – (nie było w żadnej lekcji) | makro-isldas-1 |
| owe22-o-12 | – (nie było w żadnej lekcji) | pol-fiskalna-2 |
| owe22-o-13 | makro-rynekpracy-2 | fin-publiczne-3 |
| owe22-o-14 | fin-publiczne-2 | fin-publiczne-2-cz2 |
| owe22-o-15 | – (nie było w żadnej lekcji) | pol-ue-3 |
| owe22-o-16 | – (nie było w żadnej lekcji) | firma-finansowanie-3 |
| owe22-o-18 | – (nie było w żadnej lekcji) | fin-banki-2 |
| owe22-o-19 | – (nie było w żadnej lekcji) | fin-obligacje-1 |
| owe22-o-20 | pol-ue-2, fin-podatki-1 | pol-ue-2-cz4 |
| owe22-o-21 | finanse-osoba-3 | fin-rynek-7 |
| owe22-o-23 | – (nie było w żadnej lekcji) | fin-inwestycje-2 |
| owe22-o-26 | – (nie było w żadnej lekcji) | zarz-podstawy-3 |
| owe22-o-27 | – (nie było w żadnej lekcji) | zarz-ludzie-2 |
| owe22-o-28 | zarz-marketing-2 | fin-rynek-9 |
| owe22-o-29 | zarz-strategia-1 | zarz-strategia-1-cz2 |
| owe22-o-30 | – (nie było w żadnej lekcji) | zarz-decyzje-3 |
| owe22-s-01 | makro-wzrost-2 | mikro-podstawy-1 |
| owe22-s-04 | mikro-produkcja-1 | mikro-produkcja-1-cz2 |
| owe22-s-05 | mikro-wzor-7 | mikro-struktury-1 |
| owe22-s-06 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe22-s-07 | mikro-wzor-2, mikro-wzor-3 | mikro-produkcja-5 |
| owe22-s-09 | makro-popyt-1, makro-wzor-2 | makro-szkoly-1 |
| owe22-s-10 | makro-kursy-3 | makro-cykl-1 |
| owe22-s-11 | – (nie było w żadnej lekcji) | fin-pieniadz-5 |
| owe22-s-12 | – (nie było w żadnej lekcji) | fin-podatki-2-cz2 |
| owe22-s-13 | – (nie było w żadnej lekcji) | fin-pieniadz-3 |
| owe22-s-16 | – (nie było w żadnej lekcji) | fin-publiczne-1 |
| owe22-s-17 | fin-podatki-1, finanse-osoba-4 | fin-rynek-1 |
| owe22-s-18 | fin-publiczne-1, fin-publiczne-5 | fin-publiczne-4 |
| owe22-s-20 | – (nie było w żadnej lekcji) | fin-pieniadz-4 |
| owe22-s-21 | – (nie było w żadnej lekcji) | mikro-produkcja-5 |
| owe22-s-22 | firma-analiza-1, zarzadzanie-wzor-1 | firma-rachunkowosc-3 |
| owe22-s-26 | – (nie było w żadnej lekcji) | fin-ubezpieczenia-1 |
| owe22-s-27 | fin-rynek-9 | fin-rynek-1 |
| owe22-s-28 | – (nie było w żadnej lekcji) | fin-rynek-7 |
| owe22-s-29 | – (nie było w żadnej lekcji) | firma-rachunkowosc-4 |
| owe22-s-31 | – (nie było w żadnej lekcji) | zarz-ludzie-4 |
| owe22-s-33 | – (nie było w żadnej lekcji) | zarz-organizowanie-2 |
| owe23-c-01 | – (nie było w żadnej lekcji) | mikro-rynek-1 |
| owe23-c-03 | pol-transformacja-2 | mikro-rynek-2 |
| owe23-c-05 | – (nie było w żadnej lekcji) | zarz-decyzje-1-cz2 |
| owe23-c-06 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe23-c-08 | mikro-czynniki-1 | mikro-rynek-1-cz3 |
| owe23-c-09 | makro-wzor-2 | makro-kursy-2 |
| owe23-c-10 | – (nie było w żadnej lekcji) | makro-popyt-3 |
| owe23-c-11 | makro-kursy-2 | makro-kursy-3 |
| owe23-c-12 | – (nie było w żadnej lekcji) | fin-publiczne-3 |
| owe23-c-13 | – (nie było w żadnej lekcji) | makro-rynekpracy-4 |
| owe23-c-14 | makro-inflacja-1 | makro-cykl-1 |
| owe23-c-15 | makro-kursy-2 | makro-kursy-4 |
| owe23-c-16 | – (nie było w żadnej lekcji) | firma-prawo-1 |
| owe23-c-17 | fin-ubezpieczenia-2 | fin-zabezpieczenie-1 |
| owe23-c-18 | mikro-czynniki-2, fin-inwestycje-7 | fin-zabezpieczenie-1 |
| owe23-c-19 | – (nie było w żadnej lekcji) | fin-publiczne-3 |
| owe23-c-21 | zarz-strategia-5 | fin-rynek-2 |
| owe23-c-22 | – (nie było w żadnej lekcji) | fin-inwestycje-2 |
| owe23-c-23 | mikro-rynek-5, mikro-konsument-3, mikro-wzor-6 | fin-podatki-3 |
| owe23-c-24 | fin-rynek-8 | firma-analiza-1 |
| owe23-c-25 | mikro-zawodnosci-4, fin-publiczne-5, zarz-strategia-2 | zarz-strategia-2-cz2 |
| owe23-c-27 | fin-ubezpieczenia-1 | fin-inwestycje-5 |
| owe23-c-29 | zarz-strategia-4, zarz-strategia-5 | zarz-przedsiebiorczosc-2 |
| owe23-c-30 | – (nie było w żadnej lekcji) | zarz-ludzie-3 |
| owe23-o-01 | – (nie było w żadnej lekcji) | mikro-elastycznosc-2 |
| owe23-o-02 | – (nie było w żadnej lekcji) | mikro-rynek-4 |
| owe23-o-06 | mikro-wzor-3 | mikro-struktury-1 |
| owe23-o-07 | – (nie było w żadnej lekcji) | mikro-zawodnosci-3 |
| owe23-o-08 | mikro-osoba-7, makro-cykl-2 | makro-cykl-1 |
| owe23-o-11 | – (nie było w żadnej lekcji) | makro-szkoly-2 |
| owe23-o-12 | – (nie było w żadnej lekcji) | makro-cykl-1 |
| owe23-o-14 | mikro-konsument-2, makro-inflacja-3, fin-pieniadz-5 | fin-banki-1-cz3 |
| owe23-o-15 | – (nie było w żadnej lekcji) | makro-kursy-3 |
| owe23-o-16 | – (nie było w żadnej lekcji) | fin-publiczne-1 |
| owe23-o-17 | polityka-data-4, finanse-instytucja-3 | finanse-przepis-2 |
| owe23-o-18 | fin-banki-4 | fin-banki-7 |
| owe23-o-23 | fin-rynek-10 | firma-rachunkowosc-1 |
| owe23-o-26 | makro-popyt-5 | fin-publiczne-4 |
| owe23-s-01 | mikro-podstawy-2 | mikro-rynek-1 |
| owe23-s-02 | – (nie było w żadnej lekcji) | mikro-podstawy-2 |
| owe23-s-03 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe23-s-04 | mikro-wzor-3, mikro-wzor-7 | mikro-struktury-1 |
| owe23-s-05 | fin-pieniadz-5 | fin-banki-1 |
| owe23-s-06 | – (nie było w żadnej lekcji) | mikro-elastycznosc-2 |
| owe23-s-07 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe23-s-09 | – (nie było w żadnej lekcji) | makro-pkb-3 |
| owe23-s-10 | pol-sektorowa-2 | mikro-zawodnosci-3 |
| owe23-s-11 | – (nie było w żadnej lekcji) | fin-publiczne-3 |
| owe23-s-12 | – (nie było w żadnej lekcji) | fin-podatki-2 |
| owe23-s-13 | – (nie było w żadnej lekcji) | fin-rynek-2 |
| owe23-s-15 | pol-podstawy-4 | makro-szkoly-1-cz2 |
| owe23-s-17 | makro-isldas-3, makro-rynekpracy-4, makro-osoba-5 | mikro-rynek-1-cz3 |
| owe23-s-19 | – (nie było w żadnej lekcji) | fin-publiczne-4 |
| owe23-s-22 | – (nie było w żadnej lekcji) | finanse-instytucja-4 |
| owe23-s-23 | fin-rynek-10 | fin-pieniadz-4 |
| owe23-s-24 | – (nie było w żadnej lekcji) | fin-publiczne-4 |
| owe23-s-29 | – (nie było w żadnej lekcji) | zarz-marketing-2 |
| owe23-s-30 | zarz-decyzje-5 | zarz-strategia-1 |
| owe24-c-03 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe24-c-05 | mikro-rynek-4 | mikro-rynek-1 |
| owe24-c-06 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe24-c-07 | mikro-struktury-6 | mikro-zawodnosci-1 |
| owe24-c-08 | – (nie było w żadnej lekcji) | mikro-czynniki-1 |
| owe24-c-09 | makro-inflacja-2, pol-ue-1 | makro-popyt-3 |
| owe24-c-10 | mikro-wzor-4, makro-wzrost-2 | makro-wzrost-2-cz2 |
| owe24-c-11 | – (nie było w żadnej lekcji) | mikro-rynek-1-cz2 |
| owe24-c-13 | – (nie było w żadnej lekcji) | fin-podatki-2 |
| owe24-c-14 | fin-podstawy-1 | fin-publiczne-3 |
| owe24-c-15 | makro-kursy-1 | makro-kursy-2 |
| owe24-c-16 | – (nie było w żadnej lekcji) | firma-prawo-1 |
| owe24-c-18 | firma-finansowanie-2 | firma-rachunkowosc-2 |
| owe24-c-19 | – (nie było w żadnej lekcji) | fin-podatki-1 |
| owe24-c-21 | fin-podstawy-1, firma-wzor-5 | firma-finansowanie-2 |
| owe24-c-22 | firma-rachunkowosc-5 | fin-inwestycje-1 |
| owe24-c-24 | – (nie było w żadnej lekcji) | fin-pieniadz-2 |
| owe24-c-25 | makro-kursy-2 | fin-publiczne-1 |
| owe24-c-27 | – (nie było w żadnej lekcji) | zarz-decyzje-3 |
| owe24-c-28 | mikro-struktury-5, zarz-strategia-6, zarzadzanie-osoba-5 | zarz-strategia-2 |
| owe24-c-29 | zarz-podstawy-1 | zarz-organizowanie-2 |
| owe24-c-30 | – (nie było w żadnej lekcji) | zarz-ludzie-1 |
| owe24-o-01 | – (nie było w żadnej lekcji) | mikro-podstawy-1 |
| owe24-o-02 | – (nie było w żadnej lekcji) | mikro-elastycznosc-2 |
| owe24-o-03 | mikro-wzor-5 | mikro-konsument-1 |
| owe24-o-04 | mikro-produkcja-2 | mikro-produkcja-1 |
| owe24-o-05 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe24-o-06 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe24-o-08 | – (nie było w żadnej lekcji) | pol-podstawy-4 |
| owe24-o-09 | – (nie było w żadnej lekcji) | makro-pkb-1-cz2 |
| owe24-o-10 | makro-wzor-2 | makro-isldas-2 |
| owe24-o-12 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe24-o-13 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe24-o-14 | – (nie było w żadnej lekcji) | makro-popyt-2 |
| owe24-o-15 | – (nie było w żadnej lekcji) | makro-kursy-4 |
| owe24-o-16 | – (nie było w żadnej lekcji) | fin-inwestycje-7 |
| owe24-o-17 | fin-banki-1 | fin-rynek-1 |
| owe24-o-20 | – (nie było w żadnej lekcji) | fin-rynek-7 |
| owe24-o-22 | – (nie było w żadnej lekcji) | finanse-instytucja-1 |
| owe24-o-23 | – (nie było w żadnej lekcji) | pol-ue-3 |
| owe24-o-26 | mikro-instytucja-1, firma-finansowanie-2 | mikro-struktury-5-cz2 |
| owe24-o-27 | – (nie było w żadnej lekcji) | firma-analiza-3 |
| owe24-o-28 | – (nie było w żadnej lekcji) | zarz-ludzie-2 |
| owe24-o-30 | firma-rachunkowosc-5 | zarz-decyzje-1 |
| owe24-s-02 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe24-s-03 | – (nie było w żadnej lekcji) | mikro-rynek-1 |
| owe24-s-06 | – (nie było w żadnej lekcji) | makro-rynekpracy-2 |
| owe24-s-07 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe24-s-08 | – (nie było w żadnej lekcji) | makro-popyt-2 |
| owe24-s-09 | mikro-wzor-7 | mikro-struktury-1 |
| owe24-s-12 | – (nie było w żadnej lekcji) | makro-popyt-1 |
| owe24-s-13 | – (nie było w żadnej lekcji) | fin-obligacje-2 |
| owe24-s-14 | demo-migracje-2 | firma-rachunkowosc-1 |
| owe24-s-15 | fin-publiczne-1 | fin-publiczne-2 |
| owe24-s-16 | – (nie było w żadnej lekcji) | fin-pieniadz-1 |
| owe24-s-19 | fin-podatki-3 | fin-publiczne-1 |
| owe24-s-21 | pol-sektorowa-2 | fin-rynek-2-cz2 |
| owe24-s-22 | firma-prawo-1 | fin-ubezpieczenia-2 |
| owe24-s-23 | – (nie było w żadnej lekcji) | fin-inwestycje-2 |
| owe24-s-24 | – (nie było w żadnej lekcji) | fin-obligacje-1-cz2 |
| owe24-s-25 | – (nie było w żadnej lekcji) | zarz-ludzie-1 |
| owe24-s-27 | – (nie było w żadnej lekcji) | zarz-decyzje-4 |
| owe24-s-29 | zarzadzanie-osoba-4 | zarz-ludzie-1 |
| owe24-s-30 | zarz-strategia-4 | fin-banki-1 |
| owe25-c-02 | – (nie było w żadnej lekcji) | mikro-elastycznosc-2 |
| owe25-c-03 | mikro-rynek-5 | mikro-elastycznosc-1 |
| owe25-c-04 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe25-c-05 | mikro-wzor-3, mikro-wzor-7 | mikro-produkcja-5 |
| owe25-c-08 | – (nie było w żadnej lekcji) | mikro-zawodnosci-1 |
| owe25-c-09 | – (nie było w żadnej lekcji) | makro-handel-1 |
| owe25-c-10 | – (nie było w żadnej lekcji) | fin-pieniadz-1-cz2 |
| owe25-c-11 | makro-rynekpracy-3 | makro-cykl-1-cz2 |
| owe25-c-14 | polityka-wzor-1 | pol-ue-2 |
| owe25-c-15 | makro-kursy-2 | makro-kursy-3 |
| owe25-c-18 | – (nie było w żadnej lekcji) | fin-podatki-2 |
| owe25-c-19 | – (nie było w żadnej lekcji) | fin-pieniadz-3 |
| owe25-c-20 | finanse-instytucja-3 | fin-publiczne-4 |
| owe25-c-21 | – (nie było w żadnej lekcji) | fin-rynek-2 |
| owe25-c-23 | – (nie było w żadnej lekcji) | fin-rynek-3 |
| owe25-c-25 | finanse-instytucja-5 | finanse-instytucja-2 |
| owe25-c-26 | – (nie było w żadnej lekcji) | firma-prawo-4 |
| owe25-c-27 | – (nie było w żadnej lekcji) | mikro-zawodnosci-3 |
| owe25-c-28 | – (nie było w żadnej lekcji) | zarz-ludzie-3 |
| owe25-c-29 | – (nie było w żadnej lekcji) | fin-rynek-4 |
| owe25-o-01 | mikro-podstawy-2, fin-zabezpieczenie-1 | fin-zabezpieczenie-1-cz2 |
| owe25-o-02 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe25-o-03 | – (nie było w żadnej lekcji) | mikro-rynek-4 |
| owe25-o-04 | – (nie było w żadnej lekcji) | makro-kursy-2 |
| owe25-o-05 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe25-o-06 | fin-podstawy-2 | makro-szkoly-1 |
| owe25-o-07 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe25-o-09 | mikro-wzor-7 | mikro-produkcja-5 |
| owe25-o-10 | – (nie było w żadnej lekcji) | pol-ue-3 |
| owe25-o-12 | – (nie było w żadnej lekcji) | makro-pkb-3 |
| owe25-o-13 | – (nie było w żadnej lekcji) | mikro-produkcja-5 |
| owe25-o-15 | makro-cykl-1 | makro-szkoly-1 |
| owe25-o-17 | makro-inflacja-4 | makro-inflacja-1-cz2 |
| owe25-o-18 | – (nie było w żadnej lekcji) | fin-ubezpieczenia-1 |
| owe25-o-19 | fin-pieniadz-2, finanse-wzor-1 | fin-pieniadz-4 |
| owe25-o-20 | finanse-instytucja-3, finanse-przepis-1 | fin-podatki-3 |
| owe25-o-21 | – (nie było w żadnej lekcji) | fin-publiczne-4 |
| owe25-o-22 | firma-rachunkowosc-1 | firma-rachunkowosc-3 |
| owe25-o-24 | fin-rynek-9 | fin-inwestycje-1 |
| owe25-o-28 | – (nie było w żadnej lekcji) | firma-rachunkowosc-3 |
| owe25-o-30 | – (nie było w żadnej lekcji) | firma-prawo-4-cz2 |
| owe25-s-02 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe25-s-03 | – (nie było w żadnej lekcji) | mikro-konsument-2 |
| owe25-s-04 | mikro-struktury-1, zarz-strategia-6 | mikro-struktury-2 |
| owe25-s-05 | makro-instytucja-2 | mikro-rynek-1 |
| owe25-s-06 | mikro-wzor-7 | mikro-struktury-1 |
| owe25-s-07 | – (nie było w żadnej lekcji) | makro-popyt-2 |
| owe25-s-08 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe25-s-09 | – (nie było w żadnej lekcji) | makro-rynekpracy-4 |
| owe25-s-10 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe25-s-11 | – (nie było w żadnej lekcji) | fin-pieniadz-3 |
| owe25-s-12 | – (nie było w żadnej lekcji) | makro-isldas-2 |
| owe25-s-13 | – (nie było w żadnej lekcji) | firma-rachunkowosc-1 |
| owe25-s-14 | makro-szkoly-1 | mikro-podstawy-3-cz2 |
| owe25-s-15 | fin-rynek-5 | fin-rynek-2-cz2 |
| owe25-s-16 | makro-kursy-3 | makro-kursy-4 |
| owe25-s-17 | – (nie było w żadnej lekcji) | fin-podatki-2 |
| owe25-s-18 | makro-rynekpracy-2 | fin-publiczne-3 |
| owe25-s-19 | mikro-czynniki-2 | fin-podatki-2 |
| owe25-s-21 | – (nie było w żadnej lekcji) | finanse-przepis-2 |
| owe25-s-22 | fin-rynek-2 | fin-inwestycje-5 |
| owe25-s-23 | makro-kursy-6 | fin-obligacje-1 |
| owe25-s-24 | mikro-instytucja-1, pol-sektorowa-2 | pol-ue-2-cz4 |
| owe25-s-26 | firma-finansowanie-1 | firma-finansowanie-2 |
| owe25-s-27 | – (nie było w żadnej lekcji) | zarz-strategia-1 |
| owe25-s-29 | mikro-struktury-5, mikro-wzor-4, mikro-osoba-5 | mikro-struktury-6 |
| owe26-c-01 | – (nie było w żadnej lekcji) | mikro-rynek-4 |
| owe26-c-02 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe26-c-03 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe26-c-05 | mikro-produkcja-4 | mikro-produkcja-5 |
| owe26-c-06 | – (nie było w żadnej lekcji) | mikro-czynniki-1 |
| owe26-c-07 | – (nie było w żadnej lekcji) | mikro-zawodnosci-1 |
| owe26-c-08 | – (nie było w żadnej lekcji) | mikro-zawodnosci-1 |
| owe26-c-09 | – (nie było w żadnej lekcji) | fin-podatki-1-cz2 |
| owe26-c-10 | fin-pieniadz-5 | makro-inflacja-1 |
| owe26-c-11 | – (nie było w żadnej lekcji) | pol-pieniezna-3-cz2 |
| owe26-c-12 | – (nie było w żadnej lekcji) | makro-rynekpracy-2 |
| owe26-c-13 | – (nie było w żadnej lekcji) | makro-popyt-3 |
| owe26-c-14 | – (nie było w żadnej lekcji) | makro-cykl-1 |
| owe26-c-15 | mikro-czynniki-2, makro-isldas-2 | mikro-czynniki-2-cz2 |
| owe26-c-16 | – (nie było w żadnej lekcji) | firma-prawo-4 |
| owe26-c-17 | pol-pieniezna-5, pol-ue-3, fin-podstawy-1 | makro-wzrost-1-cz2 |
| owe26-c-19 | zarzadzanie-wzor-1 | fin-rynek-3 |
| owe26-c-20 | fin-podatki-4 | fin-publiczne-4 |
| owe26-c-21 | – (nie było w żadnej lekcji) | fin-inwestycje-2 |
| owe26-c-23 | firma-prawo-2 | finanse-instytucja-4 |
| owe26-c-25 | – (nie było w żadnej lekcji) | fin-inwestycje-4 |
| owe26-c-26 | – (nie było w żadnej lekcji) | fin-rynek-4 |
| owe26-c-27 | – (nie było w żadnej lekcji) | zarz-ludzie-5 |
| owe26-c-28 | – (nie było w żadnej lekcji) | zarz-organizowanie-2 |
| owe26-c-29 | zarz-decyzje-5 | zarz-strategia-1 |
| owe26-c-30 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe26-o-02 | mikro-wzor-7 | mikro-produkcja-4 |
| owe26-o-03 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe26-o-04 | – (nie było w żadnej lekcji) | fin-podatki-5-cz2 |
| owe26-o-05 | mikro-produkcja-4, mikro-wzor-3, firma-analiza-2 | mikro-struktury-1 |
| owe26-o-06 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe26-o-14 | fin-banki-1 | fin-rynek-2 |
| owe26-o-17 | firma-rachunkowosc-5 | fin-ubezpieczenia-2 |
| owe26-o-18 | – (nie było w żadnej lekcji) | fin-podatki-3-cz2 |
| owe26-o-19 | fin-inwestycje-6 | fin-podatki-1-cz2 |
| owe26-o-20 | – (nie było w żadnej lekcji) | fin-ubezpieczenia-1 |
| owe26-o-21 | – (nie było w żadnej lekcji) | fin-rynek-7 |
| owe26-o-22 | fin-rynek-8 | fin-inwestycje-2 |
| owe26-o-23 | – (nie było w żadnej lekcji) | fin-obligacje-1 |
| owe26-o-25 | – (nie było w żadnej lekcji) | fin-inwestycje-4 |
| owe26-o-27 | – (nie było w żadnej lekcji) | zarz-podstawy-3 |
| owe26-o-28 | mikro-struktury-5 | zarz-strategia-2 |
| owe26-o-29 | mikro-konsument-3 | zarz-marketing-1 |
| owe26-o-30 | – (nie było w żadnej lekcji) | firma-prawo-3 |
| owe26-s-01 | – (nie było w żadnej lekcji) | mikro-podstawy-2 |
| owe26-s-03 | – (nie było w żadnej lekcji) | mikro-konsument-2 |
| owe26-s-04 | mikro-wzor-7 | mikro-produkcja-4 |
| owe26-s-05 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe26-s-07 | mikro-wzor-7 | mikro-produkcja-3 |
| owe26-s-08 | zarz-strategia-6 | mikro-struktury-2 |
| owe26-s-09 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe26-s-10 | – (nie było w żadnej lekcji) | fin-pieniadz-2-cz2 |
| owe26-s-12 | – (nie było w żadnej lekcji) | makro-popyt-1 |
| owe26-s-14 | mikro-podstawy-2 | makro-rynekpracy-1 |
| owe26-s-16 | fin-inwestycje-1 | fin-zabezpieczenie-1 |
| owe26-s-17 | pol-pieniezna-5 | pol-pieniezna-5-cz2 |
| owe26-s-18 | – (nie było w żadnej lekcji) | fin-pieniadz-1 |
| owe26-s-19 | – (nie było w żadnej lekcji) | fin-pieniadz-4 |
| owe26-s-21 | polityka-data-4, finanse-instytucja-3 | fin-podatki-3 |
| owe26-s-22 | – (nie było w żadnej lekcji) | fin-publiczne-1 |
| owe26-s-23 | – (nie było w żadnej lekcji) | fin-publiczne-5 |
| owe26-s-24 | – (nie było w żadnej lekcji) | firma-rachunkowosc-1 |
| owe26-s-25 | – (nie było w żadnej lekcji) | firma-prawo-3 |
| owe26-s-26 | zarz-podstawy-2, zarzadzanie-osoba-7, zarzadzanie-data-1 | zarz-podstawy-2-cz2 |
| owe26-s-27 | fin-podstawy-2 | zarz-podstawy-2-cz2 |
| owe26-s-29 | zarz-decyzje-1 | zarz-decyzje-3 |
| owe26-s-30 | – (nie było w żadnej lekcji) | zarz-decyzje-3 |
| owe27-c-01 | – (nie było w żadnej lekcji) | mikro-elastycznosc-3 |
| owe27-c-02 | mikro-konsument-2 | mikro-konsument-3 |
| owe27-c-04 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe27-c-08 | – (nie było w żadnej lekcji) | mikro-podstawy-1 |
| owe27-c-09 | – (nie było w żadnej lekcji) | makro-wzrost-1 |
| owe27-c-10 | fin-pieniadz-5, finanse-wzor-1, finanse-instytucja-6 | fin-banki-1 |
| owe27-c-11 | – (nie było w żadnej lekcji) | makro-cykl-1 |
| owe27-c-12 | – (nie było w żadnej lekcji) | makro-popyt-2 |
| owe27-c-13 | – (nie było w żadnej lekcji) | makro-inflacja-3 |
| owe27-c-14 | makro-rynekpracy-1 | makro-rynekpracy-2 |
| owe27-c-16 | polityka-data-1 | zarz-ludzie-6 |
| owe27-c-18 | fin-inwestycje-6 | firma-rachunkowosc-4 |
| owe27-c-20 | – (nie było w żadnej lekcji) | fin-podatki-3 |
| owe27-c-23 | pol-fiskalna-3 | fin-publiczne-4 |
| owe27-c-24 | – (nie było w żadnej lekcji) | firma-prawo-4 |
| owe27-c-25 | zarz-strategia-4 | zarz-przedsiebiorczosc-1 |
| owe27-c-26 | – (nie było w żadnej lekcji) | zarz-strategia-4 |
| owe27-c-27 | – (nie było w żadnej lekcji) | fin-obligacje-3 |
| owe27-c-29 | zarzadzanie-osoba-4 | zarz-ludzie-1 |
| owe27-o-02 | – (nie było w żadnej lekcji) | mikro-podstawy-2 |
| owe27-o-03 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe27-o-04 | – (nie było w żadnej lekcji) | mikro-elastycznosc-3 |
| owe27-o-05 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe27-o-06 | mikro-produkcja-2, mikro-struktury-6, firma-prawo-4 | mikro-struktury-1 |
| owe27-o-08 | mikro-wzor-7 | mikro-struktury-1 |
| owe27-o-09 | – (nie było w żadnej lekcji) | makro-pkb-1 |
| owe27-o-11 | – (nie było w żadnej lekcji) | makro-szkoly-2 |
| owe27-o-12 | makro-isldas-2 | makro-inflacja-1 |
| owe27-o-13 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe27-o-14 | – (nie było w żadnej lekcji) | fin-banki-2 |
| owe27-o-15 | – (nie było w żadnej lekcji) | fin-inwestycje-1 |
| owe27-o-17 | firma-finansowanie-3 | fin-banki-8 |
| owe27-o-18 | – (nie było w żadnej lekcji) | fin-inwestycje-5-cz2 |
| owe27-o-20 | – (nie było w żadnej lekcji) | firma-rachunkowosc-3 |
| owe27-o-21 | polityka-data-4 | pol-ue-2 |
| owe27-o-22 | pol-ue-3 | makro-kursy-3-cz2 |
| owe27-o-23 | – (nie było w żadnej lekcji) | fin-podatki-3 |
| owe27-o-24 | fin-podatki-6 | fin-ubezpieczenia-2 |
| owe27-o-28 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe27-o-29 | makro-popyt-5 | zarz-przedsiebiorczosc-1 |
| owe27-s-01 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe27-s-03 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe27-s-06 | mikro-struktury-1 | mikro-struktury-2 |
| owe27-s-07 | mikro-wzor-7 | mikro-produkcja-4 |
| owe27-s-08 | mikro-rynek-3, mikro-konsument-3 | mikro-behawioralna-1 |
| owe27-s-09 | – (nie było w żadnej lekcji) | makro-popyt-4 |
| owe27-s-10 | – (nie było w żadnej lekcji) | makro-pkb-3 |
| owe27-s-11 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe27-s-12 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe27-s-14 | – (nie było w żadnej lekcji) | fin-publiczne-3-cz2 |
| owe27-s-15 | fin-obligacje-1 | fin-pieniadz-3 |
| owe27-s-16 | – (nie było w żadnej lekcji) | fin-pieniadz-1 |
| owe27-s-17 | – (nie było w żadnej lekcji) | finanse-przepis-2 |
| owe27-s-18 | polityka-data-5 | pol-ue-3 |
| owe27-s-19 | fin-pieniadz-5, fin-banki-7 | fin-rynek-9 |
| owe27-s-20 | makro-inflacja-3 | mikro-produkcja-5 |
| owe27-s-21 | – (nie było w żadnej lekcji) | fin-podatki-3 |
| owe27-s-22 | mikro-publiczny-1 | fin-podatki-2 |
| owe27-s-24 | – (nie było w żadnej lekcji) | fin-ubezpieczenia-1 |
| owe27-s-25 | – (nie było w żadnej lekcji) | firma-prawo-1-cz2 |
| owe27-s-27 | – (nie było w żadnej lekcji) | zarz-podstawy-2 |
| owe27-s-28 | – (nie było w żadnej lekcji) | zarz-marketing-2 |
| owe27-s-29 | zarz-organizowanie-2 | zarz-marketing-1 |
| owe27-s-30 | pol-sektorowa-3, zarz-strategia-4 | zarz-strategia-3 |
| owe28-c-01 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe28-c-02 | mikro-podstawy-2 | mikro-podstawy-6 |
| owe28-c-03 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe28-c-04 | firma-prawo-4 | mikro-struktury-6 |
| owe28-c-05 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe28-c-06 | mikro-podstawy-2 | mikro-czynniki-1 |
| owe28-c-07 | mikro-struktury-1 | mikro-struktury-2 |
| owe28-c-08 | – (nie było w żadnej lekcji) | mikro-zawodnosci-2 |
| owe28-c-09 | – (nie było w żadnej lekcji) | makro-popyt-3 |
| owe28-c-10 | makro-wzor-2 | makro-popyt-3 |
| owe28-c-11 | makro-kursy-1 | fin-publiczne-3 |
| owe28-c-12 | polityka-wzor-1 | makro-inflacja-1-cz3 |
| owe28-c-15 | – (nie było w żadnej lekcji) | fin-banki-1 |
| owe28-c-16 | fin-obligacje-1, fin-rynek-10 | fin-obligacje-1-cz2 |
| owe28-c-18 | – (nie było w żadnej lekcji) | fin-rynek-3 |
| owe28-c-22 | polityka-data-4, finanse-instytucja-3 | firma-rachunkowosc-1 |
| owe28-c-23 | zarz-decyzje-2 | fin-ubezpieczenia-2 |
| owe28-c-24 | – (nie było w żadnej lekcji) | fin-publiczne-4 |
| owe28-c-25 | – (nie było w żadnej lekcji) | fin-podatki-3 |
| owe28-c-26 | – (nie było w żadnej lekcji) | zarz-marketing-2 |
| owe28-c-28 | fin-publiczne-5 | mikro-struktury-3 |
| owe28-o-01 | mikro-podstawy-2 | mikro-podstawy-2-cz2 |
| owe28-o-02 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe28-o-05 | mikro-produkcja-4 | mikro-struktury-1 |
| owe28-o-06 | mikro-produkcja-2 | mikro-struktury-1 |
| owe28-o-07 | fin-podstawy-1 | makro-finanse-1 |
| owe28-o-08 | – (nie było w żadnej lekcji) | mikro-zawodnosci-3-cz2 |
| owe28-o-09 | makro-kursy-2 | pol-ue-2-cz2 |
| owe28-o-10 | – (nie było w żadnej lekcji) | mikro-zawodnosci-3 |
| owe28-o-11 | – (nie było w żadnej lekcji) | makro-isldas-2 |
| owe28-o-12 | makro-wzor-2, zarzadzanie-wzor-1 | makro-pkb-1-cz2 |
| owe28-o-13 | fin-pieniadz-5 | makro-szkoly-1 |
| owe28-o-15 | – (nie było w żadnej lekcji) | fin-publiczne-2 |
| owe28-o-16 | – (nie było w żadnej lekcji) | makro-inflacja-5 |
| owe28-o-17 | demo-emerytury-1 | fin-ubezpieczenia-2 |
| owe28-o-19 | finanse-instytucja-1 | fin-publiczne-1 |
| owe28-o-20 | – (nie było w żadnej lekcji) | fin-rynek-7 |
| owe28-o-21 | finanse-wzor-2 | fin-rynek-3 |
| owe28-o-23 | firma-rachunkowosc-4 | firma-rachunkowosc-5 |
| owe28-o-26 | mikro-struktury-6, firma-finansowanie-3 | zarz-strategia-3-cz2 |
| owe28-o-27 | fin-inwestycje-7 | firma-prawo-4 |
| owe28-o-29 | – (nie było w żadnej lekcji) | zarz-decyzje-2 |
| owe28-s-01 | – (nie było w żadnej lekcji) | mikro-podstawy-1 |
| owe28-s-02 | – (nie było w żadnej lekcji) | mikro-rynek-4 |
| owe28-s-03 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe28-s-05 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe28-s-06 | – (nie było w żadnej lekcji) | mikro-produkcja-4 |
| owe28-s-07 | – (nie było w żadnej lekcji) | makro-handel-4 |
| owe28-s-09 | – (nie było w żadnej lekcji) | makro-kursy-3 |
| owe28-s-10 | – (nie było w żadnej lekcji) | makro-pkb-1 |
| owe28-s-11 | mikro-podstawy-4 | makro-rynekpracy-1 |
| owe28-s-12 | – (nie było w żadnej lekcji) | makro-popyt-1 |
| owe28-s-13 | – (nie było w żadnej lekcji) | fin-pieniadz-2 |
| owe28-s-14 | – (nie było w żadnej lekcji) | makro-pkb-3 |
| owe28-s-15 | – (nie było w żadnej lekcji) | makro-pkb-3 |
| owe28-s-16 | fin-rynek-8 | fin-banki-8 |
| owe28-s-17 | – (nie było w żadnej lekcji) | fin-banki-5 |
| owe28-s-18 | – (nie było w żadnej lekcji) | firma-prawo-5 |
| owe28-s-19 | polityka-instytucja-2 | pol-ue-2 |
| owe28-s-20 | – (nie było w żadnej lekcji) | firma-analiza-1 |
| owe28-s-21 | – (nie było w żadnej lekcji) | firma-przepis-2 |
| owe28-s-22 | – (nie było w żadnej lekcji) | fin-rynek-5 |
| owe28-s-23 | fin-rynek-5, finanse-data-2 | fin-rynek-8 |
| owe28-s-24 | finanse-instytucja-3 | fin-podatki-1-cz2 |
| owe28-s-25 | – (nie było w żadnej lekcji) | fin-obligacje-1-cz2 |
| owe28-s-28 | – (nie było w żadnej lekcji) | firma-prawo-3 |
| owe29-c-01 | – (nie było w żadnej lekcji) | mikro-rynek-1 |
| owe29-c-04 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe29-c-05 | mikro-produkcja-2 | mikro-czynniki-2 |
| owe29-c-08 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe29-c-09 | fin-zabezpieczenie-2 | makro-kursy-2 |
| owe29-c-10 | – (nie było w żadnej lekcji) | makro-isldas-2 |
| owe29-c-12 | pol-pieniezna-5 | makro-kursy-4 |
| owe29-c-14 | pol-pieniezna-5, fin-podstawy-1, fin-banki-1 | fin-banki-8 |
| owe29-c-16 | – (nie było w żadnej lekcji) | fin-podatki-5 |
| owe29-c-19 | – (nie było w żadnej lekcji) | fin-rynek-1 |
| owe29-c-20 | – (nie było w żadnej lekcji) | fin-podatki-1 |
| owe29-c-22 | fin-banki-6 | fin-rynek-9 |
| owe29-c-23 | – (nie było w żadnej lekcji) | fin-rynek-4 |
| owe29-c-24 | – (nie było w żadnej lekcji) | fin-podatki-3 |
| owe29-c-25 | zarz-ludzie-6 | mikro-produkcja-4 |
| owe29-c-26 | makro-cykl-1, pol-pieniezna-4 | pol-pieniezna-5-cz2 |
| owe29-c-27 | – (nie było w żadnej lekcji) | firma-finansowanie-1 |
| owe29-c-29 | firma-osoba-1 | zarz-decyzje-1 |
| owe29-o-01 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe29-o-02 | mikro-elastycznosc-1, mikro-wzor-1, mikro-wzor-7 | mikro-produkcja-4 |
| owe29-o-03 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe29-o-04 | mikro-wzor-3, mikro-wzor-7, zarz-strategia-6 | mikro-struktury-3 |
| owe29-o-05 | mikro-rynek-3 | mikro-struktury-1 |
| owe29-o-06 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe29-o-07 | – (nie było w żadnej lekcji) | mikro-zawodnosci-2 |
| owe29-o-08 | – (nie było w żadnej lekcji) | fin-pieniadz-1 |
| owe29-o-10 | – (nie było w żadnej lekcji) | fin-pieniadz-1 |
| owe29-o-12 | makro-inflacja-3, pol-pieniezna-4 | pol-ue-3 |
| owe29-o-13 | makro-rynekpracy-1, pol-spoleczna-1, polityka-przepis-1 | makro-rynekpracy-4 |
| owe29-o-15 | mikro-rynek-1, fin-pieniadz-3 | fin-pieniadz-3-cz2 |
| owe29-o-17 | makro-kursy-5, fin-banki-6 | makro-kursy-5-cz2 |
| owe29-o-18 | firma-rachunkowosc-6 | firma-finansowanie-2 |
| owe29-o-19 | – (nie było w żadnej lekcji) | fin-podatki-2 |
| owe29-o-20 | – (nie było w żadnej lekcji) | fin-podatki-1 |
| owe29-o-21 | – (nie było w żadnej lekcji) | firma-prawo-1 |
| owe29-o-22 | – (nie było w żadnej lekcji) | fin-rynek-9 |
| owe29-o-26 | – (nie było w żadnej lekcji) | zarz-ludzie-5 |
| owe29-o-28 | – (nie było w żadnej lekcji) | zarz-ludzie-5 |
| owe29-o-29 | zarz-ludzie-8 | zarz-ludzie-5 |
| owe29-o-30 | zarz-strategia-1, zarz-decyzje-5 | zarz-strategia-5 |
| owe29-s-01 | – (nie było w żadnej lekcji) | mikro-podstawy-5 |
| owe29-s-02 | – (nie było w żadnej lekcji) | mikro-podstawy-1 |
| owe29-s-04 | firma-przepis-3 | mikro-produkcja-1 |
| owe29-s-05 | – (nie było w żadnej lekcji) | mikro-rynek-1-cz2 |
| owe29-s-06 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe29-s-07 | – (nie było w żadnej lekcji) | mikro-struktury-2 |
| owe29-s-08 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe29-s-09 | – (nie było w żadnej lekcji) | makro-wzrost-2 |
| owe29-s-10 | mikro-podstawy-4 | makro-pkb-1 |
| owe29-s-11 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe29-s-12 | – (nie było w żadnej lekcji) | makro-popyt-1 |
| owe29-s-14 | – (nie było w żadnej lekcji) | makro-cykl-1 |
| owe29-s-15 | – (nie było w żadnej lekcji) | pol-pieniezna-5 |
| owe29-s-16 | fin-podstawy-1 | firma-rachunkowosc-3-cz2 |
| owe29-s-17 | – (nie było w żadnej lekcji) | firma-finansowanie-2 |
| owe29-s-18 | – (nie było w żadnej lekcji) | fin-inwestycje-1 |
| owe29-s-19 | finanse-wzor-1 | finanse-instytucja-1 |
| owe29-s-20 | pol-pieniezna-2 | pol-pieniezna-5 |
| owe29-s-22 | – (nie było w żadnej lekcji) | makro-popyt-3 |
| owe29-s-23 | – (nie było w żadnej lekcji) | fin-podatki-2 |
| owe29-s-25 | mikro-wzor-7, polityka-data-4, zarzadzanie-wzor-1 | firma-analiza-1 |
| owe29-s-26 | – (nie było w żadnej lekcji) | firma-prawo-1 |
| owe29-s-27 | fin-inwestycje-7, zarz-otoczenie-3, zarz-decyzje-5 | zarz-ludzie-5 |
| owe29-s-29 | – (nie było w żadnej lekcji) | zarz-ludzie-5 |
| owe29-s-30 | zarz-strategia-4 | zarz-przedsiebiorczosc-1 |
| owe30-c-01 | finanse-instytucja-2 | fin-banki-1 |
| owe30-c-02 | pol-pieniezna-3, fin-banki-4, fin-kryzysy-2 | fin-inwestycje-1 |
| owe30-c-03 | – (nie było w żadnej lekcji) | makro-isldas-1 |
| owe30-c-04 | – (nie było w żadnej lekcji) | makro-szkoly-2 |
| owe30-c-05 | makro-rynekpracy-2, makro-rynekpracy-4 | makro-rynekpracy-1 |
| owe30-c-06 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe30-c-07 | finanse-osoba-3 | firma-inwestycje-1 |
| owe30-c-08 | fin-obligacje-2 | fin-pieniadz-3 |
| owe30-c-11 | fin-pieniadz-2, finanse-wzor-1 | fin-banki-1 |
| owe30-c-12 | polityka-wzor-1 | fin-pieniadz-3-cz3 |
| owe30-c-13 | makro-rynekpracy-2 | fin-publiczne-3 |
| owe30-c-15 | makro-inflacja-3, pol-pieniezna-4, finanse-instytucja-6 | pol-pieniezna-4-cz2 |
| owe30-c-17 | makro-osoba-2, zarzadzanie-wzor-1 | makro-cykl-1 |
| owe30-c-18 | – (nie było w żadnej lekcji) | mikro-rynek-2 |
| owe30-c-19 | fin-rynek-2, firma-wzor-6 | firma-rachunkowosc-2-cz2 |
| owe30-c-20 | – (nie było w żadnej lekcji) | makro-popyt-3 |
| owe30-c-21 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe30-c-22 | – (nie było w żadnej lekcji) | mikro-zawodnosci-2 |
| owe30-c-23 | – (nie było w żadnej lekcji) | fin-publiczne-4 |
| owe30-c-25 | fin-rynek-3 | fin-rynek-7 |
| owe30-c-27 | – (nie było w żadnej lekcji) | zarz-ludzie-4 |
| owe30-c-28 | – (nie było w żadnej lekcji) | zarz-otoczenie-1 |
| owe30-c-30 | pol-pieniezna-4 | fin-banki-1-cz3 |
| owe30-o-01 | – (nie było w żadnej lekcji) | fin-podatki-4 |
| owe30-o-03 | pol-pieniezna-1 | pol-pieniezna-5 |
| owe30-o-05 | – (nie było w żadnej lekcji) | fin-rynek-4 |
| owe30-o-06 | – (nie było w żadnej lekcji) | fin-inwestycje-2 |
| owe30-o-09 | mikro-produkcja-3 | mikro-struktury-1 |
| owe30-o-10 | – (nie było w żadnej lekcji) | mikro-rynek-2 |
| owe30-o-12 | mikro-rynek-5, fin-rynek-6 | mikro-struktury-2 |
| owe30-o-14 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe30-o-15 | – (nie było w żadnej lekcji) | fin-publiczne-3 |
| owe30-o-16 | – (nie było w żadnej lekcji) | fin-banki-1 |
| owe30-o-17 | mikro-rynek-3 | mikro-elastycznosc-1 |
| owe30-o-18 | firma-prawo-2 | fin-obligacje-3 |
| owe30-o-19 | – (nie było w żadnej lekcji) | firma-prawo-1 |
| owe30-o-21 | mikro-konsument-2, fin-pieniadz-5 | makro-inflacja-3 |
| owe30-o-22 | – (nie było w żadnej lekcji) | fin-inwestycje-3 |
| owe30-o-23 | makro-kursy-5 | fin-pieniadz-1 |
| owe30-o-25 | finanse-instytucja-2, finanse-instytucja-6, finanse-data-1 | fin-banki-1 |
| owe30-o-27 | – (nie było w żadnej lekcji) | zarz-ludzie-3 |
| owe30-o-28 | – (nie było w żadnej lekcji) | zarz-organizowanie-2 |
| owe30-o-29 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe30-o-30 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe30-s-01 | mikro-podstawy-3 | mikro-podstawy-3-cz2 |
| owe30-s-02 | pol-fiskalna-1, fin-publiczne-1 | fin-publiczne-2 |
| owe30-s-03 | mikro-wzor-3, mikro-wzor-7 | mikro-struktury-1 |
| owe30-s-05 | fin-publiczne-1 | fin-publiczne-2 |
| owe30-s-09 | – (nie było w żadnej lekcji) | makro-popyt-1 |
| owe30-s-10 | makro-inflacja-3 | mikro-produkcja-5 |
| owe30-s-11 | finanse-instytucja-1 | pol-pieniezna-2 |
| owe30-s-13 | mikro-konsument-3 | makro-szkoly-1 |
| owe30-s-14 | – (nie było w żadnej lekcji) | fin-podatki-1 |
| owe30-s-15 | – (nie było w żadnej lekcji) | makro-pkb-1 |
| owe30-s-16 | pol-spoleczna-2 | fin-banki-1 |
| owe30-s-19 | – (nie było w żadnej lekcji) | mikro-zawodnosci-2 |
| owe30-s-20 | – (nie było w żadnej lekcji) | fin-obligacje-3 |
| owe30-s-21 | mikro-zawodnosci-1 | fin-publiczne-1 |
| owe30-s-22 | makro-wzor-4 | makro-popyt-4 |
| owe30-s-24 | finanse-instytucja-4 | fin-banki-1-cz2 |
| owe30-s-25 | fin-rynek-9 | zarz-decyzje-1 |
| owe30-s-26 | zarzadzanie-osoba-4 | zarz-ludzie-1 |
| owe30-s-27 | zarz-podstawy-2, zarzadzanie-osoba-6, zarzadzanie-osoba-7, zarzadzanie-data-1 | zarz-podstawy-2-cz2 |
| owe30-s-29 | – (nie było w żadnej lekcji) | zarz-podstawy-2 |
| owe30-s-30 | – (nie było w żadnej lekcji) | zarz-ludzie-3 |
| owe31-c-02 | makro-rynekpracy-2 | makro-rynekpracy-1 |
| owe31-c-03 | – (nie było w żadnej lekcji) | zarz-ludzie-4 |
| owe31-c-04 | zarzadzanie-wzor-1 | mikro-elastycznosc-1 |
| owe31-c-05 | – (nie było w żadnej lekcji) | mikro-zawodnosci-2 |
| owe31-c-06 | makro-rynekpracy-3 | makro-rynekpracy-4 |
| owe31-c-07 | – (nie było w żadnej lekcji) | mikro-podstawy-1 |
| owe31-c-08 | pol-pieniezna-1, finanse-instytucja-6 | pol-pieniezna-5 |
| owe31-c-09 | mikro-struktury-2 | mikro-struktury-4 |
| owe31-c-12 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe31-c-14 | pol-pieniezna-4, finanse-instytucja-6 | fin-pieniadz-3-cz3 |
| owe31-c-15 | mikro-produkcja-6 | mikro-konsument-2 |
| owe31-c-17 | mikro-czynniki-2, makro-rynekpracy-3 | mikro-czynniki-2-cz2 |
| owe31-c-20 | – (nie było w żadnej lekcji) | pol-ue-3 |
| owe31-c-21 | makro-wzrost-3, makro-osoba-5 | makro-isldas-4 |
| owe31-c-22 | – (nie było w żadnej lekcji) | fin-zabezpieczenie-2 |
| owe31-c-25 | fin-podatki-2 | fin-publiczne-1 |
| owe31-c-27 | zarz-podstawy-2, zarzadzanie-osoba-2, zarzadzanie-osoba-7 | zarz-podstawy-2-cz3 |
| owe31-c-30 | zarzadzanie-wzor-1 | zarz-marketing-2 |
| owe31-o-01 | – (nie było w żadnej lekcji) | mikro-zawodnosci-1 |
| owe31-o-02 | firma-wzor-5 | fin-publiczne-3 |
| owe31-o-03 | – (nie było w żadnej lekcji) | makro-kursy-4 |
| owe31-o-04 | – (nie było w żadnej lekcji) | mikro-rynek-1 |
| owe31-o-05 | mikro-wzor-3, mikro-wzor-7 | mikro-struktury-1 |
| owe31-o-06 | pol-pieniezna-1, pol-transformacja-1 | makro-kursy-3 |
| owe31-o-08 | firma-prawo-2, firma-prawo-6 | firma-prawo-1-cz2 |
| owe31-o-09 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe31-o-10 | fin-banki-3 | pol-podstawy-4 |
| owe31-o-12 | makro-rynekpracy-1 | makro-rynekpracy-3 |
| owe31-o-14 | mikro-czynniki-3, mikro-wzor-6 | mikro-zawodnosci-3 |
| owe31-o-15 | – (nie było w żadnej lekcji) | makro-pkb-2 |
| owe31-o-16 | zarzadzanie-wzor-1 | firma-analiza-1 |
| owe31-o-19 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe31-o-22 | – (nie było w żadnej lekcji) | fin-publiczne-1 |
| owe31-o-23 | makro-inflacja-2 | makro-inflacja-2-cz2 |
| owe31-o-24 | makro-handel-5 | makro-handel-5-cz2 |
| owe31-o-25 | – (nie było w żadnej lekcji) | zarz-ludzie-2 |
| owe31-o-26 | zarz-ludzie-3, zarzadzanie-osoba-7 | zarz-decyzje-1 |
| owe31-o-29 | zarzadzanie-osoba-4 | zarz-ludzie-1 |
| owe31-s-01 | pol-pieniezna-1, fin-pieniadz-5 | pol-pieniezna-5 |
| owe31-s-02 | fin-podstawy-1, fin-banki-1 | fin-banki-1-cz2 |
| owe31-s-04 | – (nie było w żadnej lekcji) | fin-zabezpieczenie-1 |
| owe31-s-05 | fin-inwestycje-1, fin-inwestycje-3 | fin-inwestycje-4 |
| owe31-s-06 | – (nie było w żadnej lekcji) | makro-szkoly-1 |
| owe31-s-07 | mikro-wzor-2 | mikro-produkcja-2 |
| owe31-s-08 | mikro-elastycznosc-3 | mikro-behawioralna-1 |
| owe31-s-09 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe31-s-10 | mikro-rynek-1 | mikro-rynek-4 |
| owe31-s-11 | mikro-struktury-3, makro-instytucja-1, makro-instytucja-2, pol-ue-4 | mikro-struktury-3-cz2 |
| owe31-s-12 | mikro-struktury-1 | mikro-struktury-2 |
| owe31-s-13 | – (nie było w żadnej lekcji) | makro-szkoly-1 |
| owe31-s-15 | – (nie było w żadnej lekcji) | mikro-struktury-4 |
| owe31-s-17 | makro-osoba-2 | makro-cykl-1 |
| owe31-s-18 | – (nie było w żadnej lekcji) | makro-isldas-4 |
| owe31-s-19 | – (nie było w żadnej lekcji) | pol-pieniezna-5 |
| owe31-s-20 | makro-handel-4 | makro-kursy-2 |
| owe31-s-22 | – (nie było w żadnej lekcji) | firma-analiza-3 |
| owe31-s-23 | – (nie było w żadnej lekcji) | fin-pieniadz-4 |
| owe31-s-24 | – (nie było w żadnej lekcji) | fin-rynek-7 |
| owe31-s-26 | mikro-czynniki-2, zarzadzanie-osoba-7 | zarz-podstawy-2 |
| owe31-s-27 | mikro-konsument-3 | zarz-decyzje-1 |
| owe31-s-28 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe32-c-02 | pol-pieniezna-1, fin-pieniadz-5, finanse-instytucja-1 | fin-rynek-9 |
| owe32-c-03 | – (nie było w żadnej lekcji) | mikro-rynek-3 |
| owe32-c-04 | – (nie było w żadnej lekcji) | fin-rynek-7 |
| owe32-c-06 | mikro-rynek-3, mikro-struktury-1, fin-rynek-6 | mikro-struktury-2 |
| owe32-c-08 | makro-wzor-4 | makro-popyt-4 |
| owe32-c-09 | fin-inwestycje-7, finanse-data-3 | fin-rynek-3 |
| owe32-c-10 | fin-rynek-6 | fin-inwestycje-2 |
| owe32-c-11 | fin-rynek-2, fin-rynek-3 | fin-rynek-4 |
| owe32-c-12 | – (nie było w żadnej lekcji) | fin-inwestycje-1 |
| owe32-c-14 | – (nie było w żadnej lekcji) | mikro-elastycznosc-2 |
| owe32-c-15 | polityka-data-4 | pol-ue-3 |
| owe32-c-16 | fin-pieniadz-5 | fin-inwestycje-2 |
| owe32-c-17 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe32-c-18 | – (nie było w żadnej lekcji) | makro-kursy-2 |
| owe32-c-20 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe32-c-21 | mikro-wzor-7 | mikro-produkcja-4 |
| owe32-c-22 | finanse-instytucja-2, finanse-data-1 | fin-banki-4 |
| owe32-c-23 | – (nie było w żadnej lekcji) | makro-kursy-2-cz2 |
| owe32-c-24 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe32-c-25 | – (nie było w żadnej lekcji) | makro-pkb-1-cz2 |
| owe32-c-28 | – (nie było w żadnej lekcji) | zarz-marketing-2 |
| owe32-c-30 | – (nie było w żadnej lekcji) | zarz-ludzie-4 |
| owe32-o-01 | zarzadzanie-wzor-1 | zarz-decyzje-3 |
| owe32-o-02 | polityka-instytucja-1 | pol-pieniezna-5 |
| owe32-o-03 | mikro-struktury-5, mikro-osoba-5, makro-kursy-1 | makro-kursy-4 |
| owe32-o-04 | pol-pieniezna-2 | pol-pieniezna-5 |
| owe32-o-05 | fin-inwestycje-7 | fin-rynek-3 |
| owe32-o-08 | – (nie było w żadnej lekcji) | fin-rynek-4 |
| owe32-o-09 | – (nie było w żadnej lekcji) | mikro-rynek-1 |
| owe32-o-10 | – (nie było w żadnej lekcji) | mikro-struktury-2 |
| owe32-o-11 | mikro-rynek-4 | mikro-rynek-1-cz3 |
| owe32-o-13 | – (nie było w żadnej lekcji) | mikro-struktury-4 |
| owe32-o-14 | – (nie było w żadnej lekcji) | makro-handel-3 |
| owe32-o-15 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe32-o-16 | – (nie było w żadnej lekcji) | fin-pieniadz-3 |
| owe32-o-17 | makro-inflacja-2 | makro-inflacja-2-cz2 |
| owe32-o-18 | mikro-produkcja-3 | mikro-produkcja-5 |
| owe32-o-20 | – (nie było w żadnej lekcji) | makro-pkb-2 |
| owe32-o-21 | makro-kursy-1 | makro-kursy-4 |
| owe32-o-22 | fin-publiczne-3 | makro-kursy-5 |
| owe32-o-24 | – (nie było w żadnej lekcji) | makro-handel-3 |
| owe32-o-25 | – (nie było w żadnej lekcji) | fin-publiczne-1 |
| owe32-o-27 | – (nie było w żadnej lekcji) | zarz-decyzje-1 |
| owe32-o-30 | zarz-podstawy-2, zarzadzanie-osoba-3, zarzadzanie-data-1 | zarz-podstawy-2-cz3 |
| owe32-s-01 | finanse-osoba-3 | fin-publiczne-3-cz2 |
| owe32-s-03 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe32-s-04 | – (nie było w żadnej lekcji) | firma-prawo-3 |
| owe32-s-05 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe32-s-08 | – (nie było w żadnej lekcji) | mikro-rynek-1 |
| owe32-s-09 | – (nie było w żadnej lekcji) | mikro-struktury-6 |
| owe32-s-10 | – (nie było w żadnej lekcji) | makro-popyt-2-cz2 |
| owe32-s-14 | – (nie było w żadnej lekcji) | firma-rachunkowosc-1 |
| owe32-s-16 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe32-s-19 | – (nie było w żadnej lekcji) | makro-popyt-2 |
| owe32-s-21 | makro-rynekpracy-4, fin-pieniadz-5 | makro-inflacja-1 |
| owe32-s-23 | zarz-decyzje-4 | mikro-produkcja-2 |
| owe32-s-24 | fin-pieniadz-5, fin-banki-2 | fin-banki-1-cz2 |
| owe32-s-25 | – (nie było w żadnej lekcji) | makro-handel-1 |
| owe32-s-26 | zarz-strategia-3 | zarz-strategia-3-cz2 |
| owe32-s-27 | makro-popyt-5 | zarz-przedsiebiorczosc-1 |
| owe32-s-29 | – (nie było w żadnej lekcji) | zarz-przedsiebiorczosc-1 |
| owe32-s-30 | zarzadzanie-osoba-3 | zarz-ludzie-1 |
| owe33-o-01 | finanse-wzor-2 | fin-rynek-3 |
| owe33-o-03 | – (nie było w żadnej lekcji) | makro-rynekpracy-3 |
| owe33-o-04 | – (nie było w żadnej lekcji) | makro-handel-4 |
| owe33-o-06 | – (nie było w żadnej lekcji) | makro-wzrost-3 |
| owe33-o-08 | mikro-konsument-2 | mikro-konsument-1 |
| owe33-o-09 | mikro-wzor-3 | mikro-struktury-2 |
| owe33-o-10 | – (nie było w żadnej lekcji) | mikro-rynek-2 |
| owe33-o-11 | – (nie było w żadnej lekcji) | fin-rynek-2 |
| owe33-o-12 | – (nie było w żadnej lekcji) | makro-kursy-2-cz2 |
| owe33-o-14 | makro-osoba-5, fin-pieniadz-3 | fin-pieniadz-3-cz3 |
| owe33-o-16 | fin-kryzysy-2 | pol-pieniezna-5 |
| owe33-o-17 | firma-koszty-2, firma-wzor-1 | fin-rynek-3 |
| owe33-o-19 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe33-o-20 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe33-o-25 | – (nie było w żadnej lekcji) | mikro-elastycznosc-2 |
| owe33-o-26 | finanse-osoba-4 | zarz-ludzie-2 |
| owe33-o-27 | – (nie było w żadnej lekcji) | zarz-marketing-1 |
| owe33-o-28 | – (nie było w żadnej lekcji) | zarz-decyzje-1 |
| owe33-s-01 | mikro-konsument-3 | fin-pieniadz-3-cz2 |
| owe33-s-02 | – (nie było w żadnej lekcji) | finanse-przepis-2 |
| owe33-s-03 | – (nie było w żadnej lekcji) | mikro-produkcja-6 |
| owe33-s-04 | – (nie było w żadnej lekcji) | fin-pieniadz-3 |
| owe33-s-05 | – (nie było w żadnej lekcji) | fin-pieniadz-2 |
| owe33-s-06 | – (nie było w żadnej lekcji) | mikro-struktury-2 |
| owe33-s-07 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe33-s-08 | mikro-podstawy-1, firma-koszty-1 | mikro-podstawy-1-cz2 |
| owe33-s-09 | makro-inflacja-3 | mikro-produkcja-5 |
| owe33-s-11 | – (nie było w żadnej lekcji) | fin-rynek-1 |
| owe33-s-14 | – (nie było w żadnej lekcji) | mikro-zawodnosci-2 |
| owe33-s-15 | – (nie było w żadnej lekcji) | firma-rachunkowosc-3 |
| owe33-s-16 | – (nie było w żadnej lekcji) | makro-handel-1 |
| owe33-s-17 | – (nie było w żadnej lekcji) | makro-szkoly-2 |
| owe33-s-18 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe33-s-19 | makro-popyt-1 | makro-handel-4 |
| owe33-s-25 | firma-rachunkowosc-2 | firma-analiza-1 |
| owe33-s-26 | – (nie było w żadnej lekcji) | zarz-ludzie-1 |
| owe33-s-27 | zarz-podstawy-2, zarzadzanie-osoba-7 | zarz-podstawy-2-cz3 |
| owe33-s-28 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe33-s-29 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe33-s-30 | fin-rynek-9 | zarz-decyzje-1 |
| owe34-c-01 | – (nie było w żadnej lekcji) | fin-rynek-5 |
| owe34-c-05 | fin-pieniadz-5 | pol-pieniezna-3 |
| owe34-c-06 | – (nie było w żadnej lekcji) | makro-rynekpracy-3-cz2 |
| owe34-c-08 | mikro-produkcja-2 | mikro-struktury-1 |
| owe34-c-09 | fin-pieniadz-2, finanse-wzor-1 | fin-pieniadz-3 |
| owe34-c-10 | mikro-osoba-3, zarz-decyzje-5 | mikro-behawioralna-1-cz2 |
| owe34-c-11 | – (nie było w żadnej lekcji) | finanse-instytucja-1 |
| owe34-c-14 | – (nie było w żadnej lekcji) | makro-inflacja-2 |
| owe34-c-15 | – (nie było w żadnej lekcji) | fin-podatki-3-cz2 |
| owe34-c-18 | makro-handel-4, pol-fiskalna-1 | pol-fiskalna-2 |
| owe34-c-19 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe34-c-20 | – (nie było w żadnej lekcji) | makro-rynekpracy-3 |
| owe34-c-21 | mikro-konsument-3, fin-obligacje-2, fin-pieniadz-3 | fin-pieniadz-3-cz2 |
| owe34-c-23 | – (nie było w żadnej lekcji) | zarz-decyzje-4 |
| owe34-c-25 | makro-wzor-2 | makro-handel-4 |
| owe34-c-26 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe34-c-27 | – (nie było w żadnej lekcji) | zarz-decyzje-1 |
| owe34-o-01 | – (nie było w żadnej lekcji) | fin-rynek-1 |
| owe34-o-02 | firma-koszty-1 | firma-rachunkowosc-2 |
| owe34-o-03 | – (nie było w żadnej lekcji) | fin-banki-1 |
| owe34-o-04 | – (nie było w żadnej lekcji) | fin-inwestycje-3 |
| owe34-o-05 | – (nie było w żadnej lekcji) | fin-inwestycje-2 |
| owe34-o-06 | makro-rynekpracy-4 | makro-inflacja-1 |
| owe34-o-08 | – (nie było w żadnej lekcji) | pol-pieniezna-3 |
| owe34-o-09 | mikro-produkcja-4, mikro-wzor-3 | mikro-struktury-1 |
| owe34-o-10 | – (nie było w żadnej lekcji) | firma-rachunkowosc-4 |
| owe34-o-11 | – (nie było w żadnej lekcji) | makro-popyt-4 |
| owe34-o-13 | finanse-instytucja-1 | pol-pieniezna-5-cz2 |
| owe34-o-14 | mikro-zawodnosci-1, demo-migracje-2 | mikro-zawodnosci-1-cz2 |
| owe34-o-15 | mikro-struktury-3 | fin-banki-4 |
| owe34-o-17 | – (nie było w żadnej lekcji) | mikro-podstawy-6 |
| owe34-o-18 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe34-o-19 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe34-o-20 | mikro-czynniki-2, zarz-decyzje-4 | mikro-czynniki-1 |
| owe34-o-21 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe34-o-22 | – (nie było w żadnej lekcji) | mikro-rynek-1-cz2 |
| owe34-o-23 | – (nie było w żadnej lekcji) | makro-wzrost-1 |
| owe34-o-24 | mikro-podstawy-4 | pol-pieniezna-2 |
| owe34-o-26 | – (nie było w żadnej lekcji) | zarz-decyzje-1 |
| owe34-o-27 | – (nie było w żadnej lekcji) | zarz-otoczenie-1 |
| owe34-o-29 | zarz-podstawy-1 | zarz-podstawy-2 |
| owe34-o-30 | – (nie było w żadnej lekcji) | zarz-ludzie-2 |
| owe34-s-01 | makro-osoba-1, pol-podstawy-4 | pol-podstawy-2-cz2 |
| owe34-s-02 | polityka-data-4 | mikro-elastycznosc-2 |
| owe34-s-04 | – (nie było w żadnej lekcji) | makro-popyt-1 |
| owe34-s-05 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe34-s-07 | fin-banki-6, fin-rynek-1 | fin-inwestycje-1 |
| owe34-s-08 | mikro-osoba-2 | makro-rynekpracy-2-cz2 |
| owe34-s-09 | – (nie było w żadnej lekcji) | fin-pieniadz-2 |
| owe34-s-10 | mikro-wzor-3 | mikro-produkcja-4 |
| owe34-s-11 | – (nie było w żadnej lekcji) | mikro-elastycznosc-2 |
| owe34-s-12 | – (nie było w żadnej lekcji) | fin-podatki-1-cz2 |
| owe34-s-14 | – (nie było w żadnej lekcji) | mikro-podstawy-2 |
| owe34-s-15 | makro-osoba-5 | mikro-podstawy-2-cz2 |
| owe34-s-17 | – (nie było w żadnej lekcji) | makro-kursy-2 |
| owe34-s-18 | – (nie było w żadnej lekcji) | fin-rynek-1 |
| owe34-s-21 | mikro-struktury-3 | zarz-decyzje-3 |
| owe34-s-22 | – (nie było w żadnej lekcji) | makro-kursy-3 |
| owe34-s-25 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe34-s-27 | – (nie było w żadnej lekcji) | zarz-otoczenie-1 |
| owe35-c-01 | – (nie było w żadnej lekcji) | fin-pieniadz-3-cz4 |
| owe35-c-02 | mikro-elastycznosc-3 | mikro-behawioralna-1 |
| owe35-c-03 | mikro-wzor-3, firma-analiza-2 | mikro-struktury-1 |
| owe35-c-04 | – (nie było w żadnej lekcji) | mikro-rynek-3 |
| owe35-c-06 | – (nie było w żadnej lekcji) | makro-handel-4 |
| owe35-c-07 | – (nie było w żadnej lekcji) | finanse-instytucja-4 |
| owe35-c-09 | makro-popyt-3, makro-wzor-3 | makro-handel-4 |
| owe35-c-11 | – (nie było w żadnej lekcji) | fin-inwestycje-3 |
| owe35-c-13 | – (nie było w żadnej lekcji) | fin-inwestycje-2 |
| owe35-c-14 | – (nie było w żadnej lekcji) | mikro-struktury-4 |
| owe35-c-16 | – (nie było w żadnej lekcji) | makro-pkb-2 |
| owe35-c-17 | – (nie było w żadnej lekcji) | fin-rynek-3 |
| owe35-c-19 | finanse-osoba-1 | fin-inwestycje-3 |
| owe35-c-20 | firma-prawo-6 | fin-rynek-4 |
| owe35-c-21 | – (nie było w żadnej lekcji) | fin-obligacje-2 |
| owe35-c-22 | mikro-zawodnosci-3, mikro-data-1 | mikro-zawodnosci-3-cz2 |
| owe35-c-23 | firma-finansowanie-1 | fin-rynek-4 |
| owe35-c-24 | – (nie było w żadnej lekcji) | fin-publiczne-4 |
| owe35-c-25 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe35-c-26 | – (nie było w żadnej lekcji) | zarz-ludzie-1 |
| owe35-c-27 | fin-podstawy-2 | zarz-marketing-2 |
| owe35-c-30 | fin-podstawy-2, zarz-podstawy-2, zarzadzanie-data-1 | zarz-ludzie-2 |
| owe35-o-01 | pol-pieniezna-2, fin-banki-6 | pol-pieniezna-5 |
| owe35-o-02 | zarzadzanie-wzor-1 | zarz-decyzje-3 |
| owe35-o-03 | fin-inwestycje-7 | mikro-elastycznosc-1 |
| owe35-o-04 | – (nie było w żadnej lekcji) | fin-banki-1 |
| owe35-o-05 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe35-o-06 | fin-podatki-2 | fin-podatki-2-cz2 |
| owe35-o-08 | fin-rynek-5 | fin-rynek-8 |
| owe35-o-09 | – (nie było w żadnej lekcji) | makro-rynekpracy-2 |
| owe35-o-10 | – (nie było w żadnej lekcji) | mikro-struktury-2 |
| owe35-o-12 | finanse-osoba-3 | fin-rynek-8 |
| owe35-o-14 | – (nie było w żadnej lekcji) | makro-popyt-3 |
| owe35-o-15 | – (nie było w żadnej lekcji) | fin-rynek-2 |
| owe35-o-17 | fin-obligacje-2 | fin-rynek-2 |
| owe35-o-19 | fin-inwestycje-5, finanse-osoba-3 | fin-inwestycje-5-cz2 |
| owe35-o-21 | makro-osoba-6, makro-data-1 | makro-szkoly-1-cz2 |
| owe35-o-23 | – (nie było w żadnej lekcji) | mikro-rynek-1 |
| owe35-o-24 | mikro-konsument-3, mikro-wzor-6 | firma-rachunkowosc-3 |
| owe35-o-25 | – (nie było w żadnej lekcji) | makro-isldas-1 |
| owe35-o-28 | fin-podstawy-2 | zarz-podstawy-2 |
| owe35-o-29 | zarz-podstawy-2, zarzadzanie-osoba-3 | zarz-podstawy-2-cz3 |
| owe35-o-30 | zarz-podstawy-2 | zarz-decyzje-3 |
| owe35-s-01 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe35-s-02 | – (nie było w żadnej lekcji) | makro-pkb-1-cz2 |
| owe35-s-03 | mikro-produkcja-3, mikro-wzor-3 | mikro-struktury-2 |
| owe35-s-04 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe35-s-05 | – (nie było w żadnej lekcji) | mikro-struktury-6 |
| owe35-s-06 | – (nie było w żadnej lekcji) | makro-handel-4 |
| owe35-s-07 | – (nie było w żadnej lekcji) | makro-rynekpracy-2 |
| owe35-s-08 | mikro-podstawy-4 | makro-rynekpracy-1 |
| owe35-s-09 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe35-s-11 | – (nie było w żadnej lekcji) | makro-inflacja-2 |
| owe35-s-12 | mikro-struktury-1 | mikro-zawodnosci-5 |
| owe35-s-14 | polityka-instytucja-1, finanse-instytucja-1 | pol-pieniezna-5-cz2 |
| owe35-s-15 | – (nie było w żadnej lekcji) | firma-analiza-1 |
| owe35-s-16 | – (nie było w żadnej lekcji) | fin-publiczne-4 |
| owe35-s-17 | mikro-konsument-3, mikro-wzor-6 | firma-rachunkowosc-1-cz2 |
| owe35-s-18 | fin-rynek-2 | fin-rynek-3 |
| owe35-s-20 | makro-rynekpracy-4 | mikro-produkcja-1 |
| owe35-s-21 | mikro-elastycznosc-3 | mikro-elastycznosc-2 |
| owe35-s-22 | – (nie było w żadnej lekcji) | firma-rachunkowosc-2 |
| owe35-s-23 | – (nie było w żadnej lekcji) | makro-pkb-3 |
| owe35-s-24 | – (nie było w żadnej lekcji) | fin-rynek-5 |
| owe35-s-25 | finanse-osoba-3 | fin-inwestycje-4 |
| owe35-s-28 | – (nie było w żadnej lekcji) | zarz-decyzje-5 |
| owe35-s-29 | – (nie było w żadnej lekcji) | zarz-ludzie-1 |
| owe36-o-03 | mikro-zawodnosci-3, fin-podstawy-1, fin-banki-1 | fin-banki-1-cz2 |
| owe36-o-04 | pol-pieniezna-1, finanse-instytucja-1 | pol-pieniezna-5 |
| owe36-o-05 | – (nie było w żadnej lekcji) | mikro-elastycznosc-2 |
| owe36-o-07 | – (nie było w żadnej lekcji) | makro-handel-4 |
| owe36-o-08 | makro-wzrost-2 | makro-wzrost-3 |
| owe36-o-09 | – (nie było w żadnej lekcji) | makro-kursy-3 |
| owe36-o-10 | makro-rynekpracy-4 | mikro-konsument-3 |
| owe36-o-12 | mikro-czynniki-2, zarz-ludzie-6 | makro-inflacja-4 |
| owe36-o-14 | fin-podstawy-2 | makro-szkoly-2 |
| owe36-o-15 | – (nie było w żadnej lekcji) | makro-inflacja-1-cz3 |
| owe36-o-16 | – (nie było w żadnej lekcji) | fin-pieniadz-5 |
| owe36-o-17 | – (nie było w żadnej lekcji) | makro-handel-4 |
| owe36-o-18 | – (nie było w żadnej lekcji) | mikro-podstawy-2 |
| owe36-o-22 | – (nie było w żadnej lekcji) | mikro-zawodnosci-1 |
| owe36-o-24 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe36-o-27 | – (nie było w żadnej lekcji) | zarz-podstawy-3 |
| owe36-o-28 | – (nie było w żadnej lekcji) | zarz-podstawy-2-cz2 |
| owe36-o-30 | mikro-czynniki-2, zarz-decyzje-4 | mikro-czynniki-1 |
| owe36-s-01 | mikro-struktury-1 | mikro-struktury-1-cz2 |
| owe36-s-02 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe36-s-03 | firma-finansowanie-3 | fin-banki-8 |
| owe36-s-04 | makro-osoba-5 | mikro-elastycznosc-3 |
| owe36-s-05 | makro-osoba-2 | makro-cykl-1 |
| owe36-s-06 | – (nie było w żadnej lekcji) | makro-pkb-3 |
| owe36-s-07 | – (nie było w żadnej lekcji) | fin-rynek-1 |
| owe36-s-08 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe36-s-09 | fin-podatki-1 | fin-podatki-1-cz2 |
| owe36-s-11 | – (nie było w żadnej lekcji) | firma-analiza-1 |
| owe36-s-12 | – (nie było w żadnej lekcji) | makro-rynekpracy-2 |
| owe36-s-13 | firma-finansowanie-1 | fin-rynek-2 |
| owe36-s-14 | – (nie było w żadnej lekcji) | pol-pieniezna-5 |
| owe36-s-15 | makro-popyt-1 | makro-handel-4 |
| owe36-s-18 | – (nie było w żadnej lekcji) | makro-szkoly-1 |
| owe36-s-19 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe36-s-21 | fin-podstawy-1 | fin-publiczne-3 |
| owe36-s-22 | mikro-podstawy-4 | fin-banki-1 |
| owe36-s-23 | – (nie było w żadnej lekcji) | makro-isldas-2 |
| owe36-s-24 | – (nie było w żadnej lekcji) | makro-data-3 |
| owe36-s-25 | fin-publiczne-1 | fin-publiczne-3 |
| owe36-s-26 | – (nie było w żadnej lekcji) | mikro-produkcja-5 |
| owe36-s-28 | – (nie było w żadnej lekcji) | zarz-strategia-3 |
| owe36-s-29 | – (nie było w żadnej lekcji) | zarz-otoczenie-1 |
| owe37-c-01 | – (nie było w żadnej lekcji) | firma-wzor-4 |
| owe37-c-02 | – (nie było w żadnej lekcji) | makro-pkb-1 |
| owe37-c-03 | – (nie było w żadnej lekcji) | makro-szkoly-2 |
| owe37-c-04 | fin-obligacje-2 | fin-pieniadz-3 |
| owe37-c-06 | pol-pieniezna-2, fin-banki-6 | pol-pieniezna-3 |
| owe37-c-08 | fin-obligacje-2 | fin-obligacje-3 |
| owe37-c-10 | – (nie było w żadnej lekcji) | makro-szkoly-2 |
| owe37-c-11 | – (nie było w żadnej lekcji) | fin-banki-1 |
| owe37-c-12 | – (nie było w żadnej lekcji) | makro-inflacja-3 |
| owe37-c-17 | – (nie było w żadnej lekcji) | fin-pieniadz-3-cz3 |
| owe37-c-18 | mikro-podstawy-3 | mikro-behawioralna-1 |
| owe37-c-19 | mikro-struktury-1 | mikro-struktury-6 |
| owe37-c-21 | – (nie było w żadnej lekcji) | mikro-elastycznosc-3 |
| owe37-c-22 | mikro-struktury-1 | mikro-struktury-2 |
| owe37-c-24 | – (nie było w żadnej lekcji) | mikro-struktury-6 |
| owe37-c-25 | polityka-data-5 | fin-pieniadz-4 |
| owe37-o-01 | firma-rachunkowosc-1 | firma-rachunkowosc-2 |
| owe37-o-02 | makro-cykl-2 | makro-cykl-1 |
| owe37-o-03 | – (nie było w żadnej lekcji) | mikro-konsument-2 |
| owe37-o-04 | – (nie było w żadnej lekcji) | makro-handel-4 |
| owe37-o-05 | pol-fiskalna-3 | fin-publiczne-2-cz2 |
| owe37-o-06 | makro-kursy-6 | fin-banki-2 |
| owe37-o-07 | – (nie było w żadnej lekcji) | mikro-struktury-2 |
| owe37-o-08 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe37-o-09 | firma-koszty-2, firma-wzor-1 | fin-rynek-3 |
| owe37-o-11 | – (nie było w żadnej lekcji) | mikro-struktury-2 |
| owe37-o-13 | makro-inflacja-3 | makro-szkoly-1 |
| owe37-o-14 | makro-rynekpracy-2 | makro-inflacja-1-cz3 |
| owe37-o-15 | – (nie było w żadnej lekcji) | makro-popyt-1 |
| owe37-o-16 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe37-o-17 | – (nie było w żadnej lekcji) | mikro-konsument-1 |
| owe37-o-18 | mikro-struktury-2 | mikro-struktury-4 |
| owe37-o-19 | – (nie było w żadnej lekcji) | mikro-zawodnosci-2 |
| owe37-o-20 | – (nie było w żadnej lekcji) | fin-publiczne-4-cz2 |
| owe37-o-22 | – (nie było w żadnej lekcji) | mikro-struktury-3 |
| owe37-o-23 | fin-banki-6, fin-rynek-2 | fin-inwestycje-4 |
| owe37-o-25 | – (nie było w żadnej lekcji) | makro-pkb-1 |
| owe37-o-26 | mikro-struktury-6 | zarz-organizowanie-2 |
| owe37-o-27 | – (nie było w żadnej lekcji) | zarz-organizowanie-1 |
| owe37-o-28 | – (nie było w żadnej lekcji) | zarz-ludzie-5 |
| owe37-s-02 | firma-finansowanie-2, firma-wzor-2 | firma-analiza-1 |
| owe37-s-03 | – (nie było w żadnej lekcji) | makro-szkoly-1 |
| owe37-s-04 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe37-s-05 | – (nie było w żadnej lekcji) | makro-rynekpracy-1 |
| owe37-s-06 | – (nie było w żadnej lekcji) | mikro-elastycznosc-1 |
| owe37-s-07 | polityka-wzor-1 | pol-fiskalna-2 |
| owe37-s-08 | – (nie było w żadnej lekcji) | makro-cykl-1 |
| owe37-s-09 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe37-s-10 | – (nie było w żadnej lekcji) | fin-podatki-2 |
| owe37-s-11 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe37-s-12 | – (nie było w żadnej lekcji) | mikro-rynek-1-cz2 |
| owe37-s-13 | mikro-czynniki-2 | makro-inflacja-2 |
| owe37-s-14 | firma-rachunkowosc-2 | fin-rynek-7-cz2 |
| owe37-s-15 | – (nie było w żadnej lekcji) | firma-rachunkowosc-4 |
| owe37-s-16 | – (nie było w żadnej lekcji) | fin-obligacje-1 |
| owe37-s-17 | – (nie było w żadnej lekcji) | fin-publiczne-1 |
| owe37-s-18 | – (nie było w żadnej lekcji) | fin-rynek-7 |
| owe37-s-19 | mikro-struktury-1 | zarz-marketing-2-cz2 |
| owe37-s-20 | mikro-produkcja-3, mikro-produkcja-5, mikro-wzor-3 | mikro-struktury-1 |
| owe37-s-22 | mikro-czynniki-2 | mikro-czynniki-2-cz2 |
| owe37-s-23 | – (nie było w żadnej lekcji) | firma-finansowanie-2 |
| owe37-s-25 | makro-popyt-3, makro-wzor-2 | makro-kursy-2 |
| owe37-s-26 | polityka-data-5, zarz-otoczenie-2 | firma-prawo-3 |
| owe37-s-27 | – (nie było w żadnej lekcji) | zarz-strategia-1 |
| owe37-s-28 | – (nie było w żadnej lekcji) | zarz-ludzie-2 |
| owe37-s-29 | – (nie było w żadnej lekcji) | zarz-otoczenie-1 |
| owe37-s-30 | zarz-podstawy-2, zarzadzanie-osoba-3, zarzadzanie-data-1 | zarz-podstawy-2-cz3 |
| owe38-c-01 | finanse-osoba-3 | fin-rynek-9 |
| owe38-c-02 | – (nie było w żadnej lekcji) | makro-kursy-2 |
| owe38-c-03 | pol-pieniezna-2, polityka-data-3, polityka-przepis-1, fin-publiczne-5 | pol-pieniezna-5-cz3 |
| owe38-c-04 | pol-pieniezna-3 | fin-banki-1 |
| owe38-c-05 | makro-handel-2, pol-sektorowa-2, polityka-data-1 | pol-ue-3 |
| owe38-c-06 | – (nie było w żadnej lekcji) | fin-rynek-7 |
| owe38-c-07 | fin-publiczne-2, fin-publiczne-3 | fin-publiczne-3-cz2 |
| owe38-c-10 | makro-popyt-3, makro-wzor-3 | makro-handel-4 |
| owe38-c-11 | – (nie było w żadnej lekcji) | makro-rynekpracy-3 |
| owe38-c-13 | – (nie było w żadnej lekcji) | pol-ue-2 |
| owe38-c-14 | – (nie było w żadnej lekcji) | pol-ue-1-cz2 |
| owe38-c-15 | – (nie było w żadnej lekcji) | makro-handel-4 |
| owe38-c-16 | – (nie było w żadnej lekcji) | mikro-elastycznosc-2 |
| owe38-c-17 | polityka-data-5 | makro-kursy-4 |
| owe38-c-20 | fin-rynek-1, fin-rynek-2 | fin-rynek-3 |
| owe38-c-22 | – (nie było w żadnej lekcji) | mikro-konsument-2 |
| owe38-c-23 | – (nie było w żadnej lekcji) | mikro-behawioralna-1 |
| owe38-c-25 | mikro-podstawy-1 | mikro-produkcja-4 |
| owe38-c-26 | – (nie było w żadnej lekcji) | zarz-decyzje-2 |
| owe38-c-27 | zarz-podstawy-2 | zarz-podstawy-2-cz2 |
| owe38-c-29 | – (nie było w żadnej lekcji) | zarz-organizowanie-1 |
| owe38-o-01 | firma-przepis-3 | mikro-produkcja-1 |
| owe38-o-02 | pol-ue-1 | pol-ue-1-cz2 |
| owe38-o-03 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe38-o-04 | – (nie było w żadnej lekcji) | makro-handel-4 |
| owe38-o-07 | – (nie było w żadnej lekcji) | mikro-konsument-2 |
| owe38-o-08 | – (nie było w żadnej lekcji) | fin-rynek-2 |
| owe38-o-09 | – (nie było w żadnej lekcji) | pol-pieniezna-5-cz2 |
| owe38-o-12 | – (nie było w żadnej lekcji) | makro-inflacja-2 |
| owe38-o-14 | – (nie było w żadnej lekcji) | makro-cykl-1 |
| owe38-o-15 | – (nie było w żadnej lekcji) | pol-ue-3-cz2 |
| owe38-o-18 | – (nie było w żadnej lekcji) | pol-fiskalna-2 |
| owe38-o-19 | mikro-produkcja-4, mikro-struktury-7 | mikro-struktury-1 |
| owe38-o-21 | – (nie było w żadnej lekcji) | makro-szkoly-2 |
| owe38-o-22 | – (nie było w żadnej lekcji) | makro-popyt-4 |
| owe38-o-23 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe38-o-24 | fin-obligacje-1 | fin-obligacje-1-cz3 |
| owe38-o-25 | – (nie było w żadnej lekcji) | makro-pkb-2 |
| owe38-o-26 | fin-obligacje-2 | fin-rynek-2 |
| owe38-o-27 | mikro-struktury-6 | zarz-organizowanie-2 |
| owe38-o-28 | – (nie było w żadnej lekcji) | zarz-ludzie-5 |
| owe38-o-30 | zarz-ludzie-3, zarzadzanie-osoba-3 | zarz-ludzie-4 |
| owe38-s-03 | – (nie było w żadnej lekcji) | mikro-produkcja-6 |
| owe38-s-04 | mikro-produkcja-4 | mikro-struktury-1 |
| owe38-s-06 | firma-wzor-1 | fin-rynek-7 |
| owe38-s-07 | makro-kursy-1 | fin-publiczne-1 |
| owe38-s-09 | – (nie było w żadnej lekcji) | makro-rynekpracy-1 |
| owe38-s-10 | – (nie było w żadnej lekcji) | mikro-elastycznosc-2 |
| owe38-s-11 | makro-popyt-3, makro-wzor-2 | makro-kursy-2 |
| owe38-s-12 | – (nie było w żadnej lekcji) | makro-inflacja-2-cz2 |
| owe38-s-13 | – (nie było w żadnej lekcji) | pol-ue-1 |
| owe38-s-14 | – (nie było w żadnej lekcji) | makro-isldas-2 |
| owe38-s-16 | pol-pieniezna-1 | pol-pieniezna-1-cz2 |
| owe38-s-17 | makro-inflacja-3, makro-wzrost-2 | makro-inflacja-3-cz2 |
| owe38-s-18 | – (nie było w żadnej lekcji) | fin-inwestycje-2 |
| owe38-s-21 | – (nie było w żadnej lekcji) | finanse-instytucja-4 |
| owe38-s-23 | – (nie było w żadnej lekcji) | firma-analiza-1 |
| owe38-s-24 | – (nie było w żadnej lekcji) | firma-rachunkowosc-1-cz2 |
| owe38-s-25 | – (nie było w żadnej lekcji) | zarz-strategia-1 |
| owe38-s-26 | – (nie było w żadnej lekcji) | zarz-strategia-2-cz2 |
| owe38-s-28 | – (nie było w żadnej lekcji) | zarz-ludzie-4 |
| owe38-s-29 | – (nie było w żadnej lekcji) | zarz-ludzie-5 |
| owe38-s-30 | – (nie było w żadnej lekcji) | makro-pkb-1 |
| owe39-c-01 | – (nie było w żadnej lekcji) | makro-rynekpracy-4 |
| owe39-c-02 | – (nie było w żadnej lekcji) | mikro-behawioralna-1 |
| owe39-c-03 | – (nie było w żadnej lekcji) | makro-handel-1 |
| owe39-c-04 | mikro-produkcja-3 | mikro-produkcja-6 |
| owe39-c-05 | – (nie było w żadnej lekcji) | mikro-behawioralna-1 |
| owe39-c-06 | mikro-produkcja-4, mikro-struktury-1, mikro-struktury-2 | mikro-struktury-1-cz2 |
| owe39-c-07 | polityka-wzor-1 | pol-ue-2-cz4 |
| owe39-c-08 | makro-pkb-2 | fin-zabezpieczenie-2 |
| owe39-c-09 | – (nie było w żadnej lekcji) | makro-wzrost-4 |
| owe39-c-10 | – (nie było w żadnej lekcji) | makro-handel-2 |
| owe39-c-11 | mikro-produkcja-1 | mikro-struktury-1 |
| owe39-c-12 | – (nie było w żadnej lekcji) | mikro-konsument-2 |
| owe39-c-13 | pol-pieniezna-4, fin-obligacje-2 | fin-banki-1-cz3 |
| owe39-c-14 | – (nie było w żadnej lekcji) | makro-kursy-3 |
| owe39-c-15 | – (nie było w żadnej lekcji) | mikro-zawodnosci-1 |
| owe39-c-19 | – (nie było w żadnej lekcji) | mikro-rynek-5 |
| owe39-c-21 | – (nie było w żadnej lekcji) | fin-inwestycje-2 |
| owe39-c-23 | fin-obligacje-2 | fin-obligacje-1 |
| owe39-c-24 | – (nie było w żadnej lekcji) | makro-popyt-3 |
| owe39-c-25 | – (nie było w żadnej lekcji) | fin-banki-1-cz2 |
| owe39-c-26 | – (nie było w żadnej lekcji) | zarz-przedsiebiorczosc-1 |
| owe39-c-27 | – (nie było w żadnej lekcji) | zarz-otoczenie-1 |
| owe39-c-28 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe39-c-29 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe39-c-30 | – (nie było w żadnej lekcji) | zarz-strategia-1 |
| owe39-o-01 | fin-rynek-1, firma-rachunkowosc-5 | fin-rynek-8 |
| owe39-o-03 | polityka-przepis-1 | mikro-produkcja-1 |
| owe39-o-04 | – (nie było w żadnej lekcji) | makro-popyt-1 |
| owe39-o-06 | – (nie było w żadnej lekcji) | mikro-struktury-1 |
| owe39-o-08 | – (nie było w żadnej lekcji) | fin-publiczne-5 |
| owe39-o-11 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe39-o-12 | makro-handel-3 | fin-podatki-3-cz2 |
| owe39-o-13 | polityka-wzor-1 | pol-ue-2 |
| owe39-o-14 | – (nie było w żadnej lekcji) | makro-pkb-1 |
| owe39-o-15 | – (nie było w żadnej lekcji) | makro-kursy-3 |
| owe39-o-16 | mikro-struktury-5, fin-banki-2 | pol-pieniezna-5-cz2 |
| owe39-o-19 | mikro-rynek-4 | makro-handel-5 |
| owe39-o-20 | – (nie było w żadnej lekcji) | mikro-produkcja-1 |
| owe39-o-21 | pol-pieniezna-3 | fin-banki-1-cz2 |
| owe39-o-25 | mikro-podstawy-4 | fin-banki-1-cz2 |
| owe39-o-26 | makro-cykl-2, fin-obligacje-3, zarz-organizowanie-2 | fin-obligacje-3-cz2 |
| owe39-o-27 | – (nie było w żadnej lekcji) | zarz-strategia-2 |
| owe39-o-28 | – (nie było w żadnej lekcji) | zarz-decyzje-2 |
| owe39-o-30 | zarz-strategia-2, zarzadzanie-osoba-5 | zarz-strategia-2-cz2 |
| owe39-s-02 | – (nie było w żadnej lekcji) | fin-pieniadz-2 |
| owe39-s-04 | fin-publiczne-1 | fin-publiczne-3 |
| owe39-s-05 | mikro-struktury-6, mikro-struktury-7 | mikro-struktury-1 |
| owe39-s-06 | – (nie było w żadnej lekcji) | mikro-produkcja-3 |
| owe39-s-08 | – (nie było w żadnej lekcji) | fin-podatki-3 |
| owe39-s-09 | zarz-strategia-4 | mikro-elastycznosc-2 |
| owe39-s-10 | – (nie było w żadnej lekcji) | mikro-podstawy-1 |
| owe39-s-12 | – (nie było w żadnej lekcji) | makro-handel-4 |
| owe39-s-13 | – (nie było w żadnej lekcji) | makro-popyt-1 |
| owe39-s-14 | – (nie było w żadnej lekcji) | fin-pieniadz-4 |
| owe39-s-15 | – (nie było w żadnej lekcji) | makro-inflacja-1 |
| owe39-s-16 | – (nie było w żadnej lekcji) | makro-popyt-5 |
| owe39-s-19 | – (nie było w żadnej lekcji) | mikro-struktury-2 |
| owe39-s-21 | – (nie było w żadnej lekcji) | makro-kursy-2-cz2 |
| owe39-s-23 | – (nie było w żadnej lekcji) | fin-rynek-7-cz2 |
| owe39-s-24 | makro-szkoly-3 | makro-handel-3 |
| owe39-s-25 | polityka-data-4 | firma-rachunkowosc-1 |
| owe39-s-26 | – (nie było w żadnej lekcji) | zarz-decyzje-1 |
| owe39-s-30 | – (nie było w żadnej lekcji) | zarz-ludzie-1 |

## Nowe hasła dodane po przeglądzie pytań

- Popyt na pracę
- Podaż pieniądza (nominalna i realna)
- Polityka pieniężna – cele i instrumenty
- Kredyt wekslowy NBP
- Projekcja inflacji i PKB NBP
- Efekt Tanziego–Olivery
- Prawo Wagnera
- Przeciętna i krańcowa stopa podatkowa
- Chomikowanie pracy (labour hoarding)
- Efekt bazy i efekty drugiej rundy
- Krańcowa efektywność kapitału (Keynes)
- Twierdzenie Stolpera–Samuelsona
- Subsydia eksportowe
- Wskaźnik Sharpe’a
- Efekt stadny (zachowania stadne inwestorów)
- Pozycja walutowa
- Haircut (redukcja wartości)
- Rekomendacja S (KNF)
- Pożyczki społecznościowe (P2P)
- Minimum socjalne i minimum egzystencji
- Struktura płaska i smukła
- Kafeteryjny system wynagradzania
- Prakseologia (T. Kotarbiński)
- Rezerwa ogólna i rezerwy celowe budżetu państwa
- Podatek katastralny
- Koszty uzyskania przychodów
- Harmonizacja podatków w UE
- Konwersja długu
- Fundusz parasolowy
- Kwity depozytowe (ADR, GDR)
- Kredyt balonowy
- Terminy transakcji międzybankowych (O/N, T/N, S/N)
- Heurystyki i efekt ramowania
- Efekt sieciowy (zewnętrzności sieciowe)
- Wskaźnik Hoovera (indeks Robin Hooda)
- Różnice kursowe
- Dysonans poznawczy
- Masowa kastomizacja (indywidualizacja)
- Organizacja wirtualna i fraktalna
- Polityka personalna: model sita i model kapitału ludzkiego
- Czynności bankowe (sensu stricto i sensu largo)
- Bank inwestycyjny i bank uniwersalny
- Analiza ex ante i ex post
- Handel elektroniczny (e-commerce, m-commerce, B2B, B2C)
- Pozycjonowanie stron internetowych (SEO)
