# -*- coding: utf-8 -*-
"""Ręczne korekty wykrywania pojęć w pytaniach (pojecia_pytan.py) – po przeglądzie pytań OWE XXI–XXXIX.

GLOBAL_DROP – rdzenie zbyt ogólne, by na ich podstawie uznać, że pytanie dotyczy hasła;
ITEM_DROP   – {tytuł hasła: [słowa kluczowe pomijane przy wykrywaniu]} (fałszywe trafienia);
ITEM_ADD    – {tytuł hasła: [wyrażenia regularne]} – dodatkowe formy wykrywające hasło;
NO_DETECT   – hasła, których nie wykrywa się automatycznie (tylko przez Q_FIX);
Q_FIX       – {id pytania: {"add": [...], "del": [...], "main": [...]}} – korekty pojedynczych pytań:
              „add” – pojęcia opisane w pytaniu bez nazwy (np. odpowiedź opisuje krzywą możliwości produkcyjnych).
"""
B = r"(?<![\wąćęłńóśźż])"  # początek słowa
E = r"(?![\wąćęłńóśźż])"   # koniec słowa

GLOBAL_DROP = set()

ITEM_DROP = {
    "Operacje bankowe czynne i bierne": ["czynn"],
    "Prawa konsumenta": ["konsument", "gwarancj"],
    "Teoria ilościowa pieniądza (równanie wymiany Fishera)": ["ilościow"],
    "Podatek od spadków i darowizn": ["spadk"],
    "Księgi rachunkowe i konta": ["księg"],
    "Ekonomia": ["ekonom"],
    "Myślenie krańcowe (decyzje na marginesie)": ["krańcow"],
    "Euro": ["euro"],
    "Bezrobocie rejestrowane i BAEL": ["rejestr", "rejestrowan"],
    "Produkt potencjalny i luka PKB (popytowa)": ["potencjaln"],
    "Zarządzanie zapasami": ["zapas"],
    "Kontrolowanie": ["kontrol"],
    "Pieniądz": ["pieniężn"],
    "Podejmowanie decyzji": ["decyzj"],
    "Organizacja": ["organizacj"],
    "Zarządzanie": ["zarządzani"],
    "Systemy motywacyjne i wynagrodzeń": ["wynagrodze", "premi"],
    "Ryzyko inwestycyjne": ["ryzyk"],
    "Fundusz inwestycyjny otwarty (FIO) i zamknięty (FIZ)": ["otwarty", "zamknięt"],
    "Czynniki kształtujące popyt (determinanty popytu)": ["determinant"],
    "Świadczenia społeczne w Polsce": ["świadczeni"],
    "Klauzula wyjścia (Pakt Stabilności i Wzrostu)": ["klauzul"],
    "Cykl koniunkturalny": ["faza"],
    "Zarządzanie jakością (TQM)": ["jakości"],
    "Podatek progresywny, proporcjonalny (liniowy) i regresywny": ["liniow"],
    "Formy monopolizacji (porozumienia i koncentracje)": ["konglomerat"],
    "Strategia": ["strategi"],
    "Elastyczność a utarg": ["elastyczno"],
    "Style kierowania: autokratyczny, demokratyczny, liberalny": ["autokratyczn", "autorytarn", "demokratyczn", "liberaln"],
    "Przewaga konkurencyjna i konkurencyjność": ["konkurencyjnoś"],
    "Umowy w kodeksie cywilnym": ["komis", "najm", "pożyczk", "zleceni"],
    "Prawo podaży": ["praw poda"],
    "Zbyt duży, by upaść (too big to fail)": ["zbyt duż"],
    "Bezrobocie sezonowe": ["sezonow"],
    "Emisja banknotów i monet w Polsce": ["monet"],
    "Komunikacja w organizacji": ["komunikacj"],
    "Sprawność, skuteczność i efektywność": ["skuteczn", "sprawnoś"],
    "Planowanie gospodarcze w gospodarce rynkowej": ["prognoz"],
    "Bilans": ["bilans"],
    "Próg zamknięcia (punkt zamknięcia)": ["zamknięcia"],
    "Trylemat (niemożliwa trójca) Mundella–Fleminga": ["niemożliw"],
    "Zamówienia publiczne": ["przetarg"],
}

