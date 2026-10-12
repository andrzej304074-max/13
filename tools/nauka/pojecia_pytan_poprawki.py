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


# ── XXXVI OWE, etap okręgowy ──
rx("Elastyczność mieszana (krzyżowa) popytu", B + r"mieszan\w* cenow\w* elastycznoś")
rx("Style kierowania: autokratyczny, demokratyczny, liberalny", B + r"ciągł\w* skal\w* zachowań")
rx("Nowa ekonomia klasyczna (szkoła racjonalnych oczekiwań)", B + r"now\w* makroekonomi\w* klasyczn")
fix("owe36-o-03", add=["Pułapka płynności"])
fix("owe36-o-04", add=["Rada Polityki Pieniężnej"])
fix("owe36-o-05", add=["Substytuty"])
fix("owe36-o-14", dele=["Szkoła klasyczna", "Makroekonomia"], add=["Nowa ekonomia klasyczna (szkoła racjonalnych oczekiwań)"])
fix("owe36-o-23", dele=["Rodzaje funduszy wg polityki"], add=["Rynek pieniężny"])
fix("owe36-o-25", add=["Tannenbaum Robert, Schmidt Warren H.", "Taylor Frederick Winslow", "Gantt Henry"], dele=["Zarządzanie projektami"])
fix("owe36-o-26", add=["Thompson James D."])
fix("owe36-o-27", add=["Woodward Joan"])
fix("owe36-o-28", add=["Weber Max"])


# ── XXXVI OWE, etap szkolny ──
rx("OPEC", B + r"szok\w* \(kryzys\w*\) naftow")
fix("owe36-s-08", dele=["Ekonomia"])
fix("owe36-s-12", add=["Bezrobocie strukturalne", "Bezrobocie cykliczne (koniunkturalne, keynesowskie)"], dele=["Popyt"])
fix("owe36-s-18", add=["Monetaryzm", "Teoria ilościowa pieniądza"])
fix("owe36-s-21", dele=["Pożyczka a kredyt"], add=["Dług publiczny"])
fix("owe36-s-22", add=["Punkt procentowy a procent"])
fix("owe36-s-24", add=["1973 – model Blacka–Scholesa i pierwszy szok naftowy"])
fix("owe36-s-25", add=["Deficyt pierwotny"])


# ── XXXVII OWE, etap centralny ──
drop("Teoria oczekiwań (V. Vroom)", "oczekiwań")
rx("Teoria oczekiwań (V. Vroom)", B + r"teori\w* oczekiwań(?=[^.?]*motyw)", B + r"motyw\w*[^.?]*teori\w* oczekiwań", B + r"oczekiwań vrooma")
rx("Oczekiwania adaptacyjne i racjonalne", B + r"adaptacyjn\w* charakter\w* oczekiwań")
rx("Funkcja Cobba-Douglasa", B + r"cobb\w*[-–]douglas")
fix("owe37-c-03", add=["Oczekiwania adaptacyjne i racjonalne"])
fix("owe37-c-04", add=["Krzywa dochodowości"])
fix("owe37-c-06", dele=["Wartość pieniądza w czasie"], add=["Bony pieniężne NBP"])
fix("owe37-c-08", add=["Bony skarbowe"])
fix("owe37-c-16", dele=["Światowa Organizacja Handlu", "Kapitał jako czynnik produkcji i stopa zwrotu"])
fix("owe37-c-28", dele=["Ryzyko, niepewność i wartość oczekiwana"])
fix("owe37-c-30", dele=["Hierarchia potrzeb Maslowa"], add=["Maslow Abraham"])
NO_TITLE.add("Teoria oczekiwań (V. Vroom)")


# ── XXXVII OWE, etap okręgowy ──
rx("Złota reguła bilansowa", B + r"złot\w* zasad\w* bilansow")
rx("Percepcja i błędy percepcji", B + r"błęd\w* aureoli", B + r"błąd aureoli")
rx("Deficyt strukturalny i cykliczny", B + r"sald\w* (?:cykliczn|strukturaln)")
fix("owe37-o-02", add=["Cykl koniunkturalny"])
fix("owe37-o-05", dele=["Warunek Marshalla–Lernera i krzywa J"], add=["Lerner Abba", "Dochody i wydatki budżetu państwa"])
fix("owe37-o-09", dele=["Rachunek kosztów działań"], add=["Model Gordona (wycena akcji)"])
fix("owe37-o-12", add=["Bitcoin i halving"])
fix("owe37-o-13", add=["Monetaryzm"])
fix("owe37-o-16", add=["Konkurencja doskonała"])
fix("owe37-o-25", add=["Wartość dodana"])
fix("owe37-o-26", add=["Typy struktur organizacyjnych"])
fix("owe37-o-30", dele=["Strategie konkurencji Portera"])
fix("owe37-o-28", add=["Zarządzanie zasobami ludzkimi (HRM)"])


# ── XXXVII OWE, etap szkolny ──
drop("Wskaźniki rotacji (sprawności)", "rotacj")
rx("Wskaźniki rotacji (sprawności)", B + r"wskaźnik\w* rotacji", B + r"rotacj\w* (?:zapas|należnoś|zobowiąz|aktyw)", B + r"(?:obrot|spłaty|inkasa)\w* (?:zapas|należnoś|zobowiąz)\w* w dniach")
rx("Reguły podatkowe A. Smitha", B + r"zasad\w* podatkow\w* a\. smitha")
fix("owe37-s-02", add=["Wskaźniki rotacji (sprawności)"])
fix("owe37-s-03", add=["Luka inflacyjna i deflacyjna (recesyjna)", "Polityka fiskalna (budżetowa)"])
fix("owe37-s-07", add=["Polityka fiskalna (budżetowa)"])
fix("owe37-s-08", add=["Bezrobocie cykliczne (koniunkturalne, keynesowskie)", "Naturalna stopa bezrobocia"], dele=["Keynesizm"])
fix("owe37-s-10", dele=["Struktura instytucjonalna i zasady funkcjonowania UE"], add=["Reguły podatkowe A. Smitha"])
fix("owe37-s-15", add=["Bilans"])
fix("owe37-s-23", add=["Należności i zobowiązania"])
fix("owe37-s-27", add=["Planowanie"])


# ── XXXVIII OWE, etap centralny ──
drop("Teoria oczekiwań (V. Vroom)", "vroom")
rx("Teoria oczekiwań (V. Vroom)", B + r"vroom\w*(?![\w’']*\s*[-–]\s*yetton)")
fix("owe38-c-01", add=["Podatek Tobina", "Minsky Hyman"], dele=["Q Tobina", "Hipoteza niestabilności finansowej"])
fix("owe38-c-05", add=["Unia Gospodarcza i Walutowa (UGW)"])
fix("owe38-c-11", add=["Bezrobocie strukturalne", "Bezrobocie frykcyjne"])
fix("owe38-c-25", dele=["Oszczędności narodowe"], add=["Koszty jawne i ukryte", "Koszt alternatywny (koszt utraconych możliwości)"])


# ── XXXVIII OWE, etap okręgowy ──
rx("Macierz GE (McKinseya)", B + r"selektor\w* jednostek ge" + E)
rx("Renta (annuity) i perpetuita", B + r"obligacj\w* wieczyst", B + r"konsol[ea]?" + E)
rx("Nowa ekonomia keynesowska", B + r"now\w* keynesowsk")
fix("owe38-o-01", dele=["Prawa i obowiązki pracownicze"])
fix("owe38-o-09", dele=["Pieniądz gotówkowy i bezgotówkowy", "Aprecjacja i deprecjacja"])
fix("owe38-o-13", dele=["Warunek Marshalla–Lernera i krzywa J"], add=["1951 – Europejska Wspólnota Węgla i Stali"])
fix("owe38-o-14", add=["Bezrobocie cykliczne (koniunkturalne, keynesowskie)"])
fix("owe38-o-15", dele=["Emisja banknotów i monet w Polsce"])
fix("owe38-o-18", add=["Polityka fiskalna (budżetowa)"])
fix("owe38-o-21", dele=["Keynesizm"])
fix("owe38-o-22", add=["Wydatki autonomiczne", "Model Keynesa (krzyż keynesowski)"])
fix("owe38-o-27", add=["Typy struktur organizacyjnych"])
fix("owe38-o-30", add=["House Robert", "Taylor Frederick Winslow"], dele=["Teoria ścieżki do celu (R. House)"])
fix("owe38-o-23", main=["Macierz GE (McKinseya)"])
fix("owe38-o-30", add=["House Robert", "Taylor Frederick Winslow"], dele=["Teoria ścieżki do celu (R. House)"],
    main=["House Robert", "Przywództwo transformacyjne i charyzmatyczne"])


# ── XXXVIII OWE, etap szkolny ──
rx("Run na bank", B + r"run\w* na bank")
rx("Wskaźniki płynności", B + r"wskaźnik\w* (?:bieżącej|szybkiej|natychmiastowej) płynnoś")
fix("owe38-s-01", dele=["Griffin Ricky W."], add=["Dobro Giffena"])
fix("owe38-s-02", add=["Monopol"])
fix("owe38-s-09", dele=["Instrumenty polityki rodzinnej w Polsce"], add=["Ludność aktywna zawodowo"])
fix("owe38-s-11", add=["Bilans handlowy"])
fix("owe38-s-13", add=["Teoria optymalnego obszaru walutowego"])
fix("owe38-s-17", add=["Deflator PKB"])
fix("owe38-s-25", add=["Planowanie"])


# ── XXXIX OWE, etap centralny ──
drop("Akcja", "akcj")
rx("Akcja", B + r"akcj\w*" + E + r"(?!\s+(?:kredytow|ratunkow|promocyjn|marketingow|reklamow|protestacyjn|strajkow|społeczn))")
rx("Warunek Marshalla–Lernera i krzywa J", B + r"krzyw\w* j" + E, B + r"^j$")
fix("owe39-c-01", add=["Bezrobocie strukturalne"])
fix("owe39-c-08", add=["Mnożnik zrównoważonego budżetu (Haavelmo)"])
fix("owe39-c-09", dele=["Polityka ekspansywna i restrykcyjna"], add=["Związki zawodowe a rynek pracy"])
fix("owe39-c-10", dele=["Popyt"], add=["Krzywa oferty", "Terms of trade (relacje wymiany)", "Warunek Marshalla–Lernera i krzywa J", "Krzywa możliwości produkcyjnych"],
    main=["Krzywa oferty", "Terms of trade (relacje wymiany)"])
fix("owe39-c-15", add=["Efekty zewnętrzne"])
fix("owe39-c-30", add=["Planowanie"], dele=["Krótki okres i długi okres"])
rx("Terms of trade (relacje wymiany)", B + r"relacj\w* wymienn")


# ── XXXIX OWE, etap okręgowy ──
drop("Szkoła klasyczna", "klasyczn")
rx("Szkoła klasyczna", B + r"szkoł\w* klasyczn", B + r"(?<!now\w )(?<!nowej )ekonomi\w* klasyczn",
   B + r"klasyczn\w* (?:szkoł|ekonomi|ekonomist|podejści\w* do zarządzani|kierun|nurt|teori\w* (?:ekonomi|zarządzani|organizacj)|model\w* (?:rynku|gospodark))",
   B + r"klasyc\w* ekonomii")
drop("Rodzaje funduszy wg polityki", "rynku pieniężnego")
rx("Rodzaje funduszy wg polityki", B + r"fundusz\w* (?:rynku pieniężnego|pieniężn|dłużn|obligacji|zrównoważon|stabilnego wzrostu|mieszan)")
fix("owe39-o-01", dele=["Wartość godziwa i koszt historyczny"], add=["Analiza fundamentalna i techniczna", "Rynek pieniężny"])
fix("owe39-o-06", add=["Czynniki kształtujące podaż"])
fix("owe39-o-08", add=["Deficyt pierwotny", "Obsługa i zarządzanie długiem publicznym"])
fix("owe39-o-12", add=["Cło"])
fix("owe39-o-21", add=["Operacje otwartego rynku (OOR)"])
fix("owe39-o-22", dele=["Koszt kapitału własnego i obcego", "Indeks giełdowy"])
fix("owe39-o-25", add=["Punkt procentowy a procent"])
fix("owe39-o-30", dele=["Kompetencje wyróżniające (kluczowe)", "Role kierownicze (H. Mintzberg)"], add=["Taylor Frederick Winslow", "Mintzberg Henry", "McGregor Douglas"],
    main=["Typologia strategii Milesa i Snowa"])
drop("Klasyczna i liberalna teoria finansów", "klasycz")
rx("Klasyczna i liberalna teoria finansów", B + r"klasyczn\w* (?:i liberaln\w* )?teori\w* finansów", B + r"liberaln\w* teori\w* finansów")
fix("owe39-o-01", dele=["Wartość godziwa i koszt historyczny"], add=["Analiza fundamentalna i techniczna", "Rynek pieniężny"],
    main=["Hipoteza rynku efektywnego"])
