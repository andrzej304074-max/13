"""Wykrywanie pytań obliczeniowych (trzeba coś policzyć ze wzoru) – w statystykach liczą się jako „wzór”, nie „pojęcie”.

Reguła: w treści są dane liczbowe (co najmniej dwie liczby albo równanie/funkcja) i pytanie każe wyznaczyć wartość
(„ile wynosi”, „oblicz”, „o ile”, „wyniesie”…), albo odpowiedzi to głównie liczby, a treść podaje dane liczbowe.
Ręczne poprawki: CALC_YES / CALC_NO (id pytań)."""
import re

NUM = re.compile(r"(?<![\w.])[-−]?\d+(?:[  ]\d{3})*(?:[.,]\d+)?\s*(?:%|‰|zł|mln|mld|tys\.?|pkt|proc)?", re.I)
ASK = re.compile(r"\b(ile wynosi|ile wynios|ile wyniesie|ile b[ęe]dzie|ile jest|ile przedsi|ile jednostek|oblicz|wylicz|"
                 r"o ile|wynosi(?:[ćl]a|ł)?\b|wyniesie|wynosić będzie|jak[aiey]? (?:jest|będzie|wynosi)[^?]{0,40}(?:warto|wielko|stopa|cena|"
                 r"poziom|liczba|kwota|wskaźnik|elastyczno|mnożnik)|jaka będzie|jaki będzie|jak zmieni się|ile środków|ile zgromadzi)", re.I)
EQ = re.compile(r"[A-Za-zΔ]{1,4}\s*=\s*[-−]?\s*\d|\d\s*[-+−×*/]\s*\d|\bQ[dsDS]?\s*=|\bP\s*=|\bTC\s*=|\bC\s*=\s*\d", re.I)
# przejrzane ręcznie (przypadki graniczne: elastyczność z liczbą, równania krzywych, gry z wypłatami, kursy)
CALC_YES: set[str] = {
    "owe22-c-03",
    "owe22-s-28",
    "owe23-s-03",
    "owe23-s-13",
    "owe24-o-02",
    "owe25-c-02",
    "owe25-c-09",
    "owe26-c-19",
    "owe26-o-06",
    "owe26-s-11",
    "owe27-c-02",
    "owe27-c-09",
    "owe27-s-01",
    "owe28-c-03",
    "owe28-o-21",
    "owe28-o-23",
    "owe28-s-15",
    "owe30-s-09",
    "owe31-o-09",
    "owe31-s-10",
    "owe31-s-15",
    "owe32-c-24",
    "owe32-o-11",
    "owe33-s-03",
    "owe34-c-16",
    "owe34-c-25",
    "owe34-o-07",
    "owe34-o-17",
    "owe34-s-13",
    "owe34-s-14",
    "owe34-s-15",
    "owe34-s-22",
    "owe35-c-05",
    "owe35-s-03",
    "owe36-o-15",
    "owe37-c-21",
    "owe37-c-24",
    "owe37-o-21",
    "owe38-c-24",
    "owe38-s-03",
    "owe38-s-22",
    "owe39-c-11",
    "owe39-c-16",
    "owe39-c-18",
    "owe39-c-20",
    "owe39-o-05",
    "owe39-o-06",
    "owe39-o-18",
    "owe34-o-24",
    "owe35-o-16",
    "owe31-o-04",
    "owe36-o-30",
}
# liczby w odpowiedziach, ale to fakty (stawki, terminy) albo pojęcia
CALC_NO: set[str] = {"owe21-s-28", "owe28-s-21", "owe29-o-16", "owe33-o-07", "sl-M-00ae852719", "sl-M-4e5fcc8a5c",
           "sl-M-aab4e58b13", "sl-M-005759e8d6", "sl-M-ec88b85467", "sl-M-618afd97fc", "sl-M-176afe61dd"}


def numeric_option(o: str) -> bool:
    s = re.sub(r"[\s ]", "", o)
    return bool(re.fullmatch(r"[-−]?[\d.,]+(%|‰|zł|mln|mld|tys\.?|pkt|razy|lat|szt\.?|jednostek|j\.)?(zł|mln|mld)?", s, re.I)) or \
        bool(re.fullmatch(r"[-−]?[\d.,]+[\s ]*(%|zł|mln zł|mld zł|tys\. zł|jednostek|lat|roku|razy|osób|kg|szt\.)", o.strip(), re.I))


