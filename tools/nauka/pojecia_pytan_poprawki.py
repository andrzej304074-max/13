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
NO_TITLE = {"Dobro ekonomiczne", "Działy ubezpieczeń"}  # hasła, dla których nie tworzy się wzorca z tytułu


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


# ── XXIV OWE, etap centralny ──
drop("Transformacja systemowa i plan Balcerowicza", "transformacj")
rx("Transformacja systemowa i plan Balcerowicza", B + r"transformacj\w* (?:systemow|ustrojow|gospodarcz|polsk)")
drop("Deficyt pierwotny", "pierwotn")
rx("Deficyt pierwotny", B + r"(?:deficyt|saldo|nadwyżk)\w* pierwotn")
drop("Stan i odnowa środków trwałych – wskaźniki", "umorzeni")
rx("Stan i odnowa środków trwałych – wskaźniki", B + r"umorzeni\w* środków trwałych", B + r"stopień umorzenia")
drop("Saldo migracji", "napływ", "odpływ")
rx("Saldo migracji", B + r"(?:napływ|odpływ)\w* (?:ludności|migrant|imigrant|emigrant)")
drop("Formy marketingu współczesnego", "lokowani")
rx("Formy marketingu współczesnego", B + r"lokowani\w* produkt")
drop("Wskaźniki koncentracji rynku (CR, HHI)", "koncentracj")
rx("Wskaźniki koncentracji rynku (CR, HHI)", B + r"(?:wskaźnik|stopień|stopnia|poziom)\w* koncentracji", B + r"koncentracj\w* (?:rynku|branży|sprzedaży)", B + r"cr[0-9]" + E)
fix("owe24-c-07", add=["Zbędna strata społeczna (strata martwa, deadweight loss)"])
fix("owe24-c-08", add=["Wartość krańcowego produktu pracy (VMPL) i przychód z krańcowego produktu (MRPL)", "Konkurencja doskonała"])
fix("owe24-c-12", add=["Zagregowany popyt (AD)"])
fix("owe24-c-15", add=["Bilans płatniczy"])
fix("owe24-c-16", add=["Spółka cywilna"])
fix("owe24-c-19", add=["Elementy konstrukcji podatku"])
fix("owe24-c-27", add=["Narzędzia jakości"])
fix("owe24-c-28", dele=["Akcja"])
fix("owe24-c-29", add=["Cykl życia organizacji", "Organizacja mechanistyczna i organiczna"])


# ── XXIV OWE, etap okręgowy ──
drop("Start-up i inkubator", "akcelerator")
rx("Start-up i inkubator", B + r"akcelerator\w* (?:biznes|przedsiębiorcz|start)")
drop("Instytucjonalizm i nowa ekonomia instytucjonalna", "instytucjonal")
rx("Instytucjonalizm i nowa ekonomia instytucjonalna", B + r"instytucjonali[zś]", B + r"ekonomi\w* instytucjonaln")
drop("Wydatki sztywne i elastyczne", "sztywn")
rx("Wydatki sztywne i elastyczne", B + r"wydatk\w* sztywn")
drop("Demografia a inflacja i stopy procentowe", "japoni")
drop("Dobro ekonomiczne", "dobr ekonomicz")
rx("Dobro ekonomiczne", B + r"dob(?:ro|ra|rem|er|ru)\w{0,2} ekonomiczn")
drop("Analiza wskaźnikowa", "wskaźnik")
drop("Sprawozdanie z działalności (zarządu) i raportowanie niefinansowe", "niefinansow")
rx("Sprawozdanie z działalności (zarządu) i raportowanie niefinansowe", B + r"(?:raportowani|raport|sprawozda)\w* niefinansow")
rx("SKOK", B + r"kas\w* oszczędnościowo-kredytow")
fix("owe24-o-01", add=["Ekonomia normatywna"])
fix("owe24-o-02", add=["Elastyczność dochodowa popytu", "Dobro normalne"])
fix("owe24-o-05", add=["Konkurencja doskonała"])
fix("owe24-o-10", add=["Zagregowany popyt (AD)"])
fix("owe24-o-13", add=["Hiperinflacja"])
fix("owe24-o-14", add=["Akcelerator"])
fix("owe24-o-15", add=["Model Mundella–Fleminga"])
fix("owe24-o-26", add=["Urząd Ochrony Konkurencji i Konsumentów (UOKiK)", "Kartel"])
fix("owe24-o-27", add=["Wskaźniki rentowności (ROA, ROE, ROS)"])


# ── XXIV OWE, etap szkolny ──
drop("Przepisy dotyczące pracy cudzoziemców w Polsce", "cukr")
rx("Przepisy dotyczące pracy cudzoziemców w Polsce", B + r"cukr" + E)
drop("Rodzaje funduszy wg polityki", "zrównoważon")
rx("Rodzaje funduszy wg polityki", B + r"fundusz\w* (?:zrównoważon|stabilnego wzrostu|dłużn|mieszan)")
drop("Wskaźniki rentowności (ROA, ROE, ROS)", "rentownoś")
rx("Wskaźniki rentowności (ROA, ROE, ROS)", B + r"wskaźnik\w* rentowności", B + r"rentownoś\w* (?:sprzedaży|aktywów|kapitału|netto|brutto|operacyjn)")
ITEM_ADD["Bilans"] = [B + r"bilans\w* (?:przedsiębiorstwa|spółki|firmy|banku)", B + r"w bilansie(?! płatnicz| handlow| obrotów)",
                      B + r"sum\w* bilansow"]
fix("owe24-s-04", add=["Prawo malejących przychodów (malejącej produktywności krańcowej)"])
fix("owe24-s-13", add=["Rentowność do wykupu (YTM)"])
fix("owe24-s-14", add=["Aktywa trwałe i obrotowe"])
fix("owe24-s-21", add=["Giełda Papierów Wartościowych w Warszawie (GPW)"])
fix("owe24-s-25", add=["Naukowe zarządzanie (F.W. Taylor)"])
fix("owe24-s-27", add=["Zarządzanie wiedzą"])


