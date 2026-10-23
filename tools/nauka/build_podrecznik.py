# -*- coding: utf-8 -*-
"""Buduje Podręcznik (data/nauka/podrecznik.json) z ręcznie pisanych artykułów tools/nauka/podrecznik/<temat>/<dział>.md.

Użycie: python3 -I tools/nauka/build_podrecznik.py [--strict]

Format pliku działu (jeden plik = jeden dział kursu, nazwa = id działu):

    # intro | W skrócie: tytuł przeglądu      ← przegląd działu (~800–1200 słów)
    akapity…

    # <id lekcji> | Tytuł rozdziału           ← rozdział = artykuł lekcji (~300–450 słów)
    ## Śródtytuł
    Akapit z **pogrubieniem**, _kursywą_ i odnośnikiem do hasła [[Elastyczność cenowa popytu]]
    albo [[Elastyczność cenowa popytu|własnym tekstem]].
    > Przykład: ramka z przykładem z życia
    > Uwaga: ramka „pułapka OWE”
    > Zapamiętaj: ramka z najważniejszą myślą
    $ wzór w osobnej linii
    - punkt listy
    ::wykres sd D=+1 | Podpis             ← rysunek SVG pod blokiem powyżej (pole `fig` bloku – numeracja bloków,
                                            a więc i podkreślenia użytkowników, się nie zmienia); rodzaje: FIGS niżej

Każda sekcja dostaje `ch` – datę ostatniej zmiany treści (porównanie skrótu tekstu z poprzednim podrecznik.json);
podkreślenia starsze niż `ch` czytnik ukrywa, bo ich przesunięcia dotyczą poprzedniej wersji tekstu.

Sprawdza: każda zwykła lekcja działu ma rozdział, każde hasło lekcji (i hasła z pytań – „extra”) ma w nim odnośnik,
odnośniki prowadzą do istniejących haseł. Braki to ostrzeżenia; z --strict błąd.
"""
import datetime, glob, hashlib, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "podrecznik")
OUT = os.path.join(ROOT, "data", "nauka", "podrecznik.json")
STRICT = "--strict" in sys.argv

course = json.load(open(os.path.join(ROOT, "data", "nauka", "course.json"), encoding="utf-8"))
ITEMS, LESSONS = course["items"], course["lessons"]
UNITS = {u["id"]: u for u in course["units"]}
BY_TITLE = {}
for it in ITEMS.values():
    for k in {it["t"], it["s"], *(it.get("al") or [])}:
        if k:
            BY_TITLE.setdefault(k.lower(), it["id"])

errors, warnings = [], []

INLINE = re.compile(r"\*\*(.+?)\*\*|_(.+?)_|\[\[(.+?)\]\]")


def runs(text, ctx, links):
    """Tekst z formatowaniem → lista odcinków {s, b?, i?, k?} (k = id hasła)."""
    out, pos = [], 0
    for m in INLINE.finditer(text):
        if m.start() > pos:
            out.append({"s": text[pos:m.start()]})
        if m.group(1) is not None or m.group(2) is not None:
            # pogrubienie/kursywa mogą zawierać odnośniki do haseł
            flag = "b" if m.group(1) is not None else "i"
            for r in runs(m.group(1) if flag == "b" else m.group(2), ctx, links):
                out.append({**r, flag: 1})
        else:
            target, _, label = m.group(3).partition("|")
            iid = BY_TITLE.get(target.strip().lower())
            if not iid:
                errors.append(f"{ctx}: nieznane hasło [[{target}]]")
                out.append({"s": label or target})
            else:
                links.add(iid)
                out.append({"s": label or ITEMS[iid]["s"], "k": iid})
        pos = m.end()
    if pos < len(text):
        out.append({"s": text[pos:]})
    # sklej sąsiednie zwykłe odcinki
    merged = []
    for r in out:
        if merged and set(r) == set(merged[-1]) and "k" not in r:
            merged[-1]["s"] += r["s"]
        else:
            merged.append(r)
    return merged


BOX = {"przykład:": "ex", "uwaga:": "trap", "zapamiętaj:": "key"}

