# intro | W skrócie: dwa wzory menedżera

W zarządzaniu nie ma wielu wzorów, ale dwa przydają się szczególnie: ile towaru zamawiać naraz i ile wart jest klient. Pierwszy pozwala oszczędzić na magazynie, drugi – zdecydować, ile wydać na pozyskanie klienta.

## Zapasy

Zamawiając dużo naraz, płacisz mniej za transport i obsługę zamówień, ale więcej za magazyn. Zamawiając mało – odwrotnie. Gdzieś pośrodku jest wielkość optymalna: ekonomiczna wielkość zamówienia (EOQ).

## Klient

Klient to nie jednorazowa transakcja, ale strumień zysków przez lata. Wartość klienta (CLV) to suma tych zysków, sprowadzona do dzisiejszej wartości.

## Czego nauczysz się w tym dziale

- wzór Wilsona na EOQ i jego intuicja;
- jak policzyć prosty CLV.

> Zapamiętaj: EOQ = √(2·D·K / h).

# zarzadzanie-wzor-1 | EOQ i wartość klienta

## Raz w roku czy co tydzień?

Sklep papierniczy może zamówić papier raz na cały rok – zapłaci za jeden transport, ale zapełni magazyn. Może zamawiać co tydzień – magazyn będzie pusty, ale kurier przyjedzie 52 razy. Gdzie leży złoty środek?

**[[Zarządzanie zapasami|Zarządzanie zapasami]]** szuka równowagi między dwoma kosztami: kosztem złożenia zamówienia i kosztem utrzymania zapasu. Odpowiedź daje wzór Wilsona:

$ EOQ = √(2 · D · K / h)

gdzie D – roczny popyt (sztuki), K – koszt jednego zamówienia, h – roczny koszt utrzymania jednej sztuki w magazynie.

> Przykład: sklep sprzedaje rocznie 1600 opakowań papieru. Jedno zamówienie kosztuje 50 zł (transport, obsługa), magazynowanie opakowania – 4 zł rocznie. EOQ = √(2 · 1600 · 50 / 4) = √40 000 = 200 opakowań. Sklep składa 1600 / 200 = 8 zamówień rocznie.

Przy EOQ roczne koszty zamówień (8 · 50 = 400 zł) równają się kosztom magazynowania (średni zapas 100 · 4 = 400 zł). To nie przypadek – w optimum oba koszty są równe.

> Uwaga: jeśli koszt zamówienia rośnie, EOQ rośnie (zamawiamy rzadziej, więcej). Jeśli rośnie koszt magazynowania – EOQ maleje.

## Ile wart jest klient

**[[Wartość klienta (CLV), lejek sprzedażowy i doświadczenie klienta|CLV]]** w najprostszej postaci to suma zdyskontowanych zysków z klienta:

$ CLV = Σ zysk_t / (1 + r)^t

> Przykład: klient przynosi 100 zł zysku rocznie przez 3 lata, stopa dyskontowa 10%. CLV = 100/1,1 + 100/1,21 + 100/1,331 ≈ 90,91 + 82,64 + 75,13 ≈ 248,7 zł. Wydanie 100 zł na jego pozyskanie się opłaca.

> Uwaga: średni zapas przy EOQ to **połowa** zamówienia (Q/2), bo zapas spada od Q do zera.

> Zapamiętaj: CLV mówi, ile maksymalnie warto wydać na pozyskanie klienta.