# ── XXV OWE, etap centralny ──
drop("Ograniczenia PKB jako miary dobrobytu", "dobrobyt")
rx("Ograniczenia PKB jako miary dobrobytu", B + r"(?:miar|wskaźnik)\w* dobrobytu", B + r"dobrobyt\w* ekonomiczn\w* netto")
drop("Opóźnienia polityki gospodarczej", "opóźnieni")
rx("Opóźnienia polityki gospodarczej", B + r"opóźnieni\w* (?:polityki|decyzyjn|wewnętrzn|zewnętrzn|w działaniu|w oddziaływaniu)")
drop("Unia bankowa", "nadzorcz")
drop("Hedging", "zabezpiecz")
rx("Hedging", B + r"zabezpiecz\w* (?:się )?przed (?:ryzykiem|zmian)", B + r"transakcj\w* zabezpieczając")
drop("Technologie informacyjne w zarządzaniu", "chmur")
rx("Technologie informacyjne w zarządzaniu", B + r"chmur\w* obliczeniow", B + r"przetwarzani\w* w chmurze")
drop("Warunek maksymalizacji zysku", "maksymaliz")
rx("Warunek maksymalizacji zysku", B + r"maksymaliz\w* zysk", B + r"maksymaln\w* zysk", B + r"mr\s*=\s*mc")
fix("owe25-c-02", add=["Elastyczność dochodowa popytu"])
fix("owe25-c-03", add=["Kontrola czynszów", "Cena maksymalna"])
fix("owe25-c-04", add=["Równowaga konsumenta"])
fix("owe25-c-05", add=["Warunek maksymalizacji zysku"])
fix("owe25-c-06", add=["Wartość krańcowego produktu pracy (VMPL) i przychód z krańcowego produktu (MRPL)"])
fix("owe25-c-09", add=["Przewaga komparatywna (względna)", "Koszt alternatywny (koszt utraconych możliwości)"])
fix("owe25-c-13", add=["HICP"])
fix("owe25-c-15", add=["Kurs walutowy", "Rynek walutowy (Forex)"])
fix("owe25-c-17", dele=["Licencja i know-how"])
fix("owe25-c-18", add=["Skala podatkowa PIT"])
fix("owe25-c-22", add=["Wartość pieniądza w czasie"])
fix("owe25-c-26", dele=["Umowy w kodeksie cywilnym"])
fix("owe25-c-28", add=["Teoria cyklu życia (Hersey i Blanchard)"])
fix("owe25-c-30", add=["Systemy informatyczne zarządzania"])


# ── XXV OWE, etap okręgowy ──
drop("Fundusz hedgingowy", "hedgingow")
rx("Fundusz hedgingowy", B + r"fundusz\w* hedgingow")
rx("Hedging", B + r"(?:transakcj|strategi|operacj)\w* hedgingow")
rx("Zasoby organizacji: twarde i miękkie", B + r"(?:miękk|tward)\w* zas[oó]b")
fix("owe25-o-02", add=["Rozkład ciężaru podatku (incydencja podatkowa)", "Elastyczność cenowa podaży", "Elastyczność cenowa popytu"])
fix("owe25-o-03", add=["Czynniki kształtujące podaż (determinanty podaży)"])
fix("owe25-o-07", add=["Korzyści skali (ekonomia skali)"])
fix("owe25-o-22", add=["Polityka rachunkowości", "Bilans"])
fix("owe25-o-23", add=["Hedging"])
fix("owe25-o-29", dele=["Segmentacja, targetowanie, pozycjonowanie (STP)"])


# ── XXV OWE, etap szkolny ──
drop("Podatek od spadków i darowizn", "darowizn")
rx("Podatek od spadków i darowizn", B + r"podat\w* od (?:spadków|darowizn)")
drop("System emerytalny w Polsce (od 1999 r.)", "emerytal")
rx("System emerytalny w Polsce (od 1999 r.)", B + r"(?:reform|system)\w* emerytaln")
drop("Pasywa: kapitał własny i zobowiązania", "zobowiązan")
rx("Pasywa: kapitał własny i zobowiązania", B + r"zobowiązani\w* (?:krótkoterminow|długoterminow|bieżąc|wobec dostawc)", B + r"kapitał\w* obc")
rx("Just in time i lean management", B + r"just[- ]in[- ]time")
fix("owe25-s-02", add=["Koszty jawne (księgowe) i ukryte (implicite)"])
fix("owe25-s-03", add=["Ścieżka dochód–konsumpcja i krzywa Engla", "Dobro normalne"])
fix("owe25-s-07", add=["Produkt narodowy brutto (PNB, DNB)"])
fix("owe25-s-11", add=["Stopa procentowa nominalna i realna"])
fix("owe25-s-13", add=["Pasywa: kapitał własny i zobowiązania"])
fix("owe25-s-14", add=["Laissez-faire"])
fix("owe25-s-16", add=["Model Mundella–Fleminga"])
fix("owe25-s-17", add=["Skala podatkowa PIT"])
fix("owe25-s-18", add=["Deficyt strukturalny i cykliczny"], dele=["Szkoła klasyczna"])
fix("owe25-s-21", add=["Cel inflacyjny NBP"])
fix("owe25-s-22", add=["Insider trading (wykorzystanie informacji poufnej)"])
fix("owe25-s-24", add=["Kartel"])
fix("owe25-s-29", add=["Monopol"])
fix("owe25-s-30", add=["Typy struktur organizacyjnych"])


# ── XXVI OWE, etap centralny ──
drop("Przedsiębiorca i działalność gospodarcza", "przedsiębiorc")
rx("Przedsiębiorca i działalność gospodarcza", B + r"(?:definicj|status)\w* przedsiębiorcy", B + r"mikroprzedsiębiorc")
rx("Optimum Pareto (efektywność w sensie Pareto)", B + r"pareta")
fix("owe26-c-01", add=["Czynniki kształtujące podaż (determinanty podaży)"])
fix("owe26-c-02", add=["Elastyczność cenowa popytu"])
fix("owe26-c-04", add=["Koszt krańcowy (MC)"])
fix("owe26-c-05", add=["Próg zamknięcia (punkt zamknięcia)"])
fix("owe26-c-06", add=["Renta gruntowa", "Elastyczność cenowa podaży"], dele=["Umowy w kodeksie cywilnym"])
fix("owe26-c-08", add=["Efekty zewnętrzne", "Internalizacja efektów zewnętrznych"])
fix("owe26-c-09", add=["Dochód osobisty i dochód rozporządzalny"])
fix("owe26-c-11", add=["Automatyczne stabilizatory"])
fix("owe26-c-14", add=["Inwestycje"])
fix("owe26-c-17", dele=["Samorząd terytorialny w Polsce"])
fix("owe26-c-19", add=["Agio (nadwyżka emisyjna)"])