# klasyczne podejście do zarządzania = naukowe zarządzanie + zarządzanie administracyjne, nie klasyczna ekonomia
_NZ = r"(?![^.?]{0,25}zarządzani)"
ITEM_ADD["Szkoła klasyczna"] = [B + r"szkoł\w* klasyczn\w*" + _NZ, B + r"(?<!now\w )(?<!nowej )ekonomi\w* klasyczn",
                                B + r"klasyczn\w* (?:szkoł|ekonomi|kierun|nurt|model\w* (?:rynku|gospodark))\w*" + _NZ, B + r"klasyc\w* ekonomii"]
_KZ = B + r"klasyczn\w* (?:podejści|szkoł|kierun|nurt|teori)\w*[^.?]{0,25}zarządzani"
rx("Naukowe zarządzanie (F.W. Taylor)", _KZ)
rx("Zarządzanie administracyjne (teoria administracji)", _KZ)
fix("owe21-s-33", add=["Zarządzanie administracyjne (teoria administracji)"])
fix("owe35-o-28", add=["McGregor Douglas", "Podejście behawiorystyczne", "Zarządzanie administracyjne (teoria administracji)"])


# ── XXXIX OWE, etap szkolny ──
drop("Paradoks zapobiegliwości (oszczędności)", "paradoksu")
rx("Paradoks zapobiegliwości (oszczędności)", B + r"paradoks\w* (?:oszczędz|oszczędn|zapobiegliw)")
fix("owe39-s-04", add=["Dług publiczny"])
fix("owe39-s-09", add=["Substytuty", "Dobra komplementarne"], dele=["Strategie cenowe"])
fix("owe39-s-11", add=["Krzywa Kuznetsa"], dele=["Cykle koniunkturalne – typy"])
fix("owe39-s-14", add=["Emisja banknotów i monet w Polsce"])
fix("owe39-s-26", dele=["Ministerstwo Finansów", "Podatek"], add=["Grupy i zespoły"], main=["Metody twórczego rozwiązywania problemów"])
fix("owe39-s-30", dele=["Badania marketingowe"])


# ── nowe hasła (partia 1) ──
rx("Krańcowa efektywność kapitału (Keynes)", B + r"krańcow\w* rentownoś\w* kapitał")
fix("owe23-o-18", add=["Rekomendacja S (KNF)"])
fix("owe31-s-30", add=["Lobbing", "Dystrybucja"])
fix("owe27-c-19", add=["Różnice kursowe"], main=["Różnice kursowe"])
drop("Upadłość i restrukturyzacja", "restrukturyzac")
rx("Upadłość i restrukturyzacja", B + r"restrukturyzac\w*(?! i modernizacji rolnictwa)")
drop("Formy marketingu współczesnego", "seo", "commerce", "b2b", "b2c", "c2c", "e-commerce", "m-commerce")
fix("owe27-o-17", add=["Bank inwestycyjny i bank uniwersalny", "Bank komercyjny"], main=["Bank inwestycyjny i bank uniwersalny"])


# ── pytania ręczne słownika i pytania OWE bez wykrytych pojęć ──
rx("Paradoks rolnictwa (dobra nowina dla rolnictwa – zła dla rolników)", B + r"paradoks\w* (?:urodzaju|rolnicz)")
fix("sl-M-a2eb2a4a26", add=["Raty równe (annuitetowe) i malejące"])
fix("sl-M-6fe3252148", add=["Warunek maksymalizacji zysku", "Konkurencja doskonała"])
fix("sl-M-8ae763b3a4", add=["Izokoszta"])
fix("sl-M-44fc543e27", add=["Efekty zewnętrzne (externalities)"])
fix("sl-M-a91d0b5c6f", add=["Paradoks rolnictwa (dobra nowina dla rolnictwa – zła dla rolników)"])
fix("sl-M-375dc9b5df", add=["Wartość krańcowego produktu pracy (VMPL) i przychód z krańcowego produktu (MRPL)", "Popyt na pracę"])
fix("sl-M-7594cb3f7c", add=["Transformacja systemowa i plan Balcerowicza"])
fix("sl-M-bd7675225e", add=["Współczynnik wypłacalności (adekwatności kapitałowej)"])
fix("sl-M-0ee569c41e", add=["Budżet państwa"])
fix("sl-M-c974b91136", add=["Bilans handlowy"])
fix("sl-M-6ecc382673", add=["Kurs walutowy", "Aprecjacja i deprecjacja"])
fix("sl-M-2be4e43ae8", add=["Partnerzy handlowi Polski"])
fix("sl-M-9957be16dc", add=["Zasady rachunkowości"])
fix("sl-M-9fe06bf37f", add=["Prawa konsumenta"])
fix("sl-M-689d8b0359", add=["Analiza SWOT"])
fix("sl-M-b7dbf391db", add=["Renta (annuity) i perpetuita", "Wartość pieniądza w czasie"])
fix("sl-M-64fcea790a", add=["Renta (annuity) i perpetuita", "Wartość pieniądza w czasie"])
fix("sl-M-94bcb302c0", add=["Reguła 70"])
fix("sl-M-d9b509cc5f", add=["Inflacja"])
fix("sl-M-29998da6cb", add=["Płaca nominalna i realna"])
fix("sl-M-4165a65aaa", add=["Model Keynesa (krzyż keynesowski)"])
fix("sl-M-161853bda6", add=["Procent prosty i składany"])
fix("sl-M-d2fc3e54c5", add=["Renta (annuity) i perpetuita"])
fix("sl-M-073d267ab4", add=["2000 – płynny kurs złotego i bańka internetowa"])
fix("sl-M-ac90ce430b", add=["Cztery swobody rynku wewnętrznego UE"])
fix("sl-M-35065e2540", add=["Współczynniki urodzeń, zgonów i przyrostu naturalnego"])
fix("sl-M-c8a04ead45", add=["Współczynniki urodzeń, zgonów i przyrostu naturalnego"])
fix("sl-M-a04574f2e8", add=["Starzenie się ludności i jego miary"])
fix("sl-M-68af80da3f", add=["Depopulacja"])
fix("owe26-s-22", add=["Sektor finansów publicznych"])
fix("owe28-s-28", add=["Prawa i obowiązki pracownicze"])
fix("owe33-o-19", add=["Produkcja (funkcja produkcji)", "Izokwanta", "Izokoszta"])
fix("owe34-o-21", add=["Produkcja (funkcja produkcji)"])


# ── hasła z literatury hasła przewodniego XL OWE (demografia) ──
drop("Standaryzacja współczynników demograficznych", "standaryzacj")
rx("Standaryzacja współczynników demograficznych", B + r"standaryzacj\w* (?:współczynnik|bezpośredni|pośredni)", B + r"współczynnik\w* (?:standaryzowan|surow)")
drop("Automatyzacja a starzenie się ludności", "automatyzacj", "robotyzacj")
rx("Automatyzacja a starzenie się ludności", B + r"(?:automatyzacj|robotyzacj)\w*[^.?]{0,60}(?:starzen|demograf|niedob\w* prac)", B + r"(?:starzen|demograf)\w*[^.?]{0,60}(?:automatyzacj|robotyzacj)")

# ── statystyki pytań OWE (zakładka „Pojęcia” → Statystyki) ──
# Hasła ogólne, które w treści pytania są zwykle tłem („w gospodarce autarkicznej…”, „krzywa popytu…”, „(ceteris paribus)”).
# W statystykach liczą się tylko wtedy, gdy pytanie nie dotyczy żadnego bardziej konkretnego hasła.
STAT_GENERIC = {
    "Popyt", "Podaż", "Podatek", "Konsumpcja", "Inwestycje", "Pieniądz", "Ceteris paribus", "Krótki okres i długi okres",
    "Wykresy w ekonomii: nachylenie i układ współrzędnych", "Autarkia", "Ekonomia", "Czynniki wytwórcze (czynniki produkcji)",
    "Bank centralny", "Papier wartościowy", "Transfery socjalne",
    "Dochód osobisty i dochód rozporządzalny", "Branża (sektor)",
}
fix("owe25-c-19", dele=["Stopa procentowa nominalna i realna"])  # „stopa procentowa ubezpieczenia” = składka wypadkowa
fix("owe32-c-19", dele=["Pasywa: kapitał własny i zobowiązania"])  # pasywa w bilansie płatniczym, nie w bilansie firmy

# Ręczna weryfikacja statystyk (wszystkie pytania XXI–XXXIX): ostateczna lista pojęć, o które pytanie pyta –
# sprawdzana wiedza, bez tła i bez pojęć występujących tylko w błędnych odpowiedziach. Wpis tylko tam, gdzie automat się myli.
STAT_FIX = {}


def stat(qid, *titles):
    assert titles, qid
    STAT_FIX[qid] = list(titles)

# ── weryfikacja statystyk: XXXIX OWE ──
stat("owe39-s-01", "Paradoks zapobiegliwości (oszczędności)", "Wydatki autonomiczne")
stat("owe39-s-04", "Deficyt budżetowy i deficyt sektora finansów publicznych")
stat("owe39-s-11", "Krzywa Phillipsa")
stat("owe39-s-12", "Produkt krajowy brutto (PKB)", "Metody liczenia PKB")
stat("owe39-s-17", "Kryzys subprime (2007–2009)", "Bańka spekulacyjna")
stat("owe39-s-23", "Inflacja", "Wskaźnik cen towarów i usług konsumpcyjnych (CPI)", "Deflator PKB", "PPI", "Wskaźnik cena/zysk (P/E)")
stat("owe39-s-29", "Biurokracja (M. Weber)")
stat("owe39-o-02", "Konkurencja doskonała", "Konkurencja monopolistyczna", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)")
stat("owe39-o-03", "Płaca minimalna", "Krzywa Phillipsa")
stat("owe39-o-06", "Czynniki kształtujące podaż (determinanty podaży)")
stat("owe39-o-08", "Deficyt pierwotny", "Sektor finansów publicznych")
stat("owe39-o-10", "Twierdzenie Stolpera–Samuelsona")
stat("owe39-o-12", "Polityka handlowa i wspieranie eksportu", "Kontyngent (kwota importowa)")
stat("owe39-o-16", "Mechanizm transmisji monetarnej")
stat("owe39-o-20", "Izokwanta")
stat("owe39-o-21", "Bony pieniężne NBP", "Polityka pieniężna – cele i instrumenty")
stat("owe39-o-24", "Typy struktur organizacyjnych", "Grupowanie stanowisk (departamentalizacja)")
stat("owe39-o-25", "Punkt procentowy a procent")
stat("owe39-c-01", "Krzywa Phillipsa", "Bezrobocie strukturalne", "Naturalna stopa bezrobocia")
stat("owe39-c-03", "Hipoteza Lindera")
stat("owe39-c-04", "Koszt krańcowy (MC)", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)", "Koszty zmienne (VC)")
stat("owe39-c-05", "Elastyczność cenowa popytu", "Efekt substytucyjny i efekt dochodowy", "Substytuty")
stat("owe39-c-06", "Zysk ekonomiczny (nadzwyczajny)", "Konkurencja doskonała")
stat("owe39-c-07", "Cło", "Terms of trade (relacje wymiany)")
stat("owe39-c-08", "Mnożnik zrównoważonego budżetu (Haavelmo)")
stat("owe39-c-09", "NAIRU", "Zasiłek dla bezrobotnych (ubezpieczenie od bezrobocia)", "Wydajność pracy (produkcyjność) i jej czynniki")
stat("owe39-c-10", "Krzywa oferty", "Terms of trade (relacje wymiany)")
stat("owe39-c-11", "Postęp techniczny", "Izokwanta")
stat("owe39-c-13", "Forward guidance", "Krzywa dochodowości")
stat("owe39-c-14", "Kryteria konwergencji (z Maastricht)")
stat("owe39-c-15", "Efekty zewnętrzne (externalities)", "Koszt społeczny")
stat("owe39-c-16", "Współczynnik Giniego i krzywa Lorenza", "Wskaźnik decylowy (kwintylowy)")
stat("owe39-c-17", "Histereza bezrobocia", "Polityka ekspansywna i restrykcyjna")
stat("owe39-c-18", "Równowaga Nasha", "Strategia dominująca")
stat("owe39-c-19", "Skutki cła", "Cło")
stat("owe39-c-20", "Krzywa obojętności", "Krańcowa stopa substytucji (MRS)", "Użyteczność")
stat("owe39-c-21", "Opcja", "Hedging")
stat("owe39-c-22", "Renta ekonomiczna", "Dochód transferowy")
stat("owe39-c-23", "Obligacja zerokuponowa", "Obligacja")
stat("owe39-c-26", "Typologia strategii Milesa i Snowa")
stat("owe39-c-30", "Planowanie", "Szczeble zarządzania")