# Rysunki (app/components/book-figure.tsx): rodzaj → dozwolone opcje (None – dowolna krzywa z przesunięciem −2…2)
SHIFT_GRAPHS = {"sd": "D S", "adas": "AD SRAS LRAS", "islm": "IS LM", "praca": "DL SL", "pieniadz": "MD MS", "waluta": "D S", "fundusze": "D S"}
FIGS = {
    "koszty": {}, "laffer": {}, "lorenz": {}, "przejscie": {}, "blake": {}, "monopol": {},
    "phillips": {"dlugi": {"1"}}, "kmp": {"punkty": {"1"}},
    "piramida": {"typ": {"progresywna", "ustabilizowana", "regresywna"}},
    "macierz": {"preset": {"bcg", "ansoff", "ge", "swot", "wiezien"}},
    # H5: nowe rysunki i wykresy z danych (data/wykresy – tools/wykresy/pobierz.py)
    "nadwyzka": {}, "podatek": {}, "elastycznosc": {}, "obojetnosc": {}, "oligopol": {}, "krzywaj": {}, "cykl": {},
    "solow": {}, "engel": {}, "konkurencja": {}, "lrac": {},
    "procent": {}, "portfel": {}, "sml": {}, "stawki": {}, "clo": {}, "bep": {}, "npv": {}, "wacc": {}, "zycie": {},
    "produkt": {}, "maslow": {}, "okun": {}, "uczenie": {}, "cyklzycia": {}, "opcja": {"typ": {"straddle"}},
    "cena": {"typ": {"max", "min"}}, "beveridge": {"przesun": {"1"}}, "keynes": {"wzrost": {"1"}},
    "dochodowosc": {"typ": {"normalna", "odwrocona", "obie"}},
    "seria": {"id": {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ROOT, "data", "wykresy", "*.json")) if not p.endswith("piramida-pl.json")}},
}
FIGS["piramida"]["dane"] = {"pl"}


def figure(spec, ctx):
    """„sd D=+1 S=-1 | Podpis” → {k, o, cap}."""
    body, _, cap = spec.partition("|")
    parts = body.split()
    if not parts:
        errors.append(f"{ctx}: pusty ::wykres")
        return None
    k, opts = parts[0], {}
    for kv in parts[1:]:
        key, _, val = kv.partition("=")
        opts[key] = val
    if k in SHIFT_GRAPHS:
        for key, val in opts.items():
            if key not in SHIFT_GRAPHS[k].split() or not re.fullmatch(r"[+-]?[12]", val):
                errors.append(f"{ctx}: ::wykres {k} – zła opcja {key}={val}")
        o = {key: int(val) for key, val in opts.items()}
    elif k in FIGS:
        for key, val in opts.items():
            if key not in FIGS[k] or val not in FIGS[k][key]:
                errors.append(f"{ctx}: ::wykres {k} – zła opcja {key}={val}")
        o = opts
    else:
        errors.append(f"{ctx}: nieznany rodzaj wykresu „{k}”")
        return None
    out = {"k": k}
    if o:
        out["o"] = o
    if cap.strip():
        out["cap"] = cap.strip()
    return out


def blocks(lines, ctx, links):
    out, para, lst = [], [], []

    def flush():
        nonlocal para, lst
        if para:
            out.append({"t": "p", "r": runs(" ".join(para), ctx, links)})
            para = []
        if lst:
            out.append({"t": "ul", "items": [runs(x, ctx, links) for x in lst]})
            lst = []

    for raw in lines:
        line = raw.rstrip()
        s = line.strip()
        if not s:
            flush()
            if out:
                out[-1].pop("_open", None)
        elif s.startswith("## "):
            flush()
            out.append({"t": "h", "r": runs(s[3:].strip(), ctx, links)})
        elif s.startswith("> "):
            flush()
            body = s[2:].strip()
            kind = next((v for k, v in BOX.items() if body.lower().startswith(k)), None)
            if kind is None:
                # kolejne linie „> …” bez rodzaju dopisują się do ramki bezpośrednio powyżej
                if out and out[-1].get("_open"):
                    out[-1]["r"] += [{"s": " "}] + runs(body, ctx, links)
                    continue
                errors.append(f"{ctx}: ramka bez rodzaju (Przykład:/Uwaga:/Zapamiętaj:): {body[:40]}")
                kind = "ex"
            else:
                body = body.split(":", 1)[1].strip()
            out.append({"t": kind, "r": runs(body, ctx, links), "_open": True})
        elif s.startswith("::wykres"):
            flush()
            fig = figure(s[len("::wykres"):].strip(), ctx)
            if not out:
                errors.append(f"{ctx}: ::wykres musi stać pod akapitem, ramką albo listą")
            elif fig:
                out[-1]["fig"] = fig
        elif s.startswith("$ "):
            flush()
            out.append({"t": "f", "x": s[2:].strip()})
        elif s.startswith("- "):
            if para:
                flush()
            lst.append(s[2:].strip())
        else:
            if lst:
                flush()
            para.append(s)
    flush()
    for b in out:
        b.pop("_open", None)
    return out


