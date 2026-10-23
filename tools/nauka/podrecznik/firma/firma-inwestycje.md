# intro | W skrócie: czy ta inwestycja się opłaci

Firma zastanawia się: kupić nową maszynę za milion złotych? Zbudować magazyn? Wejść na nowy rynek? Każda inwestycja to wydatek dziś w zamian za korzyści w przyszłości. Kłopot w tym, że złotówka za pięć lat nie jest warta tyle co dziś. Dlatego przyszłe wpływy trzeba zdyskontować – sprowadzić do wartości dzisiejszej.

## Metody

Najprostsza metoda to okres zwrotu: po ilu latach odzyskamy pieniądze? Ale ignoruje ona wartość pieniądza w czasie i to, co dzieje się później. Lepsze są metody dyskontowe: NPV (wartość bieżąca netto) i IRR (wewnętrzna stopa zwrotu).

## Po co to wszystko

Współczesne finanse mówią: celem firmy jest maksymalizacja jej wartości dla właścicieli, a nie samego bieżącego zysku. Firma tworzy wartość, gdy zarabia więcej niż koszt kapitału – to mierzy EVA.

## Ile warta jest cała firma

Można liczyć majątek, przyszłe przepływy (DCF) albo porównać firmę z podobnymi spółkami.

## Czego nauczysz się w tym dziale

- NPV, IRR, MIRR i okres zwrotu;
- cel finansowy przedsiębiorstwa i EVA;
- strukturę kapitału i twierdzenia Modiglianiego–Millera;
- model Gordona i metody wyceny przedsiębiorstwa.

> Zapamiętaj: NPV > 0 – inwestycja opłacalna; IRR > koszt kapitału – też.

# firma-inwestycje-1 | NPV, IRR i wartość firmy

## Dlaczego 100 zł dziś to więcej niż 100 zł za rok?

Bo dziś możesz je wpłacić na lokatę i za rok mieć więcej. Dlatego przyszłe pieniądze trzeba „przeliczyć” na dzisiejsze. **[[Wartość bieżąca netto (NPV)|NPV]]** to suma zdyskontowanych przepływów minus nakład:
::wykres npv | NPV maleje ze stopą dyskontową; projekt opłaca się, gdy NPV > 0 przy koszcie kapitału.

$ NPV = Σ CFₜ / (1 + r)ᵗ − I₀

> Przykład: maszyna kosztuje 100 000 zł, przez 3 lata daje po 40 000 zł, koszt kapitału 10%. PV = 40 000 / 1,1 + 40 000 / 1,21 + 40 000 / 1,331 ≈ 36 364 + 33 058 + 30 053 = 99 475 zł. NPV ≈ −525 zł – minimalnie nieopłacalna.

## Ile „procent” daje projekt

**[[Wewnętrzna stopa zwrotu (IRR) i MIRR|IRR]]** to stopa, przy której NPV = 0. Projekt się opłaca, gdy IRR przekracza koszt kapitału. W przykładzie powyżej IRR wynosi niecałe 10% (ok. 9,7%) – dlatego NPV jest lekko ujemne. **MIRR** zakłada, że przepływy reinwestuje się po koszcie kapitału, co jest bardziej realistyczne.

## Po ilu latach odzyskam pieniądze

**[[Okres zwrotu|Okres zwrotu]]** mówi, po ilu latach skumulowane wpływy pokryją nakład. W przykładzie: 100 000 / 40 000 = 2,5 roku. Metoda jest prosta, ale nie uwzględnia wartości pieniądza w czasie ani wpływów po okresie zwrotu.

## Zysk to nie wszystko

**[[Cel finansowy przedsiębiorstwa – maksymalizacja wartości|Celem finansowym]]** jest wzrost wartości firmy dla właścicieli, a nie sam zysk bieżący. Koncepcja interesariuszy uwzględnia też pracowników, klientów i społeczność.

**[[EVA (ekonomiczna wartość dodana)|EVA]]** mierzy, czy firma zarabia więcej, niż kosztuje jej kapitał:

$ EVA = NOPAT − WACC · kapitał zaangażowany

> Przykład: zysk operacyjny po podatku 1,2 mln zł, kapitał 10 mln zł, WACC 9%. EVA = 1,2 − 0,9 = 0,3 mln zł – firma tworzy wartość.

**[[Zysk księgowy|Zysk księgowy]]** może być dodatni, a EVA ujemna – gdy firma nie pokrywa kosztu kapitału.

> Uwaga: okres zwrotu 2,5 roku nie znaczy, że projekt się opłaca – w przykładzie NPV jest ujemne. Okres zwrotu nie dyskontuje.

> Zapamiętaj: NPV > 0 ⇔ IRR > koszt kapitału (dla typowych projektów).

## Na marginesie

Pojawiały się też: [[Koszty zmienne (VC)|koszty zmienne]], [[Q Tobina|q Tobina]] (wartość rynkowa firmy do kosztu odtworzenia majątku) i [[Wzrost gospodarczy|wzrost gospodarczy]].

# firma-inwestycje-2 | Struktura kapitału i wycena

## Dług czy akcje – czy to ma znaczenie?

Pizza nie staje się większa, gdy pokroisz ją na 8 kawałków zamiast 4. Tak mniej więcej brzmi słynne twierdzenie o **[[Struktura kapitału i teorie jej wyboru|strukturze kapitału]]**. **[[Modigliani Franco, Miller Merton|Modigliani i Miller]]** (1958) pokazali, że bez podatków struktura nie wpływa na wartość firmy. Z podatkami dług zwiększa wartość dzięki tarczy podatkowej, bo odsetki zmniejszają podatek (zob. **[[Stawki CIT|stawki CIT]]**).
::wykres wacc | Teoria kompromisu: umiarkowany dług obniża WACC, zbyt duży – podnosi.

Teoria kompromisu mówi: zadłużaj się, dopóki korzyści podatkowe przewyższają koszty ryzyka bankructwa. Teoria hierarchii: najpierw zysk zatrzymany, potem dług, na końcu emisja akcji.

## Ile warta jest akcja

**[[Model Gordona (wycena akcji)|Model Gordona]]** wycenia akcję jako strumień rosnących dywidend: P₀ = D₁ / (k − g).

> Przykład: dywidenda za rok 5 zł, k = 12%, g = 4%. P₀ = 5 / 0,08 = 62,50 zł.

## Narzędzia oceny projektów

**[[Ocena projektów inwestycyjnych – metody|Metody oceny]]** dzielą się na:
- **proste** – okres zwrotu, księgowa stopa zwrotu;
- **dyskontowe** – NPV, IRR, MIRR, wskaźnik rentowności PI = PV wpływów / nakład, zdyskontowany okres zwrotu.

Ryzyko bada się analizą wrażliwości (co, jeśli sprzedaż spadnie o 10%?) i scenariuszy.

## Ile warta jest firma

**[[Wycena przedsiębiorstwa – metody|Metody wyceny]]** to:
- **majątkowe** – wartość księgowa, odtworzeniowa, likwidacyjna;
- **dochodowe** – DCF: zdyskontowane przyszłe przepływy pieniężne;
- **porównawcze** – mnożniki rynkowe (P/E, EV/EBITDA) podobnych spółek;
- **mieszane**.

Przy wycenie trzeba pamiętać o **[[Inflacja|inflacji]]** – stopa dyskontowa i przepływy muszą być albo obie nominalne, albo obie realne. Firmy działające za granicą uwzględniają **[[Międzynarodowe aspekty finansów firmy|ryzyko walutowe, ryzyko kraju i ceny transferowe]]**.

> Uwaga: w modelu Gordona w liczniku jest dywidenda **przyszłego** roku (D₁), a wzór działa tylko, gdy k > g.

> Zapamiętaj: MM bez podatków – struktura nie ma znaczenia; z podatkami – dług zwiększa wartość (tarcza).

## Na marginesie

Pojawiała się też [[Hipoteza cyklu życia|hipoteza cyklu życia]] Modiglianiego.