# ── XXVI OWE, etap okręgowy ──
drop("Ekonomista jako naukowiec i doradca polityki", "doradc")
rx("Ekonomista jako naukowiec i doradca polityki", B + r"ekonomist\w* jako")
drop("Oczekiwania adaptacyjne i racjonalne", "adaptacyjn")
rx("Oczekiwania adaptacyjne i racjonalne", B + r"oczekiwa\w* adaptacyjn")
drop("Wskaźniki płynności", "płynnoś")
rx("Wskaźniki płynności", B + r"wskaźnik\w* płynności", B + r"płynnoś\w* (?:finansow|bieżąc|szybk|gotówkow|przedsiębiorstw|firmy|spółki)")
drop("Przedsiębiorca i działalność gospodarcza", "działalnoś gospodarcz", "działalność gospodarcza", "działalności gospodarczej")
rx("Przedsiębiorca i działalność gospodarcza", B + r"(?:prowadzeni|rozpoczęci|rejestracj|zawieszeni)\w* działalności gospodarczej", B + r"działalnoś\w* nierejestrowan")
ITEM_ADD["Wskaźniki zadłużenia"] = [B + r"wskaźnik\w* (?:zadłużenia|ogólnego zadłużenia|pokrycia)"]
fix("owe26-o-02", add=["Elastyczność a utarg"])
fix("owe26-o-04", add=["Ekonomia normatywna", "Ekonomia pozytywna"], dele=["Formy monopolizacji (porozumienia i koncentracje)"])
fix("owe26-o-06", add=["Elastyczność cenowa podaży"])
fix("owe26-o-21", add=["Analiza fundamentalna i techniczna"], dele=["Podejście sytuacyjne"])
fix("owe26-o-22", add=["Dźwignia finansowa (lewarowanie)"], dele=["Korelacja a przyczynowość"])
fix("owe26-o-28", add=["Strategie konkurencji Portera"])


# ── XXVI OWE, etap szkolny ──
drop("WIG20", "mwig40", "swig80", "wig30")
drop("Partnerzy handlowi Polski", "partner handlow", "partnerów handlow", "partnerem handlow")
rx("Partnerzy handlowi Polski", B + r"partner\w* (?:handlow\w* )?polski", B + r"(?:handl\w* zagraniczn|eksport\w*|import\w*) polski")
fix("owe26-s-03", add=["Linia ograniczenia budżetowego", "Równowaga konsumenta"], dele=["Równowaga rynkowa"])
fix("owe26-s-04", add=["Elastyczność a utarg"])
fix("owe26-s-09", add=["Inflacja popytowa i kosztowa"])
fix("owe26-s-13", add=["Kreacja pieniądza"])
fix("owe26-s-16", add=["IKE, IKZE i PPE"])
fix("owe26-s-21", add=["Stawki VAT w Polsce"])
fix("owe26-s-23", add=["Reguły finansowe JST"])
fix("owe26-s-25", add=["Umowa o pracę i umowy cywilnoprawne"])
fix("owe26-s-29", add=["Narzędzia jakości", "Otoczenie organizacji"])


# ── XXVII OWE, etap centralny ──
drop("Strategie konkurencji Portera", "zróżnicowani")
rx("Strategie konkurencji Portera", B + r"strategi\w* (?:zróżnicowania|dyferencjacji)")
ITEM_ADD["Dystrybucja"] = [B + r"kanał\w* dystrybucji", B + r"handl\w* (?:hurtow|detaliczn)", B + r"hurtowni(?:a|e|ach|ami)?" + E,
                           B + r"detalist"]
drop("Załamana krzywa popytu (model Sweezy’ego)", "załaman")
rx("Załamana krzywa popytu (model Sweezy’ego)", B + r"załaman\w* krzyw", B + r"sweezy")
drop("Reguła 70", "podwojeni")
rx("Reguła 70", B + r"podwoi\w*")
fix("owe27-c-01", add=["Czynniki kształtujące popyt (determinanty popytu)", "Dobro Veblena (efekt Veblena)"])
fix("owe27-c-09", add=["Reguła 70"])
fix("owe27-c-12", add=["Hipoteza dochodu względnego i efekt rygla", "Efekt posiadania (endowment effect)"])
fix("owe27-c-14", add=["Bezrobocie strukturalne", "Bezrobocie cykliczne (koniunkturalne, keynesowskie)"])
fix("owe27-c-18", add=["Aktywa trwałe i obrotowe"])
fix("owe27-c-20", add=["Podatek progresywny, proporcjonalny (liniowy) i regresywny"])
fix("owe27-c-25", add=["Teoria twórczej destrukcji"])
fix("owe27-c-26", add=["Strategie cenowe"])


# ── XXVII OWE, etap okręgowy ──
drop("Cło ad valorem i specyficzne (kwotowe)", "specyficzn")
rx("Cło ad valorem i specyficzne (kwotowe)", B + r"cł\w* specyficzn", B + r"cł\w* kwotow")
rx("Krótki okres i długi okres", B + r"okres\w* (?:długi|krótki)" + E, B + r"(?:krótk|dług)\w*okresow")
rx("Złudzenie pieniądza (iluzja pieniężna)", B + r"iluzj\w* pieniężn")
rx("Bilans banku centralnego", B + r"(?:pasyw|aktyw)\w* bank\w* centraln")
fix("owe27-o-03", add=["Cena minimalna", "Nadwyżka (rynkowa)"])
fix("owe27-o-07", add=["Koszty inflacji"])
fix("owe27-o-08", add=["Konkurencja doskonała"])
fix("owe27-o-09", add=["Wartość dodana"])
fix("owe27-o-11", add=["Oczekiwania adaptacyjne i racjonalne"])
fix("owe27-o-18", add=["Insider trading (wykorzystanie informacji poufnej)"])
fix("owe27-o-20", dele=["Uwarunkowania rozpoczęcia działalności gospodarczej"])
fix("owe27-o-24", add=["Ubezpieczenia społeczne"])


