# -*- coding: utf-8 -*-
"""Eseje (pytania opisowe) z kluczy OWE XXI–XXXIX → data/otwarte/eseje.json.

Wejście: katalog z plikami .txt (pdftotext -layout) kluczy i keymap.json (plik → zestaw, np. owe-39-okregowe).
Parsuje: temat(y) – na etapie szkolnym do wyboru jeden z dwóch, pytanie sponsora (do wyboru z trzech, bez schematu) –
oraz „Przykładowy schemat odpowiedzi” (części i punkty). Wynik do ręcznego przeglądu (raport: tools/otwarte/RAPORT.md).

Użycie: python3 -I tools/otwarte/extract.py <katalog_txt> <keymap.json> data/otwarte/eseje.json
"""
import json, re, sys

ROMAN = {"XXI": 21, "XXII": 22, "XXIII": 23, "XXIV": 24, "XXV": 25, "XXVI": 26, "XXVII": 27, "XXVIII": 28, "XXIX": 29, "XXX": 30,
         "XXXI": 31, "XXXII": 32, "XXXIII": 33, "XXXIV": 34, "XXXV": 35, "XXXVI": 36, "XXXVII": 37, "XXXVIII": 38, "XXXIX": 39}
STAGE = {"szkolne": "s", "okregowe": "o", "centralne": "c"}

def fix(s: str) -> str:
    # stare klucze: polskie litery jako zastępcze znaki (Ŝ → ż)
    s = s.replace("Ŝ", "ż").replace("­", "").replace("ﬁ", "fi").replace("ﬂ", "fl")
    return re.sub(r"\s+", " ", s).strip()

def open_part(lines):
    """Linie od „I. Pytanie opisowe” do sekcji testowej (z pominięciem numerów stron i nagłówków arkusza)."""
    out, on = [], False
    for l in lines:
        s = l.strip()
        if not on and re.match(r"^I\.\s*Pytanie opisowe", s):
            on = True
        if on and re.match(r"^(I{1,3}V?|IV)\.\s*(Pytania testowe|Test)", s):
            break
        if on and s and not re.fullmatch(r"\d+/\d+", s):
            out.append(l.rstrip())
    return out

def split_sections(lines):
    """[(nagłówek, linie)] wg nagłówków rzymskich na początku wiersza (I., II., III.)."""
    secs = []
    for l in lines:
        m = re.match(r"^\s{0,2}(I{1,3}|IV)\.\s+(Pytanie|Zadanie)(.*)$", l)
        if m:
            secs.append([l.strip(), []])
        elif secs:
            secs[-1][1].append(l)
    return secs

def pts_of(head):
    m = re.search(r"0\s*[–-]\s*(\d+)\s*pkt", head)
    return int(m.group(1)) if m else None

HEAD_START = re.compile(r"^\s*(Przykładowy schemat odpowiedzi|Część\s+teoretyczna|I\.\s+Wybrane aspekty)", re.I)
HEAD_ANY = re.compile(r"^\s*(Część\s+[a-ząćęłńóśźż]+|(I{1,3}|IV)\.\s+(Wybrane aspekty[^:]*|Własna ocena[^:]*))\s*:?\s*(\(\s*0\s*[–-]\s*(\d+)\s*pkt\.?\s*\))?\s*:?\s*$", re.I)
ITEM = re.compile(r"^\s*(\d{1,2}\.|[a-z]\)|[-–•])\s+(.*)$")

