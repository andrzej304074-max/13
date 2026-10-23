# intro | W skrócie: kalkulator przedsiębiorcy

Prowadzenie firmy to ciągłe liczenie. Ile sprzedać, żeby wyjść na zero? Czy inwestycja się zwróci? Ile zamówić towaru naraz? Czy firmie grozi bankructwo? Ten dział zbiera wzory z finansów przedsiębiorstwa – od amortyzacji po Z-score Altmana.

## Grupy wzorów

- **koszty i wyniki** – amortyzacja, marża pokrycia, próg rentowności, wskaźnik poziomu kosztów;
- **wskaźniki** – rentowności, Du Pont, płynności gotówkowej, zadłużenia, struktury majątku i kapitału;
- **inwestycje i wycena** – NPV, IRR, PI, okres zwrotu, WACC, EVA, model Gordona, DCF;
- **zarządzanie** – EOQ, cykl konwersji gotówki, dźwignie;
- **analiza** – indeksy dynamiki, metoda kolejnych podstawień, Z-score.

## Dobre nawyki

- zapisz dane i jednostki, zanim zaczniesz liczyć;
- przy wskaźnikach zastanów się, co jest w liczniku, a co w mianowniku – i czy wynik ma sens;
- przy dyskontowaniu pilnuj, czy przepływy i stopa są w tych samych jednostkach (roczne, nominalne).

> Zapamiętaj: próg rentowności Q = FC / (P − AVC).

# firma-wzor-1 | Amortyzacja, rentowność i koszt kapitału

## Wzór to skrót myślenia

Każdy wzór w tym rozdziale odpowiada na jedno pytanie przedsiębiorcy: ile kosztuje zużycie maszyny, ile zarabia kapitał, ile kosztują pieniądze, czy inwestycja coś dodaje. Zanim podstawisz liczby, powiedz sobie to pytanie słowami.

## Amortyzacja

**[[Metody amortyzacji|Amortyzacja liniowa]]**: odpis roczny = wartość początkowa × stawka, albo (WP − wartość końcowa) / okres.

> Przykład: samochód za 80 000 zł, stawka 20%. Odpis = 16 000 zł rocznie przez 5 lat.

## Rentowność

**[[Wskaźniki rentowności (ROA, ROE, ROS)|Rentowność]]**: ROE = ROS × (przychody / aktywa) × (aktywa / kapitał własny).

> Przykład: ROS 4%, rotacja 1,5, mnożnik kapitałowy 3. ROE = 18%.

## Koszt kapitału

**[[Koszt kapitału własnego i obcego|Koszt kapitału obcego]]** = kd · (1 − T). **Własnego** – np. modelem Gordona: ke = D₁ / P₀ + g, albo stopa wolna od ryzyka + premia za ryzyko.

> Przykład: dywidenda 3 zł, cena 50 zł, wzrost 4%. ke = 6% + 4% = 10%.

**[[Średni ważony koszt kapitału (WACC)|WACC]]** = wE · kE + wD · kD · (1 − T).

> Przykład: wE = 0,5, kE = 12%, wD = 0,5, kD = 8%, T = 19%. WACC = 6 + 4 · 0,81 = 9,24%.

## NPV i EVA

**[[Wartość bieżąca netto (NPV)|NPV]]** = Σ CFₜ / (1 + r)ᵗ − I₀.

> Przykład: I₀ = 50 000 zł, wpływy 30 000 zł po roku i 30 000 zł po dwóch, r = 8%. NPV = 27 778 + 25 720 − 50 000 ≈ 3 498 zł.

**[[EVA (ekonomiczna wartość dodana)|EVA]]** = NOPAT − WACC · kapitał.

> Przykład: NOPAT 800 000 zł, kapitał 10 mln zł, WACC 9%. EVA = 800 000 − 900 000 = −100 000 zł – firma niszczy wartość, choć jest zyskowna.

> Uwaga: w koszcie kapitału obcego mnożymy przez (1 − T), bo odsetki obniżają podatek; w koszcie kapitału własnego – nie.

> Zapamiętaj: NPV > 0 i EVA > 0 – firma tworzy wartość; EVA < 0 – niszczy ją, nawet przy zysku księgowym.

# firma-wzor-2 | Gordon, cykle i marże

## Ile warta jest akcja, ile trwa obieg gotówki?

