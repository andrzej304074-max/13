#!/usr/bin/env python3
"""Audyt treści: pytania (OWE i słownikowe), hasła kursu i Podręcznik.

Wypisuje podejrzane miejsca do przejrzenia (raport: tools/nauka/AUDYT-TRESCI.md). Nie zmienia danych.
Uruchomienie: python3 -I tools/nauka/audyt_tresci.py
"""
import glob, json, os, re, unicodedata
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(HERE, "AUDYT-TRESCI.md")
L = "ABCD"


def load_questions():
    qs = []
    for f in sorted(glob.glob(os.path.join(ROOT, "data", "questions", "*.json"))):
        d = json.load(open(f, encoding="utf-8"))
        qs += [dict(q, _src=os.path.basename(f)) for q in (d if isinstance(d, list) else d["questions"])]
    for name in ("auto.json", "manual.json"):
        d = json.load(open(os.path.join(ROOT, "data", "slownik", name), encoding="utf-8"))
        qs += [dict(q, _src=f"slownik/{name}") for q in (d if isinstance(d, list) else next(v for v in d.values() if isinstance(v, list)))]
    return qs


def norm(s):
    s = unicodedata.normalize("NFD", s.lower().replace("ł", "l"))
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in s if unicodedata.category(c) != "Mn")).strip()


TYPOS = [r"\bwogóle\b", r"\bnapewno\b", r"\bconajmniej\b", r"\bpoprostu\b", r"\bnarazie\b", r"\bw skutek\b", r"\bz pośród\b",
         r"\bprzedewszystkim\b", r"\bspowrotem\b", r"\bwłaściwie\s+właściwie\b", r"\bnie mniej jednak\b", r"\bbynajmniej\b(?=.*\bprzynajmniej)",
         r"\b([^\W\d]{3,})\s+\1\b", r"\bkróre\b", r"\bktory\b", r"\bktóra\s+która\b", r"\bpoziomie\s+poziomie\b", r"\bwzgledn", r"\bsie\b", r"\bjesli\b"]


def text_checks(where, s, out):
    if not s:
        return
    if s.count("„") != s.count("”"):
        out.append((where, "niedomknięty cudzysłów „…”", s[:160]))
    # numeracja „1)”, „a)”, „A)” nie liczy się jako nawias
    bare = re.sub(r"(?:^|(?<=[;\n])|(?<=[;:\n] ))(?:\d{1,2}|[a-dA-D])\)|(?<=\. )\d\)(?= [A-ZŁŚŻ])", "", s)
    if bare.count("(") != bare.count(")"):
        out.append((where, "niedomknięty nawias", s[:160]))
    if re.search(r"\s[,.;:!?](?!\d)", s):
        out.append((where, "spacja przed znakiem interpunkcyjnym", re.search(r".{0,30}\s[,.;:!?](?!\d).{0,30}", s).group(0)))
    if re.search(r"[a-ząćęłńóśźż],[a-ząćęłńóśźżA-Z]", s):
        out.append((where, "brak spacji po przecinku", re.search(r".{0,25}[a-ząćęłńóśźż],[a-ząćęłńóśźżA-Z].{0,25}", s).group(0)))
    if "  " in s and not re.search(r"[;,]  ", s):  # dwie spacje po „;” w zestawach wzorów są celowe
        out.append((where, "podwójna spacja", s[max(0, s.index("  ") - 30): s.index("  ") + 30]))
    for t in TYPOS:
        m = re.search(t, s, re.I)
        if m and not (t.startswith(r"\b(\w{3,})") and m.group(1).lower() in {"tak", "bardzo", "coraz", "nie", "dużo", "mniej", "więcej"}):
            out.append((where, f"możliwa literówka / powtórzenie: „{m.group(0)}”", s[max(0, m.start() - 40): m.end() + 40]))


