# intro | W skrócie: makroekonomia w liczbach

Na olimpiadzie nie wystarczy wiedzieć, co to jest mnożnik – trzeba umieć go policzyć. Ten dział zbiera wszystkie wzory z makroekonomii i pokazuje, jak ich używać. Dobra wiadomość: większość z nich wynika z kilku prostych tożsamości, więc gdy je zrozumiesz, nie musisz wkuwać reszty.

## Fundament: PKB

Wszystko zaczyna się od tożsamości:

$ Y = C + I + G + (X − M)

Produkcja kraju to suma wydatków: konsumpcji, inwestycji, zakupów rządu i eksportu netto. Z niej wynikają oszczędności, odpływy kapitału i równowaga w modelu mnożnikowym.

## Od PKB do dochodu rozporządzalnego

PKB to nie to samo co pieniądze w kieszeni rodzin. Dodajemy dochody z zagranicy (PNB), odejmujemy amortyzację (PNN), podatki pośrednie, a w końcu podatki bezpośrednie – i zostaje dochód rozporządzalny.

## Mnożniki

Gdy państwo wyda dodatkowe 100 zł, dochód wzrośnie o więcej, bo ktoś te pieniądze zarobi i wyda dalej. O ile więcej – zależy od krańcowej skłonności do konsumpcji, podatków i importu.

## Ceny, pieniądz, rynek pracy

Wzory na inflację, deflator, równanie wymiany, efekt Fishera, stopę bezrobocia i prawo Okuna pozwalają przeliczać wielkości nominalne na realne i łączyć produkcję z zatrudnieniem.

## Długi okres i świat

Reguła 70, rachunek wzrostu, kurs realny, parytet siły nabywczej, koszty alternatywne w handlu i skutki cła – to narzędzia do analizy wzrostu i gospodarki otwartej.

## Jak się uczyć wzorów

- zawsze sprawdzaj jednostki i znaki (mnożnik podatkowy jest ujemny!);
- przy procentach pamiętaj: punkt procentowy to nie procent;
- rozwiąż każdy wzór na prostych liczbach, zanim zaczniesz zadanie.

> Zapamiętaj: k = 1/(1 − MPC). Okun (w zadaniach OWE): luka PKB = −3 · (u − u*).

# makro-wzor-1 | Liczymy PKB i dochody

## Trzy metody

**[[Metody liczenia PKB|PKB można policzyć na trzy sposoby]]**, a wynik powinien być taki sam:
- **wydatkowa** – suma wydatków na dobra finalne: C + I + G + (X − M);
- **produkcyjna** – suma wartości dodanej we wszystkich firmach;
- **dochodowa** – suma dochodów czynników produkcji plus amortyzacja i podatki pośrednie netto.

## Od PKB do dochodu narodowego

**[[Produkt narodowy brutto (PNB, DNB)|PNB]]** (dziś: dochód narodowy brutto) to PKB plus saldo dochodów z zagranicy:

$ PNB = PKB + dochody rezydentów z zagranicy − dochody nierezydentów w kraju

**[[Produkt narodowy netto (PNN)|PNN]]** to PNB minus amortyzacja.

> Przykład: PKB = 1000, Polacy zarobili za granicą 30, a zagraniczne firmy wywiozły z Polski 80 zysków. PNB = 1000 + 30 − 80 = 950. Amortyzacja 120, więc PNN = 830.

## Dochód w kieszeni

**[[Dochód osobisty i dochód rozporządzalny|Dochód osobisty]]** to wszystkie dochody gospodarstw domowych, łącznie z transferami. Po odjęciu podatków bezpośrednich zostaje **dochód rozporządzalny** – dzielony na konsumpcję i oszczędności.

## Nominalny i realny

**[[PKB nominalny i realny|PKB nominalny]]** liczy się w cenach bieżących, realny – w cenach roku bazowego. Do przeliczenia służy **[[Deflator PKB|deflator]]**:

$ deflator = PKB nominalny / PKB realny × 100
$ PKB realny = PKB nominalny / deflator × 100

> Przykład: PKB nominalny = 3 300 mld zł, deflator = 110. PKB realny = 3 300 / 110 × 100 = 3 000 mld zł.

> Uwaga: deflator różni się od CPI – obejmuje wszystkie dobra w PKB (także inwestycyjne i rządowe), ale nie obejmuje importu.