def text_of(bs):
    parts = []
    for b in bs:
        if "r" in b:
            parts.append("".join(r["s"] for r in b["r"]))
        if "items" in b:
            parts += ["".join(r["s"] for r in it) for it in b["items"]]
        if "x" in b:
            parts.append(b["x"])
        if "fig" in b and b["fig"].get("cap"):
            parts.append(b["fig"]["cap"])
    return " ".join(parts)


def digest(bs):
    """Skrót treści sekcji bez rysunków – zmiana tekstu (nie dodanie wykresu) unieważnia podkreślenia."""
    return hashlib.sha1(json.dumps([{k: v for k, v in b.items() if k != "fig"} for b in bs], ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:12]


try:
    OLD = json.load(open(OUT, encoding="utf-8"))["units"]
except (OSError, ValueError, KeyError):
    OLD = {}
NOW = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
BASE = "2000-01-01T00:00:00Z"


def changed(uid, sid, bs):
    """(skrót, data ostatniej zmiany treści) – data z poprzedniej wersji, gdy treść ta sama (albo bez skrótu – pierwsze uruchomienie)."""
    h = digest(bs)
    old = OLD.get(uid) or {}
    prev = old.get("intro") if sid == "intro" else next((c for c in old.get("chapters", []) if c["lesson"] == sid), None)
    if prev and (prev.get("hx") in (None, h)):
        return h, prev.get("ch", BASE)
    return h, NOW if prev else BASE


def words(bs):
    return len(re.findall(r"\w+", text_of(bs)))


result = {}
seen_files = set()
for path in sorted(glob.glob(os.path.join(SRC, "*", "*.md"))):
    uid = os.path.splitext(os.path.basename(path))[0]
    seen_files.add(uid)
    unit = UNITS.get(uid)
    if not unit:
        errors.append(f"{path}: nie ma działu {uid}")
        continue
    sections, cur = [], None
    for line in open(path, encoding="utf-8"):
        if line.startswith("# "):
            head, _, title = line[2:].strip().partition("|")
            cur = {"id": head.strip(), "title": title.strip(), "lines": []}
            sections.append(cur)
        elif cur is not None:
            cur["lines"].append(line)
        elif line.strip():
            errors.append(f"{uid}: tekst przed pierwszym nagłówkiem „# …”")
    intro, chapters = None, []
    std = [l for l in unit["lessons"] if LESSONS[l].get("type") != "zrozum"]
    for sec in sections:
        ctx = f"{uid}/{sec['id']}"
        links = set()
        bs = blocks(sec["lines"], ctx, links)
        if not bs:
            errors.append(f"{ctx}: pusty rozdział")
        if sec["id"] == "intro":
            hx, ch = changed(uid, "intro", bs)
            intro = {"title": sec["title"] or "W skrócie", "blocks": bs, "words": words(bs), "hx": hx, "ch": ch}
            continue
        lesson = LESSONS.get(sec["id"])
        if not lesson or lesson["unit"] != uid or lesson.get("type") == "zrozum":
            errors.append(f"{ctx}: nie ma takiej zwykłej lekcji w dziale")
            continue
        if not sec["title"]:
            errors.append(f"{ctx}: brak tytułu rozdziału („# id | Tytuł”)")
        need = list(lesson["items"]) + list(lesson.get("extra") or [])
        missing = [ITEMS[i]["t"] for i in need if i not in links]
        if missing:
            warnings.append(f"{ctx}: bez odnośnika do: " + "; ".join(missing))
        hx, ch = changed(uid, sec["id"], bs)
        chapters.append({"lesson": sec["id"], "title": sec["title"], "blocks": bs, "words": words(bs), "hx": hx, "ch": ch})
    order = {l: i for i, l in enumerate(std)}
    chapters.sort(key=lambda c: order.get(c["lesson"], 1e9))
    got = {c["lesson"] for c in chapters}
    for l in std:
        if l not in got:
            warnings.append(f"{uid}: brak rozdziału dla lekcji {l} ({LESSONS[l]['title']})")
    if intro is None:
        warnings.append(f"{uid}: brak przeglądu działu („# intro | …”)")
    result[uid] = {"intro": intro, "chapters": chapters, "words": (intro["words"] if intro else 0) + sum(c["words"] for c in chapters)}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({"units": result}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

total_std = sum(1 for l in LESSONS.values() if l.get("type") != "zrozum")
done = sum(len(u["chapters"]) for u in result.values())
print(f"działy: {len(result)}/{len(UNITS)} · rozdziały: {done}/{total_std} · słów: {sum(u['words'] for u in result.values())}")
for w in warnings[:60]:
    print("ostrzeżenie:", w)
if len(warnings) > 60:
    print(f"… i {len(warnings) - 60} ostrzeżeń więcej")
for e in errors:
    print("BŁĄD:", e)
if errors or (STRICT and warnings):
    sys.exit(1)
