"""Wyciąga pytania oznaczone „🤖 AI” z wklejonego tekstu (eksport z innej aplikacji) do roboczego JSON-a.

Użycie: python3 -I tools/pytania_ai/extract.py <tekst.txt> <wynik.json>
Format wejścia (powtarzany): „N. treść pytania”, wiersz „🤖 AI | Dział: X” (albo „📜 OWE | …” – pomijane),
4 odpowiedzi w osobnych akapitach, wiersz „💡 Nie rozumiesz? …”. Poprawne odpowiedzi nie są zaznaczone –
klucz i poprawki treści są dopisywane ręcznie (data/ai/questions.json), ten skrypt tylko porządkuje surowe dane:
łączy wyrazy dzielone „opo- datkowania”, usuwa prefiksy „A.”/„a)”, scala duplikaty po znormalizowanej treści.
"""
import json, re, sys
from collections import OrderedDict

MARK = re.compile(r"^(🤖 AI|📜 OWE)\s*\|\s*Dział:\s*(.+)$")


def clean(s: str) -> str:
    s = re.sub(r"(\w)- (\w)", r"\1\2", s)
    s = re.sub(r"\s+", " ", s).strip()
    return re.sub(r"^(?:[A-Da-d][.)]|\([a-d]\))\s+", "", s)


def norm(s: str) -> str:
    return re.sub(r"[^a-ząćęłńóśźż0-9]+", " ", s.lower()).strip()


def parse(text: str):
    # akapity; pytanie = akapit(y) przed znacznikiem źródła od „N. …”, odpowiedzi = akapity po nim do „💡”
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    out = []
    for k, p in enumerate(paras):
        m = MARK.match(p)
        if not m:
            continue
        j = k - 1
        while j > 0 and not re.match(r"^\d{1,3}\. ", paras[j]) and not re.search(r"\s\d{1,3}\. \S", paras[j]):
            j -= 1
        stem = " ".join(paras[j:k])
        num = re.search(r"(?:^|\s)(\d{1,3})\. (?=\S)", stem)
        q = clean(stem[num.end():] if num else stem)
        opts = []
        for o in paras[k + 1:]:
            if o.startswith("💡") or MARK.match(o) or re.match(r"^\d{1,3}\. \S{3}", o):
                break
            opts.append(clean(o))
        src, dzial = m.groups()
        out.append({"n": int(num.group(1)) if num else 0, "src": "ai" if src.startswith("🤖") else "owe",
                    "dzial": dzial.strip(), "question": q, "options": opts})
    return out


def main(src, dst):
    qs = parse(open(src, encoding="utf-8").read())
    ai = [q for q in qs if q["src"] == "ai"]
    uniq: "OrderedDict[str, dict]" = OrderedDict()
    for q in ai:
        key = norm(q["question"]) + "|" + "|".join(sorted(norm(o) for o in q["options"]))
        if key in uniq:
            uniq[key]["dup"] += 1
        else:
            uniq[key] = {**q, "dup": 0}
    res = list(uniq.values())
    json.dump(res, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"bloków: {len(qs)}, AI: {len(ai)}, OWE (pominięte): {len(qs) - len(ai)}, unikalnych AI: {len(res)}, "
          f"opcji ≠ 4: {sum(len(q['options']) != 4 for q in res)}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
