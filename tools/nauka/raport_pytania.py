# -*- coding: utf-8 -*-
"""Raport przydziału pytań do lekcji: tools/nauka/RAPORT-PYTANIA.md.

Użycie: python3 -I tools/nauka/raport_pytania.py <stary course.json> <nowe hasła: plik z tytułami, po jednym w wierszu>
Stary course.json (sprzed przydziału według pojęć) służy do listy pytań OWE przeniesionych do innej lekcji.
"""
import json, os, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
old = json.load(open(sys.argv[1], encoding="utf-8"))
new_titles = [l.strip() for l in open(sys.argv[2], encoding="utf-8") if l.strip()]
c = json.load(open(os.path.join(ROOT, "data/nauka/course.json"), encoding="utf-8"))
I, L = c["items"], c["lessons"]
T = {t["id"]: t["title"] for t in c["topics"]}
s = lambda ids: " · ".join(I[i]["s"] for i in ids) or "–"

where = {q: lid for lid, l in L.items() for q in l.get("questions", [])}
old_where = {}
for lid, l in old["lessons"].items():
    for q in l.get("questions", []):
        old_where.setdefault(q, []).append(lid)
owe = sorted(q for q in where if q.startswith("owe"))
moved = [(q, old_where.get(q, []), where[q]) for q in owe if where[q] not in old_where.get(q, [])]
term = [l for l in L.values() if l.get("type") != "zrozum"]
by_origin = Counter("OWE" if q.startswith("owe") else "słownik – ręczne" if q.startswith("sl-M") else "słownik – automatyczne" for q in where)

out = ["# Raport: pytania Sprawdzianu i pojęcia w lekcjach", "",
       "Każde pytanie (OWE, ręczne i automatyczne ze słownika) jest w dokładnie jednej lekcji: najpóźniejszej lekcji macierzystej "
       "pojęć, których dotyczy (pojęcia z treści i poprawnych odpowiedzi; pojęcia przed osobami, instytucjami i datami). "
       "Pojęcia z treści i ze wszystkich odpowiedzi, których uczeń nie poznał wcześniej w temacie, lekcja omawia w Poznaj, Ćwicz "
       "i Utrwal (kolumna „Nowe z pytań”); poznane wcześniej powtarza w Ćwicz i Utrwal (kolumna „Powtórka”). Gdy hasła lekcji "
       "i nowe pojęcia przekraczają 12, lekcja ma kolejne części (cz. 2, 3…). Build kursu (`tools/nauka/build_course.py`) "
       "kończy się błędem, jeśli któreś pojęcie pytania nie jest omówione ani powtórzone w jego lekcji.", "",
       "Pojęcia w pytaniach wykrywa `tools/nauka/pojecia_pytan.py` (ręczne korekty w `pojecia_pytan_poprawki.py`, przegląd "
       "wszystkich pytań XXI–XXXIX OWE); pytania automatyczne niosą listę swoich pojęć (`pojecia`), a ich dystraktory "
       "pochodzą tylko z bieżącej lub wcześniejszych lekcji tematu.", "",
       "## Podsumowanie", "",
       f"- Pytań w lekcjach: {len(where)} ({', '.join(f'{k}: {v}' for k, v in by_origin.most_common())}).",
       f"- Lekcji haseł: {len(term)}, w tym kolejnych części: {sum(1 for l in term if l.get('part'))}.",
       f"- Lekcji z nowymi pojęciami z pytań: {sum(1 for l in term if l.get('extra'))}; nowych pojęć łącznie: {sum(len(l.get('extra', [])) for l in term)}.",
       f"- Pytań OWE przeniesionych do innej lekcji niż w poprzednim przydziale: {len(moved)} z {len(owe)}.",
       f"- Nowe hasła słownika dodane po przeglądzie pytań: {len(new_titles)} (lista na końcu; źródła w `tools/nauka/zrozum/WERYFIKACJA.md`).", ""]

for tid, title in T.items():
    out += [f"## {title}", "", "| Lekcja | Hasła | Pytań | Nowe z pytań | Powtórka (liczba) |", "|---|---|---|---|---|"]
    for u in c["units"]:
        if u["topic"] != tid:
            continue
        for lid in u["lessons"]:
            l = L[lid]
            if l.get("type") == "zrozum":
                continue
            name = f"{lid}" + (f" (cz. {l['part']})" if l.get("part") else "")
            out.append(f"| {name} | {s(l['items'])} | {len(l['questions'])} | {s(l.get('extra', []))} | {len(l.get('review', []))} |")
    out.append("")

out += ["## Pytania OWE przeniesione do innej lekcji", "", "Poprzedni przydział (po słowach kluczowych, do 24 pytań na lekcję) mógł "
        "dawać to samo pytanie kilku lekcjom; „skąd” to wszystkie dawne lekcje pytania.", "", "| Pytanie | Skąd | Dokąd |", "|---|---|---|"]
out += [f"| {q} | {', '.join(o) or '– (nie było w żadnej lekcji)'} | {n} |" for q, o, n in moved]
out += ["", "## Nowe hasła dodane po przeglądzie pytań", ""]
out += [f"- {t}" for t in new_titles]
open(os.path.join(HERE, "RAPORT-PYTANIA.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("lekcji:", len(term), "przeniesionych OWE:", len(moved), "nowych haseł:", len(new_titles))