# ── weryfikacja statystyk: XXXVIII OWE ──
stat("owe38-s-01", "Dobro Veblena (efekt Veblena)")
stat("owe38-s-03", "Krótkookresowe i długookresowe krzywe kosztów", "Koszty stałe (FC)")
stat("owe38-s-04", "Zysk ekonomiczny (nadzwyczajny)", "Koszt alternatywny (koszt utraconych możliwości)", "Konkurencja doskonała")
stat("owe38-s-06", "Analiza fundamentalna i techniczna")
stat("owe38-s-07", "Bilans płatniczy")
stat("owe38-s-11", "Bilans handlowy", "Produkt krajowy brutto (PKB)")
stat("owe38-s-12", "Koszty inflacji")
stat("owe38-s-14", "Model Keynesa (krzyż keynesowski)", "Zagregowany popyt (AD)")
stat("owe38-s-15", "Operacje otwartego rynku (OOR)", "Bony pieniężne NBP")
stat("owe38-s-16", "Strategia bezpośredniego celu inflacyjnego (BCI)", "Narodowy Bank Polski (NBP)")
stat("owe38-s-18", "Problem pryncypała i agenta (problem agencji)")
stat("owe38-s-24", "Kapitał obrotowy netto")
stat("owe38-s-25", "Szczeble zarządzania", "Planowanie")
stat("owe38-s-28", "Wielka piątka (cechy osobowości)")
stat("owe38-o-02", "Hipoteza dochodu permanentnego", "Friedman Milton")
stat("owe38-o-03", "Deflacja długu (I. Fisher)", "Deflacja i dezinflacja")
stat("owe38-o-06", "Akcept bankierski i certyfikat depozytowy", "Weksel")
stat("owe38-o-08", "Operacje otwartego rynku (OOR)")
stat("owe38-o-09", "Mechanizm transmisji monetarnej")
stat("owe38-o-10", "Dobro normalne", "Dobro luksusowe (wyższego rzędu)")
stat("owe38-o-11", "Monopol naturalny", "Koszty stałe (FC)")
stat("owe38-o-14", "Histereza bezrobocia")
stat("owe38-o-15", "Euro", "Unia Europejska – historia")
stat("owe38-o-16", "Kryteria konwergencji (z Maastricht)")
stat("owe38-o-21", "Zagregowana podaż (AS)", "Nowa ekonomia keynesowska")
stat("owe38-o-22", "Wydatki autonomiczne")
stat("owe38-o-25", "Produkt narodowy netto (PNN)", "Produkt narodowy brutto (PNB, DNB)", "Amortyzacja")
stat("owe38-o-26", "TIPS")
stat("owe38-o-27", "Typy struktur organizacyjnych", "Grupowanie stanowisk (departamentalizacja)")
stat("owe38-o-28", "Role kierownicze (H. Mintzberg)")
stat("owe38-c-01", "Podatek Tobina")
stat("owe38-c-02", "Rezerwy walutowe (oficjalne aktywa rezerwowe)")
stat("owe38-c-03", "Bony pieniężne NBP", "Polityka pieniężna – cele i instrumenty")
stat("owe38-c-04", "Operacje otwartego rynku (OOR)")
stat("owe38-c-05", "Integracja gospodarcza – formy (Balassa)")
stat("owe38-c-06", "Europejski System Walutowy (ESW) i ERM")
stat("owe38-c-07", "Kryzysy walutowe – generacje", "Finansowanie deficytu", "System kursu płynnego i stałego")
stat("owe38-c-10", "Mnożnik podatkowy", "Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS)")
stat("owe38-c-11", "Płace efektywnościowe (motywujące)")
stat("owe38-c-12", "Unia bankowa", "Europejski Bank Centralny (EBC)")
stat("owe38-c-13", "Cztery swobody rynku wewnętrznego UE")
stat("owe38-c-14", "Teoria optymalnego obszaru walutowego", "McKinnon Ronald, Kenen Peter")
stat("owe38-c-15", "Funkcja konsumpcji (keynesowska)", "Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS)")
stat("owe38-c-19", "ETF", "WIG20")
stat("owe38-c-21", "Izokwanta", "Substytuty")
stat("owe38-c-23", "Efekt substytucyjny i efekt dochodowy", "Substytuty")
stat("owe38-c-24", "Kartel", "Monopol", "Koszt krańcowy (MC)")
stat("owe38-c-25", "Zysk ekonomiczny (nadzwyczajny)", "Zysk księgowy", "Koszt alternatywny (koszt utraconych możliwości)")
stat("owe38-c-27", "Teoria X i teoria Y (D. McGregor)", "Naukowe zarządzanie (F.W. Taylor)")
stat("owe38-c-28", "Przywództwo", "Model Vrooma–Yettona–Jago", "Teoria ścieżki do celu (R. House)", "Teoria cyklu życia (Hersey i Blanchard)", "Model LMX (wymiany przywódca–członek)")

# ── weryfikacja statystyk: XXXVII OWE ──
stat("owe37-s-01", "Deflator PKB", "PKB nominalny i realny")
stat("owe37-s-03", "Luka inflacyjna i deflacyjna (recesyjna)", "Keynesizm", "Polityka fiskalna (budżetowa)")
stat("owe37-s-08", "Bezrobocie cykliczne (koniunkturalne, keynesowskie)", "Recesja i depresja")
stat("owe37-s-09", "Naturalna stopa bezrobocia", "Friedman Milton", "Phelps Edmund")
stat("owe37-s-13", "Inflacja oczekiwana i nieoczekiwana", "Oczekiwania adaptacyjne i racjonalne")
stat("owe37-s-14", "Analiza fundamentalna i techniczna")
stat("owe37-s-18", "Popyt na pieniądz (preferencja płynności)", "Keynes John Maynard")
stat("owe37-s-20", "Warunek maksymalizacji zysku", "Konkurencja doskonała", "Koszt krańcowy (MC)", "Utarg (przychód) całkowity, przeciętny i krańcowy")
stat("owe37-s-24", "Inwestycje")
stat("owe37-s-26", "Role kierownicze (H. Mintzberg)")
stat("owe37-s-28", "Naukowe zarządzanie (F.W. Taylor)", "Systemy motywacyjne i wynagrodzeń", "Taylor Frederick Winslow")
stat("owe37-s-12", "Rozkład ciężaru podatku (incydencja podatkowa)", "Podatek na producentów – nowa równowaga")
stat("owe37-o-01", "Złota reguła bilansowa")
stat("owe37-o-02", "Produkt potencjalny i luka PKB (popytowa)", "Cykl koniunkturalny")
stat("owe37-o-04", "Produkt krajowy brutto (PKB)", "Metody liczenia PKB")
stat("owe37-o-05", "Prawo Wagnera")
stat("owe37-o-07", "Konkurencja monopolistyczna", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)")
stat("owe37-o-08", "Przychody (efekty) skali", "Krótkookresowe i długookresowe krzywe kosztów")
stat("owe37-o-09", "Koszt kapitału własnego i obcego", "Model Gordona (wycena akcji)", "Dywidenda")
stat("owe37-o-11", "Dyskryminacja (różnicowanie) cenowa", "Zbędna strata społeczna (strata martwa, deadweight loss)", "Monopol")
stat("owe37-o-14", "Produkt potencjalny i luka PKB (popytowa)", "Inflacja")
stat("owe37-o-16", "Krótki okres i długi okres", "Koszty zmienne (VC)", "Koszty stałe (FC)")
stat("owe37-o-18", "Model Cournota", "Równowaga Nasha", "Duopol")
stat("owe37-o-19", "Twierdzenie Coase’a", "Efekty zewnętrzne (externalities)")
stat("owe37-o-20", "Subwencja i dotacja", "Czynniki kształtujące podaż (determinanty podaży)")
stat("owe37-o-22", "Krańcowy koszt pracy (MCL)", "Monopson")
stat("owe37-o-24", "REIT")
stat("owe37-o-25", "Produkt krajowy brutto (PKB)", "Wartość dodana")
stat("owe37-o-26", "Typy struktur organizacyjnych", "Grupowanie stanowisk (departamentalizacja)")
stat("owe37-o-29", "Czebole i keiretsu")
stat("owe37-c-03", "Oczekiwania adaptacyjne i racjonalne", "Friedman Milton")
stat("owe37-c-04", "Krzywa dochodowości")
stat("owe37-c-05", "Koszty jawne (księgowe) i ukryte (implicite)", "Zysk ekonomiczny (nadzwyczajny)")
stat("owe37-c-06", "Operacje otwartego rynku (OOR)", "Stopy procentowe NBP", "Kredyt lombardowy")
stat("owe37-c-07", "Zysk normalny", "Zysk księgowy")
stat("owe37-c-08", "Papiery dyskontowe", "Bony skarbowe")
stat("owe37-c-09", "Krzywa Beveridge’a", "NAIRU", "Bezrobocie frykcyjne")
stat("owe37-c-10", "Nowa ekonomia klasyczna (szkoła racjonalnych oczekiwań)", "Lucas Robert E.")
stat("owe37-c-11", "Reguła Taylora", "Produkt potencjalny i luka PKB (popytowa)")
stat("owe37-c-12", "Teoria ilościowa pieniądza (równanie wymiany Fishera)", "PKB nominalny i realny")
stat("owe37-c-13", "Krzywa IS", "Model IS-LM", "Pułapka inwestycyjna")
stat("owe37-c-17", "Popyt na pieniądz (preferencja płynności)", "Keynes John Maynard")
stat("owe37-c-18", "Podaż pracy (krzywa zakrzywiona do tyłu)", "Efekt substytucyjny i efekt dochodowy")
stat("owe37-c-19", "Długookresowa krzywa podaży gałęzi", "Konkurencja doskonała")
stat("owe37-c-21", "Elastyczność dochodowa popytu", "Dobro niższego rzędu (podrzędne)")
stat("owe37-c-22", "Bariery wejścia", "Monopol", "Struktura rynku")
stat("owe37-c-24", "Długookresowa krzywa podaży gałęzi", "Rozkład ciężaru podatku (incydencja podatkowa)")
stat("owe37-c-26", "Typy struktur organizacyjnych", "Grupowanie stanowisk (departamentalizacja)")
stat("owe37-c-28", "Niepewność otoczenia (J.D. Thompson)")
stat("owe37-c-30", "Model LPC F. Fiedlera", "Podejście sytuacyjne")

# ── weryfikacja statystyk: XXXVI OWE ──
stat("owe36-s-05", "Cykle koniunkturalne – typy")
stat("owe36-s-06", "PKB per capita i parytet siły nabywczej (PPP)")
stat("owe36-s-07", "Obligacja", "Obligacje skarbowe (detaliczne i hurtowe)", "Kurs walutowy")
stat("owe36-s-08", "NAIRU")
stat("owe36-s-10", "Obsługa i zarządzanie długiem publicznym", "Stopy procentowe NBP")
stat("owe36-s-14", "Operacje otwartego rynku (OOR)", "Bony pieniężne NBP")
stat("owe36-s-15", "Konsumpcja autonomiczna", "Funkcja konsumpcji (keynesowska)")
stat("owe36-s-16", "Hiperinflacja")
stat("owe36-s-18", "Monetaryzm", "Friedman Milton", "Podaż pieniądza (nominalna i realna)")
stat("owe36-s-21", "Obligacja", "Polityka fiskalna (budżetowa)")
stat("owe36-s-22", "Punkt procentowy a procent")
stat("owe36-s-24", "1973 – model Blacka–Scholesa i pierwszy szok naftowy", "OPEC")
stat("owe36-s-25", "Deficyt budżetowy i deficyt sektora finansów publicznych", "Deficyt pierwotny")
stat("owe36-s-26", "Próg rentowności (BEP)", "Koszty stałe (FC)", "Koszty zmienne (VC)")
stat("owe36-s-30", "Teoria X i teoria Y (D. McGregor)", "Naukowe zarządzanie (F.W. Taylor)")
stat("owe36-o-01", "Credit crunch (zakleszczenie kredytowe)")
stat("owe36-o-03", "Pożyczkodawca ostatniej instancji", "Pokusa nadużycia (moral hazard)")
stat("owe36-o-04", "Strategia bezpośredniego celu inflacyjnego (BCI)", "Rada Polityki Pieniężnej (RPP)")
stat("owe36-o-05", "Elastyczność mieszana (krzyżowa) popytu", "Dobra komplementarne")
stat("owe36-o-09", "Rynek walutowy (Forex)", "Kurs walutowy")
stat("owe36-o-10", "Teoria kontraktów implicytnych")
stat("owe36-o-11", "Teorie krótkookresowej podaży zagregowanej (lepkie płace, lepkie ceny, błędne postrzeganie)", "Koszty inflacji")
stat("owe36-o-15", "Równowaga konsumenta (II prawo Gossena)", "Linia ograniczenia budżetowego")
stat("owe36-o-16", "Agregaty pieniężne (NBP)")
stat("owe36-o-17", "Mnożnik (inwestycyjny, wydatkowy)", "Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS)")
stat("owe36-o-19", "Efekt Tanziego–Olivery", "Deficyt budżetowy i deficyt sektora finansów publicznych")
stat("owe36-o-21", "Konkurencja monopolistyczna")
stat("owe36-o-23", "Rynek pieniężny", "Bony skarbowe")
stat("owe36-o-24", "Krzywa obojętności", "Dobra komplementarne")
stat("owe36-o-25", "Style kierowania: autokratyczny, demokratyczny, liberalny", "Tannenbaum Robert, Schmidt Warren H.")
stat("owe36-o-26", "Niepewność otoczenia (J.D. Thompson)")
stat("owe36-o-29", "Cechy osobowości w organizacji", "Stres w pracy")
stat("owe36-o-30", "Wartość krańcowego produktu pracy (VMPL) i przychód z krańcowego produktu (MRPL)")

