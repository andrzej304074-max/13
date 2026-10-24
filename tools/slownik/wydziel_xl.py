# -*- coding: utf-8 -*-
"""Jednorazowo (Plan IV, I1): pytania o hasło przewodnie XL jako osobne źródło – zmiana id `sl-…` → `xl-…` w danych
bez ponownego generowania (to samo dają teraz build_manual.py i gen_theme.py):
- data/slownik/manual.json: pytania z `th: 1` (400 ręcznych) – sl-M- → xl-M-;
- data/slownik/theme_auto.json: 254 pytania skryptowe – sl-T-/sl-TC- → xl-T-/xl-TC-;
- data/nauka/slownik-stats.json: te same id w statystykach.
Zapisuje też data/slownik/xl-ids.json (nowe id) – do migracji odpowiedzi, testów i brudnopisów w bazie (lib/schema.ts).
Użycie: python3 -I tools/slownik/wydziel_xl.py
"""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
P = lambda *a: os.path.join(ROOT, *a)
dump = lambda o, p: json.dump(o, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

manual = json.load(open(P("data/slownik/manual.json"), encoding="utf-8"))
theme = json.load(open(P("data/slownik/theme_auto.json"), encoding="utf-8"))
ren = {}
for q in manual:
    if q.get("th") and q["id"].startswith("sl-M-"):
        ren[q["id"]] = "xl-" + q["id"][3:]
for q in theme:
    if q["id"].startswith("sl-"):
        ren[q["id"]] = "xl-" + q["id"][3:]
for q in manual + theme:
    q["id"] = ren.get(q["id"], q["id"])
dump(manual, P("data/slownik/manual.json"))
dump(theme, P("data/slownik/theme_auto.json"))
stats = json.load(open(P("data/nauka/slownik-stats.json"), encoding="utf-8"))
n = 0
for r in stats:
    if r["id"] in ren:
        r["id"] = ren[r["id"]]; n += 1
dump(sorted(stats, key=lambda r: r["id"]), P("data/nauka/slownik-stats.json"))
ids = sorted(q["id"] for q in manual + theme if q["id"].startswith("xl-"))
dump(ids, P("data/slownik/xl-ids.json"))
print(f"zmienione id: {len(ren)} (w statystykach: {n}), wszystkich pytań XL: {len(ids)}")
