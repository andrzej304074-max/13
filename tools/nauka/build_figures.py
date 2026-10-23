"""Rysunki przy hasłach: tools/nauka/wykresy_hasel.txt (hasło → rysunek) + rysunki Podręcznika → data/nauka/figures.json.

  python3 -I tools/nauka/build_figures.py           – tylko data/nauka/figures.json (po build_podrecznik.py)
  python3 -I tools/nauka/build_figures.py --wstaw   – najpierw wstawia brakujące ::wykres do Podręcznika: pod blokiem
      z pierwszym odnośnikiem [[hasło]] w danym dziale, najwyżej 3 rysunki na rozdział, bez powtórzeń tego samego rysunku
      w rozdziale i bez dwóch rysunków pod jednym blokiem. Potem trzeba przebudować Podręcznik (build_podrecznik.py --strict).

figures.json: {id hasła: {k, o?, cap?}} – kurs (karty „Poznaj”, „Zrozumienie”), fiszki, tabela pojęć pokazują rysunek hasła.
Kolejność: ręczna lista, potem rysunek z bloku Podręcznika, który linkuje hasło (pierwsze hasło bloku).
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "podrecznik")
MAP = os.path.join(HERE, "wykresy_hasel.txt")
OUT = os.path.join(ROOT, "data", "nauka", "figures.json")
MAX_PER_CHAPTER = 3

course = json.load(open(os.path.join(ROOT, "data", "nauka", "course.json"), encoding="utf-8"))
BY_TITLE = {}
for it in course["items"].values():
    for k in {it["t"], it["s"], *(it.get("al") or [])}:
        if k:
            BY_TITLE.setdefault(k.lower(), it["id"])


def parse_spec(spec):
    body, _, cap = spec.partition("|")
    parts = body.split()
    o = {}
    for kv in parts[1:]:
        key, _, val = kv.partition("=")
        o[key] = int(val) if re.fullmatch(r"[+-]?\d", val) and parts[0] in SHIFT else val
    fig = {"k": parts[0]}
    if o:
        fig["o"] = o
    if cap.strip():
        fig["cap"] = cap.strip()
    return fig


SHIFT = {"sd", "adas", "islm", "praca", "pieniadz", "waluta", "fundusze"}


def load_map():
    out = []
    for n, line in enumerate(open(MAP, encoding="utf-8"), 1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        title, _, spec = line.partition(" = ")
        if not spec:
            sys.exit(f"{MAP}:{n}: brak „ = ”")
        iid = BY_TITLE.get(title.strip().lower())
        if not iid:
            print(f"ostrzeżenie: {MAP}:{n}: nieznane hasło „{title}”", file=sys.stderr)
            continue
        out.append((title.strip(), iid, spec.strip()))
    return out


def insert(mapping):
    """Wstawia ::wykres do plików Podręcznika; zwraca liczbę wstawionych rysunków."""
    files = sorted(glob.glob(os.path.join(SRC, "*", "*.md")))
    texts = {f: open(f, encoding="utf-8").read().split("\n") for f in files}
    added = 0
    for title, iid, spec in mapping:
        kind_key = spec.partition("|")[0].strip()
        # najpierw dział zgodny z tematem hasła (np. „Popyt” – mikro), potem pozostałe
        topic = course["items"][iid]["topic"]
        order = sorted(files, key=lambda f: os.path.basename(os.path.dirname(f)) != topic)
        link = re.compile(r"\[\[" + re.escape(title) + r"(\||\]\])", re.I)
        done = False
        for f in order:
            if done:
                break
            lines = texts[f]
            for hit in [i for i, l in enumerate(lines) if link.search(l) and not l.startswith("#")]:
                # nie w „Na marginesie” (tam tylko wzmianki) i nie pod blokiem ze wzorem
                sec = next((lines[i] for i in range(hit, -1, -1) if lines[i].startswith("#")), "")
                if sec.startswith("## Na marginesie"):
                    continue
                if lines[hit].startswith(("Na marginesie", "Pojawiały się", "Pojawiała się", "Pojawił się")):
                    continue
                # wpis listy osób („- **[[Nazwisko…”) – rysunek pojęcia tam nie pasuje
                if lines[hit].startswith("- ") and course["items"][iid]["kind"] != "osoba" and re.match(r"- \*\*\[\[[^]|]+ [A-ZŁŚŻŹ]", lines[hit]) and not link.search(lines[hit][:len(title) + 8]):
                    continue
                j = hit
                while j < len(lines) and lines[j].strip():
                    j += 1
                b0 = hit
                while b0 > 0 and lines[b0 - 1].strip():
                    b0 -= 1
                if any(l.startswith("$") for l in lines[b0:j]):
                    continue
                done = True
                break
            if not done:
                continue
            # granice rozdziału (# …)
            start = max((i for i in range(hit + 1) if lines[i].startswith("# ")), default=0)
            end = next((i for i in range(hit + 1, len(lines)) if lines[i].startswith("# ")), len(lines))
            chapter = lines[start:end]
            figs = [l for l in chapter if l.startswith("::wykres")]
            if len(figs) >= MAX_PER_CHAPTER or any(l[len("::wykres"):].partition("|")[0].strip() == kind_key for l in figs):
                break
            # pod blokiem nie może już stać rysunek
            if any(l.startswith("::wykres") for l in lines[b0:j]):
                break
            lines.insert(j, f"::wykres {spec}")
            added += 1
    for f, lines in texts.items():
        text = "\n".join(lines)
        if text != open(f, encoding="utf-8").read():
            open(f, "w", encoding="utf-8").write(text)
    return added


def build(mapping):
    figs = {}
    for _title, iid, spec in mapping:
        figs.setdefault(iid, parse_spec(spec))
    book = json.load(open(os.path.join(ROOT, "data", "nauka", "podrecznik.json"), encoding="utf-8"))
    for u in book["units"].values():
        blocks = [*(u["intro"]["blocks"] if u.get("intro") else []), *[b for c in u["chapters"] for b in c["blocks"]]]
        for b in blocks:
            if not b.get("fig"):
                continue
            runs = b.get("r") or [r for item in b.get("items", []) for r in item]
            first = next((r["k"] for r in runs if r.get("k")), None)
            if first:
                figs.setdefault(first, b["fig"])
    json.dump(dict(sorted(figs.items())), open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    return figs


if __name__ == "__main__":
    mapping = load_map()
    if "--wstaw" in sys.argv:
        print("wstawione rysunki:", insert(mapping))
    figs = build(mapping)
    print(f"hasła z rysunkiem: {len(figs)} → {os.path.relpath(OUT, ROOT)}")