# ── weryfikacja statystyk: XXXV OWE ──
stat("owe35-s-02", "Produkt krajowy brutto (PKB)", "Metody liczenia PKB")
stat("owe35-s-03", "Zysk ekonomiczny (nadzwyczajny)", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)", "Koszty stałe (FC)", "Koszty zmienne (VC)")
stat("owe35-s-04", "Krzywa podaży firmy doskonale konkurencyjnej", "Konkurencja doskonała")
stat("owe35-s-05", "Długookresowa krzywa podaży gałęzi", "Konkurencja doskonała")
stat("owe35-s-06", "Mnożnik (inwestycyjny, wydatkowy)", "Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS)")
stat("owe35-s-07", "Bezrobocie strukturalne")
stat("owe35-s-08", "Punkt procentowy a procent", "Stopa bezrobocia")
stat("owe35-s-10", "Oszczędności narodowe (prywatne i publiczne)")
stat("owe35-s-11", "Inflacja oczekiwana i nieoczekiwana", "Dług publiczny")
stat("owe35-s-12", "Monopol naturalny", "Dobra mieszane: klubowe i wspólne")
stat("owe35-s-13", "Koszty inflacji")
stat("owe35-s-14", "Rada Polityki Pieniężnej (RPP)", "Polityka pieniężna – cele i instrumenty")
stat("owe35-s-15", "Wskaźniki rentowności (ROA, ROE, ROS)")
stat("owe35-s-21", "Elastyczność dochodowa popytu", "Dobro normalne")
stat("owe35-s-22", "Bilans", "Rachunek zysków i strat (RZiS)", "Wynik finansowy – poziomy")
stat("owe35-s-23", "Produkt potencjalny i luka PKB (popytowa)")
stat("owe35-s-27", "Funkcje zarządzania")
stat("owe35-o-01", "Kredyt wekslowy NBP")
stat("owe35-o-02", "EOQ – wzór Wilsona", "Zarządzanie zapasami")
stat("owe35-o-04", "Zagregowana podaż (AS)", "Postęp techniczny", "Polityka pieniężna – cele i instrumenty")
stat("owe35-o-05", "Elastyczność mieszana (krzyżowa) popytu")
stat("owe35-o-07", "Konkurencja doskonała", "Utarg (przychód) całkowity, przeciętny i krańcowy", "Długookresowa krzywa podaży gałęzi")
stat("owe35-o-08", "WIG", "Indeks giełdowy")
stat("owe35-o-11", "Naturalna stopa bezrobocia", "Popyt na pracę", "Ludność aktywna zawodowo (zasób siły roboczej)")
stat("owe35-o-12", "Hipoteza rynku efektywnego", "Fama Eugene")
stat("owe35-o-13", "Strategia dominująca", "Dylemat więźnia")
stat("owe35-o-14", "Odpływy kapitałowe netto (NCO)")
stat("owe35-o-15", "Rynek pierwotny i wtórny")
stat("owe35-o-16", "Kartel", "Monopol", "Koszt krańcowy (MC)")
stat("owe35-o-19", "Model CAPM", "Sharpe William")
stat("owe35-o-20", "Cena maksymalna", "Niedobór (rynkowy)")
stat("owe35-o-23", "Popyt indywidualny i rynkowy")
stat("owe35-o-25", "Krzywa LM", "Model IS-LM", "Polityka ekspansywna i restrykcyjna")
stat("owe35-o-28", "Klasyczne podejście do zarządzania")
stat("owe35-o-30", "Naukowe zarządzanie (F.W. Taylor)", "Gantt Henry")
stat("owe35-c-01", "Mechanizm transmisji monetarnej", "Teorie krótkookresowej podaży zagregowanej (lepkie płace, lepkie ceny, błędne postrzeganie)")
stat("owe35-c-02", "Efekt substytucyjny i efekt dochodowy", "Dobro Giffena", "Dobro niższego rzędu (podrzędne)")
stat("owe35-c-03", "Warunek maksymalizacji zysku", "Monopol")
stat("owe35-c-06", "Funkcja konsumpcji (keynesowska)", "Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS)")
stat("owe35-c-09", "Mnożnik podatkowy", "Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS)")
stat("owe35-c-11", "Strategie opcyjne: straddle i strangle", "Opcja")
stat("owe35-c-12", "Dochody i wydatki budżetu państwa", "Podatek dochodowy od osób fizycznych (PIT)")
stat("owe35-c-13", "Fundusze private equity i venture capital")
stat("owe35-c-14", "Model Bertranda", "Równowaga Nasha", "Duopol")
stat("owe35-c-15", "Prawo Okuna", "Produkt potencjalny i luka PKB (popytowa)", "Naturalna stopa bezrobocia")
stat("owe35-c-16", "Produkt narodowy netto (PNN)", "Podatki bezpośrednie i pośrednie", "Amortyzacja")
stat("owe35-c-17", "Akcja", "Dywidenda", "Prawo poboru")
stat("owe35-c-18", "Komitet Stabilności Finansowej (KSF)", "Bankowy Fundusz Gwarancyjny (BFG)", "Narodowy Bank Polski (NBP)")
stat("owe35-c-19", "Wycena opcji: model Blacka–Scholesa i dwumianowy", "Cox John, Ross Stephen, Rubinstein Mark")
stat("owe35-c-20", "NewConnect", "Mała, średnia i mikrofirma (MŚP)")
stat("owe35-c-21", "Rentowność do wykupu (YTM)", "Obligacja zerokuponowa")
stat("owe35-c-24", "Obligacje komunalne i przychodowe", "Samorząd terytorialny w Polsce")
stat("owe35-c-25", "Zysk normalny", "Konkurencja doskonała", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)")
stat("owe35-c-27", "Cykl życia produktu", "Levitt Theodore")
stat("owe35-c-28", "Siatka kierownicza (Blake i Mouton)")
stat("owe35-c-29", "Teoria ścieżki do celu (R. House)", "Teoria oczekiwań (V. Vroom)")
stat("owe35-c-30", "Naukowe zarządzanie (F.W. Taylor)", "Taylor Frederick Winslow", "Klasyczne podejście do zarządzania", "Systemy motywacyjne i wynagrodzeń")

# ── weryfikacja statystyk: XXXIV OWE ──
stat("owe34-s-07", "Fundusz inwestycyjny otwarty (FIO) i zamknięty (FIZ)", "Rynek kapitałowy")
stat("owe34-s-08", "Naturalna stopa bezrobocia", "Friedman Milton", "Phelps Edmund")
stat("owe34-s-10", "Warunek maksymalizacji zysku", "Utarg (przychód) całkowity, przeciętny i krańcowy", "Koszt krańcowy (MC)")
stat("owe34-s-11", "Substytuty", "Równowaga konsumenta (II prawo Gossena)")
stat("owe34-s-15", "Czynniki kształtujące popyt (determinanty popytu)", "Ceteris paribus", "Elastyczność cenowa popytu")
stat("owe34-s-16", "Konkurencja monopolistyczna", "Reklama – spory ekonomiczne i sygnał jakości")
stat("owe34-s-17", "Metody liczenia PKB", "Produkt krajowy brutto (PKB)")
stat("owe34-s-18", "Luzowanie ilościowe (QE)", "Rynek pierwotny i wtórny", "Narodowy Bank Polski (NBP)")
stat("owe34-s-21", "Szok podażowy i popytowy", "Logistyka i łańcuch dostaw (SCM)")
stat("owe34-s-24", "Koszty bezpośrednie i pośrednie")
stat("owe34-s-25", "Elastyczność cenowa popytu")
stat("owe34-s-26", "Pięć sił Portera", "Porter Michael E.")
stat("owe34-s-28", "Klasyczne podejście do zarządzania", "Naukowe zarządzanie (F.W. Taylor)", "Zarządzanie administracyjne (teoria administracji)")
stat("owe34-o-01", "Stopy procentowe NBP", "Rynek międzybankowy")
stat("owe34-o-02", "Rachunek zysków i strat (RZiS)", "Koszty bezpośrednie i pośrednie")
stat("owe34-o-04", "Wycena opcji: model Blacka–Scholesa i dwumianowy", "Black Fischer, Scholes Myron, Merton Robert")
stat("owe34-o-05", "Opcja")
stat("owe34-o-06", "Krzywa Phillipsa", "Naturalna stopa bezrobocia")
stat("owe34-o-07", "Ścieżka dochód–konsumpcja i krzywa Engla", "Elastyczność dochodowa popytu")
stat("owe34-o-09", "Konkurencja doskonała", "Zysk ekonomiczny (nadzwyczajny)", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)")
stat("owe34-o-10", "Wartość firmy (goodwill)", "Pasywa: kapitał własny i zobowiązania")
stat("owe34-o-11", "Akcelerator finansowy", "Bernanke Ben")
stat("owe34-o-13", "Rada Polityki Pieniężnej (RPP)", "Narodowy Bank Polski (NBP)")
stat("owe34-o-15", "Hipoteza niestabilności finansowej")
stat("owe34-o-16", "Prawo Kopernika–Greshama", "Hiperinflacja")
stat("owe34-o-17", "Linia ograniczenia budżetowego")
stat("owe34-o-18", "Zbędna strata społeczna (strata martwa, deadweight loss)", "Monopol")
stat("owe34-o-19", "Koszt krańcowy (MC)", "Koszty utopione")
stat("owe34-o-21", "Produkt całkowity, przeciętny i krańcowy", "Produkcja (funkcja produkcji)")
stat("owe34-o-23", "Popyt na pieniądz (preferencja płynności)")
stat("owe34-o-24", "Punkt procentowy a procent", "Stopy procentowe NBP")
stat("owe34-o-28", "Typy struktur organizacyjnych")
stat("owe34-o-30", "Naukowe zarządzanie (F.W. Taylor)", "Systemy motywacyjne i wynagrodzeń")
stat("owe34-c-02", "Agregaty pieniężne (NBP)", "Baza monetarna (M0, pieniądz wielkiej mocy)", "Gotówka w obiegu")
stat("owe34-c-03", "Zysk ekonomiczny (nadzwyczajny)", "Zysk księgowy", "Koszt alternatywny (koszt utraconych możliwości)")
stat("owe34-c-04", "Instrument pochodny (derywat)", "Opcja")
stat("owe34-c-05", "Bony pieniężne NBP", "Polityka pieniężna – cele i instrumenty", "Narodowy Bank Polski (NBP)")
stat("owe34-c-08", "Monopol", "Utarg (przychód) całkowity, przeciętny i krańcowy", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)")
stat("owe34-c-09", "Mnożnik kreacji pieniądza", "Rezerwa obowiązkowa")
stat("owe34-c-10", "Ekonomia behawioralna", "Kahneman Daniel", "Tversky Amos")
stat("owe34-c-12", "Zysk ekonomiczny (nadzwyczajny)", "Konkurencja doskonała", "Monopol")
stat("owe34-c-13", "Tarcza podatkowa")
stat("owe34-c-14", "Inflacja oczekiwana i nieoczekiwana", "Koszty inflacji")
stat("owe34-c-15", "Podatek akcyzowy (akcyza)")
stat("owe34-c-17", "Inwestycje", "Amortyzacja")
stat("owe34-c-20", "Krzywa Beveridge’a", "Bezrobocie strukturalne")
stat("owe34-c-21", "Krzywa dochodowości")
stat("owe34-c-22", "Renta ekonomiczna", "Popyt na pracę")
stat("owe34-c-23", "Postęp techniczny", "Krzywa możliwości produkcyjnych (granica możliwości produkcyjnych)")
stat("owe34-c-24", "Pułapka inwestycyjna", "Krzywa IS", "Model IS-LM")
stat("owe34-c-26", "Zbędna strata społeczna (strata martwa, deadweight loss)", "Dyskryminacja (różnicowanie) cenowa", "Monopol")
stat("owe34-c-29", "Biurokracja (M. Weber)", "Zarządzanie administracyjne (teoria administracji)", "Weber Max")
stat("owe34-c-01", "WIG", "Indeks giełdowy")

