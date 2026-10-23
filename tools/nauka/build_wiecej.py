"""„Więcej” przy fiszkach i hasłach: tools/nauka/wiecej/*.md → data/nauka/wiecej.json.

Format pliku (jeden wpis na hasło, tytuł dokładnie jak w kursie):

    # Elastyczność cenowa popytu
    Rozszerzone wyjaśnienie: 2–4 zdania – intuicja, „po co to”, typowa pułapka.
    Przykład: konkretny przykład (liczbowy albo z życia, najlepiej z Polski).

Wynik: {id hasła: {x: wyjaśnienie, ex: przykład, ch?: [dział, lekcja] – pierwszy rozdział Podręcznika z odnośnikiem do hasła}}.
Kontrola (--strict – błąd zamiast ostrzeżenia): każde hasło kursu (bez lekcji „Zrozumienie”) ma wpis; długości; wyjaśnienie nie
powtarza definicji; przykład przy wzorze ma liczby.
Uruchomienie: python3 -I tools/nauka/build_wiecej.py [--strict]
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "wiecej")
OUT = os.path.join(ROOT, "data", "nauka", "wiecej.json")
STRICT = "--strict" in sys.argv

course = json.load(open(os.path.join(ROOT, "data", "nauka", "course.json"), encoding="utf-8"))
ITEMS = {i["id"]: i for i in course["items"].values() if i["kind"] != "zrozumienie"}
BY_TITLE = {}
for it in ITEMS.values():
    for k in (it["t"], it["s"]):
        BY_TITLE.setdefault(k.lower(), it["id"])

problems, warnings = [], []


def chapters():
    """Pierwszy rozdział Podręcznika, który linkuje hasło (dział, lekcja)."""
    book = json.load(open(os.path.join(ROOT, "data", "nauka", "podrecznik.json"), encoding="utf-8"))
    out = {}
    for uid, u in book["units"].items():
        for ch in u["chapters"]:
            for b in ch["blocks"]:
                runs = b.get("r") or [r for item in b.get("items", []) for r in item]
                for r in runs:
                    if r.get("k"):
                        out.setdefault(r["k"], [uid, ch["lesson"]])
    return out


def words(s):
    return set(re.findall(r"[a-ząćęłńóśźż0-9]{4,}", s.lower()))


def parse():
    entries = {}
    for path in sorted(glob.glob(os.path.join(SRC, "*.md"))):
        name = os.path.basename(path)
        cur = None
        for n, line in enumerate(open(path, encoding="utf-8"), 1):
            line = line.rstrip("\n")
            if line.startswith("# "):
                title = line[2:].strip()
                iid = BY_TITLE.get(title.lower())
                if not iid:
                    problems.append(f"{name}:{n}: nieznane hasło „{title}”")
                    cur = None
                    continue
                if iid in entries:
                    problems.append(f"{name}:{n}: hasło „{title}” drugi raz")
                cur = entries.setdefault(iid, {"x": [], "ex": [], "where": f"{name}:{n}"})
            elif cur is not None and line.strip():
                if line.startswith("Przykład:"):
                    cur["ex"].append(line[len("Przykład:"):].strip())
                elif cur["ex"]:
                    cur["ex"].append(line.strip())
                else:
                    cur["x"].append(line.strip())
    return entries


def check(iid, x, ex, where):
    it = ITEMS[iid]
    if not 80 <= len(x) <= 900:
        problems.append(f"{where}: {it['t']}: wyjaśnienie ma {len(x)} znaków (80–900)")
    if not 25 <= len(ex) <= 700:
        problems.append(f"{where}: {it['t']}: przykład ma {len(ex)} znaków (25–700)")
    d = it["d"].strip().rstrip(".")
    if d and d.lower() in x.lower():
        problems.append(f"{where}: {it['t']}: wyjaśnienie powtarza definicję")
    dw, xw = words(it["d"]), words(x)
    if dw and len(dw & xw) / len(xw or {1}) > 0.6:
        warnings.append(f"{where}: {it['t']}: wyjaśnienie bardzo podobne do definicji")
    if it["kind"] == "wzor" and not re.search(r"\d", ex):
        problems.append(f"{where}: {it['t']}: przykład do wzoru bez liczb")


def main():
    entries = parse()
    ch = chapters()
    out = {}
    for iid, e in entries.items():
        x, ex = " ".join(e["x"]), " ".join(e["ex"])
        check(iid, x, ex, e["where"])
        out[iid] = {"x": x, "ex": ex, **({"ch": ch[iid]} if iid in ch else {})}
    missing = [ITEMS[i]["t"] for i in ITEMS if i not in out]
    msg = f"hasła z „Więcej”: {len(out)}/{len(ITEMS)}"
    if missing:
        (problems if STRICT else warnings).append(f"brak wpisów: {len(missing)} (np. {', '.join(missing[:5])})")
    for w in warnings[:40]:
        print("ostrzeżenie:", w, file=sys.stderr)
    for p in problems:
        print("BŁĄD:", p, file=sys.stderr)
    if problems:
        sys.exit(1)
    json.dump(dict(sorted(out.items())), open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(msg)


if __name__ == "__main__":
    main()
