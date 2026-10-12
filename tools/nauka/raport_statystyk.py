# -*- coding: utf-8 -*-
"""Raport statystyk pytań OWE: tools/nauka/RAPORT-STATYSTYK.md (dane: data/nauka/owe-stats.json z build_course.py).

Użycie: python3 -I tools/nauka/raport_statystyk.py
"""
import importlib.util, json, os
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
d = json.load(open(os.path.join(ROOT, "data/nauka/owe-stats.json"), encoding="utf-8"))
c = json.load(open(os.path.join(ROOT, "data/nauka/course.json"), encoding="utf-8"))
I, T = c["items"], {t["id"]: t["title"] for t in c["topics"]}
U = {u["id"]: u["title"] for u in c["units"]}
s = importlib.util.spec_from_file_location("p", os.path.join(HERE, "pojecia_pytan_poprawki.py"))
P = importlib.util.module_from_spec(s); s.loader.exec_module(P)

n = len(d)
types = Counter(r["t"] for r in d)
out = ["# Raport: statystyki pytań OWE (XXI–XXXIX)", "",
       "Dane zakładki „Pojęcia → Statystyki pytań OWE” (`data/nauka/owe-stats.json`, generuje `tools/nauka/build_course.py`).", "",
       "**Jak liczone:**",
       "- dział i zagadnienie pytania – lekcja kursu, do której build przydziela pytanie (jedna na pytanie, więc procenty działów sumują się do 100);",
       "- pojęcia pytania – hasła wykryte w treści i w poprawnych odpowiedziach (`tools/nauka/pojecia_pytan.py`, ręczne korekty w "
       "`pojecia_pytan_poprawki.py` z przeglądu wszystkich pytań XXI–XXXIX); pojęcia dodane do pytania tylko po to, by lekcja omówiła "
       "błędne odpowiedzi, nie liczą się;",
       "- hasła ogólne, będące zwykle tłem pytania (`STAT_GENERIC`), liczą się tylko wtedy, gdy pytanie nie dotyczy niczego konkretniejszego: "
       + ", ".join(sorted(P.STAT_GENERIC)) + ";",
       "- podobne pytania z różnych edycji liczą się osobno (3 pytania o to samo pojęcie = 3);",
       "- gdzie automat się mylił, obowiązuje ręczna lista pojęć pytania (`STAT_FIX`, helper `stat()` w `pojecia_pytan_poprawki.py`); "
       "pierwsze pojęcie z listy wyznacza dział i zagadnienie pytania.", "",
       "## Podsumowanie", "",
       f"- Pytań: {n} (jednokrotnego wyboru: {types['single']}, wielokrotnego: {types['multi']}).",
       f"- Pytań bez rozpoznanego pojęcia: {sum(1 for r in d if not r['items'])}.",
       f"- Różnych pojęć, o które pytano: {len(Counter(i for r in d for i in r['items']))}; średnio {sum(len(r['items']) for r in d) / n:.2f} pojęcia na pytanie.", "",
       "## Działy", "", "| Dział | Pytań | % | jednokrotny | wielokrotny |", "|---|---|---|---|---|"]
ROMAN = {21: "XXI", 22: "XXII", 23: "XXIII", 24: "XXIV", 25: "XXV", 26: "XXVI", 27: "XXVII", 28: "XXVIII", 29: "XXIX", 30: "XXX",
         31: "XXXI", 32: "XXXII", 33: "XXXIII", 34: "XXXIV", 35: "XXXV", 36: "XXXVI", 37: "XXXVII", 38: "XXXVIII", 39: "XXXIX"}
fixed = Counter(int(q[3:5]) for q in P.STAT_FIX)
by_ed = Counter(r["ed"] for r in d)
by_title = {v["t"]: k for k, v in I.items()}
ic = Counter(i for r in d for i in r["items"])
NEW = ["Postęp techniczny", "Deflacja długu (I. Fisher)", "Papiery dyskontowe", "Klasyczne podejście do zarządzania", "Program leniency (łagodzenia kar)"]
ver = ["## Weryfikacja ręczna (12.10.2026)", "",
        f"Przejrzano ręcznie wszystkie {n} pytań, edycja po edycji (XXXIX → XXI): treść, wszystkie odpowiedzi z zaznaczeniem poprawnych, "
        f"wykryte pojęcia oraz dział i zagadnienie. Poprawiono {len(P.STAT_FIX)} pytań ({len(P.STAT_FIX) / n * 100:.0f}%); pozostałe automat przypisał dobrze.", "",
        "| Edycja | Pytań | Poprawionych |", "|---|---|---|"]