# ── XXVII OWE, etap szkolny ──
drop("Strategie cenowe", "penetracj")
rx("Strategie cenowe", B + r"cen\w* penetracyjn", B + r"strategi\w* penetracji cenow")
fix("owe27-s-01", add=["Elastyczność cenowa popytu"])
fix("owe27-s-08", add=["Efekt substytucyjny i efekt dochodowy"], dele=["Prawa i obowiązki pracownicze"])
fix("owe27-s-15", add=["Wartość pieniądza w czasie"])
fix("owe27-s-17", add=["Cel inflacyjny NBP"])
fix("owe27-s-19", dele=["Kredyty frankowe"])
fix("owe27-s-30", add=["Macierz Ansoffa (strategie rozwoju)"], dele=["Strategie cenowe"])
drop("Uwarunkowania rozpoczęcia działalności gospodarczej", "rozpoczęci działalności", "rozpoczęcia działalności", "zezwoleni")
rx("Uwarunkowania rozpoczęcia działalności gospodarczej", B + r"rozpoczęci\w* działalności gospodarczej", B + r"zakładani\w* (?:firmy|działalności|przedsiębiorstwa)")


# ── XXVIII OWE, etap centralny ──
drop("Interpretacja indywidualna i ogólna", "interpretacj")
rx("Interpretacja indywidualna i ogólna", B + r"interpretacj\w* (?:indywidualn|ogóln|podatkow|przepisów prawa podatkowego)")
drop("Obligacje zamienne i z prawem pierwszeństwa", "zamienn")
rx("Obligacje zamienne i z prawem pierwszeństwa", B + r"obligacj\w* zamienn", B + r"zamian\w* (?:obligacji )?na akcje")
drop("Stopa realna (Fisher)", "stop real")
drop("Zlecenia giełdowe na GPW", "zleceni")
rx("Zlecenia giełdowe na GPW", B + r"zleceni\w* (?:giełdow|kupna|sprzedaży|z limitem|peg|cross|po każdej|po cenie|stop|switch|z warunkiem)")
rx("Popyt pochodny (na czynniki wytwórcze)", B + r"popyt\w* na czynni\w* (?:wytwórcz|produkcji)")
fix("owe28-c-01", add=["Popyt", "Elastyczność cenowa popytu"])
fix("owe28-c-03", add=["Elastyczność cenowa popytu"], dele=["Interpretacja indywidualna i ogólna"])
fix("owe28-c-04", dele=["Obligacje zamienne i z prawem pierwszeństwa"])
fix("owe28-c-06", add=["Popyt pochodny (na czynniki wytwórcze)"])
fix("owe28-c-09", add=["Funkcja konsumpcji (keynesowska)"])
fix("owe28-c-10", add=["Mnożnik (inwestycyjny, wydatkowy)"])
fix("owe28-c-11", add=["Deficyt budżetowy i deficyt sektora finansów publicznych", "Bilans handlowy"])
fix("owe28-c-19", add=["Aktywna i pasywna polityka rynku pracy"])
fix("owe28-c-28", add=["Kartel", "Urząd Ochrony Konkurencji i Konsumentów (UOKiK)"], dele=["Zlecenia giełdowe na GPW"])


# ── XXVIII OWE, etap okręgowy ──
drop("Organizacje otoczenia biznesu", "fundusz pożyczkow", "fundusze pożyczkow")
rx("Organizacje otoczenia biznesu", B + r"fundusz\w* (?:pożyczkow|poręczeniow)\w* (?:regionaln|lokaln)")
drop("Integracja gospodarcza – formy (Balassa)", "integracj")
rx("Integracja gospodarcza – formy (Balassa)", B + r"integracj\w* (?:gospodarcz|regionaln|europejsk|ekonomiczn)", B + r"form\w* integracji")
fix("owe28-o-01", add=["Koszt alternatywny (koszt utraconych możliwości)"])
fix("owe28-o-02", add=["Równowaga konsumenta"])
fix("owe28-o-03", add=["Tragedia wspólnego pastwiska (tragedia wspólnoty)"])
fix("owe28-o-04", add=["Cena minimalna", "Nadwyżka (rynkowa)"])
fix("owe28-o-05", add=["Koszty jawne (księgowe) i ukryte (implicite)"])
fix("owe28-o-07", add=["Rynek funduszy pożyczkowych"])
fix("owe28-o-11", add=["Mnożnik (inwestycyjny, wydatkowy)"])
fix("owe28-o-23", add=["Wartość firmy"])
fix("owe28-o-26", add=["Integracja pionowa i pozioma", "Dywersyfikacja"], dele=["Integracja gospodarcza – formy (Balassa)"])
fix("owe28-o-27", add=["Prawa konsumenta"])


# ── XXVIII OWE, etap szkolny ──
drop("Kapitalizacja giełdowa", "kapitalizacj")
rx("Kapitalizacja giełdowa", B + r"kapitalizacj\w* (?:giełdow|rynkow|spółk|indeks)", B + r"(?:największ|najmniejsz|dużej|małej)\w* kapitalizacj")
drop("Obligacje skarbowe (detaliczne i hurtowe)", "ros", "dos", "coi", "edo")
drop("Ekonomia behawioralna", "behawioraln")
rx("Ekonomia behawioralna", B + r"(?:ekonomi|finans)\w* behawioraln", B + r"podejści\w* behawioraln\w* w finans")
drop("Podejście systemowe", "systemow")
rx("Podejście systemowe", B + r"podejści\w* systemow", B + r"teori\w* systemów", B + r"system\w* otwart")
fix("owe28-s-01", add=["Rzadkość"])
fix("owe28-s-02", add=["Czynniki kształtujące podaż (determinanty podaży)"])
fix("owe28-s-04", add=["Krzywa obojętności"])
fix("owe28-s-08", add=["Popyt pochodny (na czynniki wytwórcze)"])
fix("owe28-s-09", add=["Kurs walutowy"])
fix("owe28-s-10", add=["Metody liczenia PKB"])
fix("owe28-s-12", add=["Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS)"])
fix("owe28-s-16", add=["Stopa procentowa nominalna i realna", "Wartość pieniądza w czasie"], dele=["Kapitalizacja giełdowa"])
fix("owe28-s-24", add=["Podatki bezpośrednie i pośrednie"])
fix("owe28-s-25", dele=["Popyt doskonale elastyczny / doskonale nieelastyczny"])
fix("owe28-s-27", add=["Podejście systemowe", "Podejście behawiorystyczne (szkoła stosunków międzyludzkich)"], dele=["Ekonomia behawioralna"])