ITEM_ADD = {
    "Prawo podaży": [B + r"praw\w* podaży"],
    "Zbyt duży, by upaść (too big to fail)": [B + r"zbyt du\w*,? by upaść"],
    "Bezrobocie sezonowe": [B + r"bezroboci\w* sezonow"],
    "Emisja banknotów i monet w Polsce": [B + r"monet(?:y|a|ę|ami)?" + E, B + r"emisj\w* (?:banknotów|pieniądza gotówkowego)"],
    "Komunikacja w organizacji": [B + r"komunikacj\w* (?:w organizacji|w przedsiębiorstwie|formaln|nieformaln|pionow|poziom)", B + r"proces\w* komunikacji"],
    "Sprawność, skuteczność i efektywność": [B + r"sprawnoś\w* (?:organizacji|działania)", B + r"skutecznoś\w* (?:organizacji|działania)"],
    "Planowanie gospodarcze w gospodarce rynkowej": [B + r"planowani\w* (?:gospodarcz|indykatywn|centraln)"],
    "Bilans": [B + r"bilans\w* (?:przedsiębiorstwa|spółki|firmy|banku)", B + r"w bilansie", B + r"sum\w* bilansow"],
    "Próg zamknięcia (punkt zamknięcia)": [B + r"(?:próg|progu|punkt\w*) zamknięcia", B + r"wstrzyma\w* produkcj"],
    "Podatek progresywny, proporcjonalny (liniowy) i regresywny": [B + r"podat\w* liniow", B + r"progresj\w* podatkow"],
    "Strategia": [B + r"strategi[aię] (?:przedsiębiorstwa|firmy|organizacji)", B + r"poziom\w* strategii"],
    "Elastyczność a utarg": [B + r"elastycznoś\w* a (?:utarg|przych)", B + r"utarg\w* całkowit\w*[^.]{0,40}elastycz"],
    "Style kierowania: autokratyczny, demokratyczny, liberalny": [B + r"styl\w* (?:kierowania|zarządzania|przywództwa)", B + r"(?:autokratyczn|demokratyczn|liberaln)\w* styl", B + r"laissez"],
    "Przewaga konkurencyjna i konkurencyjność": [B + r"konkurencyjnoś\w* (?:przedsiębiorstw|firm|gospodark|kraj|międzynarodow)"],
    "Bilans handlowy": [B + r"eksport\w* netto"],
    "Umowy w kodeksie cywilnym": [B + r"(?:najem|najmu|komis|komisu|dzierżaw\w*)" + E, B + r"umow\w* (?:zleceni|o dzieło|pożyczki|użyczeni)"],
    "Zarządzanie jakością (TQM)": [B + r"zarządzani\w* jakości", B + r"kompleksow\w* zarządzani\w* jakości"],
    "Upadłość i restrukturyzacja": [B + r"syndyk" + E, B + r"syndyka" + E, B + r"syndykiem" + E],
    "Fundusz inwestycyjny": [B + r"jednost\w* uczestnictwa"],
    "Dywidenda": [B + r"stop\w* dywidendy", B + r"dy" + E],
    "Klauzula wyjścia (Pakt Stabilności i Wzrostu)": [B + r"klauzul\w* wyjści"],
    "Ekonomia": [B + r"ekonomi[aię]" + E],
    "Bezrobocie rejestrowane i BAEL": [B + r"bezroboci\w* rejestrowan", B + r"bael" + E],
    "Euro": [B + r"euro" + E, B + r"strefie euro", B + r"strefy euro"],
    "Organizacja": [B + r"organizacj[aię] (?:jako|to)" + E],
    "Zarządzanie": [B + r"zarządzanie (?:to|jest)" + E, B + r"proces zarządzania"],
    "Podejmowanie decyzji": [B + r"podejmowani\w* decyzj", B + r"proces\w* decyzyjn"],
    "Kontrolowanie": [B + r"kontrolowani", B + r"kontrol\w* (?:wstępn|bieżąc|końcow|następcz)"],
    "Produkt potencjalny i luka PKB (popytowa)": [B + r"luk\w* pkb", B + r"produkt\w* potencjaln", B + r"pkb potencjaln"],
    "Agregaty pieniężne (NBP)": [B + r"m[0-3]" + E],
    "Konkurencja doskonała": [B + r"cenobior"],
    "Rachunek przepływów pieniężnych (cash flow)": [B + r"przepływ\w* środków pieniężn"],
    "Krajowy Depozyt Papierów Wartościowych (KDPW)": [B + r"krajow\w* depozyt\w* papierów"],
    "Ryzyko inwestycyjne": [B + r"ryzyk\w* inwestycyjn"],
    "Zarządzanie zapasami": [B + r"zarządzani\w* zapas"],
    "Systemy motywacyjne i wynagrodzeń": [B + r"system\w* (?:motywacyjn|wynagradzani|wynagrodzeń|premiow)"],
    "Świadczenia społeczne w Polsce": [B + r"świadczeni\w* (?:społeczn|rodzinn)"],
}