> Zapamiętaj: PKB = C + I + G + (X − M); PNB = PKB + saldo dochodów pierwotnych z zagranicą; realny = nominalny / deflator.

# makro-wzor-2 | Konsumpcja, inwestycje, oszczędności

## Funkcja konsumpcji

Keynes zauważył, że ludzie wydają tym więcej, im więcej zarabiają – ale nie całą podwyżkę. **[[Funkcja konsumpcji (keynesowska)|Funkcja konsumpcji]]**:

$ C = Ca + c · YD

Ca to konsumpcja autonomiczna (wydajemy coś nawet przy zerowym dochodzie), c – krańcowa skłonność do konsumpcji.

## MPC i MPS

**[[Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS)|MPC]]** to część dodatkowego dochodu wydawana na konsumpcję, MPS – oszczędzana:

$ MPC = ΔC / ΔYD,  MPS = ΔS / ΔYD,  MPC + MPS = 1

> Przykład: dochód wzrósł o 1000 zł, konsumpcja o 800 zł. MPC = 0,8, MPS = 0,2.

## Inwestycje

**[[Inwestycje|Inwestycje brutto]]** obejmują też odtworzenie zużytych maszyn. Netto to tylko przyrost kapitału:

$ I netto = I brutto − amortyzacja

Czy firma powinna inwestować? James Tobin podpowiada **[[Q Tobina|wskaźnik q]]**:

$ q = wartość rynkowa firmy / koszt odtworzenia aktywów

Gdy q > 1, giełda wycenia firmę wyżej niż koszt jej majątku – opłaca się dokupić maszyny.

## Oszczędności i kapitał

**[[Oszczędności narodowe (prywatne i publiczne)|Oszczędności narodowe]]**:

$ S = Y − C − G
$ S prywatne = YD − C,  S publiczne = T − G

W gospodarce zamkniętej S = I. W otwartej nadwyżka oszczędności płynie za granicę jako **[[Odpływy kapitałowe netto (NCO)|odpływy kapitału netto]]**:

$ NCO = NX = S − I

> Przykład: S = 250, I = 200. NCO = NX = 50 – kraj ma nadwyżkę handlową i kupuje aktywa za granicą.

> Uwaga: MPC to zmiana konsumpcji przy **zmianie** dochodu (ΔC/ΔY), a przeciętna skłonność – C/Y. Nie są równe.

> Zapamiętaj: C = C₀ + c·Y; MPC + MPS = 1; S = Y − C.

# makro-wzor-3 | Mnożnik, popyt i bezrobocie

## Mnożnik

Rząd wydaje 100 mln zł na drogę. Robotnicy zarabiają i wydają 80% w sklepach, sklepikarze wydają 80% tego, i tak dalej. **[[Mnożnik (inwestycyjny, wydatkowy)|Mnożnik]]**:

$ k = 1 / (1 − MPC) = 1 / MPS

> Przykład: MPC = 0,8. k = 1 / 0,2 = 5. Wydatki 100 mln zł zwiększą dochód o 500 mln zł.

Z podatkiem proporcjonalnym t mnożnik maleje: k = 1 / [1 − MPC(1 − t)].

## Mnożnik podatkowy

**[[Mnożnik podatkowy|Mnożnik podatkowy]]** jest ujemny i mniejszy (co do wartości) niż wydatkowy, bo część obniżki podatków ludzie oszczędzają:

$ kT = −MPC / [1 − MPC(1 − t)]

> Przykład: MPC = 0,8, t = 0. kT = −0,8 / 0,2 = −4. Podwyżka podatków o 10 obniża dochód o 40.

## Zagregowany popyt

**[[Zagregowany popyt (AD)|Zagregowany popyt]]**: AD = C + I + G + NX. Krzywa AD opada, bo przy niższych cenach działają trzy efekty: majątkowy (Pigou), stopy procentowej (Keynes) i kursowy (Mundell–Fleming).

## Bezrobocie i Okun

**[[Stopa bezrobocia|Stopa bezrobocia]]**:

$ u = bezrobotni / (pracujący + bezrobotni) × 100%

**[[Prawo Okuna|Prawo Okuna]]** łączy bezrobocie z luką PKB. W zadaniach OWE przyjmuje się współczynnik 3: każdy punkt procentowy bezrobocia ponad naturalne to 3% luki PKB.