# ── XXIX OWE, etap centralny ──
drop("Popyt doskonale elastyczny / doskonale nieelastyczny", "proporcjonaln")
drop("Szok asymetryczny", "asymetryczn")
rx("Szok asymetryczny", B + r"szok\w* asymetryczn", B + r"asymetryczn\w* szok")
drop("Instytucja pożyczkowa (firma pożyczkowa)", "instytuc pożyczko")
rx("Instytucja pożyczkowa (firma pożyczkowa)", B + r"(?:instytucj|firm)\w* pożyczkow")
drop("Otoczenie organizacji", "otoczeni")
rx("Otoczenie organizacji", B + r"otoczeni\w* (?:organizacji|przedsiębiorstwa|firmy|zadaniow|ogóln|zewnętrzn|wewnętrzn|makroekonomiczn|konkurencyjn|biznes|celow|bliższ|dalsz)", B + r"makrootoczeni", B + r"pest(?:el)?" + E)
drop("Wskaźniki wyprzedzające (barometry koniunktury)", "wyprzedzając")
rx("Wskaźniki wyprzedzające (barometry koniunktury)", B + r"wskaźnik\w* wyprzedzając")
drop("Sygnalizacja i odsiewanie (screening)", "sygnaliz")
rx("Sygnalizacja i odsiewanie (screening)", B + r"sygnalizacj\w* (?:jakości|rynkow|wykształceni)", B + r"signal")
drop("Reklama – spory ekonomiczne i sygnał jakości", "reklam")
rx("Reklama – spory ekonomiczne i sygnał jakości", B + r"reklam(?!acj)")
drop("Promocja (komunikacja marketingowa)", "reklam")
rx("Promocja (komunikacja marketingowa)", B + r"reklam(?!acj)")
drop("Koszt kapitału własnego i obcego", "gordon")
rx("Koszt kapitału własnego i obcego", B + r"model\w* gordona")
fix("owe29-c-02", add=["Prawo popytu", "Prawo podaży"])
fix("owe29-c-03", add=["Ścieżka cena–konsumpcja"])
fix("owe29-c-04", add=["Równowaga konsumenta"])
fix("owe29-c-08", add=["Prawo malejącej użyteczności krańcowej (I prawo Gossena)"])
fix("owe29-c-12", add=["Trylemat (niemożliwa trójca) Mundella–Fleminga"])
fix("owe29-c-17", add=["Asymetria polityki pieniężnej"], dele=["Szok asymetryczny"])
fix("owe29-c-20", add=["Podatki lokalne"])
fix("owe29-c-26", dele=["Wskaźniki wyprzedzające (barometry koniunktury)"])
fix("owe29-c-28", add=["Prawa konsumenta"])
fix("owe29-c-30", add=["Naukowe zarządzanie (F.W. Taylor)", "Podejście behawiorystyczne (szkoła stosunków międzyludzkich)"])


# ── XXIX OWE, etap okręgowy ──
drop("Podatek progresywny, proporcjonalny (liniowy) i regresywny", "proporcjonaln")
rx("Podatek progresywny, proporcjonalny (liniowy) i regresywny", B + r"podat\w* (?:proporcjonaln|progresywn|regresywn)", B + r"(?:progresywn|regresywn|proporcjonaln)\w* (?:podat|skal|system\w* podatk|opodatk)")
ITEM_ADD["Reguła 70"] = []
rx("Czek", B + r"czek(?:u|iem|i|ów|owy|owe|owym)?" + E)
rx("Lider cenowy", B + r"przywódc\w* cenow")
fix("owe29-o-01", add=["Konkurencja doskonała", "Hipoteza rynku efektywnego"])
fix("owe29-o-02", add=["Elastyczność a utarg"])
fix("owe29-o-04", add=["Oligopol", "Lider cenowy"])
fix("owe29-o-07", add=["Dobra publiczne"])
fix("owe29-o-08", add=["Siła nabywcza pieniądza"])
fix("owe29-o-09", dele=["Reguła 70"])
fix("owe29-o-14", add=["Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS)"])


# ── XXIX OWE, etap szkolny ──
drop("Rzadkość", "rzadko")
rx("Rzadkość", B + r"rzadkoś")
drop("Typologia strategii Milesa i Snowa", "poszukiwacz", "obrońc", "analityk", "reaktor")
rx("Typologia strategii Milesa i Snowa", B + r"strategi\w* (?:poszukiwacz|obrońc|analityk|reaktor)", B + r"(?:poszukiwacz|obrońc|analityk|reaktor)\w* \((?:prospector|defender|analyzer|reactor)")
drop("Crowdfunding", "społecznościow")
rx("Crowdfunding", B + r"(?:finansowani|pożyczk)\w* społecznościow", B + r"crowd")
fix("owe29-s-01", add=["Koszt alternatywny (koszt utraconych możliwości)", "Myślenie krańcowe (decyzje na marginesie)"])
fix("owe29-s-02", add=["Ekonomia pozytywna", "Ekonomia normatywna"])
fix("owe29-s-07", add=["Konkurencja doskonała"])
fix("owe29-s-09", add=["Współczynnik Giniego i krzywa Lorenza"])
fix("owe29-s-21", add=["Współczynnik Giniego i krzywa Lorenza"])
fix("owe29-s-22", add=["Wartość pieniądza w czasie"])
fix("owe29-s-23", add=["Skala podatkowa PIT"])
fix("owe29-s-26", add=["CEIDG i KRS"])


# ── XXX OWE, etap centralny ──
drop("Samorząd terytorialny w Polsce", "samorząd")
rx("Samorząd terytorialny w Polsce", B + r"samorząd\w* (?:terytorialn|gmin|lokaln|regionaln|województw|powiat)", B + r"samorząd" + E)
rx("Sektor finansów publicznych", B + r"sektor\w* instytucji rządowych i samorządowych")
rx("Twierdzenie o wyborcy medianowym", B + r"środkow\w* głosując")
fix("owe30-c-02", add=["Swap walutowy (FX swap)", "Kryzys subprime"])
fix("owe30-c-04", add=["Hipoteza rynku efektywnego", "Oczekiwania adaptacyjne i racjonalne", "Minsky Hyman"])