NO_DETECT = set()


def _q(add=(), dele=(), main=()):
    return {"add": list(add), "del": list(dele), "main": list(main)}


Q_FIX = {
    # ── XXI OWE, etap centralny ──
    "owe21-c-01": _q(add=["Prawo podaży", "Czynniki kształtujące podaż (determinanty podaży)", "Cło"]),
    "owe21-c-02": _q(add=["Nadwyżka (rynkowa)"]),
    "owe21-c-03": _q(dele=["Promocja (komunikacja marketingowa)"]),
    "owe21-c-04": _q(add=["Krzywa obojętności", "Linia ograniczenia budżetowego"]),
    "owe21-c-05": _q(add=["Krzywa możliwości produkcyjnych (granica możliwości produkcyjnych)", "Izokoszta"]),
    "owe21-c-06": _q(add=["Zysk księgowy", "Koszt alternatywny (koszt utraconych możliwości)"]),
    "owe21-c-07": _q(add=["Konkurencja doskonała"], dele=["Strategie konkurencji Portera"]),
    "owe21-c-08": _q(add=["Dobro Veblena (efekt Veblena)", "Bariery wejścia"]),
    "owe21-c-10": _q(add=["Zagregowany popyt (AD)"], dele=["Równowaga rynkowa"]),
    "owe21-c-15": _q(add=["Ludność aktywna zawodowo (zasób siły roboczej)"]),
    "owe21-c-16": _q(add=["Dewaluacja i rewaluacja"]),
    "owe21-c-19": _q(add=["Zasady rachunkowości"]),
    "owe21-c-26": _q(add=["Partnerzy handlowi Polski"]),
    "owe21-c-30": _q(dele=["Produkt potencjalny i luka PKB (popytowa)"]),
    # ── XXI OWE, etap okręgowy ──
    "owe21-o-01": _q(add=["Dobra komplementarne", "Prawo popytu"]),
    "owe21-o-02": _q(add=["Równowaga konsumenta"]),
    "owe21-o-06": _q(add=["Warunek maksymalizacji zysku", "Konkurencja doskonała"]),
    "owe21-o-07": _q(add=["Kartel", "Oligopol zmowy i oligopol niekooperacyjny"]),
    "owe21-o-11": _q(add=["Bezrobocie strukturalne", "Bezrobocie cykliczne (koniunkturalne, keynesowskie)"]),
    "owe21-o-12": _q(add=["Agregaty pieniężne (NBP)"]),
    "owe21-o-13": _q(add=["Dochód narodowy", "Współczynnik Giniego i krzywa Lorenza"], dele=["Zarządzanie jakością (TQM)"]),
    "owe21-o-21": _q(add=["Obligacje skarbowe (detaliczne i hurtowe)"]),
    "owe21-o-24": _q(add=["Kontrakt terminowy (futures i forward)"]),
    "owe21-o-28": _q(add=["Offshoring, outsourcing, nearshoring, reshoring"], dele=["Organizowanie i struktura organizacyjna"]),
    "owe21-o-29": _q(add=["Pięć sił Portera"]),
    # ── XXI OWE, etap szkolny ──
    "owe21-s-01": _q(add=["Koszty stałe (FC)"]),
    "owe21-s-05": _q(add=["Wielkość popytu a popyt", "Czynniki kształtujące popyt (determinanty popytu)"]),
    "owe21-s-07": _q(add=["Elastyczność mieszana (krzyżowa) popytu"]),
    "owe21-s-11": _q(add=["Dochód osobisty i dochód rozporządzalny"]),
    "owe21-s-17": _q(dele=["Strategia", "Przewaga konkurencyjna i konkurencyjność"]),
    "owe21-s-19": _q(add=["OECD"]),
    "owe21-s-26": _q(add=["Jednostka budżetowa i zakład budżetowy"], dele=["Kontrola budżetowa"]),
    "owe21-s-27": _q(add=["Podatek od towarów i usług (VAT)"]),
    "owe21-s-29": _q(add=["Podatki bezpośrednie i pośrednie"]),
    "owe21-s-31": _q(add=["Style kierowania: autokratyczny, demokratyczny, liberalny"]),
    "owe21-s-32": _q(dele=["Krótki okres i długi okres"]),
    "owe21-s-34": _q(add=["Typy struktur organizacyjnych"], dele=["Grupy i zespoły"]),
    "owe21-s-35": _q(dele=["Skutki cła"]),
    # ── XXII OWE, etap centralny ──
    "owe22-c-01": _q(add=["Równowaga rynkowa"]),
    "owe22-c-02": _q(add=["Elastyczność cenowa podaży"]),
    "owe22-c-03": _q(add=["Dobro neutralne i dobro niechciane", "Substytuty"]),
    "owe22-c-04": _q(add=["Zbędna strata społeczna (strata martwa, deadweight loss)", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)"]),
    "owe22-c-08": _q(add=["Próg zamknięcia (punkt zamknięcia)"]),
    "owe22-c-10": _q(add=["Kurs walutowy"]),
    "owe22-c-14": _q(add=["Bilans płatniczy"]),
    "owe22-c-15": _q(add=["Efekt majątkowy (efekt Pigou, efekt realnych zasobów pieniężnych)", "Hipoteza dochodu względnego i efekt rygla"]),
    "owe22-c-17": _q(add=["Wynik finansowy – poziomy"]),
    "owe22-c-19": _q(add=["Opcja"]),
    "owe22-c-21": _q(add=["Kredyt konsumencki i odsetki maksymalne"]),
    "owe22-c-22": _q(dele=["Upadłość i restrukturyzacja"]),
    "owe22-c-27": _q(add=["Strategie wobec produktu w schyłku"]),
    "owe22-c-30": _q(add=["Urlop wypoczynkowy i czas pracy"]),
}


# ── pomocnicze do kolejnych porcji przeglądu (dopisywane poniżej, edycja po edycji) ──
def drop(title, *keys):
    ITEM_DROP.setdefault(title, []).extend(keys)


def rx(title, *pats):
    ITEM_ADD.setdefault(title, []).extend(pats)


def fix(qid, add=(), dele=(), main=()):
    Q_FIX[qid] = _q(add, dele, main)


# ── XXII OWE, etap okręgowy ──
drop("Mity reform emerytalnych", "automatyczn stabiliz")
fix("owe22-o-03", add=["Dumping", "Równowaga rynkowa"])
fix("owe22-o-04", add=["Ścieżka dochód–konsumpcja i krzywa Engla", "Elastyczność dochodowa popytu", "Dobro normalne"])
fix("owe22-o-05", add=["Elastyczność a utarg"])
fix("owe22-o-06", add=["Dobra publiczne"])
fix("owe22-o-07", add=["Konkurencja doskonała", "Popyt doskonale elastyczny / doskonale nieelastyczny"])
fix("owe22-o-09", add=["Produkt narodowy brutto (PNB, DNB)"])
fix("owe22-o-10", add=["Mnożnik (inwestycyjny, wydatkowy)", "Bilans handlowy"], dele=["Wskaźniki rentowności (ROA, ROE, ROS)"])
fix("owe22-o-11", add=["Model IS-LM", "Krzywa IS"], dele=["Stopa procentowa nominalna i realna"])
fix("owe22-o-13", add=["Deficyt strukturalny i cykliczny"],
    dele=["Bezrobocie strukturalne", "Bezrobocie cykliczne (koniunkturalne, keynesowskie)", "Szkoła klasyczna"])
fix("owe22-o-15", add=["Kurs walutowy"], dele=["Równowaga rynkowa"])
fix("owe22-o-18", add=["Aktywa i pasywa banku"])
fix("owe22-o-22", add=["Czek"], dele=["Weksel"])
fix("owe22-o-23", add=["Opcja"])
fix("owe22-o-27", add=["Przywództwo"])
fix("owe22-o-28", dele=["Wrogie przejęcie i metody obrony", "Dystrybucja"])


# ── XXII OWE, etap szkolny ──
drop("Bezrobocie cykliczne (koniunkturalne, keynesowskie)", "keynesowsk", "cykliczn", "koniunkturaln")
rx("Bezrobocie cykliczne (koniunkturalne, keynesowskie)", B + r"bezroboci\w* (?:cykliczn|koniunkturaln|keynesowsk)")
drop("Bezrobocie strukturalne", "strukturaln")
rx("Bezrobocie strukturalne", B + r"bezroboci\w* strukturaln")
drop("Popyt doskonale elastyczny / doskonale nieelastyczny", "jednostkow")
drop("Saldo obrotów bieżących", "rachunku bieżącego", "rachunek bieżący")
rx("Saldo obrotów bieżących", B + r"rachun\w* bieżąc\w* bilansu")
drop("Bezrobocie dobrowolne i przymusowe", "dobrowoln", "przymusow")
rx("Bezrobocie dobrowolne i przymusowe", B + r"bezroboci\w* (?:dobrowoln|przymusow)")
drop("Grupy i zespoły", "normowani")
rx("Grupy i zespoły", B + r"faz\w* normowania", B + r"normowani\w* (?:się )?(?:grupy|zespołu)")
drop("Piramida wieku", "piramid")
rx("Piramida wieku", B + r"piramid\w* (?:wieku|ludności|demograficzn)")
fix("owe22-s-11", add=["Inflacja"])
fix("owe22-s-14", add=["Naturalna stopa bezrobocia"])
fix("owe22-s-15", add=["Keynesizm", "Ekonomia podaży (supply-side economics)"])
fix("owe22-s-26", add=["Ubezpieczenia obowiązkowe w Polsce"])
fix("owe22-s-27", add=["WIBOR i WIBID", "Rynek międzybankowy"])
fix("owe22-s-33", add=["Typy struktur organizacyjnych"])


# ── XXIII OWE, etap centralny ──
drop("Deficyt budżetowy i deficyt sektora finansów publicznych", "deficyt")
rx("Deficyt budżetowy i deficyt sektora finansów publicznych", B + r"deficyt\w* (?:budżet|sektora finansów|finansów publicznych|publiczn|państwa|fiskaln)")
ITEM_ADD["Bilans"] = [B + r"bilans\w* (?:przedsiębiorstwa|spółki|firmy|banku)", B + r"w bilansie(?! płatnicz| handlow)",
                      B + r"sum\w* bilansow"]
drop("Kontrola czynszów", "czynsz")
rx("Kontrola czynszów", B + r"kontrol\w* czynsz", B + r"regulacj\w* czynsz", B + r"czynsz\w* regulowan")
drop("Dobra mieszane: klubowe i wspólne", "klubow")
rx("Dobra mieszane: klubowe i wspólne", B + r"dob(?:ro|ra|rem|er)\w* klubow")
drop("Zasady rachunkowości", "ostrożnoś")
rx("Zasady rachunkowości", B + r"zasad\w* ostrożnoś")
drop("Przymusowy wykup (squeeze-out) i odkup (sell-out)", "odkup")
drop("Kapitał jako czynnik produkcji i stopa zwrotu", "stop zwrotu", "stopa zwrotu", "stopy zwrotu")
rx("Klaster i park technologiczny", B + r"klastr", B + r"klastrów")
fix("owe23-c-02", add=["Nadwyżka (rynkowa)"])
fix("owe23-c-03", add=["Nadwyżka konsumenta"])
fix("owe23-c-05", add=["Podejmowanie decyzji"])
fix("owe23-c-06", add=["Konkurencja doskonała"])
fix("owe23-c-09", add=["Tożsamości gospodarki otwartej: NX = NCO i S = I + NCO"])
fix("owe23-c-10", add=["Mnożnik (inwestycyjny, wydatkowy)"])
fix("owe23-c-11", add=["Bilans handlowy"])
fix("owe23-c-13", add=["Krzywa Phillipsa", "Prawo Okuna"])
fix("owe23-c-15", add=["Model Mundella–Fleminga"])
fix("owe23-c-17", add=["IKE, IKZE i PPE"])
fix("owe23-c-19", add=["Progi ostrożnościowe i konstytucyjny limit długu"], dele=["Zasady rachunkowości"])
fix("owe23-c-20", add=["Kredyt konsumencki i odsetki maksymalne"])
fix("owe23-c-23", dele=["Kontrola czynszów"])
fix("owe23-c-26", add=["Segmentacja, targetowanie, pozycjonowanie (STP)"])
fix("owe23-c-27", add=["Franczyza (franchising)", "Faktoring", "Incoterms"])
fix("owe23-c-30", add=["Siatka kierownicza (Blake i Mouton)"], dele=["Grupy i zespoły"])


# ── XXIII OWE, etap okręgowy ──
drop("Percepcja i błędy percepcji", "projekcj")
rx("Percepcja i błędy percepcji", B + r"efekt\w* projekcji")
drop("Niezależność banku centralnego", "niezależn")
rx("Niezależność banku centralnego", B + r"niezależnoś\w* (?:banku|banków|nbp|ebc|fed|rpp)", B + r"niezależn\w* bank\w* centraln")
drop("Podatek dochodowy od osób fizycznych (PIT)", "osób fizycznych")
rx("Podatek dochodowy od osób fizycznych (PIT)", B + r"podat\w* dochodow\w* od osób fizycznych", B + r"pit" + E)
drop("Podatek dochodowy od osób prawnych (CIT)", "osób prawnych")
rx("Podatek dochodowy od osób prawnych (CIT)", B + r"podat\w* dochodow\w* od osób prawnych", B + r"cit" + E)
drop("Krajowa Administracja Skarbowa (KAS)", "kas")
drop("2017 – Krajowa Administracja Skarbowa i obniżenie wieku emerytalnego", "kas")
drop("Inflacja oczekiwana i nieoczekiwana", "nieoczekiwan")
rx("Inflacja oczekiwana i nieoczekiwana", B + r"inflacj\w* (?:oczekiwan|nieoczekiwan)", B + r"nieoczekiwan\w* inflacj")
drop("Polityka przemysłowa – horyzontalna i sektorowa", "horyzontaln")
rx("Teoria ilościowa pieniądza (równanie wymiany Fishera)", B + r"ilościow\w* teori\w* pieniądza", B + r"teori\w* ilościow")
fix("owe23-o-01", add=["Substytuty", "Dobra komplementarne"])
fix("owe23-o-02", add=["Czynniki kształtujące popyt (determinanty popytu)"])
fix("owe23-o-04", add=["Koszty zmienne (VC)"])
fix("owe23-o-05", add=["Izokoszta"])
fix("owe23-o-06", add=["Konkurencja doskonała"])
fix("owe23-o-08", add=["Cykle koniunkturalne – typy"])
fix("owe23-o-12", add=["Cykl koniunkturalny"])
fix("owe23-o-15", add=["Kurs walutowy", "Rynek walutowy (Forex)"])
fix("owe23-o-17", add=["Gwarancja depozytów BFG"])
fix("owe23-o-21", add=["Strategia bezpośredniego celu inflacyjnego (BCI)"], dele=["Planowanie scenariuszowe"])
fix("owe23-o-30", add=["Integracja pionowa i pozioma"], dele=["Wejście i wyjście z rynku w długim okresie"])


# ── XXIII OWE, etap szkolny ──
drop("Księgi rachunkowe i konta", "debet")
rx("Księgi rachunkowe i konta", B + r"księg\w* rachunkow", B + r"kont\w* księgow")
drop("Akcje uprzywilejowane", "uprzywilejowan")
rx("Akcje uprzywilejowane", B + r"akcj\w* uprzywilejowan", B + r"uprzywilejowan\w* akcj")
drop("Wskaźniki zadłużenia", "zadłużeni", "pokrycia")
rx("Wskaźniki zadłużenia", B + r"wskaźnik\w* (?:zadłużenia|ogólnego zadłużenia|pokrycia)", B + r"dźwigni\w* finansow")
drop("Zarządzanie projektami", "projekt")
rx("Zarządzanie projektami", B + r"zarządzani\w* projekt", B + r"kierowni\w* projektu")
drop("Kryteria konwergencji (z Maastricht)", "konwergencj", "maastricht")
rx("Kryteria konwergencji (z Maastricht)", B + r"kryteri\w* (?:konwergencji|z maastricht|nominaln)")
drop("Obligacje komunalne i przychodowe", "komunaln", "przychodow")
rx("Obligacje komunalne i przychodowe", B + r"obligacj\w* (?:komunaln|przychodow|samorząd)")
drop("Dystrybucja", "kanał", "hurtow", "detaliczn")
rx("Dystrybucja", B + r"kanał\w* dystrybucji", B + r"handl\w* (?:hurtow|detaliczn)", B + r"(?:hurtowni|detalist)")
fix("owe23-s-03", add=["Elastyczność a utarg"])
fix("owe23-s-05", add=["Operacje otwartego rynku (OOR)"])
fix("owe23-s-06", add=["Dobro normalne", "Substytuty"])
fix("owe23-s-07", add=["Produkcja (funkcja produkcji)"])
fix("owe23-s-09", add=["Produkt narodowy brutto (PNB, DNB)"])
fix("owe23-s-10", add=["Asymetria informacji", "Rzeczywista roczna stopa oprocentowania (RRSO)"], dele=["Akcje uprzywilejowane"])
fix("owe23-s-15", add=["Laissez-faire"])
fix("owe23-s-18", add=["Kryteria konwergencji (z Maastricht)"])
fix("owe23-s-19", add=["Obligacje komunalne i przychodowe"])
fix("owe23-s-23", add=["Pieniądz elektroniczny i karta płatnicza"], dele=["Księgi rachunkowe i konta"])
fix("owe23-s-24", add=["Podatki lokalne"])
fix("owe23-s-25", add=["Funkcje zarządzania"])
