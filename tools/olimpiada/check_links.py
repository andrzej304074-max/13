# -*- coding: utf-8 -*-
"""Sprawdza adresy w data/olimpiada/literatura.json (HTTP 200 po przekierowaniach).

Użycie: python3 -I tools/olimpiada/check_links.py data/olimpiada/literatura.json
"""
import json, sys, urllib.parse, urllib.request

# odpowiadają 403 automatom (ochrona przed botami), w przeglądarce działają – sprawdzone ręcznie
BOT_403 = ("www.imf.org", "doi.org", "www.nbp.pl", "www.obserwatorfinansowy.pl", "isap.sejm.gov.pl")

d = json.load(open(sys.argv[1]))
urls = set()
def add(x):
    if x and not x.startswith("/"):
        urls.add(x)
add(d["source"]); add(d.get("archive"))
for g in d["groups"]:
    for it in g["items"]:
        for k in ("free", "alt"):
            for l in it.get(k, []): add(l["u"])
for l in d["theme"]["items"] + d["general"]: add(l["u"])
for p in d["previous"]:
    add(p.get("lit")); add(p.get("inf"))
bad = 0
for u in sorted(urls):
    req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (link check)"})
    code = None
    for attempt in range(4):  # chwilowe zerwania połączenia – ponów
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                code = r.status
        except Exception as ex:  # noqa: BLE001
            code = getattr(ex, "code", type(ex).__name__)
        if code == 202:
            code = 200
        if code == 200 or isinstance(code, int) and 400 <= code < 500:
            break
    host = urllib.parse.urlsplit(u).hostname
    if code == 403 and host in BOT_403:
        continue
    if code != 200:
        bad += 1
        print(f"{code}  {u}")
print(f"sprawdzono {len(urls)} adresów, błędnych: {bad}")
sys.exit(1 if bad else 0)
