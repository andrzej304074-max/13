# -*- coding: utf-8 -*-
"""Składa słownik pojęć OWE: dane z s*.py → HTML → PDF (Chromium), z dwuprzebiegowym spisem treści i indeksem.

Użycie: python3 -I build.py <katalog_glossary> <katalog_repo> <plik_pdf>
"""
import glob, html, importlib.util, json, os, re, subprocess, sys, unicodedata

G, REPO, OUT = (os.path.abspath(a) for a in sys.argv[1:4])
SCRATCH = os.path.dirname(G)

def load(path):
    spec = importlib.util.spec_from_file_location(os.path.basename(path)[:-3], path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

sections = [load(p) for p in sorted(glob.glob(os.path.join(G, "s[0-9]*_*.py")))]

# --- liczenie wystąpień hasła w bazie pytań ---
qs = [q for f in sorted(glob.glob(os.path.join(REPO, "data/questions/*.json"))) for q in json.load(open(f))]
texts = [" ".join([q["question"], *q["options"], q["explanation"]]).lower() for q in qs]

def default_keys(term):
    base = re.sub(r"\(.*?\)", "", term).split(" i ")[0].split(" a ")[0].split("/")[0].strip().lower()
    words = [w for w in re.split(r"[\s\-–]+", base) if w]
    stem = " ".join(w if len(w) <= 4 else w[: max(4, len(w) - 2)] for w in words)
    return [stem] if stem else []

_cnt = {}
def count(keys):
    key = tuple(keys)
    if key not in _cnt:
        pat = re.compile(r"(?<![\wąćęłńóśźż])(?:" + "|".join(re.escape(k.lower()) for k in keys) + ")")
        _cnt[key] = sum(1 for t in texts if pat.search(t))
    return _cnt[key]

def norm(s):
    return unicodedata.normalize("NFC", s)

esc = lambda s: html.escape(norm(s))

def slug(i, j=None):
    return f"s{i}" if j is None else f"s{i}-{j}"

def sort_key(s):
    order = "aąbcćdeęfghijklłmnńoóprsśtuwyzźż"
    s = s.lower()
    return [order.index(c) if c in order else 100 + ord(c) for c in s]

def build_html(pages):
    """pages: dict anchor->page (pusty w pierwszym przebiegu)."""
    pg = lambda a: str(pages.get(a, "")) if pages else ""
    out = []
    total_terms = sum(len(s.E) for s in sections)
    # strona tytułowa
    out.append(f"""<section class="title"><div>
      <p class="kicker">Olimpiada Wiedzy Ekonomicznej</p>
      <h1>Słownik pojęć</h1>
      <p class="sub">Pojęcia, wzory, osoby, instytucje, daty i przepisy z pytań testowych XXI–XXXIX OWE
      (zawody szkolne, okręgowe i centralne) zebranych w aplikacji Testy OWE, uzupełnione o program i literaturę olimpiady oraz hasło przewodnie XL OWE „Gospodarka wobec wyzwań demograficznych”.</p>
      <p class="meta">{total_terms} haseł · {len(qs)} pytań w bazie · stan wiedzy: październik 2026</p>
    </div></section>""")
    # spis treści
    toc = ['<section class="toc"><h2>Spis treści</h2><ol>']
    for i, s in enumerate(sections, 1):
        toc.append(f'<li><a href="#{slug(i)}"><span class="n">{i}.</span> {esc(s.TITLE)}'
                   f'<span class="dots"></span><span class="pg">{pg(slug(i))}</span></a>'
                   f'<div class="toc-intro">{esc(s.INTRO)} <em>({len(s.E)} haseł)</em></div></li>')
    toc.append(f'<li><a href="#idx"><span class="n"></span> Indeks alfabetyczny<span class="dots"></span>'
               f'<span class="pg">{pg("idx")}</span></a></li>')
    toc.append('</ol><p class="howto">Jak czytać hasło: <b>pogrubiona nazwa</b>, definicja, '
               '<span class="tag w">wzór</span> <span class="tag p">przykład</span> <span class="tag u">uwaga</span>. '
               'Liczba w nawiasie przy haśle – w ilu pytaniach bazy pojęcie się pojawia (szacunkowo, '
               'wg słów kluczowych). Fakty zmienne w czasie mają dopisek „stan na …”.</p></section>')
    out.append("".join(toc))
    index = []
    for i, s in enumerate(sections, 1):
        out.append(f'<section class="sec" id="{slug(i)}"><h2><span class="n">{i}.</span> {esc(s.TITLE)}</h2>'
                   f'<p class="intro">{esc(s.INTRO)}</p>')
        for t in getattr(s, "TABLES", []):
            title, head, rows = t
            out.append(f'<div class="tbl"><h3>{esc(title)}</h3><table><thead><tr>'
                       + "".join(f"<th>{esc(h)}</th>" for h in head) + "</tr></thead><tbody>"
                       + "".join("<tr>" + "".join(f"<td>{esc(c)}</td>" for c in r) + "</tr>" for r in rows)
                       + "</tbody></table></div>")
        out.append('<div class="entries">')
        for j, (term, d, x) in enumerate(sorted(s.E, key=lambda e: sort_key(e[0]))):
            n = count(x.get("k") or default_keys(term))
            a = slug(i, j)
            if not getattr(s, "NO_INDEX", False): index.append((term, i, a))
            parts = [f'<div class="e" id="{a}"><p><b>{esc(term)}</b>'
                     + (f' <span class="cnt">({n})</span>' if n else "") + f' – {esc(d)}</p>']
            if x.get("w"): parts.append(f'<p class="w"><span class="tag w">wzór</span> {esc(x["w"])}</p>')
            if x.get("p"): parts.append(f'<p class="p"><span class="tag p">przykład</span> {esc(x["p"])}</p>')
            if x.get("u"): parts.append(f'<p class="u"><span class="tag u">uwaga</span> {esc(x["u"])}</p>')
            parts.append("</div>")
            out.append("".join(parts))
        out.append("</div></section>")
    # indeks
    out.append('<section class="idx" id="idx"><h2>Indeks alfabetyczny</h2><div class="cols">')
    letter = None
    for term, i, a in sorted(index, key=lambda e: sort_key(e[0])):
        L = term[0].upper()
        if L != letter:
            letter = L; out.append(f'<h4>{esc(L)}</h4>')
        out.append(f'<p><a href="#{a}">{esc(term)}</a> <span class="ref">{i}'
                   + (f" · s. {pg(a)}" if pg(a) else "") + "</span></p>")
    out.append("</div></section>")
    css = open(os.path.join(G, "style.css")).read()
    return f'<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Słownik pojęć OWE</title><style>{css}</style></head><body>{"".join(out)}</body></html>', index

def render(html_text, pdf):
    hp = os.path.join(SCRATCH, "glossary", "out.html")
    open(hp, "w").write(html_text)
    subprocess.run(["node", os.path.join(SCRATCH, "glossary", "print.mjs"), hp, pdf], check=True, cwd=SCRATCH)

def page_texts(pdf):
    n = int(re.search(r"Pages:\s+(\d+)", subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout).group(1))
    t = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout.split("\f")
    return [re.sub(r"\s+", " ", norm(x)) for x in t[:n]]

def locate(pdf, index):
    pt = page_texts(pdf)
    pages = {}
    def find(s, start=0):
        s = re.sub(r"\s+", " ", norm(s))
        for k in range(start, len(pt)):
            if s in pt[k]: return k
        return None
    for i, s in enumerate(sections, 1):
        k = find(f"{i}. {s.TITLE}", 2)
        if k is not None: pages[slug(i)] = k + 1
    k = find("Indeks alfabetyczny", 2)
    if k is not None: pages["idx"] = k + 1
    for term, i, a in index:
        st = pages.get(slug(i), 1) - 1
        k = find(term[:40], st)
        if k is not None: pages[a] = k + 1
    return pages, len(pt)

h, index = build_html({})
render(h, OUT)
pages, n = locate(OUT, index)
for _ in range(2):  # numery stron mogą przesunąć układ spisu – powtórz do stabilizacji
    h, index = build_html(pages)
    render(h, OUT)
    new, n = locate(OUT, index)
    if new == pages: break
    pages = new
missing = [t for t, i, a in index if a not in pages]
print(f"ok: {n} stron, {len(index)} haseł, bez numeru strony: {len(missing)}", missing[:10])
