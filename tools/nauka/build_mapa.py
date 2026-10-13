#!/usr/bin/env python3
"""Buduje mapę powiązań pojęć (data/nauka/mapa.json) dla strony Pojęcia → Mapa myśli.

Dla każdego hasła kursu (bez lekcji „Zrozumienie”) wybiera do 24 najsilniej powiązanych haseł.
Siła powiązania to suma wag z czterech źródeł (maska bitowa powodów w nawiasie):
  1 – wspólne pytanie OWE (data/nauka/owe-stats.json → items): 3 za każde pytanie,
  2 – ten sam akapit, lista lub ramka Podręcznika (data/nauka/podrecznik.json, odnośniki [[…]]): 2 za każdy blok
      (bez części „Na marginesie” – to przegląd haseł z innych działów, nie powiązanie treściowe),
  4 – opis hasła wymienia tytuł innego hasła (tytuł ≥ 5 znaków, całe słowa, bez polskich znaków): 3;
      nazwisko osoby (także w odmianie) w tytule lub opisie innego hasła: 2,
  8 – hasła główne tej samej lekcji działu pojęciowego (items, bez powtórek z innych działów): 1;
      hasła prawie bez powiązań (< 3) – też lekcje działów „Osoby”, „Daty” itp.: 0,5.
Pytania słownikowe nie są źródłem: ich zestawienia pojęć są losowe (dystraktory).

Format: {"v": 1, "n": {id: [[sąsiad, waga, maska, wspólne_pytania_OWE], …]}} – posortowane malejąco wg wagi.
Uruchomienie: python3 -I tools/nauka/build_mapa.py
"""
import json, os, re, unicodedata
from collections import defaultdict
from itertools import combinations

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "data", "nauka", "mapa.json")
TOP = 24

course = json.load(open(os.path.join(ROOT, "data", "nauka", "course.json"), encoding="utf-8"))
owe = json.load(open(os.path.join(ROOT, "data", "nauka", "owe-stats.json"), encoding="utf-8"))
book = json.load(open(os.path.join(ROOT, "data", "nauka", "podrecznik.json"), encoding="utf-8"))

items = {k: v for k, v in course["items"].items() if v["kind"] != "zrozumienie"}
lessons = course["lessons"].values() if isinstance(course["lessons"], dict) else course["lessons"]

w = defaultdict(float)          # (a, b) → waga, a < b
mask = defaultdict(int)
oweq = defaultdict(int)


def add(a, b, weight, bit):
    if a == b or a not in items or b not in items:
        return
    key = (a, b) if a < b else (b, a)
    w[key] += weight
    mask[key] |= bit
    if bit == 1:
        oweq[key] += 1


# 1. wspólne pytania OWE
for q in owe:
    for a, b in combinations(sorted(set(q["items"])), 2):
        add(a, b, 3, 1)

# 2. bloki Podręcznika (pomijamy sekcję „Na marginesie”)
def runs_of(block):
    if "r" in block:
        return block["r"]
    return [r for it in block.get("items", []) for r in it]

for unit in book["units"].values():
    for part in ([unit["intro"]] if unit.get("intro") else []) + unit["chapters"]:
        skip = False
        for bl in part["blocks"]:
            if bl["t"] == "h":
                skip = "".join(r["s"] for r in bl["r"]).strip().lower().startswith("na marginesie")
                continue
            if skip:
                continue
            ks = sorted({r["k"] for r in runs_of(bl) if r.get("k")})
            for a, b in combinations(ks, 2):
                add(a, b, 2, 2)


# 3. opis wymienia tytuł innego hasła
def norm(s):
    s = unicodedata.normalize("NFD", s.lower().replace("ł", "l"))
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return " " + re.sub(r"[^a-z0-9]+", " ", s).strip() + " "

by_title = defaultdict(list)
for k, v in items.items():
    t = norm(v["t"]).strip()
    if len(t) >= 5:
        by_title[t].append(k)
titles = sorted(by_title, key=len, reverse=True)
for k, v in items.items():
    d = norm(v.get("d") or "")
    for t in titles:
        if f" {t} " in d:
            for other in by_title[t]:
                add(k, other, 3, 4)

# 3b. nazwisko osoby w opisie lub tytule innego hasła (także w odmianie: „Taylora”, „Keynesa”) – waga 2;
#     gdy kilka osób ma to samo nazwisko (F.W. Taylor, John B. Taylor), wymagany też inicjał albo imię
NAME_OK = re.compile(r"^[A-ZŁŚŻŹĆŃÓ][a-ząćęłńóśźż]{3,}$")
people = []  # (id, nazwisko, imię)
for k, v in items.items():
    if v["kind"] != "osoba":
        continue
    for part in re.split(r",\s*|\s+i\s+", v["t"]):
        toks = part.split()
        if toks and NAME_OK.match(toks[0]):
            people.append((k, toks[0], toks[1] if len(toks) > 1 else ""))
same = defaultdict(set)
for k, sur, _ in people:
    same[sur].add(k)
for k, sur, first in people:
    rx = re.compile(r"\b" + re.escape(sur) + r"(?:a|em|owi|ie|u|ów|owie|ach|ami|y)?\b")
    who = re.compile(r"\b(?:" + re.escape(first[:1]) + r"\.|" + re.escape(first) + r")") if first and len(same[sur]) > 1 else None
    for k2, v2 in items.items():
        if k2 == k or k2 in same[sur]:
            continue
        text = v2["t"] + " " + (v2.get("d") or "")
        mt = rx.search(text)
        if mt and (who is None or who.search(text[max(0, mt.start() - 25):mt.end() + 25])):
            add(k, k2, 2, 4)

# 4. ta sama lekcja (hasła główne) – tylko działy pojęciowe; działy „Osoby”, „Daty” itp. są ułożone alfabetycznie
for l in lessons:
    if l["kind"] != "pojecie":
        continue
    for a, b in combinations(sorted(set(l["items"])), 2):
        add(a, b, 1, 8)

# 5. hasła prawie bez powiązań: słabe powiązanie z hasłami tej samej lekcji (także działów „Osoby”, „Daty”…)
deg = defaultdict(int)
for a_, b_ in w:
    deg[a_] += 1
    deg[b_] += 1
for l in lessons:
    if l["kind"] == "zrozumienie":
        continue
    for a_, b_ in combinations(sorted(set(l["items"])), 2):
        if deg[a_] < 3 or deg[b_] < 3:
            add(a_, b_, 0.5, 8)

nb = defaultdict(list)
for (a, b), weight in w.items():
    m, o = mask[(a, b)], oweq[(a, b)]
    nb[a].append([b, weight, m, o])
    nb[b].append([a, weight, m, o])
out = {}
for k in items:
    lst = sorted(nb.get(k, []), key=lambda x: (-x[1], items[x[0]]["t"]))[:TOP]
    out[k] = [[b, round(x, 1) if x % 1 else int(x), m, o] for b, x, m, o in lst]

json.dump({"v": 1, "n": out}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
iso = sum(1 for v in out.values() if not v)
print(f"hasła: {len(out)} · bez powiązań: {iso} · krawędzie: {len(w)} · rozmiar: {os.path.getsize(OUT) // 1024} KB")