> Przykład: u = 8%, u* = 5%. Luka = −3 · (8 − 5) = −9% – PKB jest o 9% poniżej potencjalnego.

## Pieniądz

**[[Teoria ilościowa pieniądza (równanie wymiany Fishera)|Równanie wymiany]]**: M · V = P · Y. Przy stałych V i Y wzrost M podnosi proporcjonalnie P.

> Uwaga: mnożnik podatkowy ma znak **ujemny** i wartość −MPC/(1 − MPC) – obniżka podatków działa słabiej niż równy wzrost wydatków.

> Zapamiętaj: mnożnik = 1 / (1 − MPC); Okun: wzrost bezrobocia o 1 p.p. ponad naturalne ≈ 2–3% luki PKB.

# makro-wzor-4 | Stopy, podwojenie i gospodarka otwarta

## Efekt Fishera

**[[Efekt Fishera|Efekt Fishera]]**:

$ i ≈ r + πᵉ
$ dokładnie: 1 + i = (1 + r)(1 + πᵉ)

> Przykład: r = 2%, πᵉ = 5%. Przybliżenie: i ≈ 7%. Dokładnie: 1,02 · 1,05 = 1,071, więc i = 7,1%.

## Reguła 70

**[[Reguła 70|Reguła 70]]**: czas podwojenia ≈ 70 / tempo wzrostu w %. Przy 5% – około 14 lat.

## Import zmniejsza mnożnik

**[[Krańcowa skłonność do importu (MPI)|Krańcowa skłonność do importu]]**: MPI = ΔM / ΔY. Część dodatkowego dochodu „ucieka” za granicę, więc w gospodarce otwartej mnożnik jest mniejszy: k = 1 / [1 − c(1 − t) + m].

> Przykład: c = 0,8, t = 0,25, m = 0,1. 1 − 0,8 · 0,75 + 0,1 = 1 − 0,6 + 0,1 = 0,5. k = 2.

## Krzywa podaży Lucasa

**[[Krzywa podaży Lucasa (model wysp)|Krzywa podaży Lucasa]]**:

$ Y = Y* + α · (P − Pᵉ)

Produkcja przekracza potencjalną tylko wtedy, gdy ceny są wyższe, niż oczekiwano. Producent na swojej „wyspie” widzi wzrost ceny swojego produktu i myśli, że to wzrost ceny względnej – więc produkuje więcej.

## Odpływy i zastrzyki

**[[Model okrężnego obiegu w gospodarce otwartej z państwem|Model okrężnego obiegu]]**: w równowadze odpływy z obiegu równają się zastrzykom:

$ S + T + M = I + G + X

## Kwoty z różnych lat

**[[Przeliczanie kwot pieniężnych z różnych okresów|Przeliczanie kwot]]**: kwota w cenach roku T = kwota w roku t · (indeks cen T / indeks cen t).

> Przykład: 2 000 zł z roku, gdy indeks wynosił 80; dziś indeks wynosi 120. 2 000 · 120 / 80 = 3 000 zł w dzisiejszych cenach.

> Uwaga: w gospodarce otwartej mnożnik = 1 / (1 − MPC + MPI) – import „wycieka” i **zmniejsza** mnożnik.

> Zapamiętaj: Fisher: i ≈ r + π; reguła 70: lata podwojenia ≈ 70 / g(%).

# makro-wzor-5 | Wydajność, fundusze i podaż zagregowana

## Wydajność pracy

**[[Wydajność pracy (produkcyjność) i jej czynniki|Wydajność pracy]]** to produkcja na godzinę pracy: Y / L. Zależy od kapitału fizycznego na pracownika (K/L), kapitału ludzkiego (H/L), zasobów naturalnych (N/L) i technologii (A). **[[Makroekonomiczna funkcja produkcji (stałe przychody skali)|Funkcja produkcji]]** przy stałych przychodach skali pozwala to zapisać:

$ Y/L = A · F(1, K/L, H/L, N/L)

> Przykład: produkcja 600 jednostek, 200 godzin pracy. Wydajność = 3 jednostki na godzinę.

## Rynek funduszy pożyczkowych

