# -*- coding: utf-8 -*-
"""Sprawdza, czy adresy źródeł w lekcjach „Zrozumienie” działają (HTTP 200 po przekierowaniach).

Użycie: python3 -I tools/nauka/check_links.py data/nauka/zrozum.json
"""
import json, sys, urllib.parse, urllib.request

# Serwisy, które odpowiadają 403 automatom (ochrona przed botami), a w przeglądarce działają –
# sprawdzone ręcznie; 403 z tych domen nie jest błędem.
BOT_403 = ("www.imf.org", "press.princeton.edu", "www.mofa.go.jp", "www.oecd.org", "www.podatki.biz", "www.dnv.com", "www.sgs.com")
# Serwisy zrywające połączenie z automatem (sprawdzone ręcznie, działają w przeglądarce).
BOT_DROP = ("bank.pl",)

content = json.load(open(sys.argv[1]))
urls = sorted({s["u"] for c in content.values() for s in c["sources"]})
bad = 0
for u in urls:
    req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (link check)"})
    for attempt in range(3):  # chwilowe błędy sieci – ponów
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                code = r.status
        except Exception as ex:  # noqa: BLE001
            code = getattr(ex, "code", type(ex).__name__)
        if code == 202:  # EUR-Lex: odpowiedź „przyjęto” przed przekierowaniem przeglądarki
            code = 200
        if code == 200 or isinstance(code, int) and 400 <= code < 500:
            break
    host = urllib.parse.urlsplit(u).hostname
    if code == 403 and host in BOT_403 or code == "RemoteDisconnected" and host in BOT_DROP:
        continue
    if code != 200:
        bad += 1
        print(f"{code}  {u}")
print(f"sprawdzono {len(urls)} adresów, błędnych: {bad}")
sys.exit(1 if bad else 0)