# ── XXX OWE, etap okręgowy ──
drop("Notowania ciągłe i jednolite (fixing)", "jednolit")
rx("Notowania ciągłe i jednolite (fixing)", B + r"(?:notowa|system|kurs)\w* jednolit")
drop("Efekt Slutsky’ego i Hicksa (dekompozycja zmiany ceny)", "skompensowan")
rx("Efekt Slutsky’ego i Hicksa (dekompozycja zmiany ceny)", B + r"dochod\w* skompensowan", B + r"hicks")
drop("Hipoteza cyklu życia", "cyklu życia")
rx("Hipoteza cyklu życia", B + r"hipotez\w* cyklu życia", B + r"(?:oczekiwan|przeciętn)\w*,? (?:oczekiwan\w* )?w (?:całym )?cyklu życia", B + r"modigliani")
fix("owe30-o-01", add=["Podatki bezpośrednie i pośrednie"])
fix("owe30-o-12", add=["Dyskryminacja cenowa"])
fix("owe30-o-17", add=["Elastyczność cenowa popytu"])
fix("owe30-o-27", add=["Siatka kierownicza (Blake i Mouton)", "Style kierowania: autokratyczny, demokratyczny, liberalny"])
fix("owe30-o-28", add=["Cykl życia organizacji"])


# ── XXX OWE, etap szkolny ──
drop("Rewolucja marginalistyczna", "marginal")
rx("Rewolucja marginalistyczna", B + r"rewolucj\w* marginalist", B + r"marginaliśc", B + r"marginalizm")
fix("owe30-s-08", add=["Cło"])
fix("owe30-s-17", add=["Bariery wejścia"])
fix("owe30-s-20", add=["Renta (annuity) i perpetuita"])
fix("owe30-s-30", add=["Siatka kierownicza (Blake i Mouton)"], dele=["Grupy i zespoły"])


# ── XXXI OWE, etap centralny ──
drop("Taylor Frederick Winslow", "taylora")
rx("Taylor Frederick Winslow", B + r"f\.\s?w\.\s?taylor", B + r"taylor(?:a|em)?" + E + r"(?! reguł)(?=[^.]{0,40}(?:zarządzan|organizacj\w* pracy|tayloryzm))")
drop("Naukowe zarządzanie (F.W. Taylor)", "taylor")
rx("Naukowe zarządzanie (F.W. Taylor)", B + r"tayloryzm", B + r"naukow\w* organizacj\w* pracy")
drop("Model Keynesa (krzyż keynesowski)", "45°")
drop("Elastyczność cenowa popytu", "elastyczny")
rx("Elastyczność cenowa popytu", B + r"popyt\w* (?:jest |był |będzie )?(?:nie)?elastyczn", B + r"(?:nie)?elastyczn\w* (?:cenow\w* )?popyt")
drop("Cykl koniunkturalny", "faz cyklu")
rx("Cykl koniunkturalny", B + r"faz\w* cyklu koniunkturaln", B + r"faz\w* (?:ożywienia|recesji|depresji|rozkwitu|boomu)" + E)
drop("Źródła finansowania przedsiębiorstwa", "źródł finansowania", "źródła finansowania", "źródłem finansowania")
rx("Źródła finansowania przedsiębiorstwa", B + r"źródł\w* finansowania (?:przedsiębiorstw|działalności|firm|spółk|inwestycji)")
rx("Teorie krótkookresowej podaży zagregowanej (lepkie płace, lepkie ceny, błędne postrzeganie)", B + r"(?:lepkoś|sztywnoś)\w* (?:nominaln\w* )?(?:cen|płac)", B + r"lepki\w* (?:cen|płac)")
fix("owe31-c-01", add=["Nachylenie krzywej zagregowanego popytu (trzy efekty)"])
fix("owe31-c-15", dele=["Ścieżka ekspansji przedsiębiorstwa", "Model Keynesa (krzyż keynesowski)"])
fix("owe31-c-21", add=["Teorie krótkookresowej podaży zagregowanej (lepkie płace, lepkie ceny, błędne postrzeganie)"])
fix("owe31-c-28", add=["Rodzaje innowacji"])
fix("owe31-c-30", dele=["Cykl koniunkturalny"])


# ── XXXI OWE, etap okręgowy ──
drop("Modele systemów ochrony zdrowia", "rezydualn")
rx("Modele systemów ochrony zdrowia", B + r"model\w* rezydualn")
drop("Cele SMART", "smart")
rx("Cele SMART", B + r"smart" + E)
rx("Dobra społecznie pożądane (merit goods)", B + r"społecznie niepożądan")
rx("Negatywna (niekorzystna) selekcja", B + r"selekcj\w* negatywn")
fix("owe31-o-13", dele=["Modele systemów ochrony zdrowia"])
fix("owe31-o-25", add=["Zarządzanie"])
fix("owe31-o-26", dele=["Teoria oczekiwań (V. Vroom)"])
fix("owe31-o-30", add=["Krzywa IS"])


# ── XXXI OWE, etap szkolny ──
drop("Strategie cenowe", "ustalania cen")
rx("Strategie cenowe", B + r"strategi\w* (?:cenow|ustalania cen)")
drop("Mnożnik (inwestycyjny, wydatkowy)", "mnożnik")
rx("Mnożnik (inwestycyjny, wydatkowy)", B + r"mnożnik(?!\w* (?:kapitału|kreacji|podatkow|bankow|zrównoważ))", B + r"efekt\w* mnożnikow")
rx("Krańcowa stopa technicznej substytucji (MRTS)", B + r"substytucji techniczn")
drop("Szczeble zarządzania", "szczebl")
rx("Szczeble zarządzania", B + r"szczebl\w* (?:zarządzania|kierownicz|hierarchi|organizacyjn)", B + r"(?:najwyższ|średni|niższ)\w* szczebl")
rx("Model Du Ponta (piramida wskaźników)", B + r"du ?pont")
fix("owe31-s-07", add=["Krańcowa stopa technicznej substytucji (MRTS)"], dele=["Krańcowa stopa substytucji (MRS)"])
fix("owe31-s-15", add=["Dylemat więźnia", "Kartel"], dele=["Strategie cenowe"])
fix("owe31-s-20", add=["Tożsamości gospodarki otwartej: NX = NCO i S = I + NCO"])
fix("owe31-s-22", add=["Model Du Ponta (piramida wskaźników)"])
fix("owe31-s-29", add=["Planowanie"], dele=["Szczeble zarządzania"])
fix("owe31-s-30", add=["Lobbing"])


# ── XXXII OWE, etap centralny ──
drop("Pasywa: kapitał własny i zobowiązania", "pasyw")
rx("Pasywa: kapitał własny i zobowiązania", B + r"pasyw(?:a|ów|ach|ami|om)" + E)
fix("owe32-c-01", add=["WIG"])
fix("owe32-c-03", add=["Rozkład ciężaru podatku (incydencja podatkowa)"])
fix("owe32-c-12", add=["Fundusz inwestycyjny"], dele=["Style kierowania: autokratyczny, demokratyczny, liberalny"])
fix("owe32-c-14", add=["Substytuty", "Dobra komplementarne"])
fix("owe32-c-21", add=["Elastyczność a utarg"])
fix("owe32-c-24", add=["Elastyczność cenowa popytu"])


