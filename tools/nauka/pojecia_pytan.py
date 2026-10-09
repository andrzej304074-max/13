# -*- coding: utf-8 -*-
"""Pojęcia (hasła słownika) występujące w pytaniach – w treści i w każdej odpowiedzi.

Używane przez build_course.py do przydziału pytań do lekcji i do wyznaczenia pojęć,
które lekcja musi omówić, żeby Sprawdzian nie pytał o rzeczy spoza lekcji.
Ręczne korekty: pojecia_pytan_poprawki.py.

Przegląd (CLI):
  python3 -I tools/nauka/pojecia_pytan.py dump 'owe-21-*'   – pytania z dopasowanymi hasłami
  python3 -I tools/nauka/pojecia_pytan.py stats              – statystyki
"""
import glob, importlib.util, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
WB = r"(?<![\wąćęłńóśźż])"
END = r"(?![\wąćęłńóśźż])"
# czteroznakowe rdzenie, które mogą mieć końcówkę (pozostałe krótkie klucze – tylko całe słowo)
PREFIX4 = {"akcj", "bańk", "bess", "bodź", "cesj", "cukr", "etyk", "fuzj", "gmin", "hoss", "misj", "opcj", "utar",
           "wizj", "zmow", "łowc", "żniw", "nisz", "okun", "nash", "kerr", "mayo", "saya", "łask", "ford",
           "watt", "hume", "owen", "mill", "snow", "card", "bain", "barr", "fama", "kuhn", "ries", "jago", "awal", "gini", "swap"}


def _load(p):
    s = importlib.util.spec_from_file_location(os.path.basename(p)[:-3], p)
    m = importlib.util.module_from_spec(s)
    s.loader.exec_module(m)
    return m


FIX = _load(os.path.join(HERE, "pojecia_pytan_poprawki.py"))


def _key_rx(k):
    """Słowo kluczowe → wyrażenie: wyrazy wielowyrazowego klucza mogą mieć dowolne końcówki
    („fundusz inwestycyjn” trafia też w „funduszu inwestycyjnego”); krótkie klucze (≤ 4 znaki) – tylko całe słowo."""
    words = k.split()
    if len(words) == 1:
        return WB + re.escape(k) + ("" if len(k) >= 5 or k in PREFIX4 else END)
    # krótkie wyrazy (np. „i”, „ii”, „od”) – dokładnie, dłuższe – z dowolną końcówką
    parts = [re.escape(w) + (r"[\wąćęłńóśźż]*" if len(w) >= 4 else END) for w in words[:-1]]
    last = re.escape(words[-1]) + ("" if len(words[-1]) >= 3 else END)
    return WB + r"\s+".join(parts + [last])


def _title_rx(it):
    """Wzorzec z tytułu hasła (bez nawiasów): „Rynek funduszy pożyczkowych” trafia też w „rynku funduszy
    pożyczkowych”. Tylko tytuły 2–5-wyrazowe bez spójników i myślników (te opisują zestawienia, nie nazwy)."""
    if it["kind"] in ("data", "wzor"):
        return None
    words = it["s"].lower().replace(",", " ").split()
    if not 2 <= len(words) <= 5 or any(w in ("i", "a", "–", "-", "oraz", "czy", "vs") or ":" in w for w in words):
        return None
    parts = []
    for w in words:
        w = w.strip("„”\"'.")
        if len(w) >= 5:
            parts.append(re.escape(w[: len(w) - 1 if len(w) <= 7 else len(w) - 2]) + r"[\wąćęłńóśźż]*")
        else:
            parts.append(re.escape(w) + END)
    return WB + r"\s+".join(parts)


def _year(t):
    m = re.match(r"^(\d{3,4})", t)
    return m.group(1) if m else None