# ── weryfikacja statystyk: XXXIII OWE ──
stat("owe33-s-01", "Popyt na pieniądz (preferencja płynności)", "Keynes John Maynard")
stat("owe33-s-02", "Narodowy Bank Polski (NBP)", "Polityka pieniężna – cele i instrumenty")
stat("owe33-s-03", "Krótkookresowe i długookresowe krzywe kosztów", "Koszty stałe (FC)")
stat("owe33-s-04", "Ubezpieczenia społeczne (ZUS)")
stat("owe33-s-07", "Krzywa obojętności", "Substytuty")
stat("owe33-s-09", "Próg rentowności (BEP)", "Koszty stałe (FC)", "Koszty zmienne (VC)")
stat("owe33-s-10", "Model Stackelberga", "Duopol")
stat("owe33-s-11", "Transakcja repo i reverse repo", "Rynek pieniężny")
stat("owe33-s-15", "Bilans")
stat("owe33-s-17", "Nowa ekonomia klasyczna (szkoła racjonalnych oczekiwań)", "Lucas Robert E.", "Oczekiwania adaptacyjne i racjonalne")
stat("owe33-s-20", "Kurs nominalny i realny")
stat("owe33-s-21", "Rewolucje przemysłowe")
stat("owe33-s-23", "Blockchain (łańcuch bloków)")
stat("owe33-s-25", "Wskaźniki rentowności (ROA, ROE, ROS)", "Kapitał obrotowy netto", "Aktywa trwałe i obrotowe")
stat("owe33-s-27", "Podejście behawiorystyczne (szkoła stosunków międzyludzkich)", "McGregor Douglas")
stat("owe33-s-30", "Metody twórczego rozwiązywania problemów", "Podejmowanie decyzji")
stat("owe33-o-02", "Deficyt pierwotny")
stat("owe33-o-05", "Bezrobocie strukturalne", "Przemysł 4.0 (czwarta rewolucja przemysłowa)")
stat("owe33-o-06", "Rewolucje przemysłowe")
stat("owe33-o-09", "Konkurencja monopolistyczna", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)", "Zysk ekonomiczny (nadzwyczajny)")
stat("owe33-o-10", "Nadwyżka producenta")
stat("owe33-o-13", "Model Bertranda", "Oligopol")
stat("owe33-o-14", "Naturalna (neutralna) stopa procentowa", "Wicksell Knut")
stat("owe33-o-15", "Konwersja długu")
stat("owe33-o-16", "Polityka ekspansywna i restrykcyjna", "Kredyt lombardowy", "Haircut (redukcja wartości)")
stat("owe33-o-17", "Koszt kapitału własnego i obcego", "Model Gordona (wycena akcji)")
stat("owe33-o-19", "Izokoszta", "Izokwanta", "Krańcowa stopa technicznej substytucji (MRTS)")
stat("owe33-o-22", "Odpływy kapitałowe netto (NCO)", "Oszczędności narodowe (prywatne i publiczne)")
stat("owe33-o-24", "Szok podażowy i popytowy", "Krzywa Phillipsa")
stat("owe33-o-26", "Teoria oczekiwań (V. Vroom)", "Motywacja")

# ── weryfikacja statystyk: XXXII OWE ──
stat("owe32-s-04", "Ubezpieczenia społeczne (ZUS)", "Umowa o pracę i umowy cywilnoprawne")
stat("owe32-s-05", "Podaż indywidualna i rynkowa", "Konkurencja doskonała")
stat("owe32-s-08", "Podatek na producentów – nowa równowaga", "Rozkład ciężaru podatku (incydencja podatkowa)")
stat("owe32-s-09", "Wejście i wyjście z rynku w długim okresie", "Konkurencja doskonała", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)")
stat("owe32-s-11", "Zlecenia giełdowe na GPW")
stat("owe32-s-15", "Blue chips", "WIG20")
stat("owe32-s-19", "Zakupy rządowe a transfery w PKB", "Produkt krajowy brutto (PKB)", "Metody liczenia PKB")
stat("owe32-s-21", "Krzywa Phillipsa", "Friedman Milton", "Phelps Edmund", "Podaż pieniądza (nominalna i realna)")
stat("owe32-s-22", "Cło ad valorem i specyficzne (kwotowe)")
stat("owe32-s-23", "Krzywa doświadczenia (uczenia się)", "Przychody (efekty) skali")
stat("owe32-s-24", "Interwencja walutowa", "Podaż pieniądza (nominalna i realna)")
stat("owe32-s-28", "Sieci komunikacyjne w małych grupach")
stat("owe32-s-29", "Typologia strategii Milesa i Snowa")
stat("owe32-s-30", "Dwuczynnikowa teoria Herzberga", "Motywacja")
stat("owe32-o-01", "EOQ – wzór Wilsona", "Zarządzanie zapasami")
stat("owe32-o-02", "Kurs walutowy", "Rada Ministrów", "Rada Polityki Pieniężnej (RPP)")
stat("owe32-o-03", "Warunek Marshalla–Lernera i krzywa J", "Aprecjacja i deprecjacja", "Saldo obrotów bieżących")
stat("owe32-o-04", "Stopy procentowe NBP", "Korytarz stóp procentowych", "Rynek międzybankowy")
stat("owe32-o-05", "Pierwsza oferta publiczna (IPO)")
stat("owe32-o-06", "Kurs nominalny i realny", "Aprecjacja i deprecjacja", "Hiperinflacja")
stat("owe32-o-09", "Zysk ekonomiczny – wzór", "Utarg (przychód) całkowity, przeciętny i krańcowy", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)")
stat("owe32-o-10", "Dyskryminacja (różnicowanie) cenowa", "Utarg (przychód) całkowity, przeciętny i krańcowy", "Monopol")
stat("owe32-o-11", "Podatek na producentów – nowa równowaga", "Podaż")
stat("owe32-o-12", "Konkurencja monopolistyczna")
stat("owe32-o-13", "Model Bertranda", "Równowaga Nasha", "Duopol")
stat("owe32-o-14", "Protekcjonizm", "Mill John Stuart")
stat("owe32-o-15", "Stopa procentowa nominalna i realna", "Inflacja")
stat("owe32-o-16", "Procent prosty i składany")
stat("owe32-o-18", "Próg zamknięcia (punkt zamknięcia)", "Koszty zmienne (VC)")
stat("owe32-o-19", "Saldo obrotów bieżących", "Bilans płatniczy", "Dochody pierwotne i wtórne")
stat("owe32-o-20", "Produkt narodowy netto (PNN)", "Amortyzacja", "Produkt narodowy brutto (PNB, DNB)")
stat("owe32-o-24", "Krzywa doświadczenia (uczenia się)", "Protekcjonizm")
stat("owe32-o-25", "Dochody i wydatki budżetu państwa", "Podatek akcyzowy (akcyza)")
stat("owe32-o-26", "Systemy zarządzania R. Likerta")
stat("owe32-o-29", "Cechy osobowości w organizacji", "Stres w pracy")
stat("owe32-c-02", "Interwencja walutowa", "Narodowy Bank Polski (NBP)", "Podaż pieniądza (nominalna i realna)")
stat("owe32-c-03", "Rozkład ciężaru podatku (incydencja podatkowa)", "Podatek na producentów – nowa równowaga")
stat("owe32-c-04", "Dywidenda", "Zysk na akcję (EPS)")
stat("owe32-c-05", "Prowizorium budżetowe", "Procedura budżetowa w Polsce")
stat("owe32-c-06", "Zbędna strata społeczna (strata martwa, deadweight loss)", "Dyskryminacja (różnicowanie) cenowa", "Konkurencja doskonała", "Monopol")
stat("owe32-c-10", "Dzień trzech wiedźm", "Kontrakt terminowy (futures i forward)")
stat("owe32-c-11", "Prawo do akcji (PDA)")
stat("owe32-c-15", "Europejski System Walutowy (ESW) i ERM")
stat("owe32-c-16", "Opcja w pieniądzu, przy pieniądzu, poza pieniądzem", "Opcja")
stat("owe32-c-17", "Krótki okres i długi okres")
stat("owe32-c-20", "Kontyngent (kwota importowa)", "Cło", "Skutki cła w małym kraju – obliczanie")
stat("owe32-c-21", "Elastyczność a utarg", "Utarg (przychód) całkowity, przeciętny i krańcowy")
stat("owe32-c-22", "Polityka pieniężna – cele i instrumenty", "Narodowy Bank Polski (NBP)")
stat("owe32-c-23", "Rezerwy walutowe (oficjalne aktywa rezerwowe)", "Narodowy Bank Polski (NBP)")
stat("owe32-c-24", "Elastyczność cenowa popytu – wzór", "Elastyczność cenowa popytu")
stat("owe32-c-25", "Produkt narodowy brutto (PNB, DNB)", "Produkt krajowy brutto (PKB)")
stat("owe32-c-27", "Biurokracja (M. Weber)")
stat("owe32-c-28", "Dywersyfikacja")
stat("owe32-c-29", "Funkcje zarządzania")
stat("owe32-c-30", "Grupy i zespoły", "Tuckman Bruce")

# ── weryfikacja statystyk: XXXI OWE ──
stat("owe31-s-01", "Strategia bezpośredniego celu inflacyjnego (BCI)", "Narodowy Bank Polski (NBP)")
stat("owe31-s-04", "IKE, IKZE i PPE", "System emerytalny w Polsce (od 1999 r.)")
stat("owe31-s-06", "Bezrobocie dobrowolne i przymusowe", "Keynesizm", "Keynes John Maynard")
stat("owe31-s-08", "Dobro Giffena", "Efekt substytucyjny i efekt dochodowy")
stat("owe31-s-09", "Koszty stałe (FC)", "Koszt krańcowy (MC)")
stat("owe31-s-10", "Subsydium do produkcji – skutki rynkowe", "Równowaga rynkowa")
stat("owe31-s-11", "Kartel", "OPEC")
stat("owe31-s-13", "Merkantylizm", "Bilans handlowy")
stat("owe31-s-14", "Teoria ilościowa pieniądza (równanie wymiany Fishera)", "Fisher Irving")
stat("owe31-s-15", "Dylemat więźnia", "Strategia dominująca", "Kartel")
stat("owe31-s-17", "Cykle koniunkturalne – typy")
stat("owe31-s-18", "Teorie krótkookresowej podaży zagregowanej (lepkie płace, lepkie ceny, błędne postrzeganie)", "Zagregowana podaż (AS)")
stat("owe31-s-19", "Mechanizm transmisji monetarnej")
stat("owe31-s-20", "Oszczędności narodowe (prywatne i publiczne)", "Autarkia")
stat("owe31-s-22", "Model Du Ponta (piramida wskaźników)", "Wskaźniki rentowności (ROA, ROE, ROS)")
stat("owe31-s-23", "Kryptowaluta", "Bitcoin i halving")
stat("owe31-s-25", "Marketing mix (4P / 7P / 4C)")
stat("owe31-s-27", "Ryzyko, niepewność i wartość oczekiwana", "Podejmowanie decyzji")
stat("owe31-o-02", "Dług publiczny", "Otwarte fundusze emerytalne (OFE)")
stat("owe31-o-04", "Czynniki kształtujące popyt (determinanty popytu)", "Popyt")
stat("owe31-o-05", "Monopol", "Utarg (przychód) całkowity, przeciętny i krańcowy")
stat("owe31-o-06", "Transformacja systemowa i plan Balcerowicza", "System kursu płynnego i stałego", "Hiperinflacja")
stat("owe31-o-09", "Koszt krańcowy (MC)", "Koszty stałe (FC)")
stat("owe31-o-11", "Współczynnik aktywności zawodowej i wskaźnik zatrudnienia", "Ludność aktywna zawodowo (zasób siły roboczej)")
stat("owe31-o-12", "NAIRU")
stat("owe31-o-13", "Model Cournota", "Duopol", "Warunek maksymalizacji zysku")
stat("owe31-o-14", "Płace efektywnościowe (motywujące)", "Negatywna (niekorzystna) selekcja")
stat("owe31-o-15", "Deflator PKB")
stat("owe31-o-16", "Wskaźniki płynności")
stat("owe31-o-17", "Monopson", "Krańcowy koszt pracy (MCL)", "Warunek maksymalizacji zysku")
stat("owe31-o-19", "Podaż indywidualna i rynkowa", "Krótki okres i długi okres")
stat("owe31-o-20", "Klasyfikacja wydatków COFOG", "Sektor finansów publicznych")
stat("owe31-o-22", "Rola państwa w gospodarce", "Funkcje finansów publicznych (Musgrave)")
stat("owe31-o-23", "Koszty inflacji")
stat("owe31-o-28", "Teoria ERG (C. Alderfer)")
stat("owe31-o-30", "Krzywa IS", "Model IS-LM", "Polityka fiskalna (budżetowa)")
stat("owe31-c-01", "Zagregowany popyt (AD)", "Efekt majątkowy (efekt Pigou, efekt realnych zasobów pieniężnych)")
stat("owe31-c-02", "Bezrobocie frykcyjne", "Bezrobocie strukturalne")
stat("owe31-c-05", "Dobra publiczne", "Krzywa możliwości produkcyjnych (granica możliwości produkcyjnych)")
stat("owe31-c-06", "Model bumelowania (Shapiro–Stiglitz)", "Płace efektywnościowe (motywujące)")
stat("owe31-c-08", "Reguła Taylora", "Rezerwa obowiązkowa", "Cel operacyjny NBP", "POLONIA")
stat("owe31-c-09", "Model Bertranda", "Równowaga Nasha", "Duopol")
stat("owe31-c-12", "Dyskryminacja (różnicowanie) cenowa", "Monopol")
stat("owe31-c-13", "Prawo Okuna", "Naturalna stopa bezrobocia", "Produkt potencjalny i luka PKB (popytowa)")
stat("owe31-c-14", "Strategia wyjścia (exit strategy)", "System Rezerwy Federalnej (Fed)")
stat("owe31-c-17", "Histereza bezrobocia", "Model insiderów–outsiderów")
stat("owe31-c-18", "Dochód transferowy", "Podaż pracy (krzywa zakrzywiona do tyłu)", "Popyt na pracę")
stat("owe31-c-21", "Efekt majątkowy (efekt Pigou, efekt realnych zasobów pieniężnych)", "Teorie krótkookresowej podaży zagregowanej (lepkie płace, lepkie ceny, błędne postrzeganie)")
stat("owe31-c-22", "Modele systemów ochrony zdrowia")
stat("owe31-c-24", "Inflacja bazowa", "Koszty inflacji")
stat("owe31-c-25", "Fiskalizm", "Reguła edynburska", "Ricardo David")
stat("owe31-c-26", "Wydatki sztywne i elastyczne", "Jednostka budżetowa i zakład budżetowy")
stat("owe31-c-27", "Zarządzanie administracyjne (teoria administracji)", "Barnard Chester", "Weber Max", "Urwick Lyndall")