def main():
    found = defaultdict(list)
    qs = load_questions()
    seen = defaultdict(list)
    for q in qs:
        w = f"{q['_src']} {q['id']}"
        e = q.get("explanation") or ""
        opts = q["options"]
        # wyjaśnienie wskazuje literę w nawiasie – czy zgodną z kluczem (jednokrotny wybór)
        letters = set(re.findall(r"\(([A-D])\)", e))
        if q["type"] == "single" and letters and L[q["correct"][0]] not in letters:
            found["Pytania: wyjaśnienie wskazuje inną literę niż klucz"].append(
                (w, f"klucz {L[q['correct'][0]]}, w wyjaśnieniu {', '.join(sorted(letters))}", e[:220]))
        if q["type"] == "multi" and letters:
            wrong = [x for x in letters if L.index(x) not in q["correct"]]
            for x in wrong:
                at = e.index(f"({x})")
                ctx = e[max(0, at - 80): at + 90]
                if not re.search(r"\bnie\b|\bni\b|błęd|fałsz|niepoprawn|nieprawd|myl|odwrotn|wbrew|zamiast|a nie\b|żaden|nietrafn|bez związku|inn\w+ hasł|dotycz\w* inn", ctx, re.I):
                    found["Pytania: wyjaśnienie wskazuje jako poprawną literę spoza klucza (wielokrotny)"].append(
                        (w, f"klucz {','.join(L[i] for i in q['correct']) or '–'}, litera {x}", ctx))
        if len(e.strip()) < 40:
            found["Pytania: brak albo bardzo krótkie wyjaśnienie"].append((w, f"{len(e.strip())} znaków", e))
        if len({o.strip().lower() for o in opts}) < len(opts):
            found["Pytania: powtórzone odpowiedzi"].append((w, "", " | ".join(opts)))
        if q["type"] == "multi" and not q["correct"] and not re.search(r"żadn|wszystkie .*(błędn|fałsz|niepoprawn)|nie jest poprawn", e, re.I) \
                and len(re.findall(r"\b[A-D]\s*[–-]\s*fałsz", e)) < 4:
            found["Pytania: wielokrotny bez poprawnych – wyjaśnienie tego nie mówi"].append((w, "", e[:220]))
        seen[(q["_src"].split("/")[0], norm(q["question"]))].append(q)
        text_checks(w + " (pytanie)", q["question"], found["Tekst: pytania"])
        text_checks(w + " (wyjaśnienie)", e, found["Tekst: wyjaśnienia"])
        for o in opts:
            text_checks(w + " (odpowiedź)", o, found["Tekst: odpowiedzi"])
    for (_, k), lst in seen.items():
        if len(lst) > 1 and len({tuple(sorted(norm(o) for o in q["options"])) for q in lst}) == 1 and len({tuple(q["correct"]) for q in lst}) > 1:
            found["Pytania: to samo pytanie z tymi samymi odpowiedziami, ale innym kluczem"].append(
                (", ".join(q["id"] for q in lst), "", lst[0]["question"][:160]))

    course = json.load(open(os.path.join(ROOT, "data", "nauka", "course.json"), encoding="utf-8"))
    items = {k: v for k, v in course["items"].items() if v["kind"] != "zrozumienie"}
    titles = defaultdict(list)
    for k, v in items.items():
        titles[norm(v["t"])].append(k)
        d = v.get("d") or ""
        if len(d.strip()) < 25:
            found["Hasła: brak albo bardzo krótka definicja"].append((f"{k} {v['t']}", f"{len(d.strip())} znaków", d))
        for m in re.finditer(r"\bpor\.\s+([^;)]+)", d):
            ref = m.group(1).strip().rstrip(".")
            if not any(norm(ref).startswith(norm(x["t"])[:12]) or norm(x["t"]).startswith(norm(ref)[:12]) for x in items.values()):
                found["Hasła: odsyłacz „por.” do nieznanego hasła"].append((f"{k} {v['t']}", ref, d[:200]))
        text_checks(f"{k} {v['t']}", d, found["Tekst: definicje haseł"])
    for t, ks in titles.items():
        if len(ks) > 1:
            found["Hasła: zdublowany tytuł"].append((", ".join(ks), items[ks[0]]["t"], ""))

    book = json.load(open(os.path.join(ROOT, "data", "nauka", "podrecznik.json"), encoding="utf-8"))
    for uid, u in book["units"].items():
        for part in ([u["intro"]] if u.get("intro") else []) + u["chapters"]:
            for bl in part["blocks"]:
                txt = bl.get("x") or "".join(r["s"] for r in (bl.get("r") or [x for it in bl.get("items", []) for x in it]))
                text_checks(f"podręcznik {uid} / {part.get('lesson', 'intro')}", txt, found["Tekst: Podręcznik"])

    lines = ["# Audyt treści", "", "Wynik `python3 -I tools/nauka/audyt_tresci.py` – miejsca do przejrzenia (nie każde to błąd).", ""]
    total = 0
    for cat in sorted(found):
        lst = found[cat]
        if not lst:
            continue
        total += len(lst)
        lines += [f"## {cat} ({len(lst)})", ""]
        for w, what, ctx in lst[:400]:
            lines.append(f"- `{w}` {what} — {ctx.replace(chr(10), ' ')[:240]}")
        lines.append("")
    open(OUT, "w", encoding="utf-8").write("\n".join(lines))
    for cat in sorted(found):
        if found[cat]:
            print(f"{len(found[cat]):5}  {cat}")
    print(f"razem: {total} → {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