Te wzory łączą dwa światy: inwestora, który wycenia akcję z dywidend, i księgowego, który liczy, ile dni pieniądze są zamrożone w zapasach i należnościach.

## Model Gordona

**[[Model Gordona (wycena akcji)|P₀ = D₁ / (k − g)]]**.

> Przykład: D₁ = 2 zł, k = 9%, g = 3%. P₀ = 2 / 0,06 ≈ 33,33 zł.

## Cykl konwersji gotówki

**[[Cykl operacyjny i cykl konwersji gotówki|CKG]]** = rotacja zapasów + rotacja należności − rotacja zobowiązań (w dniach).

> Przykład: 35 + 45 − 40 = 40 dni.

## Złota reguła finansowania

**[[Złota reguła finansowania (bankowa)|Reguła bankowa]]**: majątek długoterminowy / kapitał długoterminowy ≤ 1.

> Przykład: aktywa trwałe 400, kapitał stały 500. 400 / 500 = 0,8 ≤ 1 – reguła spełniona.

## Du Pont

**[[Model Du Ponta (piramida wskaźników)|Du Pont]]**: ROE = ROS · (S / A) · (A / KW); ROA = ROS · (S / A).

> Przykład: ROS 6%, S/A = 1,2, A/KW = 2. ROA = 7,2%, ROE = 14,4%.

## Koszty

**[[Wskaźnik poziomu kosztów|Wskaźnik poziomu kosztów]]** = koszty / przychody · 100% (w polskich firmach zwykle około 95%).

**[[Marża pokrycia (marża brutto)|Marża pokrycia]]** = S − KZ; jednostkowa = p − kz; wskaźnik marży = MP / S.

> Przykład: przychody 500 000 zł, koszty zmienne 300 000 zł. MP = 200 000 zł, wskaźnik marży = 40%.

> Uwaga: w modelu Gordona mianownik to k − g; gdy g zbliża się do k, wynik rośnie bez ograniczeń – model przestaje mieć sens.

> Zapamiętaj: CKG = zapasy + należności − zobowiązania; reguła bankowa – majątek długoterminowy finansuj kapitałem długoterminowym.

# firma-wzor-3 | Gotówka, odsetki i opłacalność

## Ile sprzedać, żeby wyjść na zero?

To pierwsze pytanie każdego, kto otwiera firmę. Próg rentowności dzieli koszty stałe przez to, ile zostaje z każdej sprzedanej sztuki.

## Wydajność gotówkowa

**[[Wskaźniki wydajności gotówkowej (dynamiczna analiza płynności)|Wydajność gotówkowa sprzedaży]]** = przepływy operacyjne / przychody. Pokazuje, czy zysk zamienia się w gotówkę.

> Przykład: CF operacyjne 90 000 zł, przychody 1 200 000 zł. WGS = 7,5%.

## Odsetki

**[[Wskaźnik pokrycia odsetek (TIE)|TIE]]** = EBIT / odsetki.

## Próg rentowności

**[[Próg rentowności – wzór|Próg rentowności]]**:

$ Q = FC / (P − AVC)
$ wartościowo: FC / (1 − AVC / P)

> Przykład: FC = 60 000 zł, P = 40 zł, AVC = 25 zł. Q = 4 000 sztuk; wartościowo 60 000 / 0,375 = 160 000 zł.

## NPV i IRR

**[[NPV i IRR – wzory|IRR]]**: Σ CFₜ / (1 + IRR)ᵗ − I₀ = 0.

> Przykład: I₀ = 100 zł, jedyny wpływ 121 zł po 2 latach. 100 = 121 / (1 + IRR)² → IRR = 10%.

## Rentowność

**[[Rentowność – wzory|Wzory rentowności]]**: ROA = ZN / A; ROE = ZN / KW; ROS = ZN / S.

## Tarcza

**[[Tarcza podatkowa – wzór|Tarcza]]** = odsetki (lub amortyzacja) × stawka podatku.

> Przykład: odsetki 50 000 zł, CIT 9%. Tarcza = 4 500 zł.

> Uwaga: próg rentowności dzielimy przez **marżę jednostkową** (P − AVC), a nie przez cenę.

> Zapamiętaj: Q* = FC / (P − AVC); tarcza podatkowa = odsetki × stawka CIT.

# firma-wzor-4 | Amortyzacja, zapasy i dźwignie

## Maszyna traci wartość, magazyn kosztuje