**[[Rynek funduszy pożyczkowych|Rynek funduszy pożyczkowych]]**: podaż to oszczędności narodowe, popyt – inwestycje, cena – realna stopa procentowa. W gospodarce otwartej: S = I + NCO. **[[Tożsamości gospodarki otwartej: NX = NCO i S = I + NCO|Tożsamości]]** gwarantują, że NX = NCO.

## Dlaczego krótkookresowa podaż rośnie

**[[Teorie krótkookresowej podaży zagregowanej (lepkie płace, lepkie ceny, błędne postrzeganie)|Trzy teorie]]** wyjaśniają, dlaczego krótkookresowa krzywa AS jest rosnąca:
- **lepkie płace** – płace w umowach nie nadążają za cenami; gdy ceny rosną, praca realnie tanieje i firmy produkują więcej;
- **lepkie ceny** – część firm nie zmienia cen od razu (koszty menu);
- **błędne postrzeganie** – producenci mylą ogólny wzrost cen ze wzrostem cen względnych.

## Rachunek wzrostu

**[[Rachunek wzrostu i łączna produktywność czynników (reszta Solowa)|Reszta Solowa]]** to ta część wzrostu, której nie wyjaśnia przyrost kapitału i pracy:

$ g_A = g_Y − α · g_K − (1 − α) · g_L

> Przykład: g_Y = 4%, g_K = 5%, g_L = 1%, α = 0,3. g_A = 4 − 1,5 − 0,7 = 1,8%.

> Uwaga: w rachunku wzrostu wkład kapitału to α · (ΔK/K), a nie samo ΔK/K – udział kapitału α jest zwykle około 1/3.

> Zapamiętaj: wydajność = Y/L; S = I na rynku funduszy pożyczkowych; Solow: g_Y = g_A + α·g_K + (1 − α)·g_L.

# makro-wzor-6 | Pieniądz, kurs i równowaga

## Prędkość obiegu

**[[Prędkość obiegu pieniądza|Prędkość obiegu]]** = PKB nominalny / podaż pieniądza.

> Przykład: PKB nominalny 2 400, M = 800. V = 3.

## Big Mac i kurs realny

**[[Indeks Big Maca|Indeks Big Maca]]**: kurs PPP = cena w kraju / cena w USA. **[[Kurs nominalny i realny|Kurs realny]]**: e realny = e · P* / P.

> Przykład: Big Mac w Polsce 22 zł, w USA 5,50 dolara. Kurs PPP = 4. Gdy rynkowy kurs wynosi 3,80, złoty jest według tej miary przewartościowany o około 5%.

## PKB metodą wydatkową

**[[PKB – metoda wydatkowa|Metoda wydatkowa]]**: Y = C + I + G + (X − M).

> Przykład: C = 600, I = 200, G = 180, X = 300, M = 280. Y = 600 + 200 + 180 + 20 = 1 000.

## Dochód i oszczędności

**[[Dochód rozporządzalny i oszczędności|Dochód rozporządzalny]]**: YD = Y − T + Tr (Tr – transfery). Oszczędności prywatne = YD − C, publiczne = T − G, narodowe = Y − C − G.

## Równowaga w modelu mnożnikowym

**[[Równowaga w modelu mnożnikowym|Równowaga]]**: Y = C + I + G, gdzie C = Ca + c(Y − T). Po przekształceniu:

$ Y = (Ca − c · T + I + G) / (1 − c)

> Przykład: Ca = 100, c = 0,8, T = 200, I = 150, G = 210. Y = (100 − 160 + 150 + 210) / 0,2 = 300 / 0,2 = 1 500.

> Uwaga: kurs realny = kurs nominalny × ceny zagraniczne / ceny krajowe – przy notowaniu bezpośrednim jego wzrost oznacza **realne osłabienie** waluty krajowej.

> Zapamiętaj: V = PY / M; równowaga w modelu mnożnikowym: Y = C + I + G (+ NX).

# makro-wzor-7 | Ściąga ze wzorów

Ten rozdział zbiera najczęściej używane wzory w jednym miejscu.

## Mnożniki

**[[Mnożniki – zestawienie|Zestawienie mnożników]]**:
- wydatkowy: k = 1 / (1 − c);
- z podatkiem t: k = 1 / [1 − c(1 − t)];
- w gospodarce otwartej: k = 1 / [1 − c(1 − t) + m];
- podatkowy (podatek kwotowy): kT = −c / (1 − c);
- zrównoważonego budżetu (podatek kwotowy): 1 – wzrost G finansowany takim samym wzrostem T podnosi dochód o tyle samo.