# ── XXXII OWE, etap okręgowy ──
drop("Siła rynkowa i wskaźnik Lernera", "lerner")
rx("Siła rynkowa i wskaźnik Lernera", B + r"(?:indeks|wskaźnik)\w* lernera")
drop("Sieci komunikacyjne w małych grupach", "łańcuch", "okrąg", "wzorzec")
rx("Sieci komunikacyjne w małych grupach", B + r"sie[ćc]\w* (?:typu |w kształcie )?(?:łańcuch|okręg|koła|gwiazd|y)" + E)
drop("Gospodarka niedoboru", "niedoboru")
rx("Gospodarka niedoboru", B + r"gospodar\w* niedoboru", B + r"miękk\w* ograniczen")
fix("owe32-o-01", add=["Zarządzanie zapasami"])
fix("owe32-o-02", add=["Polityka kursowa"])
fix("owe32-o-04", add=["Korytarz stóp procentowych"])
fix("owe32-o-06", add=["Kurs nominalny i realny"])
fix("owe32-o-07", dele=["Ścieżka ekspansji przedsiębiorstwa"])
fix("owe32-o-11", dele=["Cło ad valorem i specyficzne (kwotowe)"])
fix("owe32-o-15", add=["Stopa procentowa nominalna i realna"])
fix("owe32-o-19", add=["Saldo obrotów bieżących"])
fix("owe32-o-27", add=["Kontrolowanie"])
fix("owe32-o-29", add=["Cechy osobowości w organizacji"])
fix("owe32-o-30", add=["Taylor Frederick Winslow"])
drop("Dyskryminacja (różnicowanie) cenowa", "różnicuj", "różnicowani")
rx("Dyskryminacja (różnicowanie) cenowa", B + r"różnicow\w* cen", B + r"różnicuj\w* cen", B + r"(?:doskonał|pierwszego|drugiego|trzeciego)\w* (?:stopnia )?(?:różnicowani|dyskryminacj)")


# ── XXXII OWE, etap szkolny ──
drop("Endogeniczne teorie wzrostu", "endogeniczn")
rx("Endogeniczne teorie wzrostu", B + r"endogeniczn\w* (?:teori|model)\w* wzrostu", B + r"(?:teori|model)\w* wzrostu endogeniczn", B + r"wzrost\w* endogeniczn")
drop("Inwestycje bezpośrednie (BIZ) i portfelowe", "portfelow")
rx("Inwestycje bezpośrednie (BIZ) i portfelowe", B + r"inwestycj\w* portfelow")
rx("Model, teoria i prawo ekonomiczne", B + r"zmienn\w* (?:endogeniczn|egzogeniczn)", B + r"(?:endogeniczn|egzogeniczn)\w*" + E)
fix("owe32-s-04", add=["Składki na ubezpieczenia społeczne"])
fix("owe32-s-09", add=["Wejście i wyjście z rynku w długim okresie"])
fix("owe32-s-12", add=["Tragedia wspólnego pastwiska (tragedia wspólnoty)", "Dobra publiczne"])
fix("owe32-s-13", add=["Podatek progresywny, proporcjonalny (liniowy) i regresywny"])
fix("owe32-s-23", add=["Korzyści skali (ekonomia skali)"])
fix("owe32-s-27", add=["Macierz BCG"], dele=["Inwestycje bezpośrednie (BIZ) i portfelowe"])


# ── XXXIII OWE, etap okręgowy ──
drop("Wartość nominalna, emisyjna, rynkowa i księgowa akcji", "wartość nominaln", "wartości nominaln")
rx("Wartość nominalna, emisyjna, rynkowa i księgowa akcji", B + r"wartoś\w* (?:nominaln|rynkow|emisyjn)\w* (?:akcji|udziału)", B + r"cen\w* nominaln\w* akcji")
drop("Narzucanie cen odsprzedaży", "odsprzedaż")
rx("Narzucanie cen odsprzedaży", B + r"narzucani\w* cen")
drop("Transfery socjalne", "transfer")
rx("Transfery socjalne", B + r"transfer\w* (?:socjaln|budżetow|rządow|społeczn|jednostronn|pieniężn)", B + r"płatnoś\w* transferow")
drop("Demografia", "demograf")
rx("Demografia", B + r"demografi[aięą]" + E)
fix("owe33-o-05", add=["Bezrobocie strukturalne"])
fix("owe33-o-06", add=["Rewolucje przemysłowe"])
fix("owe33-o-07", dele=["Ścieżka ekspansji przedsiębiorstwa"])
fix("owe33-o-21", dele=["Formy marketingu współczesnego"])
fix("owe33-o-23", add=["Gospodarka współdzielenia (sharing economy) i peer economy"])
fix("owe33-o-26", dele=["Strategie konkurencji Portera"])


# ── XXXIII OWE, etap szkolny ──
drop("Teoria ścieżki do celu (R. House)", "house")
rx("Teoria ścieżki do celu (R. House)", B + r"r\.\s?house", B + r"house[’']?a" + E)
rx("Seigniorage (renta emisyjna)", B + r"seniorat")
rx("Macierz GE (McKinseya)", B + r"(?:selektor|macierz)\w* (?:jednostek )?general electric")
fix("owe33-s-01", dele=["Hersey Paul, Blanchard Kenneth"])
fix("owe33-s-02", add=["Cel inflacyjny NBP"])
fix("owe33-s-03", add=["Krótkookresowe i długookresowe krzywe kosztów"])
fix("owe33-s-04", add=["Składki na ubezpieczenia społeczne"])
fix("owe33-s-07", add=["Substytuty"])
fix("owe33-s-11", add=["Rynek pieniężny"])
fix("owe33-s-21", add=["Rewolucje przemysłowe"])
fix("owe33-s-30", add=["Metody twórczego rozwiązywania problemów"], dele=["Grupy i zespoły"])