class Matcher:
    """Dopasowuje hasła do tekstu pytania po słowach kluczowych (z poprawkami)."""

    def __init__(self, items):
        self.items = {i: it for i, it in items.items() if it["kind"] != "zrozumienie"}
        self.by_title = {it["t"]: i for i, it in self.items.items()}
        for i, it in self.items.items():  # skrócone tytuły (bez nawiasów), jeśli jednoznaczne
            self.by_title.setdefault(it["s"], i)
        bad = [t for t in list(FIX.ITEM_DROP) + list(FIX.ITEM_ADD) + list(FIX.NO_DETECT) if t not in self.by_title]
        bad += [t for f in FIX.Q_FIX.values() for k in ("add", "del", "main") for t in f.get(k, []) if t not in self.by_title]
        if bad:
            raise ValueError("pojecia_pytan_poprawki: nieznane hasła: " + "; ".join(sorted(set(bad))))
        self.rx = {}
        for i, it in self.items.items():
            if it["t"] in FIX.NO_DETECT or it["s"] in FIX.NO_DETECT:
                continue
            drop = {k.lower() for k in FIX.ITEM_DROP.get(it["t"], FIX.ITEM_DROP.get(it["s"], []))} | FIX.GLOBAL_DROP
            keys = [k.lower() for k in it["k"] if k.lower() not in drop and len(k) >= 2]
            # krótkie klucze (np. „cło”, „m1”) – tylko jako całe słowo
            add = list(FIX.ITEM_ADD.get(it["t"], FIX.ITEM_ADD.get(it["s"], [])))
            tr = _title_rx(it) if it["t"] not in FIX.NO_TITLE else None
            if tr:
                add.append(tr)
            pats = [_key_rx(k) for k in keys] + add
            if not pats:
                continue
            year = _year(it["t"]) if it["kind"] == "data" else None
            self.rx[i] = (keys, re.compile("(?:" + "|".join(pats) + ")"), year, bool(add))

    KIND_RANK = {"pojecie": 0, "instytucja": 1, "wzor": 2, "przepis": 3, "osoba": 4, "data": 5}

    def find(self, text, prefer_person=False):
        """Hasła w tekście. Gdy kilka haseł trafia w ten sam fragment, zostaje najdłuższe dopasowanie
        (np. „kosztu krańcowego” → Koszt krańcowy, a nie Myślenie krańcowe), a przy równych – pojęcie przed
        wzorem, osobą i datą."""
        t = text.lower()
        cands = []
        for i, (keys, rx, year, has_add) in self.rx.items():
            if year and year not in t:
                continue
            if not has_add and not any(k.split()[0] in t for k in keys):
                continue
            for m in rx.finditer(t):
                cands.append((m.start(), m.end(), i))
        kr = lambda i: -1 if prefer_person and self.items[i]["kind"] == "osoba" else self.KIND_RANK.get(self.items[i]["kind"], 9)
        rank = lambda c: (-(c[1] - c[0]), kr(c[2]))
        taken, out = [], set()
        for a, b, i in sorted(cands, key=rank):
            if any(a >= a2 and b <= b2 and i2 != i for a2, b2, i2 in taken):
                continue
            taken.append((a, b, i))
            out.add(i)
        return out

    def analyze(self, q):
        """{'stem': set, 'opts': [set...], 'main': set, 'all': set} – id haseł."""
        stem = self.find(q["question"])
        # odpowiedź będąca samym nazwiskiem (np. „Henri Fayol”) dotyczy osoby, nie jej koncepcji
        name = lambda o: len(o.split()) <= 4 and all(w[:1].isupper() for w in o.split())
        opts = [self.find(o, prefer_person=name(o)) for o in q["options"]]
        allc = stem.union(*opts)
        main = stem.union(*(opts[k] for k in q["correct"] if k < len(opts)))
        fix = FIX.Q_FIX.get(q["id"], {})
        add = {self.by_title[t] for t in fix.get("add", [])}
        dele = {self.by_title[t] for t in fix.get("del", [])}
        allc = (allc | add) - dele
        main = ((main | add) - dele) if not fix.get("main") else {self.by_title[t] for t in fix["main"]}
        if not main:
            main = set(allc)
        return {"stem": stem, "opts": opts, "main": main & allc or main, "all": allc | main}


def bank(root, pattern="*"):
    out = []
    for f in sorted(glob.glob(os.path.join(root, "data/questions", pattern + ".json"))):
        out += json.load(open(f))
    return out


def main():
    root = os.path.abspath(os.path.join(HERE, "..", ".."))
    items = json.load(open(os.path.join(root, "data/nauka/course.json")))["items"]
    m = Matcher(items)
    cmd = sys.argv[1] if len(sys.argv) > 1 else "stats"
    qs = bank(root, sys.argv[2] if len(sys.argv) > 2 else "owe-*")
    s = lambda ids: ", ".join(sorted(items[i]["s"] for i in ids)) or "–"
    if cmd == "dump":
        for q in qs:
            a = m.analyze(q)
            print(f"## {q['id']} | {q['question'][:300]}")
            print(f"   [treść] {s(a['stem'])}")
            for k, o in enumerate(q["options"]):
                mark = "*" if k in q["correct"] else " "
                print(f"   {mark}{chr(97 + k)}) {o[:130]}  →  {s(a['opts'][k])}")
            print(f"   MAIN: {s(a['main'])}")
    else:
        none = sum(1 for q in qs if not m.analyze(q)["all"])
        sizes = sorted(len(m.analyze(q)["all"]) for q in qs)
        print(f"pytań: {len(qs)}, bez pojęć: {none}, pojęć na pytanie: mediana {sizes[len(sizes) // 2]}, max {sizes[-1]}")


if __name__ == "__main__":
    main()
