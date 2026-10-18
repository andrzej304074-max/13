#!/usr/bin/env python3
"""Klasyfikacja pytań testowych, esejów i zadań OWE: czy dotyczą hasła przewodniego SWOJEJ edycji.

Metoda: słowa kluczowe (rdzenie wyrazów) hasła każdej edycji XXI–XXXIX szukane w treści pytania (bez odpowiedzi
i objaśnień – dawały dużo fałszywych trafień), w temacie eseju, w treści i poleceniach zadania. Wyniki graniczne
poprawione ręcznie w data/olimpiada/theme-overrides.json ({"id": true|false}).

Wynik: data/olimpiada/theme.json – {"questions": [id…], "open": [id…]} (lista identyfikatorów „z hasła”) + raport.
Uruchom: python3 -I tools/otwarte/theme.py [--show ED]   (--show wypisuje pytania edycji z oceną do przeglądu)
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

TRADE = [r"handl\w* (zagraniczn|międzynarodow)", r"\bcł(o|a|em|u)\b", r"\bceł\b", r"celn", r"kontyngent", r"protekcjon",
         r"\beksport", r"\bimport", r"przewag\w* (komparatywn|absolutn|względn)", r"koszt\w* komparatywn", r"dumping",
         r"\bWTO\b", r"\bGATT\b", r"terms of trade", r"bilans\w* handlow", r"wolny handel|wolnego handlu|wolnym handl",
         r"barier\w* (handlow|pozataryfow)", r"taryf", r"subsydi\w* eksport", r"ricard", r"heckscher", r"liberalizac\w* handl",
         r"wymian\w* (handlow|międzynarodow)", r"embarg", r"samoograniczeni"]

KEYWORDS: dict[int, list[str]] = {
    21: [r"gospodarstw\w* domow", r"konsument", r"konsumpc", r"oszczędz", r"oszczędnoś", r"użyteczn", r"ubóstw",
         r"poziom\w* życia", r"budżet\w* (domow|rodzin|konsument)", r"dochod\w* (rozporządzaln|osobist|realn)",
         r"lokat", r"kredyt\w* (konsumpc|hipoteczn|mieszkani)", r"prawo engla|engla", r"krzyw\w* obojętn", r"ograniczeni\w* budżet"],
    22: [r"środowisk", r"ekolog", r"zanieczyszcz", r"emisj\w* (gaz|co2|zanieczy|dwutlen)", r"efekt\w* zewnętrzn", r"klimat",
         r"odnawialn", r"zasob\w* naturaln", r"zrównoważon", r"coase", r"recykling", r"opłat\w* (produktow|ekolog|emisyj)",
         r"podat\w* pigou", r"pigou", r"surowc\w* naturaln", r"energ\w* (odnawialn|jądrow|wiatr|słoneczn)", r"handel emisj|uprawnie\w* do emisji"],
    23: [r"koniunktur", r"cykl\w* (koniunk|gospodar)", r"recesj", r"kryzys", r"ożywieni", r"depresj", r"stabilizator",
         r"antycykl", r"procykl", r"luk\w* (pkb|produkcyjn|inflacyjn|deflacyjn|recesyjn)", r"mnożnik", r"okuna",
         r"bezroboci\w* (cykliczn|koniunktur)", r"spowolnieni", r"boom", r"wahani\w* (gospodar|koniunkt|cykliczn|aktywn)"],
    24: [r"pieni(ądz|ężn|ędz)", r"inflacj", r"\bbank", r"kredyt", r"lokat", r"odset", r"stop\w* procentow", r"kurs\w* walut",
         r"obligacj", r"\bakcj", r"giełd", r"ubezpiecz", r"kart\w* (płatnicz|kredytow|debetow)", r"oszczędz", r"walut",
         r"bon\w* skarbow", r"weksl", r"dyskont", r"kapitalizac", r"emerytal", r"fundusz\w* inwestycyjn", r"rat\w* kredyt"],
    25: [r"kryzys", r"regulac", r"nadz(ór|oru|orcz)", r"globaliz", r"dług\w* publiczn", r"interwenc", r"liberal", r"\bład",
         r"keynes", r"monetary", r"neoliberal", r"bank\w* centraln", r"deficyt", r"polityk\w* (fiskaln|pieniężn|monetarn)",
         r"bail.?out", r"too big to fail", r"bank\w* (upadł|ratow)", r"system\w* finansow"],
    26: [r"nierównowag", r"deficyt", r"\bdług", r"nadwyżk", r"niedob(ór|or)", r"bilans\w* płatnicz", r"\bsald",
         r"bezroboc", r"inflacj", r"\bluk\w*", r"cen\w* (maksymaln|minimaln)", r"równowag"],
    27: [r"\beuro\b", r"strefa euro|strefy euro|strefie euro|strefę euro", r"\bEBC\b", r"europejsk\w* bank\w* centraln",
         r"uni\w* (walutow|gospodarcz\w* i walutow)", r"konwergencj", r"maastricht", r"\bERM", r"kurs\w* walut",
         r"wspóln\w* walut", r"optymaln\w* obszar", r"pakt\w* stabilności", r"\bUGW\b", r"kurs\w* (konwersji|wymiany)", r"dewaluac|rewaluac|deprecjac|aprecjac"],
    28: [r"transformac", r"prywatyzac", r"balcerowicz", r"centralnie planow", r"nakazow", r"wolnoś\w* gospodarcz",
         r"swobod\w* działalności", r"przedsiębiorczo", r"\b1989\b", r"deregulac", r"reform", r"gospodark\w* rynkow",
         r"socjali", r"hiperinflac", r"terapi\w* szokow", r"własnoś\w* (prywatn|państwow)", r"liberalizac"],
    29: [r"nierównoś", r"gini", r"lorenz", r"ubóstw", r"redystrybuc", r"zróżnicowani\w* (dochod|płac|majątk)",
         r"rozwarstwi", r"wykluczeni", r"\btransfer", r"progresj|progresywn", r"zasiłk", r"płac\w* minimaln", r"sprawiedliw",
         r"rozkład\w* dochod", r"minimum (socjaln|egzysten)", r"kuznets", r"dochód podstawowy|dochodu podstawowego"],
    30: [r"państw", r"\brząd", r"budżet\w* państw", r"podat", r"polityk\w* fiskaln", r"wydatk\w* (publiczn|budżet|rządow|państw)",
         r"dob(ro|ra|rem|er)\w* publiczn", r"regulac", r"interwenc", r"zawodnoś", r"efekt\w* zewnętrzn", r"monopol\w* naturaln",
         r"cł(o|a)\b", r"subsydi|dotac", r"cen\w* (maksymaln|minimaln|urzędow)", r"sektor\w* publiczn", r"dług\w* publiczn", r"deficyt"],
    31: [r"rynk?\w* pracy", r"bezroboc", r"\bpłac", r"wynagrodz", r"zatrudni", r"pracowni", r"pracodaw", r"związk\w* zawodow",
         r"podaż\w* pracy", r"popyt\w* na pracę", r"kapitał\w* ludzk", r"phillips", r"migrac", r"umow\w* o (pracę|dzieło)|umowa zleceni",
         r"aktywnoś\w* zawodow", r"siła robocz|sił\w* robocz", r"produkt\w* krańcow\w* pracy", r"monopson", r"zasiłk"],
    32: TRADE,
    33: [r"rewolucj", r"technolog", r"cyfryz|cyfrow", r"automatyz", r"robot", r"sztuczn\w* inteligencj", r"internet",
         r"innowac", r"postęp\w* techn", r"ekonomi\w* współdziel", r"kryptowalut|bitcoin", r"blockchain", r"e-commerce|handel elektroniczn",
         r"platform", r"\bdan(e|ych) (osobow|cyfrow)|big data", r"start.?up", r"przemysł\w* 4"],
    34: [r"pandemi", r"covid", r"kryzys", r"recesj", r"lockdown", r"\bszok", r"stabilizator", r"pakiet\w* (pomocow|stymul|antykryz)",
         r"tarcz\w* (antykryz|finansow)", r"luzowani\w* ilościow", r"pułapk\w* płynności", r"zamrożeni", r"epidemi",
         r"pomoc\w* publiczn", r"spowolnieni", r"antycykl"],
    35: [r"giełd", r"\bakcj", r"obligacj", r"\bGPW\b", r"\bWIG", r"\bIPO\b", r"rynk?\w* kapitałow", r"papier\w* wartościow",
         r"dywidend", r"kontrakt\w* (terminow|futures)", r"futures", r"\bopcj", r"makler|brokers", r"notowa", r"fundusz\w* inwestycyjn",
         r"\bP/E\b|cena/zysk", r"kapitalizac\w* (rynkow|giełd)", r"emisj\w* akcji", r"spółk\w* (akcyjn|publiczn)", r"hossa|bessa",
         r"instrument\w* pochodn|derywat", r"towarow\w* giełd"],
    36: [r"inflacj", r"deflacj", r"\bCPI\b", r"deflator", r"poziom\w* cen", r"stop\w* procentow", r"\bNBP\b", r"cel\w* inflacyjn",
         r"sił\w* nabywcz", r"realn\w* (płac|dochod|stop|wynagrodz)", r"indeksac", r"hiperinflac", r"stagflac", r"phillips",
         r"wskaźnik\w* cen", r"wzrost\w* cen", r"bank\w* centraln", r"polityk\w* pieniężn|polityk\w* monetarn", r"podaż\w* pieniądza",
         r"fisher", r"oczekiwa\w* inflacyjn"],
    37: [r"kapitał\w* społeczn", r"zaufani", r"społeczeństw\w* obywatelsk", r"sieci\w* społeczn", r"\bnorm\w* społeczn",
         r"instytucj\w* (formaln|nieformaln)", r"putnam", r"coleman", r"bourdieu", r"kooperac", r"współprac", r"organizacj\w* pozarządow",
         r"wolontaria", r"altruizm", r"dylemat\w* więźnia", r"gapowicz", r"dob(ro|ra)\w* wspóln", r"teori\w* gier"],
    38: [r"uni\w* europejsk", r"\bUE\b", r"unijn", r"wspóln\w* rynk", r"jednolit\w* rynk", r"fundusz\w* (europejsk|strukturaln|spójności|unijn)",
         r"akcesj", r"integracj", r"\beuro\b", r"komisj\w* europejsk", r"parlament\w* europejsk", r"rad\w* (unii|europejsk)",
         r"swobod\w* przepływ", r"polityk\w* spójności", r"\bWPR\b|wspóln\w* polityk\w* roln", r"strefa euro|strefy euro|strefie euro",
         r"\bEBC\b", r"traktat", r"schengen", r"uni\w* celn"],
    39: TRADE,
}

_RX = {ed: re.compile("|".join(f"(?:{k})" for k in kws), re.I) for ed, kws in KEYWORDS.items()}


def hits(ed: int, text: str) -> list[str]:
    rx = _RX.get(ed)
    return sorted({m.group(0).lower() for m in rx.finditer(text)}) if rx else []


def blocks_text(blocks) -> str:
    out = []
    for b in blocks or []:
        if b.get("t") in ("p", "f"):
            out.append(b.get("x", ""))
        elif b.get("t") == "ul":
            out += b.get("items", [])
        elif b.get("t") == "table":
            out += [" ".join(b.get("head", []))] + [" ".join(r) for r in b.get("rows", [])]
    return " ".join(out)


def main():
    overrides = json.load(open(os.path.join(ROOT, "data/olimpiada/theme-overrides.json")))
    show = int(sys.argv[sys.argv.index("--show") + 1]) if "--show" in sys.argv else None
    q_ids, open_ids, report = [], [], {}
    for f in sorted(glob.glob(os.path.join(ROOT, "data/questions/owe-*.json"))):
        ed = int(os.path.basename(f).split("-")[1])
        for q in json.load(open(f)):
            text = q["question"]
            h = hits(ed, text)
            yes = overrides.get(q["id"], bool(h))
            if yes:
                q_ids.append(q["id"])
            r = report.setdefault(ed, [0, 0, 0, 0])
            r[0] += 1
            r[1] += yes
            if show == ed:
                mark = "TAK" if yes else "nie"
                ov = " (ręcznie)" if q["id"] in overrides else ""
                print(f"{mark}{ov} {q['id']}: {q['question'][:110]} | {', '.join(h)}")
    for f in sorted(glob.glob(os.path.join(ROOT, "data/otwarte/sets/*.json"))):
        s = json.load(open(f))
        items = [(e["id"], " ".join(t["title"] for t in e["topics"])) for e in s["essays"]]
        if s.get("task"):
            t = s["task"]
            items.append((t["id"], t["title"] + " " + blocks_text(t["intro"]) + " " + " ".join(p["prompt"] for p in t["parts"])))
        for iid, text in items:
            h = hits(s["ed"], text)
            yes = overrides.get(iid, bool(h))
            if yes:
                open_ids.append(iid)
            r = report.setdefault(s["ed"], [0, 0, 0, 0])
            r[2] += 1
            r[3] += yes
            if show == s["ed"]:
                print(f"{'TAK' if yes else 'nie'}{' (ręcznie)' if iid in overrides else ''} {iid}: {text[:110]} | {', '.join(h)}")
    unknown = set(overrides) - set(q_ids) - set(open_ids) - {k for k, v in overrides.items() if v is False}
    if unknown:
        sys.exit(f"nieznane identyfikatory w theme-overrides.json: {sorted(unknown)}")
    out = {"questions": sorted(q_ids), "open": sorted(open_ids)}
    json.dump(out, open(os.path.join(ROOT, "data/olimpiada/theme.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    if show is None:
        print("edycja  pytania  z hasła   %    | eseje+zadania  z hasła")
        for ed, (n, y, on, oy) in sorted(report.items()):
            print(f"{ed:>6} {n:>8} {y:>8} {y / n * 100 if n else 0:5.1f} | {on:>13} {oy:>8}")
        print(f"razem pytań z hasła: {len(q_ids)}, esejów/zadań: {len(open_ids)}")


if __name__ == "__main__":
    main()