# ── weryfikacja statystyk: XXX OWE ──
stat("owe30-s-02", "Krzywa Laffera")
stat("owe30-s-03", "Warunek maksymalizacji zysku", "Konkurencja doskonała")
stat("owe30-s-04", "Hipoteza dochodu permanentnego")
stat("owe30-s-05", "Konsolidacja fiskalna", "Deficyt budżetowy i deficyt sektora finansów publicznych")
stat("owe30-s-06", "CDS (credit default swap)")
stat("owe30-s-13", "Popyt na pieniądz (preferencja płynności)", "Keynes John Maynard")
stat("owe30-s-15", "Fiskalizm")
stat("owe30-s-16", "Automatyczne stabilizatory")
stat("owe30-s-17", "Warunek maksymalizacji zysku", "Konkurencja doskonała", "Monopol")
stat("owe30-s-20", "Renta (annuity) i perpetuita", "Obligacja")
stat("owe30-s-21", "Funkcje finansów publicznych (Musgrave)", "Polityka fiskalna (budżetowa)")
stat("owe30-s-22", "Mnożnik (inwestycyjny, wydatkowy)", "Krańcowa skłonność do importu (MPI)")
stat("owe30-s-24", "Bankowy Fundusz Gwarancyjny (BFG)")
stat("owe30-s-25", "Metody twórczego rozwiązywania problemów")
stat("owe30-s-27", "Zarządzanie administracyjne (teoria administracji)", "Taylor Frederick Winslow")
stat("owe30-o-01", "Podatki bezpośrednie i pośrednie", "Podatek od gier i podatek tonażowy")
stat("owe30-o-02", "Luzowanie ilościowe (QE)", "Europejski Bank Centralny (EBC)")
stat("owe30-o-03", "Strategia bezpośredniego celu inflacyjnego (BCI)", "Polityka pieniężna – cele i instrumenty")
stat("owe30-o-04", "Inercja (bezwładność) inflacji")
stat("owe30-o-05", "Spółka publiczna")
stat("owe30-o-07", "Gospodarka niedoboru", "Kornai János")
stat("owe30-o-09", "Krzywa podaży firmy doskonale konkurencyjnej", "Koszt krańcowy (MC)", "Koszty zmienne (VC)")
stat("owe30-o-10", "Nadwyżka konsumenta")
stat("owe30-o-12", "Dyskryminacja (różnicowanie) cenowa", "Nadwyżka całkowita i efektywność rynku (planista społeczny)", "Monopol")
stat("owe30-o-13", "Podatek Pigou", "Efekty zewnętrzne (externalities)")
stat("owe30-o-14", "Koszt krańcowy (MC)")
stat("owe30-o-15", "Progi ostrożnościowe i konstytucyjny limit długu", "Dług publiczny")
stat("owe30-o-16", "Baza monetarna (M0, pieniądz wielkiej mocy)", "Agregaty pieniężne (NBP)")
stat("owe30-o-18", "Bony skarbowe", "Papiery dyskontowe")
stat("owe30-o-19", "Limity kapitału zakładowego spółek", "Spółki kapitałowe (KSH)")
stat("owe30-o-21", "Neutralność pieniądza i dychotomia klasyczna")
stat("owe30-o-22", "CDS (credit default swap)", "Spread")
stat("owe30-o-23", "Specjalne prawa ciągnienia (SDR)")
stat("owe30-o-25", "Ujemne stopy procentowe", "Europejski Bank Centralny (EBC)")
stat("owe30-o-27", "Siatka kierownicza (Blake i Mouton)")
stat("owe30-o-28", "Cykl życia organizacji")
stat("owe30-c-02", "Swap walutowy (FX swap)", "Transakcja repo i reverse repo", "Narodowy Bank Polski (NBP)")
stat("owe30-c-03", "Pułapka płynności", "Polityka pieniężna – cele i instrumenty")
stat("owe30-c-04", "Hipoteza niestabilności finansowej", "Minsky Hyman")
stat("owe30-c-07", "Q Tobina")
stat("owe30-c-08", "Krzywa dochodowości", "Recesja i depresja")
stat("owe30-c-10", "Inflacja bazowa")
stat("owe30-c-11", "Mnożnik kreacji pieniądza", "Agregaty pieniężne (NBP)", "Baza monetarna (M0, pieniądz wielkiej mocy)")
stat("owe30-c-12", "Reguła Taylora", "Naturalna (neutralna) stopa procentowa", "Produkt potencjalny i luka PKB (popytowa)")
stat("owe30-c-13", "Deficyt strukturalny i cykliczny", "Cykl koniunkturalny")
stat("owe30-c-15", "Luzowanie ilościowe (QE)", "System Rezerwy Federalnej (Fed)")
stat("owe30-c-16", "Polityka ekspansywna i restrykcyjna", "Krzywa Phillipsa", "Produkt potencjalny i luka PKB (popytowa)")
stat("owe30-c-17", "Cykle koniunkturalne – typy")
stat("owe30-c-19", "Kapitał stały i obrotowy netto", "Złota reguła bilansowa")
stat("owe30-c-20", "Oszczędności narodowe (prywatne i publiczne)")
stat("owe30-c-22", "Twierdzenie Coase’a", "Koszty transakcyjne", "Efekty zewnętrzne (externalities)")
stat("owe30-c-23", "Podatki lokalne", "Samorząd terytorialny w Polsce")
stat("owe30-c-24", "Krzywa obojętności", "Krańcowa stopa substytucji (MRS)", "Równowaga konsumenta (II prawo Gossena)", "Dobro neutralne i dobro niechciane (antydobro)")
stat("owe30-c-25", "Split i scalenie akcji", "Zysk na akcję (EPS)", "Wskaźniki rentowności (ROA, ROE, ROS)")
stat("owe30-c-26", "Typy struktur organizacyjnych")
stat("owe30-c-30", "Forward guidance", "Rada Polityki Pieniężnej (RPP)")

# ── weryfikacja statystyk: XXIX OWE ──
stat("owe29-s-01", "Bodźce (zachęty) w ekonomii", "Myślenie krańcowe (decyzje na marginesie)")
stat("owe29-s-02", "Ekonomia pozytywna", "Ekonomia normatywna")
stat("owe29-s-04", "Krótki okres i długi okres")
stat("owe29-s-05", "Dobro normalne", "Dobro niższego rzędu (podrzędne)")
stat("owe29-s-06", "Warunek maksymalizacji zysku", "Konkurencja doskonała")
stat("owe29-s-07", "Konkurencja monopolistyczna", "Monopol")
stat("owe29-s-08", "Monopol", "Zysk ekonomiczny (nadzwyczajny)", "Zysk normalny")
stat("owe29-s-09", "Efektywność a sprawiedliwość (wymienność celów)")
stat("owe29-s-13", "Keynesizm", "Szkoła klasyczna", "Zagregowany popyt (AD)")
stat("owe29-s-14", "Dług publiczny", "Recesja i depresja")
stat("owe29-s-16", "Bilans", "Rachunek zysków i strat (RZiS)", "Rachunek przepływów pieniężnych (cash flow)")
stat("owe29-s-18", "Dom maklerski (firma inwestycyjna)")
stat("owe29-s-22", "Procent prosty i składany")
stat("owe29-s-24", "Reasekuracja")
stat("owe29-s-27", "Promocja (komunikacja marketingowa)", "Lobbing")
stat("owe29-s-29", "Konflikt w organizacji")
stat("owe29-s-30", "Strategie cenowe")
stat("owe29-o-01", "Zysk ekonomiczny (nadzwyczajny)", "Wejście i wyjście z rynku w długim okresie")
stat("owe29-o-02", "Elastyczność a utarg", "Elastyczność cenowa popytu")
stat("owe29-o-04", "Lider cenowy", "Koszt krańcowy (MC)")
stat("owe29-o-05", "Zbędna strata społeczna (strata martwa, deadweight loss)", "Monopol", "Nadwyżka konsumenta")
stat("owe29-o-08", "Siła nabywcza pieniądza")
stat("owe29-o-09", "Teoria ilościowa pieniądza (równanie wymiany Fishera)")
stat("owe29-o-11", "Stopa bezrobocia")
stat("owe29-o-13", "Naturalna stopa bezrobocia", "Zasiłek dla bezrobotnych (ubezpieczenie od bezrobocia)")
stat("owe29-o-14", "Mnożnik podatkowy", "Mnożnik (inwestycyjny, wydatkowy)")
stat("owe29-o-15", "Popyt na pieniądz (preferencja płynności)", "Obligacja")
stat("owe29-o-17", "Inkaso dokumentowe")
stat("owe29-o-18", "Księgi rachunkowe i konta", "Należności i zobowiązania")
stat("owe29-o-21", "Obligacja", "Spółki osobowe (KSH)")
stat("owe29-o-22", "Formacje analizy technicznej", "Analiza fundamentalna i techniczna")
stat("owe29-o-28", "Zarządzanie zasobami ludzkimi (HRM)")
stat("owe29-o-29", "Percepcja i błędy percepcji")
stat("owe29-o-30", "Zarządzanie strategiczne i analiza strategiczna", "Analiza SWOT")
stat("owe29-c-01", "Czynniki kształtujące podaż (determinanty podaży)", "Równowaga rynkowa")
stat("owe29-c-03", "Ścieżka cena–konsumpcja", "Krzywa obojętności", "Linia ograniczenia budżetowego")
stat("owe29-c-04", "Równowaga konsumenta (II prawo Gossena)")
stat("owe29-c-05", "Krańcowa stopa technicznej substytucji (MRTS)")
stat("owe29-c-06", "Zysk ekonomiczny (nadzwyczajny)", "Zysk księgowy", "Koszt alternatywny (koszt utraconych możliwości)")
stat("owe29-c-08", "Prawo malejącej użyteczności krańcowej (I prawo Gossena)", "Użyteczność")
stat("owe29-c-09", "Metody liczenia PKB", "Produkt krajowy brutto (PKB)", "Zakupy rządowe a transfery w PKB")
stat("owe29-c-10", "Zagregowana podaż (AS)")
stat("owe29-c-12", "Trylemat (niemożliwa trójca) Mundella–Fleminga", "System kursu płynnego i stałego")
stat("owe29-c-14", "Zarząd waluty (currency board)", "Pożyczkodawca ostatniej instancji")
stat("owe29-c-15", "Spółki osobowe (KSH)", "Organy spółki akcyjnej")
stat("owe29-c-16", "Podwójne opodatkowanie", "Podatek dochodowy od osób prawnych (CIT)")
stat("owe29-c-18", "Franszyza integralna i redukcyjna")
stat("owe29-c-20", "Podatki lokalne", "Elementy konstrukcji podatku")
stat("owe29-c-22", "Polisolokata", "Ubezpieczeniowy fundusz kapitałowy (UFK)")
stat("owe29-c-23", "Przymusowy wykup (squeeze-out) i odkup (sell-out)")
stat("owe29-c-24", "Faktura VAT i KSeF")
stat("owe29-c-25", "Koszty transakcyjne")
stat("owe29-c-26", "Forward guidance")
stat("owe29-c-27", "Rachunek przepływów pieniężnych (cash flow)", "Kredyt obrotowy i inwestycyjny")
stat("owe29-c-28", "Prawa konsumenta", "Ustawa o prawach konsumenta (2014)", "Handel elektroniczny (e-commerce, m-commerce, B2B, B2C)")