Amortyzacja rozkłada koszt maszyny na lata, EOQ mówi, ile towaru zamawiać naraz, a dźwignie pokazują, jak bardzo zysk reaguje na zmianę sprzedaży.

## Amortyzacja degresywna

**[[Amortyzacja liniowa i degresywna – wzory|Degresywna]]**: A = WN · s · k (k ≤ 2), z przejściem na liniową, gdy odpis liniowy jest wyższy.

> Przykład: maszyna 100 000 zł, stawka 20%, k = 2. Rok 1: 100 000 · 0,4 = 40 000 zł. Rok 2: 60 000 · 0,4 = 24 000 zł. Rok 3: 36 000 · 0,4 = 14 400 zł – mniej niż liniowe 20 000 zł, więc od roku 3 przechodzimy na liniową (20 000 zł).

## Ile zamówić

**[[EOQ – wzór Wilsona|EOQ]]** – ekonomiczna wielkość zamówienia:

$ EOQ = √(2 · D · K / h)

D – roczne zapotrzebowanie, K – koszt jednego zamówienia, h – roczny koszt przechowania jednostki.

> Przykład: D = 1 000 szt., K = 50 zł, h = 4 zł. EOQ = √25 000 ≈ 158 szt. – około 6–7 zamówień rocznie.

## Obsługa długu

**[[Wskaźnik pokrycia długu nadwyżką finansową|Pokrycie długu nadwyżką finansową]]** = (zysk netto + amortyzacja) / (raty + odsetki).

> Przykład: zysk netto 120, amortyzacja 80, raty 100, odsetki 40. Wskaźnik = 200 / 140 ≈ 1,43.

## Kapitał obrotowy

**[[Kapitał obrotowy netto|KON]]** = kapitał stały − aktywa trwałe = aktywa obrotowe − zobowiązania krótkoterminowe.

## Dźwignie

**[[Dźwignie DOL, DFL, DTL – wzory|Stopnie dźwigni]]**:

$ DOL = (S − VC) / EBIT
$ DFL = EBIT / (EBIT − odsetki)
$ DTL = DOL · DFL

> Przykład: S = 1 000, VC = 600, FC = 200, EBIT = 200, odsetki 50. DOL = 2, DFL = 200 / 150 ≈ 1,33, DTL ≈ 2,67. Wzrost sprzedaży o 10% podniesie zysk netto o około 26,7%.

## Okres zwrotu i PI

**[[Okres zwrotu i wskaźnik rentowności PI – wzory|Okres zwrotu]]** = I₀ / roczny CF. **PI** = PV wpływów / I₀; PI > 1 ⇔ NPV > 0.

> Przykład: I₀ = 200 000 zł, PV wpływów = 230 000 zł. PI = 1,15 – projekt opłacalny.

> Uwaga: w amortyzacji degresywnej stawkę mnożymy przez współczynnik (np. 2), ale liczymy ją od **wartości netto**, a nie początkowej.

> Zapamiętaj: DOL = marża pokrycia / EBIT; DFL = EBIT / (EBIT − odsetki); DTL = DOL · DFL.

# firma-wzor-5 | Bankructwo, wycena i majątek

## Czy firmie grozi upadek i ile jest warta?

Z-score łączy pięć wskaźników w jedną ocenę ryzyka, a DCF wycenia firmę jako sumę przyszłych przepływów sprowadzonych do dziś.

## Z-score

**[[Z-score Altmana – wzór|Z-score Altmana]]** (1968, spółki przemysłowe):

$ Z = 1,2 · X₁ + 1,4 · X₂ + 3,3 · X₃ + 0,6 · X₄ + 1,0 · X₅

X₁ – kapitał obrotowy / aktywa; X₂ – zyski zatrzymane / aktywa; X₃ – EBIT / aktywa; X₄ – rynkowa wartość kapitału własnego / zobowiązania; X₅ – przychody / aktywa.

> Przykład: X₁ = 0,2, X₂ = 0,3, X₃ = 0,1, X₄ = 1,0, X₅ = 1,5. Z = 0,24 + 0,42 + 0,33 + 0,6 + 1,5 = 3,09 – według klasycznych progów Altmana (1,81 i 2,99) firma jest w strefie bezpiecznej.

## DCF

**[[Wycena DCF i wartość rezydualna – wzory|Wycena DCF]]**:

$ EV = Σ FCFₜ / (1 + WACC)ᵗ + TV / (1 + WACC)ⁿ
$ TV = FCFₙ₊₁ / (WACC − g)

> Przykład: FCF 100 przez 2 lata, potem rosną o 5% (FCF₃ = 105), WACC 10%. TV = 105 / 0,05 = 2 100. EV = 90,91 + 82,64 + 2 100 / 1,21 ≈ 1 909. Dług netto 500 → wartość kapitału własnego ≈ 1 409.

## Struktura majątku

**[[Struktura majątku (aktywów) – wskaźniki|Wskaźniki struktury majątku]]**: udział aktywów trwałych i obrotowych w aktywach, wskaźnik unieruchomienia = MT / MO.

## Środki trwałe

**[[Stan i odnowa środków trwałych – wskaźniki|Wskaźniki stanu środków trwałych]]**: umorzenia = umorzenie / wartość początkowa; odnowy = nowe środki trwałe / wartość początkowa.

> Przykład: wartość początkowa 1 mln zł, umorzenie 600 000 zł. Wskaźnik umorzenia = 60% – majątek jest mocno zużyty.

## Maszyny i czas

**[[Wykorzystanie maszyn i czasu pracy – wskaźniki|Wykorzystanie maszyn]]**: gotowości produkcyjnej, sprawności, zaangażowania, wykorzystania czasu, przestojów.

## Zapasy i należności

**[[Zapasy i należności – wskaźniki szczegółowe|Szczegółowe wskaźniki]]**: udział zapasów w aktywach obrotowych, rotacja zapasów, relacja dynamik należności i przychodów.

> Uwaga: w DCF wartość rezydualną (po okresie prognozy) też trzeba zdyskontować na dziś – częsty błąd to dodanie jej bez dyskontowania.

> Zapamiętaj: Z-score Altmana: im wyższy, tym bezpieczniej; DCF = suma zdyskontowanych FCF + zdyskontowana wartość rezydualna.

# firma-wzor-6 | Kapitał, analiza czynnikowa i dynamika

## Skąd ta zmiana?

Sprzedaż wzrosła – ale dzięki cenie czy ilości? Analiza czynnikowa rozkłada zmianę na przyczyny, a indeksy dynamiki pokazują jej tempo.

## Struktura kapitału

**[[Struktura kapitału (pasywów) – wskaźniki|Wskaźniki]]**: udział KW, udział KO, przekładnia kapitałowa = KO / KW, samofinansowania = KW / KO, efekt dźwigni = ROE − ROA.

> Przykład: KW 400, KO 600. Przekładnia = 1,5; samofinansowanie ≈ 0,67.

## Kolejne podstawienia

**[[Metoda kolejnych podstawień – wzór|Metoda kolejnych podstawień]]** dla y = a · b:

$ Δy(a) = a₁ · b₀ − a₀ · b₀
$ Δy(b) = a₁ · b₁ − a₁ · b₀

> Przykład: ilość z 100 do 120, cena z 10 do 11. Δ(ilość) = 1 200 − 1 000 = 200; Δ(cena) = 1 320 − 1 200 = 120; razem 320.

## Dynamika

**[[Indeksy dynamiki – wzory|Indeksy]]**:

$ jednopodstawowy: iₜ = yₜ / y₀ · 100
$ łańcuchowy: iₜ = yₜ / yₜ₋₁ · 100
$ średnie tempo: (yₙ / y₀)^(1/n) − 1

> Przykład: sprzedaż 100, 120, 150. Łańcuchowe: 120%, 125%. Jednopodstawowy dla roku 2: 150%. Średnie tempo = 1,5^0,5 − 1 ≈ 22,5% rocznie.

## Obsługa długu

**[[Wskaźniki obsługi zadłużenia – wzory|Wskaźniki obsługi zadłużenia]]**: TIE = EBIT / odsetki; DSCR = (zysk netto + amortyzacja + odsetki) / (raty + odsetki); dług netto / EBITDA.

> Przykład: dług netto 900, EBITDA 300. Dług netto / EBITDA = 3 – firma spłaciłaby dług z EBITDA w trzy lata.

> Uwaga: indeks **łańcuchowy** porównuje z poprzednim okresem, **jednopodstawowy** – zawsze z tym samym okresem bazowym.

> Zapamiętaj: metoda kolejnych podstawień: zmieniaj czynniki po kolei, w ustalonej kolejności.
