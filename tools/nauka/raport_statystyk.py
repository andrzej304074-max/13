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
       "- podobne pytania z różnych edycji liczą się osobno (3 pytania o to samo pojęcie = 3).", "",
       "**Kontrola ręczna (12.10.2026):** przejrzano próbki pytań dla 150 najczęstszych pojęć; poprawiono fałszywe dopasowania "
       "(m.in. „stopa procentowa ubezpieczenia” → składka, nie stopa procentowa; aktywa/pasywa w bilansie płatniczym) i dodano hasła-tło "
       "(np. „Autarkia” w zadaniach z modelem gospodarki, „Transfery socjalne” i „Dochód rozporządzalny” z opisów zmiennych).", "",
       "## Podsumowanie", "",
       f"- Pytań: {n} (jednokrotnego wyboru: {types['single']}, wielokrotnego: {types['multi']}).",
       f"- Pytań bez rozpoznanego pojęcia: {sum(1 for r in d if not r['items'])}.",
       f"- Różnych pojęć, o które pytano: {len(Counter(i for r in d for i in r['items']))}; średnio {sum(len(r['items']) for r in d) / n:.2f} pojęcia na pytanie.", "",
       "## Działy", "", "| Dział | Pytań | % | jednokrotny | wielokrotny |", "|---|---|---|---|---|"]
tc = Counter(r["topic"] for r in d)
for t, k in tc.most_common():
    out.append(f"| {T.get(t, 'nieprzypisane')} | {k} | {k / n * 100:.1f}% | {sum(1 for r in d if r['topic'] == t and r['t'] == 'single')} | {sum(1 for r in d if r['topic'] == t and r['t'] == 'multi')} |")
out += ["", "## Zagadnienia (30 najczęstszych)", "", "| Zagadnienie | Dział | Pytań |", "|---|---|---|"]
uc = Counter(r["unit"] for r in d if r["unit"])
for u, k in uc.most_common(30):
    out.append(f"| {U[u]} | {T[next(x['topic'] for x in c['units'] if x['id'] == u)]} | {k} |")
out += ["", "## Pojęcia (150 najczęstszych)", "", "| # | Pojęcie | Rodzaj | Dział | Razem | jedn. | wiel. |", "|---|---|---|---|---|---|---|"]
ic = Counter(i for r in d for i in r["items"])
for k, (i, m) in enumerate(ic.most_common(150), 1):
    s1 = sum(1 for r in d if i in r["items"] and r["t"] == "single")
    out.append(f"| {k} | {I[i]['t']} | {I[i]['kind']} | {T[I[i]['topic']]} | {m} | {s1} | {m - s1} |")
open(os.path.join(HERE, "RAPORT-STATYSTYK.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("pytań:", n, "pojęć:", len(ic))
