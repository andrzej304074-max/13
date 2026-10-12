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

Sprawdza: każda zwykła lekcja działu ma rozdział, każde hasło lekcji (i hasła z pytań – „extra”) ma w nim odnośnik,
odnośniki prowadzą do istniejących haseł. Braki to ostrzeżenia; z --strict błąd.
"""
import glob, json, os, re, sys

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
    return " ".join(parts)


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
            intro = {"title": sec["title"] or "W skrócie", "blocks": bs, "words": words(bs)}
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
        chapters.append({"lesson": sec["id"], "title": sec["title"], "blocks": bs, "words": words(bs)})
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