# ── weryfikacja statystyk: XXVIII OWE ──
stat("owe28-s-02", "Czynniki kształtujące podaż (determinanty podaży)", "Podaż")
stat("owe28-s-05", "Krótki okres i długi okres", "Koszty stałe (FC)", "Koszty zmienne (VC)")
stat("owe28-s-07", "Konkurencja doskonała")
stat("owe28-s-09", "Aprecjacja i deprecjacja", "Kurs walutowy")
stat("owe28-s-10", "Metody liczenia PKB")
stat("owe28-s-12", "Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS)")
stat("owe28-s-15", "PKB per capita i parytet siły nabywczej (PPP)")
stat("owe28-s-16", "Procent prosty i składany")
stat("owe28-s-19", "Instytucje UE")
stat("owe28-s-24", "Podatki bezpośrednie i pośrednie")
stat("owe28-s-25", "Obligacja", "Rentowność do wykupu (YTM)")
stat("owe28-s-26", "Spółka cywilna")
stat("owe28-s-27", "Podejście systemowe")
stat("owe28-s-28", "Prawa i obowiązki pracownicze", "Kodeks pracy (1974)")
stat("owe28-o-02", "Równowaga konsumenta (II prawo Gossena)")
stat("owe28-o-04", "Cena minimalna", "Nadwyżka (rynkowa)")
stat("owe28-o-05", "Zysk normalny", "Koszty jawne (księgowe) i ukryte (implicite)", "Zysk księgowy", "Konkurencja doskonała")
stat("owe28-o-07", "Rynek funduszy pożyczkowych")
stat("owe28-o-09", "Skutki cła", "Cło")
stat("owe28-o-10", "Amortyzacja", "Inwestycje")
stat("owe28-o-11", "Mnożnik (inwestycyjny, wydatkowy)", "Krańcowa skłonność do konsumpcji (MPC) i oszczędzania (MPS)")
stat("owe28-o-12", "Metody liczenia PKB", "Inwestycje")
stat("owe28-o-13", "Monetaryzm", "Podaż pieniądza (nominalna i realna)", "Zagregowany popyt (AD)")
stat("owe28-o-14", "Prawo Okuna", "Produkt potencjalny i luka PKB (popytowa)")
stat("owe28-o-17", "Kasa Rolniczego Ubezpieczenia Społecznego (KRUS)", "DB, DC i NDC – formuły emerytalne")
stat("owe28-o-18", "Strategia bezpośredniego celu inflacyjnego (BCI)", "Narodowy Bank Polski (NBP)")
stat("owe28-o-19", "Rada Polityki Pieniężnej (RPP)")
stat("owe28-o-20", "Day trading i market timing")
stat("owe28-o-21", "Dywidenda", "Wskaźniki giełdowe – wzory")
stat("owe28-o-22", "Podatek katastralny")
stat("owe28-o-23", "Wartość firmy (goodwill)", "Fuzja i przejęcie (M&A)", "Wartości niematerialne i prawne")
stat("owe28-o-26", "Formy monopolizacji (porozumienia i koncentracje)", "Fuzja i przejęcie (M&A)", "Dywersyfikacja")
stat("owe28-o-28", "Pięć sił Portera")
stat("owe28-c-01", "Popyt indywidualny i rynkowy", "Prawo popytu")
stat("owe28-c-04", "Monopol prawny: patenty i prawa autorskie", "Nadwyżka konsumenta")
stat("owe28-c-05", "Koszty zmienne (VC)", "Koszt krańcowy (MC)", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)")
stat("owe28-c-09", "Funkcja konsumpcji (keynesowska)", "Oszczędności narodowe (prywatne i publiczne)")
stat("owe28-c-10", "Nadwyżka budżetowa", "Oszczędności narodowe (prywatne i publiczne)")
stat("owe28-c-11", "Deficyty bliźniacze", "Saldo obrotów bieżących")
stat("owe28-c-12", "Reguła Taylora")
stat("owe28-c-14", "Stagflacja i slumpflacja")
stat("owe28-c-15", "Rezerwa obowiązkowa")
stat("owe28-c-17", "Zlecenia giełdowe na GPW")
stat("owe28-c-18", "Dywidenda")
stat("owe28-c-19", "Dodatek aktywizacyjny")
stat("owe28-c-20", "Otwarte fundusze emerytalne (OFE)", "2014 – zmiany w OFE i unia bankowa")
stat("owe28-c-21", "Polityka rachunkowości", "Rok obrotowy")
stat("owe28-c-23", "Bezpośrednia likwidacja szkód (BLS)")
stat("owe28-c-24", "Udziały JST w podatkach dochodowych")
stat("owe28-c-25", "Odwrotne obciążenie VAT (reverse charge)")
stat("owe28-c-28", "Ustawa o ochronie konkurencji i konsumentów (2007)", "Kartel", "Urząd Ochrony Konkurencji i Konsumentów (UOKiK)")

# ── weryfikacja statystyk: XXVII OWE ──
stat("owe27-s-01", "Elastyczność cenowa popytu")
stat("owe27-s-02", "Równowaga rynkowa", "Czynniki kształtujące podaż (determinanty podaży)")
stat("owe27-s-03", "Prawo malejącej użyteczności krańcowej (I prawo Gossena)")
stat("owe27-s-08", "Podaż pracy (krzywa zakrzywiona do tyłu)", "Pieniądz a czas wolny – koszt alternatywny czasu")
stat("owe27-s-09", "Model Keynesa (krzyż keynesowski)")
stat("owe27-s-11", "Taksflacja", "Siła nabywcza pieniądza")
stat("owe27-s-13", "Baza monetarna (M0, pieniądz wielkiej mocy)", "Gotówka w obiegu")
stat("owe27-s-14", "Polityka fiskalna (budżetowa)")
stat("owe27-s-15", "Obligacja zerokuponowa", "Wartość pieniądza w czasie")
stat("owe27-s-19", "Kurs krzyżowy")
stat("owe27-s-21", "Faktura VAT i KSeF")
stat("owe27-s-25", "Giełda Papierów Wartościowych w Warszawie (GPW)")
stat("owe27-s-26", "Marketing mix (4P / 7P / 4C)")
stat("owe27-s-28", "Marka (brand) i rebranding")
stat("owe27-s-29", "Typy struktur organizacyjnych")
stat("owe27-o-01", "Krótki okres i długi okres")
stat("owe27-o-03", "Cena minimalna")
stat("owe27-o-08", "Optimum techniczne i optimum ekonomiczne", "Koszt krańcowy (MC)")
stat("owe27-o-09", "Dobro konsumpcyjne, pośrednie i inwestycyjne", "Metody liczenia PKB")
stat("owe27-o-10", "Mnożnik podatkowy", "Mnożnik (inwestycyjny, wydatkowy)")
stat("owe27-o-11", "Oczekiwania adaptacyjne i racjonalne", "Złudzenie pieniądza (iluzja pieniężna)")
stat("owe27-o-12", "Stagflacja i slumpflacja", "Szok podażowy i popytowy", "Zagregowana podaż (AS)")
stat("owe27-o-14", "Bilans banku centralnego")
stat("owe27-o-15", "Agregaty pieniężne (NBP)")
stat("owe27-o-18", "Spekulacja", "Insider trading (wykorzystanie informacji poufnej)")
stat("owe27-o-20", "Rok obrotowy")
stat("owe27-o-22", "ERM II")
stat("owe27-o-24", "Składki na ubezpieczenia społeczne")
stat("owe27-o-25", "Janosikowe")
stat("owe27-c-02", "Dobro neutralne i dobro niechciane (antydobro)", "Krzywa obojętności")
stat("owe27-c-04", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)", "Koszty stałe (FC)")
stat("owe27-c-05", "Warunek maksymalizacji zysku", "Konkurencja doskonała", "Oligopol", "Monopol", "Konkurencja monopolistyczna")
stat("owe27-c-07", "Próg zamknięcia (punkt zamknięcia)", "Zysk ekonomiczny (nadzwyczajny)", "Konkurencja doskonała")
stat("owe27-c-09", "Reguła 70")
stat("owe27-c-10", "Kreacja pieniądza (system rezerwy cząstkowej)", "Operacje otwartego rynku (OOR)", "Rezerwa obowiązkowa")
stat("owe27-c-12", "Hipoteza dochodu względnego i efekt rygla (zapadki)")
stat("owe27-c-13", "Efekt Fishera")
stat("owe27-c-14", "Bezrobocie strukturalne")
stat("owe27-c-15", "Teoria realnego cyklu koniunkturalnego")
stat("owe27-c-16", "Światowa Organizacja Handlu (WTO)")
stat("owe27-c-17", "Efekt cappuccino", "Koszty i korzyści przyjęcia euro")
stat("owe27-c-20", "Podatek progresywny, proporcjonalny (liniowy) i regresywny", "Podatek dochodowy od osób prawnych (CIT)")
stat("owe27-c-21", "Gwarancje de minimis", "Bank Gospodarstwa Krajowego (BGK)")
stat("owe27-c-22", "Fundusz inwestycyjny otwarty (FIO) i zamknięty (FIZ)")
stat("owe27-c-23", "Procedura nadmiernego deficytu (EDP)")
stat("owe27-c-24", "Prawo własności przemysłowej (2000)", "Własność intelektualna")
stat("owe27-c-25", "Dyfuzja innowacji")
stat("owe27-c-26", "Strategie cenowe")
stat("owe27-c-27", "Wartość pieniądza w czasie")
stat("owe27-c-28", "Dumping", "Bariery wejścia")