def parse_schema(lines):
    """Części schematu (tytuł, punkty, punktacja) i ich punkty; podpunkty a) b) i myślniki zostają osobnymi punktami z wcięciem."""
    parts, cur, item = [], None, None
    def flush():
        nonlocal item
        if item is not None and cur is not None:
            cur["points"].append(fix(item))
        item = None
    for l in lines:
        s = l.strip()
        if not s or re.search(r"Przykładowy schemat odpowiedzi", s):
            continue
        hm = HEAD_ANY.match(s)
        if hm:
            flush()
            title = re.sub(r"^(I{1,3}|IV)\.\s+", "", hm.group(1)).strip().rstrip(":")
            cur = {"title": title[0].upper() + title[1:], "pts": int(hm.group(5)) if hm.group(5) else None, "points": []}
            parts.append(cur)
            continue
        if cur is None:
            cur = {"title": "Schemat odpowiedzi", "pts": None, "points": []}
            parts.append(cur)
        im = ITEM.match(s)
        if im:
            flush()
            mark = im.group(1)
            item = ("  " if re.match(r"[a-z]\)|[-–•]", mark) else "") + (mark + " " if re.match(r"[a-z]\)", mark) else "") + im.group(2)
        elif item is None:
            item = s
        else:
            item += " " + s
    flush()
    return [p for p in parts if p["points"]]

def topic_starts(lines):
    """Indeksy linii rozpoczynających tematy: wiersz „N. …” (N = kolejny temat), po którym – przed innym punktem – zaczyna się schemat."""
    starts = []
    for i, l in enumerate(lines):
        m = re.match(r"^\s{0,3}(\d)\.\s+\S", l)
        if not m or int(m.group(1)) != len(starts) + 1:
            continue
        for j in range(i + 1, min(i + 12, len(lines))):
            if HEAD_START.match(lines[j]):
                starts.append(i)
                break
            if HEAD_ANY.match(lines[j].strip()) or ITEM.match(lines[j]) and re.match(r"^\s{0,3}\d\.", lines[j]):
                break
    return starts

def parse_topic(lines):
    """Temat = linie do pierwszego nagłówka schematu; reszta = schemat."""
    k = next((i for i, l in enumerate(lines) if HEAD_START.match(l)), len(lines))
    title = fix(" ".join(x.strip() for x in lines[:k]))
    title = re.sub(r"^\d\.\s+", "", title)
    return {"title": title, "schema": parse_schema(lines[k:])}

def parse_essay(head, lines):
    choose = bool(re.search(r"wybierz\s+JEDEN", head + " " + " ".join(lines[:2]), re.I))
    sponsor = bool(re.search(r"sponsor|preferencj", head, re.I))
    body = lines
    # dokończenie nagłówka w następnym wierszu („… niżej tematów.”)
    while body and not re.match(r"^\s{0,3}\d\.\s", body[0]) and choose and not HEAD_START.match(body[0]):
        body = body[1:]
    if choose:
        st = topic_starts(body) if not sponsor else [i for i, l in enumerate(body) if re.match(r"^\s{0,3}\d\.\s+\S", l)]
        if not st:
            st = [0]
        topics = [parse_topic(body[a:b]) for a, b in zip(st, st[1:] + [len(body)])]
    else:
        topics = [parse_topic(body)]
    return {"kind": "sponsor" if sponsor else "ogolne", "pts": pts_of(head + " " + " ".join(lines[:2])), "choose": len(topics) > 1, "topics": topics}

def main():
    src, keymap, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    km = json.load(open(keymap))
    result = []
    report = []
    for f, v in sorted(km.items(), key=lambda x: x[1]["set"]):
        sid = v["set"]
        _, ed, stage = sid.split("-")
        lines = open(f"{src}/{f}.txt", encoding="utf-8").read().splitlines()
        secs = split_sections(open_part(lines))
        essays = []
        for head, body in secs:
            if re.search(r"Pytanie", head) and not re.search(r"testow", head):
                e = parse_essay(head, body)
                e.update({"id": f"{sid}-esej{len(essays) + 1}", "set": sid, "ed": int(ed), "stage": STAGE[stage]})
                essays.append(e)
        result += essays
        report.append(f"| {sid} | {len(essays)} | " + "; ".join(f"{e['kind']} {e['pts']} pkt, tematy {len(e['topics'])}, części " +
                      "/".join(str(len(t['schema'])) for t in e["topics"]) for e in essays) + " |")
    json.dump(result, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("\n".join(report))
    print(f"esejów: {len(result)}")

main()