# ── XXXIV OWE, etap centralny ──
rx("Weksel", B + r"weksel" + E, B + r"weksl\w*")
drop("Grupy i zespoły", "grup")
rx("Grupy i zespoły", B + r"grup\w* (?:formaln|nieformaln|robocz|zadaniow|interesu|koleżeńsk|i zespoł)", B + r"(?:rozwoju|rozwój|fazy|faz) grupy", B + r"spójnoś\w* grupy")
fix("owe34-c-03", add=["Koszt alternatywny (koszt utraconych możliwości)"])
fix("owe34-c-05", add=["Operacje otwartego rynku (OOR)"])
fix("owe34-c-14", add=["Inflacja oczekiwana i nieoczekiwana"])
fix("owe34-c-17", add=["Amortyzacja"])
fix("owe34-c-21", dele=["Teoria oczekiwań (V. Vroom)"])
fix("owe34-c-23", add=["Wzrost gospodarczy", "Krzywa doświadczenia (uczenia się)"])


# ── XXXIV OWE, etap okręgowy ──
drop("Przejście epidemiologiczne i przejście migracyjne", "epidemiologiczn")
rx("Przejście epidemiologiczne i przejście migracyjne", B + r"przejści\w* epidemiologiczn")
drop("Formy monopolizacji (porozumienia i koncentracje)", "koncern")
rx("Formy monopolizacji (porozumienia i koncentracje)", B + r"koncern\w*(?=[^.?]*(?:kartel|trust|syndykat|holding))", B + r"(?:kartel|trust|syndykat|holding)\w*[^.?]*koncern")
rx("Dobra mieszane: klubowe i wspólne", B + r"zasob\w* wspóln", B + r"dob\w* klubow")
fix("owe34-o-26", add=["Kontrolowanie"])
fix("owe34-o-28", add=["Typy struktur organizacyjnych"])
fix("owe34-o-29", dele=["Hierarchia potrzeb Maslowa"], add=["Maslow Abraham"])
rx("Pułapka maltuzjańska", B + r"malthuzjańsk")
fix("owe34-o-24", add=["Punkt procentowy a procent"])


# ── XXXIV OWE, etap szkolny ──
fix("owe34-s-02", add=["Substytuty", "Dobra komplementarne"])
fix("owe34-s-08", add=["Pigou Arthur Cecil", "Marshall Alfred"], dele=["Podatek Pigou", "Warunek Marshalla–Lernera i krzywa J"])
fix("owe34-s-17", add=["Bilans handlowy"])
fix("owe34-s-20", dele=["Histereza bezrobocia"])
fix("owe34-s-21", add=["Szok podażowy i popytowy"], dele=["Popyt", "Podaż"])
fix("owe34-s-25", add=["Elastyczność cenowa popytu"])
fix("owe34-s-30", add=["Ford Henry"], dele=["Przemysł 4.0"])


# ── XXXV OWE, etap centralny ──
drop("Teoria cyklu życia (Hersey i Blanchard)", "teori cyklu życia", "teoria cyklu życia")
rx("Teoria cyklu życia (Hersey i Blanchard)", B + r"teori\w* cyklu życia(?! produkt)")
rx("Naukowe zarządzanie (F.W. Taylor)", B + r"zarządzani\w* naukow")
fix("owe35-c-17", add=["Prawo poboru"])
fix("owe35-c-19", dele=["Hipoteza cyklu życia"], add=["Struktura kapitału i teorie jej wyboru"])
fix("owe35-c-27", dele=["Szkoła klasyczna"])
fix("owe35-c-28", dele=["Grupy i zespoły"])
fix("owe35-c-29", add=["Emerson Harrington", "Teoria oczekiwań (V. Vroom)"], dele=["Naukowe zarządzanie (F.W. Taylor)"])


# ── XXXV OWE, etap okręgowy ──
rx("Elastyczność mieszana (krzyżowa) popytu", B + r"mieszan\w* elastycznoś", B + r"krzyżow\w* elastycznoś")
rx("Hipoteza rynku efektywnego", B + r"rynk\w* efektywn")
rx("Zarządzanie zapasami", B + r"koszt\w* (?:utrzymania|realizacji|składania|magazynowania) (?:zapas|zamówie|dostaw)")
fix("owe35-o-01", add=["Stopy procentowe NBP"], dele=["Weksel"])
fix("owe35-o-04", add=["Zagregowana podaż (AS)", "Inflacja"])
fix("owe35-o-08", add=["Indeksy GPW – zestaw"])
fix("owe35-o-09", add=["Bezrobocie cykliczne (koniunkturalne, keynesowskie)"], dele=["Keynesizm"])
fix("owe35-o-15", add=["Rynek pierwotny i wtórny", "Rynek pieniężny"])
fix("owe35-o-26", add=["Teoria cyklu życia (Hersey i Blanchard)"], dele=["Teoria oczekiwań (V. Vroom)"])
fix("owe35-o-28", add=["McGregor Douglas", "Podejście behawiorystyczne"])
fix("owe35-o-29", add=["Taylor Frederick Winslow", "Naukowe zarządzanie (F.W. Taylor)"])
fix("owe35-o-30", add=["Gantt Henry"])


# ── XXXV OWE, etap szkolny ──
drop("Metody twórczego rozwiązywania problemów", "kapelusz")
rx("Metody twórczego rozwiązywania problemów", B + r"sześci\w* (?:myślow\w* )?kapelusz", B + r"kapelusz\w* (?:myślow|de bono)")
rx("Hierarchia potrzeb Maslowa", B + r"potrzeb\w* (?:fizjologiczn|bezpieczeństwa|szacunku|uznania)")
rx("Hipoteza rynku efektywnego", B + r"efektywnoś\w* informacyjn")
fix("owe35-s-05", add=["Długookresowa krzywa podaży gałęzi", "Konkurencja doskonała"])
fix("owe35-s-07", add=["Bezrobocie strukturalne", "Bezrobocie cykliczne (koniunkturalne, keynesowskie)", "Naturalna stopa bezrobocia"], dele=["Keynesizm"])
fix("owe35-s-11", add=["Dług publiczny", "Inflacja oczekiwana i nieoczekiwana", "Deflacja i dezinflacja"])
fix("owe35-s-12", add=["Wykluczalność i rywalizacyjność (klasyfikacja dóbr)"])
fix("owe35-s-15", add=["Wskaźniki rentowności (ROA, ROE, ROS)"])
fix("owe35-s-22", add=["Wynik finansowy – poziomy"])
fix("owe35-s-28", add=["Technologie informacyjne w zarządzaniu"], dele=["Ekonomia"])