# ── weryfikacja statystyk: XXVI OWE ──
stat("owe26-s-01", "Czynniki wytwórcze (czynniki produkcji)")
stat("owe26-s-03", "Linia ograniczenia budżetowego")
stat("owe26-s-04", "Elastyczność a utarg", "Utarg (przychód) całkowity, przeciętny i krańcowy")
stat("owe26-s-09", "Inflacja popytowa i kosztowa", "Polityka pieniężna – cele i instrumenty")
stat("owe26-s-11", "PKB nominalny i realny", "Deflator PKB")
stat("owe26-s-13", "Kreacja pieniądza (system rezerwy cząstkowej)", "Bank komercyjny (uniwersalny)")
stat("owe26-s-16", "IKE, IKZE i PPE", "System emerytalny w Polsce (od 1999 r.)")
stat("owe26-s-17", "Jastrzębie i gołębie", "Rada Polityki Pieniężnej (RPP)")
stat("owe26-s-20", "WIG")
stat("owe26-s-21", "Podatek od towarów i usług (VAT)")
stat("owe26-s-22", "Klasyfikacja wydatków COFOG", "Sektor finansów publicznych")
stat("owe26-s-23", "Reguły finansowe JST")
stat("owe26-s-25", "Umowa o pracę i umowy cywilnoprawne")
stat("owe26-s-27", "Funkcje zarządzania", "Klasyczne podejście do zarządzania")
stat("owe26-s-29", "Otoczenie organizacji", "Planowanie scenariuszowe", "Metody twórczego rozwiązywania problemów")
stat("owe26-s-30", "Logistyka i łańcuch dostaw (SCM)")
stat("owe26-o-01", "Krzywa możliwości produkcyjnych (granica możliwości produkcyjnych)")
stat("owe26-o-02", "Elastyczność a utarg", "Utarg (przychód) całkowity, przeciętny i krańcowy")
stat("owe26-o-03", "Nadwyżka konsumenta")
stat("owe26-o-04", "Ekonomia normatywna", "Ekonomia pozytywna")
stat("owe26-o-05", "Zysk ekonomiczny (nadzwyczajny)", "Monopol", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)")
stat("owe26-o-06", "Elastyczność cenowa podaży")
stat("owe26-o-08", "Prawo malejących przychodów (malejącej produktywności krańcowej)", "Koszty zmienne (VC)")
stat("owe26-o-09", "Produkt narodowy netto (PNN)", "Produkt narodowy brutto (PNB, DNB)", "Dochód narodowy", "Dochód osobisty i dochód rozporządzalny")
stat("owe26-o-11", "Transfery socjalne", "Budżet państwa")
stat("owe26-o-12", "Kalecki Michał", "Keynesizm")
stat("owe26-o-13", "Bezrobocie cykliczne (koniunkturalne, keynesowskie)", "Naturalna stopa bezrobocia")
stat("owe26-o-16", "Abolicja podatkowa")
stat("owe26-o-17", "Audyt wewnętrzny i biegły rewident")
stat("owe26-o-18", "Bilans")
stat("owe26-o-19", "Koszty według rodzajów")
stat("owe26-o-20", "Składki na ubezpieczenia społeczne")
stat("owe26-o-21", "Analiza fundamentalna i techniczna")
stat("owe26-o-22", "Kontrakt terminowy (futures i forward)", "Dźwignia operacyjna i finansowa (DOL, DFL)")
stat("owe26-o-23", "Obligacja zerokuponowa")
stat("owe26-o-25", "Ubezpieczeniowy fundusz kapitałowy (UFK)", "Ryzyko inwestycyjne")
stat("owe26-o-29", "Marketing")
stat("owe26-c-01", "Czynniki kształtujące podaż (determinanty podaży)")
stat("owe26-c-04", "Koszty zmienne (VC)", "Koszt krańcowy (MC)", "Koszt całkowity (TC) i przeciętny koszt całkowity (ATC)", "Krótkookresowe i długookresowe krzywe kosztów")
stat("owe26-c-05", "Zysk normalny", "Próg zamknięcia (punkt zamknięcia)")
stat("owe26-c-06", "Renta gruntowa", "Renta ekonomiczna")
stat("owe26-c-09", "Dochód osobisty i dochód rozporządzalny")
stat("owe26-c-10", "Podaż pieniądza (nominalna i realna)", "Zagregowany popyt (AD)")
stat("owe26-c-11", "Polityka dyskrecjonalna", "Rezerwa obowiązkowa", "Podatek akcyzowy (akcyza)")
stat("owe26-c-13", "Parytet stóp procentowych", "Odpływy kapitałowe netto (NCO)")
stat("owe26-c-14", "Cykl koniunkturalny", "Inwestycje")
stat("owe26-c-15", "Zagregowana podaż (AS)", "Płaca nominalna i realna", "Wydajność pracy (produkcyjność) i jej czynniki")
stat("owe26-c-17", "Pakt fiskalny (2012)")
stat("owe26-c-18", "Wskaźnik cena/wartość księgowa (P/BV)", "Wskaźnik cena/zysk (P/E)")
stat("owe26-c-19", "Agio (nadwyżka emisyjna)", "Kapitał zakładowy, zapasowy i rezerwowy")
stat("owe26-c-20", "Podatki lokalne", "Podatek od czynności cywilnoprawnych (PCC)", "Uproszczone formy ewidencji")
stat("owe26-c-23", "Biuro Informacji Kredytowej (BIK)", "Biura informacji gospodarczej (BIG)")
stat("owe26-c-24", "Zasady rachunkowości")
stat("owe26-c-25", "Sekurytyzacja")

# ── weryfikacja statystyk: XXV OWE ──
stat("owe25-s-02", "Koszt alternatywny (koszt utraconych możliwości)", "Koszty jawne (księgowe) i ukryte (implicite)")
stat("owe25-s-03", "Ścieżka dochód–konsumpcja i krzywa Engla", "Dobro normalne")
stat("owe25-s-06", "Monopol", "Utarg (przychód) całkowity, przeciętny i krańcowy")
stat("owe25-s-07", "Produkt narodowy brutto (PNB, DNB)", "Metody liczenia PKB")
stat("owe25-s-11", "Inwestycje", "Krańcowa efektywność kapitału (Keynes)")
stat("owe25-s-14", "Laissez-faire", "Rola państwa w gospodarce")
stat("owe25-s-16", "Polityka ekspansywna i restrykcyjna", "Model Mundella–Fleminga")
stat("owe25-s-19", "Podatek dochodowy od osób fizycznych (PIT)")
stat("owe25-s-22", "Spekulacja", "Insider trading (wykorzystanie informacji poufnej)")
stat("owe25-s-24", "Polityka konkurencji (antymonopolowa)")
stat("owe25-s-26", "Zabezpieczenia kredytu")
stat("owe25-s-27", "Funkcje zarządzania", "Planowanie")
stat("owe25-s-29", "Siła rynkowa i wskaźnik Lernera")
stat("owe25-s-30", "Typy struktur organizacyjnych", "Centralizacja i decentralizacja")
stat("owe25-s-21", "Cel inflacyjny NBP", "Narodowy Bank Polski (NBP)")
stat("owe25-o-01", "Krzywa możliwości produkcyjnych (granica możliwości produkcyjnych)")
stat("owe25-o-02", "Rozkład ciężaru podatku (incydencja podatkowa)", "Podatek akcyzowy (akcyza)")
stat("owe25-o-03", "Czynniki kształtujące podaż (determinanty podaży)")
stat("owe25-o-04", "Zagregowany popyt (AD)")
stat("owe25-o-07", "Przychody (efekty) skali", "Korzyści skali (ekonomia skali)")
stat("owe25-o-09", "Próg zamknięcia (punkt zamknięcia)", "Koszty zmienne (VC)")
stat("owe25-o-12", "PKB per capita i parytet siły nabywczej (PPP)")
stat("owe25-o-13", "Próg rentowności (BEP)")
stat("owe25-o-15", "Keynesizm", "Polityka fiskalna (budżetowa)")
stat("owe25-o-16", "Organy spółki akcyjnej")
stat("owe25-o-18", "Odpowiedzialność kontraktowa i deliktowa", "Ubezpieczenie")
stat("owe25-o-19", "Mnożnik kreacji pieniądza", "Baza monetarna (M0, pieniądz wielkiej mocy)")
stat("owe25-o-20", "Podatek od towarów i usług (VAT)", "Stawki VAT w Polsce")
stat("owe25-o-21", "Reguły finansowe JST", "Samorząd terytorialny w Polsce")
stat("owe25-o-22", "Polityka rachunkowości", "Sprawozdanie finansowe")
stat("owe25-o-28", "Rachunek przepływów pieniężnych (cash flow)")
stat("owe25-o-30", "Zasoby organizacji: twarde i miękkie")
stat("owe25-c-01", "Rzadkość", "Pieniądz a czas wolny – koszt alternatywny czasu", "Koszt alternatywny (koszt utraconych możliwości)")
stat("owe25-c-02", "Elastyczność dochodowa popytu", "Dobro normalne")
stat("owe25-c-03", "Kontrola czynszów", "Elastyczność cenowa podaży", "Cena maksymalna")
stat("owe25-c-05", "Warunek maksymalizacji zysku", "Koszt krańcowy (MC)", "Utarg (przychód) całkowity, przeciętny i krańcowy")
stat("owe25-c-06", "Wartość krańcowego produktu pracy (VMPL) i przychód z krańcowego produktu (MRPL)", "Krańcowy koszt pracy (MCL)")
stat("owe25-c-09", "Przewaga komparatywna (względna)", "Koszt alternatywny (koszt utraconych możliwości)")
stat("owe25-c-11", "Histereza bezrobocia", "Model insiderów–outsiderów")
stat("owe25-c-13", "Inflacja bazowa")
stat("owe25-c-15", "Bilans płatniczy", "Aprecjacja i deprecjacja", "Kurs walutowy")
stat("owe25-c-18", "Uproszczone formy ewidencji", "Skala podatkowa PIT")
stat("owe25-c-19", "Składki na ubezpieczenia społeczne", "Ubezpieczenia społeczne (ZUS)")
stat("owe25-c-20", "Regionalne izby obrachunkowe (RIO)", "Samorząd terytorialny w Polsce")
stat("owe25-c-22", "Wewnętrzna stopa zwrotu (IRR) i MIRR")
stat("owe25-c-23", "Dywidenda", "Wskaźniki giełdowe – wzory")
stat("owe25-c-24", "Finanse behawioralne", "Heurystyki i efekt ramowania")
stat("owe25-c-26", "Project finance")
stat("owe25-c-28", "Teoria cyklu życia (Hersey i Blanchard)", "Podejście sytuacyjne")
stat("owe25-c-29", "Wrogie przejęcie i metody obrony")

# ── weryfikacja statystyk: XXIV OWE ──
stat("owe24-s-05", "Dobro Veblena (efekt Veblena)", "Dobro luksusowe (wyższego rzędu)")
stat("owe24-s-06", "Bezrobocie dobrowolne i przymusowe")
stat("owe24-s-08", "Amortyzacja", "Inwestycje")
stat("owe24-s-11", "Monopson")
stat("owe24-s-13", "Obligacja", "Rentowność do wykupu (YTM)")
stat("owe24-s-15", "Efekt wypychania (crowding out)", "Deficyt budżetowy i deficyt sektora finansów publicznych")
stat("owe24-s-17", "Stagflacja i slumpflacja")
stat("owe24-s-18", "Bilans płatniczy")
stat("owe24-s-19", "Dochody i wydatki budżetu państwa", "Podatek akcyzowy (akcyza)")
stat("owe24-s-20", "Leasing")
stat("owe24-s-21", "Giełda Papierów Wartościowych w Warszawie (GPW)")
stat("owe24-s-22", "Towarzystwo ubezpieczeń wzajemnych (TUW)")
stat("owe24-s-23", "Kontrakt terminowy (futures i forward)", "WIG20")
stat("owe24-s-24", "Bony skarbowe", "Ministerstwo Finansów (MF)")
stat("owe24-s-25", "Naukowe zarządzanie (F.W. Taylor)", "Motywacja")
stat("owe24-s-26", "Faktoring")
stat("owe24-s-30", "Outsourcing")
stat("owe24-o-02", "Elastyczność dochodowa popytu")
stat("owe24-o-03", "Krzywa obojętności", "Krańcowa stopa substytucji (MRS)")
stat("owe24-o-04", "Izokwanta", "Krańcowa stopa technicznej substytucji (MRTS)")
stat("owe24-o-05", "Krzywa podaży firmy doskonale konkurencyjnej", "Koszt krańcowy (MC)")
stat("owe24-o-09", "Wartość dodana", "Metody liczenia PKB")
stat("owe24-o-10", "Model Keynesa (krzyż keynesowski)", "Oszczędności narodowe (prywatne i publiczne)")
stat("owe24-o-13", "Hiperinflacja")
stat("owe24-o-15", "Model Mundella–Fleminga", "System kursu płynnego i stałego")
stat("owe24-o-17", "POLONIA", "Rynek międzybankowy")
stat("owe24-o-18", "Koszty uzyskania przychodów", "Działalność badawczo-rozwojowa (B+R)")
stat("owe24-o-19", "SKOK")
stat("owe24-o-20", "Analiza fundamentalna i techniczna")
stat("owe24-o-23", "Pieniądz elektroniczny i karta płatnicza")
stat("owe24-o-25", "Polityka personalna: model sita i model kapitału ludzkiego")
stat("owe24-o-26", "Program leniency (łagodzenia kar)", "Kartel")
stat("owe24-o-28", "Style kierowania: autokratyczny, demokratyczny, liberalny", "Motywacja")
stat("owe24-c-01", "Krzywa możliwości produkcyjnych (granica możliwości produkcyjnych)", "Koszt alternatywny (koszt utraconych możliwości)")
stat("owe24-c-03", "Optimum producenta (kombinacja najtańsza)", "Produkt całkowity, przeciętny i krańcowy")
stat("owe24-c-05", "Prawo popytu", "Ceteris paribus", "Czynniki kształtujące popyt (determinanty popytu)")
stat("owe24-c-08", "Wartość krańcowego produktu pracy (VMPL) i przychód z krańcowego produktu (MRPL)", "Warunek maksymalizacji zysku")
stat("owe24-c-09", "Hipoteza dochodu permanentnego", "Friedman Milton")
stat("owe24-c-11", "Płace efektywnościowe (motywujące)")
stat("owe24-c-14", "Deficyty bliźniacze", "Deficyt budżetowy i deficyt sektora finansów publicznych")
stat("owe24-c-15", "Saldo obrotów bieżących", "Bilans handlowy")
stat("owe24-c-16", "CEIDG i KRS", "Spółki osobowe (KSH)")
stat("owe24-c-18", "Kapitał obrotowy netto", "Kapitał stały i obrotowy netto")
stat("owe24-c-19", "Elementy konstrukcji podatku")
stat("owe24-c-20", "Aktuariusz")
stat("owe24-c-21", "Upadłość i restrukturyzacja")
stat("owe24-c-22", "Podatek od zysków kapitałowych („podatek Belki”)", "Wycena zapasów (rozchodu)")
stat("owe24-c-23", "Formacje analizy technicznej")
stat("owe24-c-25", "Rezerwy walutowe (oficjalne aktywa rezerwowe)", "Polityka kursowa")
stat("owe24-c-26", "Concierge")
stat("owe24-c-27", "Narzędzia jakości")
stat("owe24-c-29", "Organizowanie i struktura organizacyjna", "Szczeble zarządzania")
