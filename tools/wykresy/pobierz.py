"""Serie danych do wykresów (data/wykresy/*.json) – pobierane z API Eurostatu, z adresem źródła i datą pobrania.

Każda liczba na wykresie pochodzi z odpowiedzi API (adres zapisany w pliku `url` – da się sprawdzić w przeglądarce).
Uruchomienie: python3 -I tools/wykresy/pobierz.py  (wymaga sieci; bez sieci zostają dotychczasowe pliki).
"""
import datetime
import json
import pathlib
import subprocess
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "wykresy"
API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
GEO = {"PL": "Polska", "EU27_2020": "UE-27"}

# id: (tytuł, jednostka, rodzaj, zbiór, parametry stałe, od roku, opis źródła)
SERIES = {
    "dzietnosc": ("Współczynnik dzietności", "dzieci na kobietę", "linia", "demo_find", {"indic_de": "TOTFERRT"}, 1990,
                  "Eurostat, demo_find (TFR)"),
    "obciazenie": ("Współczynnik obciążenia osobami starszymi", "osoby 65+ na 100 osób w wieku 15–64", "linia", "demo_pjanind",
                   {"indic_de": "OLDDEP1"}, 2000, "Eurostat, demo_pjanind (OLDDEP1)"),
    "inflacja": ("Inflacja HICP", "% r/r", "slupki", "prc_hicp_aind", {"unit": "RCH_A_AVG", "coicop": "CP00"}, 2010,
                 "Eurostat, prc_hicp_aind (HICP, roczna stopa zmian)"),
    "bezrobocie": ("Stopa bezrobocia (BAEL, 15–74 lata)", "% aktywnych zawodowo", "linia", "une_rt_a",
                   {"age": "Y15-74", "sex": "T", "unit": "PC_ACT"}, 2005, "Eurostat, une_rt_a"),
    "dlug": ("Dług sektora instytucji rządowych i samorządowych", "% PKB", "linia", "gov_10dd_edpt1",
             {"na_item": "GD", "sector": "S13", "unit": "PC_GDP"}, 2005, "Eurostat, gov_10dd_edpt1 (dług EDP)"),
    "dlugosc-zycia": ("Dalsze trwanie życia 65-latka", "lata", "linia", "demo_mlexpec", {"sex": "T", "age": "Y65", "unit": "YR"}, 2000,
                      "Eurostat, demo_mlexpec (oczekiwana dalsza długość życia w wieku 65 lat)"),
    "pkb": ("Realny wzrost PKB", "% r/r", "slupki", "nama_10_gdp", {"na_item": "B1GQ", "unit": "CLV_PCH_PRE"}, 2010,
            "Eurostat, nama_10_gdp (wolumen, zmiana r/r)"),
}


def fetch(dataset, params):
    q = urllib.parse.urlencode([*params.items(), ("format", "JSON"), ("lang", "EN")], doseq=True)
    url = f"{API}{dataset}?{q}"
    out = subprocess.run(["curl", "-sS", "-m", "60", url], capture_output=True, check=True).stdout
    return url, json.loads(out)


def values(js):
    """{rok: wartość} z odpowiedzi JSON-stat (jedna seria)."""
    idx = js["dimension"]["time"]["category"]["index"]
    rev = {v: k for k, v in idx.items()}
    return {int(rev[int(k)]): float(v) for k, v in js["value"].items()}


def series():
    today = datetime.date.today().isoformat()
    for sid, (title, unit, kind, ds, fixed, start, src) in SERIES.items():
        lines, urls = [], []
        for geo in GEO:
            url, js = fetch(ds, {**fixed, "geo": geo, "sinceTimePeriod": str(start)})
            v = values(js)
            if not v:
                continue
            urls.append(url)
            lines.append({"name": GEO[geo], "points": [[y, round(v[y], 2)] for y in sorted(v)]})
        if not lines:
            print("brak danych:", sid, file=sys.stderr)
            continue
        doc = {"id": sid, "title": title, "unit": unit, "kind": kind, "source": src, "urls": urls, "fetched": today, "lines": lines}
        (OUT / f"{sid}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(sid, [(l["name"], l["points"][0][0], l["points"][-1]) for l in lines])


def piramida(year_hint=None):
    """Struktura wieku Polski (grupy 5-letnie, mężczyźni / kobiety) – ostatni dostępny rok."""
    groups = ["Y_LT5"] + [f"Y{a}-{a + 4}" for a in range(5, 85, 5)] + ["Y_GE85"]
    data = {}
    for sex in ("M", "F"):
        url, js = fetch("demo_pjangroup", {"geo": "PL", "sex": sex, "age": groups, "unit": "NR", "lastTimePeriod": "1"})
        ages = js["dimension"]["age"]["category"]["index"]
        year = list(js["dimension"]["time"]["category"]["index"])[0]
        n_age = len(ages)
        vals = {}
        for k, v in js["value"].items():
            i = int(k)
            age = [a for a, j in ages.items() if j == i % n_age][0]
            vals[age] = v
        data[sex] = (url, year, [round(vals.get(g, 0) / 1e6, 3) for g in groups])
    doc = {"id": "piramida-pl", "title": f"Piramida wieku Polski ({data['M'][1]})", "unit": "mln osób", "kind": "piramida",
           "source": "Eurostat, demo_pjangroup (ludność wg grup wieku, 1 stycznia)", "urls": [data["M"][0], data["F"][0]],
           "fetched": datetime.date.today().isoformat(), "year": data["M"][1],
           "groups": [{"Y_LT5": "0-4", "Y_GE85": "85+"}.get(g, g[1:]) for g in groups], "men": data["M"][2], "women": data["F"][2]}
    (OUT / "piramida-pl.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("piramida-pl", doc["year"], sum(doc["men"]) + sum(doc["women"]))


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    series()
    piramida()
