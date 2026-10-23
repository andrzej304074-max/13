# intro | W skrócie: demografia w liczbach

Demografia to w dużej mierze proste rachunki: dodawanie, odejmowanie, dzielenie przez liczbę ludności i mnożenie przez 1000 albo 100. Trudność nie leży w działaniach, tylko w pytaniu: co przez co dzielimy? Kto to wie, rozwiąże każde zadanie z tego działu w minutę.

## Dwie grupy wzorów

Pierwsza grupa opisuje ruch ludności: dzietność, przyrost naturalny, saldo migracji, obciążenie demograficzne. Druga – skutki starzenia się: miary starości, emeryturę, warunek Aarona i dynamikę długu.

## Jak czytać wynik

Każdy wynik ma jednostkę i znaczenie. „−3‰” to trzy osoby mniej na każdy tysiąc mieszkańców w roku. „WO = 58” to 58 osób na utrzymaniu na każde 100 w wieku produkcyjnym. Zanim zapiszesz odpowiedź, powiedz ją sobie słowami.

## Czego nauczysz się w tym dziale

- obliczać TFR, przyrost naturalny i rzeczywisty, saldo migracji, WO;
- obliczać współczynnik i indeks starości, emeryturę z ZUS;
- stosować warunek Aarona i wzór na dynamikę długu.

> Zapamiętaj: współczynniki ruchu ludności podaje się na 1000 mieszkańców (‰), obciążenie – na 100 osób.

# demografia-wzor-1 | Ruch ludności w liczbach

## Ile dzieci na kobietę – w jednym wzorze

**[[Współczynnik dzietności (TFR)|TFR]]** to suma cząstkowych współczynników płodności. Gdy dane są w grupach pięcioletnich, mnożymy sumę przez 5, bo każda grupa obejmuje pięć lat życia:

$ TFR = 5 · Σ f₅ₓ

**[[Zastępowalność pokoleń|Zastępowalność]]** to TFR ≈ 2,1 albo NRR = 1. Współczynnik reprodukcji brutto liczy tylko dziewczynki, które stanowią ok. 48,6% urodzeń: GRR ≈ TFR · 0,486.

> Przykład: TFR = 1,4. GRR ≈ 1,4 · 0,486 ≈ 0,68 córki na kobietę – nawet bez uwzględnienia zgonów to daleko od 1.

> Uwaga: zapominanie o mnożeniu przez 5 to najczęstszy błąd. Suma współczynników z grup pięcioletnich nie jest jeszcze TFR.

## Przyrost: najpierw odejmij, potem podziel

**[[Współczynniki urodzeń, zgonów i przyrostu naturalnego|Współczynniki ruchu naturalnego]]** liczymy na 1000 mieszkańców:

$ PN‰ = (U − Z) / L · 1000

**[[Saldo migracji|Saldo migracji]]** liczymy tak samo – z przyjazdów i wyjazdów:

$ SM = I − E;  współczynnik = (I − E) / L · 1000

> Przykład: L = 50 000, U = 400, Z = 550, I = 300, E = 250. PN = −150, czyli −3‰. SM = +50, czyli +1‰. Przyrost rzeczywisty = −100 (−2‰).

## Obciążenie: ilu na utrzymaniu

**[[Współczynnik obciążenia demograficznego|Współczynnik obciążenia]]** porównuje osoby w wieku nieprodukcyjnym z osobami w wieku produkcyjnym:

$ WO = (L₀₋₁₄ + L₆₅₊) / L₁₅₋₆₄ · 100

> Przykład: 6 mln dzieci, 24 mln w wieku 15–64, 8 mln seniorów. WO = 14 / 24 · 100 ≈ 58,3. Obciążenie starszymi = 8 / 24 · 100 ≈ 33,3, wskaźnik wsparcia = 24 / 8 = 3.

> Zapamiętaj: w mianowniku WO jest grupa produkcyjna, a nie cała ludność.

# demografia-wzor-2 | Starzenie się, emerytury i dług

## Dwie miary starości – dwa różne mianowniki

**[[Starzenie się ludności i jego miary|Miary starzenia się]]** różnią się tym, z kim porównujemy seniorów:

$ współczynnik starości = L₆₅₊ / L · 100
$ indeks starości = L₆₅₊ / L₀₋₁₄ · 100

> Przykład: L = 38 mln, 65+ = 7,6 mln, 0–14 = 5,7 mln. Współczynnik starości = 20% (próg „starości” według ONZ – 7% – przekroczony prawie trzykrotnie). Indeks starości ≈ 133 – na 100 dzieci przypada 133 seniorów.

## Emerytura: kapitał dzielony na miesiące

**[[Obliczanie emerytury w polskim systemie|Emerytura z ZUS]]** to zgromadzony kapitał podzielony przez liczbę miesięcy, przez które statystycznie będziemy ją pobierać:

$ E = (składki + kapitał początkowy) / średnie dalsze trwanie życia (mies.)

> Przykład: 450 000 zł / 250 miesięcy = 1800 zł miesięcznie.

## Reprodukcja: liczymy matki przyszłych pokoleń

**[[Współczynnik reprodukcji brutto i netto|Współczynnik reprodukcji]]** liczy tylko córki – to one urodzą następne pokolenie:

$ GRR ≈ TFR · 0,486;  NRR = GRR skorygowany o zgony dziewcząt przed wiekiem matki

> Przykład: TFR = 1,2 → GRR ≈ 0,58. Nawet bez zgonów pokolenie córek byłoby o ok. 40% mniej liczne niż pokolenie matek.

## Aaron: porównaj dwie stopy zwrotu

**[[Warunek Aarona (paradoks Aarona–Samuelsona)|Warunek Aarona]]** mówi, kiedy system repartycyjny daje więcej niż kapitałowy:

$ PAYG korzystniejszy ⇔ n + g > r

> Przykład: n = 0,5%, g = 2,5%, r = 2%. 3% > 2% – w takich warunkach system repartycyjny daje więcej.

## Dług: wyścig odsetek ze wzrostem

**[[Dynamika długu publicznego (r − g) i pułapka zadłużenia|Dynamika długu]]** pokazuje, jak zmienia się relacja długu do PKB:

$ Δd ≈ (r − g) / (1 + g) · d − nadwyżka pierwotna

> Przykład: d = 80% PKB, r = 4%, g = 4%, nadwyżka pierwotna 1% PKB. Δd ≈ 0 − 1 = −1 p.p. – dług spada o 1 punkt procentowy PKB rocznie.

> Uwaga: współczynnik starości dzieli przez **całą ludność**, indeks starości – przez **liczbę dzieci**. Ten sam kraj ma więc np. 20% i 133.

> Zapamiętaj: dług maleje sam, gdy r < g albo gdy państwo ma nadwyżkę pierwotną.