def is_calc(q: dict) -> bool:
    if q["id"] in CALC_YES:
        return True
    if q["id"] in CALC_NO:
        return False
    stem = q["question"]
    nums = [m for m in NUM.findall(stem) if re.search(r"\d", m) and not re.fullmatch(r"\s*(19|20)\d\d\s*", m)]
    num_opts = sum(numeric_option(o) for o in q["options"])
    data = len(nums) >= 2 or bool(EQ.search(stem))
    if num_opts >= 3 and data:
        return True
    if data and bool(ASK.search(stem)) and (num_opts >= 2 or bool(EQ.search(stem)) or len(nums) >= 3):
        return True
    # dane liczbowe w treści, a w odpowiedziach wyniki wplecione w zdania („firma wpłaci 110 zł…”)
    digit_opts = sum(bool(re.search(r"\d", o)) for o in q["options"])
    return data and digit_opts >= 3


# Pytanie obliczeniowe → hasło-wzór (tytuł hasła kursu). Reguły po słowach z treści i odpowiedzi; pasuje kilka – wszystkie.
FORMULA_RULES: list[tuple[str, str]] = [
    (r"elastyczno\w* (cenow\w* )?(popytu|podaży)|elastyczno\w* punktow|współczynnik\w* elastyczno|\|ed\||stałą elastyczno", "Elastyczność cenowa popytu – wzór"),
    (r"elastyczno\w* łukow|wielkoś\w* (popytu|podaży) (o \d|z \d)|(popytu|podaży) o \d+ ?%", "Elastyczność cenowa popytu – wzór"),
    (r"elastyczno\w* (dochodow|mieszan|krzyżow)|krzyw\w* engla", "Elastyczność dochodowa i mieszana – wzór"),
    (r"równowag\w* (rynkow|na rynku)|cen\w* (i ilość )?równowagi|krzyw\w* (popytu|podaży)[^.]{0,40}(równaniem|opisan|funkcj)|\b[pq][ds]? ?= ?[-−]?\s?\d|krzyw\w* podaży przyjmuje|cen\w* maksymaln|cen\w* minimaln", "Równowaga rynkowa – obliczanie"),
    (r"dotacj\w* (do|dla) (produkc|producent|każd|jednost|\d)|podat\w* (na|od) (producent|jednost|każd)|akcyz\w* (w wysokości|\d)", "Podatek na producentów – nowa równowaga"),
    (r"ponos\w* konsument|częś\w* podatku", "Podatek na producentów – nowa równowaga"),
    (r"rotacj|cykl\w* (zapasów|należności|zobowiązań|inkasa|konwersji)", "Zapasy i należności – wskaźniki szczegółowe"),
    (r"zadłużeni\w* ogóln|zobowiązani\w* (długo|krótko)|suma bilansow", "Struktura kapitału (pasywów) – wskaźniki"),
    (r"zysk\w* (ze sprzedaży|brutto|netto)|koszt\w* własn\w* sprzedaży", "Rentowność – wzory"),
    (r"saldo|bilans\w* płatnicz|rachun\w* (obrotów )?bieżąc|oszczędno\w* krajow", "PKB – metoda wydatkowa"),
    (r"funkcj\w* produkcji", "Produkt przeciętny i krańcowy, optimum czynników – wzory"),
    (r"faz\w* procesu|kolejnych etapach|etap\w*[^.]{0,60}cen|sprzedaje je przedsiębiorstwu", "Wartość dodana – sumowanie"),
    (r"nadwyżk\w* (konsument|producent)|gotowo\w* do zapłaty", "Nadwyżka konsumenta i producenta – wzór"),
    (r"utarg|przych[oó]d całkowit|\btr ?=", "Utarg i jego maksimum"),
    (r"\btc ?=|\bmc ?=|koszt\w* (krańcow|przeciętn|całkowit|stał|zmienn)|\bafc\b|\bavc\b|\batc\b", "Koszty – zależności"),
    (r"monopol|kartel", "Maksymalizacja zysku – monopol"),
    (r"zysk\w* ekonomiczn|koszt\w* (jawn|ukryt|alternatywn[^.]{0,30}właściciel)", "Zysk ekonomiczny – wzór"),
    (r"próg\w* rentowno|break.even|marż\w* (brutto )?(na )?pokrycia", "Próg rentowności – wzór"),
    (r"wydatk\w* (konsumpcyjn|rządow|państw)|metod\w* wydatkow|eksport\w* netto", "PKB – metoda wydatkowa"),
    (r"dochod\w* rozporządzaln|skłonno\w* do (oszczędzania|konsumpcji)|\bmp[cs]\b|\bap[cs]\b", "Dochód rozporządzalny i oszczędności"),
    (r"\bc ?= ?\d|autarki|model\w* mnożnikow|dochód równowagi|produkcj\w* równowagi", "Równowaga w modelu mnożnikowym"),
    (r"mnożnik\w* (wydatk|podatk|inwest|budżet|zrównoważ)|mnożnik(?! (kreacji|pieniężn|kapitałow))", "Mnożniki – zestawienie"),
    (r"inflacj|ceny wzrosły w kolejnych|wynagrodzeni\w* (nominaln|realn)|deflator|\bcpi\b|indeks\w* cen|koszyk|realn\w* pkb|nominaln\w* pkb", "Inflacja i indeksy cen"),
    (r"stop\w* (procentow\w* )?realn|realn\w* stop|fisher", "Stopa realna (Fisher)"),
    (r"równani\w* wymiany|prędkoś\w* obiegu|szybkoś\w* obiegu|ilość pieniądza w obiegu|\bmv ?=", "Równanie wymiany"),
    (r"agregat\w* m[0-3]|wartoś\w* agregatu", "Mnożnik kreacji pieniądza – wzór"),
    (r"mnożnik\w* (kreacji|pieniężn)|baz\w* monetarn|rezerw\w* obowiązkow|kreacj\w* pieniądza", "Mnożnik kreacji pieniądza – wzór"),
    (r"okun|luk\w* pkb", "Prawo Okuna – obliczanie"),
    (r"stop\w* bezrobocia|bezrobotn|aktywno\w* zawodow|wskaźnik\w* zatrudnienia", "Stopa bezrobocia i wskaźniki rynku pracy"),
    (r"taylor", "Reguła Taylora – wzór"),
    (r"reguł\w* 7[02]|podwoi", "Reguła 70 – wzór"),
    (r"lokat|kapitalizacj|odsetk|oprocentowan|wartoś\w* (bieżąc|przyszł|obecn)|dyskont|rent\w* (wieczyst|roczn)|annuit|kredyt\w* (na|w wysokości)|rat\w* (kredyt|stał|równ)|obligacj|wieczyst", "Wartość pieniądza w czasie – wzory"),
    (r"obligacj\w* zerokupon|rentowno\w* (do wykupu|obligacji)|\bytm\b", "YTM obligacji zerokuponowej"),
    (r"\bnpv\b|\birr\b|wartoś\w* bieżąc\w* netto|wewnętrzn\w* stop\w* zwrotu", "NPV i IRR – wzory"),
    (r"dywidend|\bp/?e\b|cen\w* do zysku|zysk\w* na akcję|\beps\b|stop\w* zwrotu|\bbet[aęy]\b|\bcapm\b|akcj\w* (spółki|kosztuj|kupi)|emisj\w* akcji|wartoś\w* (nominaln|emisyjn)|opcj\w* (put|call|kupna|sprzedaży)|p/bv|wartoś\w* księgow", "Wskaźniki giełdowe – wzory"),
    (r"\broe\b|\broa\b|\bros\b|rentowno\w* (sprzedaży|aktywów|kapitału)|du ?pont|mnożnik\w* kapitałow", "Rentowność – wzory"),
    (r"tarcz\w* podatkow", "Tarcza podatkowa – wzór"),
    (r"amortyzacj|odpis\w* amortyz", "Amortyzacja liniowa i degresywna – wzory"),
    (r"przewag\w* (komparatywn|względn|absolutn)|koszt\w* alternatywn|krzyw\w* możliwości produkcyjn|godzin\w* można wyprodukować|może (miesięcznie|w ciągu)", "Koszt alternatywny w handlu (przewaga komparatywna)"),
    (r"\bcł[aoe]\b|\bcłem\b|kontyngent", "Skutki cła w małym kraju – obliczanie"),
    (r"kurs\w* (realn|walutow|nominaln|spot|terminow)|eur/|usd/|/pln|parytet|big mac|aprecjac|deprecjac|osłabił|umocnił|\bppp\b", "Kurs realny i parytet siły nabywczej – wzory"),
    (r"gini|lorenz|kwintyl|decyl", "Współczynnik Giniego – wzór"),
    (r"\beoq\b|wilson|optymaln\w* wielko\w* zamówienia", "EOQ – wzór Wilsona"),
    (r"wartoś\w* dodan|zużyci\w* pośredni|produkcj\w* globaln", "Wartość dodana – sumowanie"),
    (r"pokryci\w* (obsługi )?długu|dług\w* netto|ebitda|pokryci\w* odsetek|obsług\w* zadłużenia", "Wskaźniki obsługi zadłużenia – wzory"),
    (r"kapitał\w* obrotow|płynno\w*|wskaźnik\w* (bieżąc|szybk)", "Kapitał obrotowy netto"),
    (r"dźwigni|\bdol\b|\bdfl\b|\bdtl\b", "Dźwignie DOL, DFL, DTL – wzory"),
    (r"okres\w* zwrotu|wskaźnik\w* rentowności \(?pi|\bpi\b\)", "Okres zwrotu i wskaźnik rentowności PI – wzory"),
    (r"altman|z-score", "Z-score Altmana – wzór"),
    (r"\bdcf\b|wartoś\w* rezydualn|\bwacc\b|średni\w* ważon\w* koszt", "Wycena DCF i wartość rezydualna – wzory"),
    (r"produkt\w* (krańcow|przeciętn)|wydajno\w* (krańcow|przeciętn)|krańcow\w* stop\w* technicznej|krańcow\w* produkt|izokwant|nakład\w* (pracy|kapitału)|zatrudni\w*[^.]{0,40}produkcj", "Produkt przeciętny i krańcowy, optimum czynników – wzory"),
    (r"strat\w* (społeczn|martw|dobrobytu)|deadweight|harberger", "Strata martwa (trójkąt Harbergera) – wzór"),
    (r"lerner", "Indeks Lernera i reguła odwrotnej elastyczności – wzór"),
    (r"herfindahl|\bhhi\b|\bcr\d", "Wskaźniki koncentracji CR i HHI – wzory"),
    (r"użyteczno|krzyw\w* obojętno|ograniczeni\w* budżetow|koszyk\w* dóbr|\bmrs\b|krańcow\w* stop\w* substytucji|dóbr\w* (a i b|x i y)|dochód konsumenta|wydaje cały dochód|lini\w* budżetu", "Równowaga konsumenta – wzory"),
    (r"rachun\w* wzrostu|solow|\btfp\b|łączn\w* produktywno", "Rachunek wzrostu – wzór"),
    (r"baumol|tobin", "Model Baumola–Tobina – wzór"),
    (r"kolejnych podstawie", "Metoda kolejnych podstawień – wzór"),
    (r"dynamik\w* (o )?(podstaw|łańcuch)|indeks\w* (dynamiki|łańcuchow|jednopodstaw)", "Indeksy dynamiki – wzory"),
    (r"rent\w* ekonomiczn|dochod\w* transferow", "Renta ekonomiczna i dochód transferowy – obliczanie"),
]


def formula_items(q: dict, by_title: dict[str, str]) -> list[str]:
    """Hasła-wzory pasujące do pytania obliczeniowego (id hasła; puste – brak reguły)."""
    text = (q["question"] + " " + " ".join(q["options"])).lower()
    return [by_title[t] for r, t in FORMULA_RULES if t in by_title and re.search(r, text)]