ver += [f"| {ROMAN[e]} | {by_ed[e]} | {fixed[e]} |" for e in sorted(by_ed, reverse=True)]
ver += ["", "**Nowe hasła** (pytania dotyczyły czegoś, czego nie było w słowniku; fakty potwierdzone w 2 źródłach – `tools/nauka/zrozum/WERYFIKACJA.md`, "
        "każde omówione w lekcji „Zrozumienie”):", ""]
ver += [f"- {t} – {ic[by_title[t]]} pyt." for t in NEW]
ver += ["", "**Typowe błędy automatu:**",
        "- pojęcia-tło z treści liczone jako temat pytania (np. NBP, „Skarb Państwa”, inflacja, stopa procentowa, równowaga rynkowa w zadaniach o czymś innym);",
        "- pojęcie poboczne decydowało o dziale (np. pytanie o próg zamknięcia zaliczone do kosztów zmiennych, pytanie o histerezę do cyklu koniunkturalnego);",
        "- ogólne hasło zamiast konkretnego (np. „Podatek” zamiast „Klin podatkowy”, „Popyt” zamiast „Czynniki kształtujące popyt”, „Inwestycje” zamiast „Krańcowa efektywność kapitału”);",
        "- dopasowania słów w innym znaczeniu (np. „strategia parasola” → „Fundusz parasolowy”, „nadgodziny” → „Urlop wypoczynkowy i czas pracy” w pytaniu o krótki okres, „agent ubezpieczeniowy” → „Ubezpieczenie” w pytaniu o bezrobocie strukturalne).", "",
        "**Przypisania dyskusyjne** (brak osobnego hasła – za mało pytań lub brak 2 rzetelnych źródeł):",
        "- owe31-o-22 „nowy konserwatyzm fiskalny” → Rola państwa w gospodarce, Funkcje finansów publicznych (Musgrave);",
        "- owe31-c-05 „krzywa wykonalności” (Stiglitz) → Dobra publiczne, Krzywa możliwości produkcyjnych;",
        "- owe24-o-09 „produkt globalny” → Wartość dodana, Metody liczenia PKB;",
        "- owe22-c-27 „strategia parasola” (cenowa) → Strategie cenowe;",
        "- owe21-c-16 „rezerwa rewaluacyjna NBP” → Bilans banku centralnego, Rezerwy walutowe.", ""]
k = out.index("## Działy")
out[k:k] = ver
tc = Counter(r["topic"] for r in d)
for t, k in tc.most_common():
    out.append(f"| {T.get(t, 'nieprzypisane')} | {k} | {k / n * 100:.1f}% | {sum(1 for r in d if r['topic'] == t and r['t'] == 'single')} | {sum(1 for r in d if r['topic'] == t and r['t'] == 'multi')} |")
out += ["", "## Zagadnienia (30 najczęstszych)", "", "| Zagadnienie | Dział | Pytań |", "|---|---|---|"]
uc = Counter(r["unit"] for r in d if r["unit"])
for u, k in uc.most_common(30):
    out.append(f"| {U[u]} | {T[next(x['topic'] for x in c['units'] if x['id'] == u)]} | {k} |")
out += ["", "## Pojęcia (150 najczęstszych)", "", "| # | Pojęcie | Rodzaj | Dział | Razem | jedn. | wiel. |", "|---|---|---|---|---|---|---|"]
for k, (i, m) in enumerate(ic.most_common(150), 1):
    s1 = sum(1 for r in d if i in r["items"] and r["t"] == "single")
    out.append(f"| {k} | {I[i]['t']} | {I[i]['kind']} | {T[I[i]['topic']]} | {m} | {s1} | {m - s1} |")
open(os.path.join(HERE, "RAPORT-STATYSTYK.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("pytań:", n, "pojęć:", len(ic))