## Ceny

**[[Inflacja i indeksy cen|Inflacja]]**: π = (P₁ − P₀) / P₀ · 100%. Zmiana realna ≈ nominalna − inflacja.

> Przykład: indeks cen z 200 do 210. π = 10 / 200 = 5%. Płaca wzrosła o 8%, więc realnie o około 3%.

## Pieniądz

**[[Równanie wymiany|Równanie wymiany]]**: M · V = P · Y.

## Rynek pracy

**[[Stopa bezrobocia i wskaźniki rynku pracy|Wskaźniki rynku pracy]]** (P – pracujący, B – bezrobotni):

$ u = B / (P + B)
$ wskaźnik aktywności = (P + B) / ludność 15+
$ wskaźnik zatrudnienia = P / ludność 15+

> Przykład: ludność 15+ = 1 000, pracujący 540, bezrobotni 60. u = 60 / 600 = 10%, aktywność = 60%, zatrudnienie = 54%.

**[[Prawo Okuna – obliczanie|Okun]]**: (Y − Y*) / Y* · 100% = −3 · (u − u*).

## Wzrost

**[[Reguła 70 – wzór|Reguła 70]]**: t ≈ 70 / g; dokładnie t = ln 2 / ln(1 + g).

> Przykład: g = 7%. Przybliżenie: 10 lat. Dokładnie: 0,693 / 0,0677 ≈ 10,2 roku.

> Uwaga: zanim podstawisz do wzoru, sprawdź, czy dane są **nominalne czy realne** i w jakim okresie (rok, kwartał).

# makro-wzor-8 | Handel, nierówności i wartość dodana

## Koszt alternatywny w handlu

**[[Koszt alternatywny w handlu (przewaga komparatywna)|Koszt alternatywny dobra X]]** = nakład na X / nakład na Y (wyrażony w jednostkach Y).

> Przykład: w Polsce 1 tona stali wymaga 4 godzin, 1 tona zboża – 2 godzin. Koszt stali = 4 / 2 = 2 tony zboża. W Czechach stal – 6 godzin, zboże – 2. Koszt stali = 3 tony zboża. Polska ma przewagę komparatywną w stali, Czechy – w zbożu.

## Skutki cła

**[[Skutki cła w małym kraju – obliczanie|Skutki cła]]** przy cenie światowej Pw i cle t:
- cena krajowa = Pw + t;
- wpływy budżetu = t · import po cle;
- efekt redystrybucyjny (zysk producentów) = t · (Qs₁ + Qs₂) / 2;
- strata = ½ · t · ΔQs + ½ · t · ΔQd.

> Przykład: t = 2, produkcja krajowa wzrasta z 40 do 50, popyt spada z 100 do 90. Import po cle = 40. Wpływy = 80. Zysk producentów = 2 · 45 = 90. Strata = ½ · 2 · 10 + ½ · 2 · 10 = 20.

## Kurs i PPP

**[[Kurs realny i parytet siły nabywczej – wzory|Wzory kursowe]]**: e realny = e · P* / P; z PPP wynika e = P / P*.

## Gini

**[[Współczynnik Giniego – wzór|Współczynnik Giniego]]**: G = A / (A + B), gdzie A to pole między linią równości a krzywą Lorenza, B – pole pod krzywą Lorenza.

> Przykład: A = 0,15, B = 0,35. G = 0,15 / 0,5 = 0,3.

## Wartość dodana

**[[Wartość dodana – sumowanie|Wartość dodana]]** = wartość produkcji − zużycie pośrednie. PKB = suma wartości dodanej (+ podatki od produktów − dotacje).

> Przykład: rolnik sprzedaje zboże za 100, młyn mąkę za 160, piekarnia chleb za 250. VA = 100 + 60 + 90 = 250 – tyle, ile wynosi wartość produktu finalnego.

## Rachunek wzrostu

**[[Rachunek wzrostu – wzór|Rachunek wzrostu]]**: g_Y = g_A + α · g_K + (1 − α) · g_L.

> Zapamiętaj: wartość dodana liczona po wszystkich etapach = wartość produktu finalnego. Dlatego PKB liczy tylko dobra finalne.
