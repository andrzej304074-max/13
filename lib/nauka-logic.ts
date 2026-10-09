import type { Question } from "./types";
import type { AnswerLog, CourseItem, ExerciseType, GraphSpec, LessonPayload, ZEx } from "./nauka-types";

/* ---------- sprawdzanie wpisanych odpowiedzi ---------- */

/** Małe litery, bez polskich znaków, interpunkcji i podwójnych spacji. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Dopuszczalna liczba literówek: ok. 1 na 5 znaków (krótkie słowa – bez błędów). */
function tolerance(len: number) {
  return len <= 3 ? 0 : len <= 6 ? 1 : Math.floor(len / 5);
}

export function fuzzyEqual(typed: string, target: string): boolean {
  const a = normalize(typed), b = normalize(target);
  if (!a || !b) return false;
  return levenshtein(a, b) <= tolerance(b.length);
}

/** Rok z początku tytułu hasła-daty („1694 – założenie Banku Anglii” → "1694"). */
export function yearOf(item: CourseItem): string | null {
  const m = /^(\d{3,4})/.exec(item.s);
  return m ? m[1] : null;
}

/** Tytuł daty bez roku: „założenie Banku Anglii”. */
export function eventOf(item: CourseItem): string {
  return item.s.replace(/^\d{3,4}(\s*[–-]\s*\d{2,4})?\s*[–-]\s*/, "");
}

/** Nazwisko osoby – hasła osób mają postać „Nazwisko Imię”. */
export function surnameOf(item: CourseItem): string {
  return item.s.split(/\s+/)[0];
}

/** Odpowiedzi akceptowane przy wpisywaniu nazwy hasła. */
export function acceptedAnswers(item: CourseItem): string[] {
  if (item.kind === "data") return [yearOf(item) ?? item.s];
  const out = [item.s, ...item.al.filter((a) => !/\.\s/.test(a))];
  if (item.kind === "osoba") out.push(surnameOf(item));
  // nazwa bez dopisku „– wzór”, „– przykład” itp.
  const base = item.s.replace(/\s+[–-]\s+.*$/, "");
  if (base !== item.s && base.length >= 3) out.push(base);
  return [...new Set(out)];
}

/** Rdzenie słów kluczowych hasła (np. "elastyczno ceno popy") – każdy musi zaczynać któreś wpisane słowo. */
function stemsMatch(typed: string, stem: string): boolean {
  const words = normalize(typed).split(" ");
  const parts = normalize(stem).split(" ").filter(Boolean);
  return parts.length > 0 && parts.every((p) => words.some((w) => w.startsWith(p)));
}

export function checkTyped(typed: string, item: CourseItem): boolean {
  if (normalize(typed).length === 0) return false;
  if (item.kind === "data") return normalize(typed) === normalize(yearOf(item) ?? "");
  if (acceptedAnswers(item).some((a) => fuzzyEqual(typed, a))) return true;
  return normalize(typed).length >= 4 && item.k.some((k) => k.length >= 4 && stemsMatch(typed, k));
}

/* ---------- XP ---------- */

export const XP_CORRECT = 10;
export const XP_COMBO_EVERY = 5;
export const XP_COMBO_BONUS = 5;
export const XP_FINISH = 10;
export const XP_PERFECT = 10;

/** XP za pod-lekcję: 10 za poprawną odpowiedź, +5 co 5 poprawnych z rzędu, +10 za ukończenie, +10 bez błędu. */
export function computeXp(correct: boolean[], finished = true): number {
  let xp = 0, combo = 0;
  for (const c of correct) {
    if (c) {
      xp += XP_CORRECT;
      combo++;
      if (combo % XP_COMBO_EVERY === 0) xp += XP_COMBO_BONUS;
    } else combo = 0;
  }
  if (finished && correct.length > 0) {
    xp += XP_FINISH;
    if (correct.every(Boolean)) xp += XP_PERFECT;
  }
  return xp;
}

/* ---------- generator ćwiczeń ---------- */

export type Exercise =
  | { type: "intro"; item: CourseItem; fromQuestions?: boolean }
  | { type: "wybor"; item: CourseItem; title: string; prompt: string; options: string[]; correct: number; long?: boolean }
  | { type: "wzor"; item: CourseItem; title: string; prompt: string; options: string[]; correct: number; long?: boolean }
  | { type: "prawda-falsz"; item: CourseItem; term?: string; statement: string; truth: boolean; trueDef: string; ctx?: string; stat?: ExerciseType }
  | { type: "luka"; item: CourseItem; before: string; after: string; options: string[]; answer: string; why?: string; ctx?: string; stat?: ExerciseType }
  | { type: "wpisz"; item: CourseItem; title: string; prompt: string; hint: string }
  | { type: "pary"; items: CourseItem[]; left: { id: string; text: string }[]; right: { id: string; text: string }[] }
  | { type: "kolejnosc"; items: CourseItem[]; shuffled: CourseItem[] }
  | { type: "fiszka"; item: CourseItem }
  | { type: "pytanie"; item: CourseItem; question: Question; ctx?: string; stat?: ExerciseType }
  | { type: "karta"; item: CourseItem; title: string; text: string; w?: string; p?: string; g?: GraphSpec }
  | { type: "lancuch"; item: CourseItem; q: string; steps: string[]; shuffled: string[]; why?: string; ctx?: string; stat?: ExerciseType }
  | { type: "kategorie"; item: CourseItem; q: string; cats: string[]; entries: { text: string; cat: number }[]; why?: string; ctx?: string; stat?: ExerciseType }
  | { type: "liczba"; item: CourseItem; q: string; a: number; tol: number; unit?: string; steps: string[]; ctx?: string; stat?: ExerciseType }
  | { type: "wykres"; item: CourseItem; q: string; g: GraphSpec; options: string[]; correct: number; why: string; ctx?: string; stat?: ExerciseType };

/** Typ ćwiczenia zapisywany w statystykach (karty wprowadzające i wyjaśniające nie są oceniane). */
export function exerciseKind(e: Exercise): ExerciseType | null {
  if (e.type === "intro" || e.type === "karta") return null;
  return ("stat" in e && e.stat) || e.type;
}

/* ---------- odpowiedzi liczbowe ---------- */

/** Liczba z tekstu użytkownika: „1 234,5”, „1234.5”, „12%”, „−3” → number (NaN, gdy się nie da). */
export function parseNumber(s: string): number {
  const t = s
    .replace(/[\s\u00a0]/g, "")
    .replace(/[−–]/g, "-")
    .replace(",", ".")
    .replace(/[^0-9.\-]+$/, "");
  return /^-?\d+(\.\d+)?$|^-?\.\d+$/.test(t) ? Number(t) : NaN;
}

export function checkNumber(input: string, answer: number, tol: number): boolean {
  const v = parseNumber(input);
  return Number.isFinite(v) && Math.abs(v - answer) <= tol + 1e-9;
}

/* ---------- lekcje „Zrozumienie”: ćwiczenia z ręcznej treści ---------- */

/** Tasuje opcje i zwraca nowe położenie poprawnych odpowiedzi. */
function shuffleKeyed(opts: string[], ok: number[], rnd: () => number) {
  const order = shuffle(opts.map((_, i) => i), rnd);
  return { options: order.map((i) => opts[i]), correct: order.flatMap((i, pos) => (ok.includes(i) ? [pos] : [])) };
}

export function buildZrozum(exs: ZEx[], item: CourseItem, rnd: () => number = Math.random): Exercise[] {
  return exs.map((e): Exercise => {
    switch (e.t) {
      case "karta":
        return { type: "karta", item, title: e.title, text: e.text, w: e.w, p: e.p, g: e.g };
      case "wybor":
      case "multi": {
        const k = shuffleKeyed(e.opts, e.t === "wybor" ? [e.ok] : e.ok, rnd);
        const question: Question = {
          id: "", type: e.t === "wybor" ? "single" : "multi", edition: "", question: e.q,
          options: k.options, correct: k.correct, explanation: e.why,
        };
        return { type: "pytanie", item, question, ctx: e.ctx, stat: e.stat };
      }
      case "pf":
        return { type: "prawda-falsz", item, statement: e.s, truth: e.v, trueDef: e.why, ctx: e.ctx, stat: e.stat };
      case "luka": {
        const [before, after] = e.text.split("___");
        return { type: "luka", item, before, after, options: shuffle(e.opts, rnd), answer: e.opts[e.ok], why: e.why, ctx: e.ctx, stat: e.stat };
      }
      case "lancuch": {
        let shuffled = shuffle(e.steps, rnd);
        if (shuffled.every((x, i) => x === e.steps[i])) shuffled = [...e.steps].reverse();
        return { type: "lancuch", item, q: e.q, steps: e.steps, shuffled, why: e.why, ctx: e.ctx, stat: e.stat };
      }
      case "kategorie":
        return {
          type: "kategorie", item, q: e.q, cats: e.cats, why: e.why, ctx: e.ctx, stat: e.stat,
          entries: shuffle(e.items.map(([text, cat]) => ({ text, cat })), rnd),
        };
      case "liczba":
        return { type: "liczba", item, q: e.q, a: e.a, tol: e.tol, unit: e.unit, steps: e.steps, ctx: e.ctx, stat: e.stat };
      case "wykres": {
        const k = shuffleKeyed(e.opts, [e.ok], rnd);
        return { type: "wykres", item, q: e.q, g: e.g, options: k.options, correct: k.correct[0], why: e.why, ctx: e.ctx, stat: e.stat };
      }
    }
  });
}

export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function clip(text: string, limit = 220): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const dot = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return (dot > limit * 0.5 ? cut.slice(0, dot + 1) : cut.slice(0, cut.lastIndexOf(" ")) + " …").trim();
}

/** Definicja do pokazania bez nazwy hasła; pusta, jeśli maskowanie zostawiło za mało treści. */
function masked(item: CourseItem): string {
  return clip(item.m, 260);
}

/** Wybiera do n różnych wartości `key` z kandydatów, pomijając wartość poprawną. */
function distractors(cands: CourseItem[], key: (i: CourseItem) => string | null, correct: string, n = 3, rnd = Math.random) {
  const seen = new Set([normalize(correct)]);
  const out: string[] = [];
  for (const c of shuffle(cands, rnd)) {
    const v = key(c);
    if (!v || seen.has(normalize(v))) continue;
    seen.add(normalize(v));
    out.push(v);
    if (out.length >= n) break;
  }
  return out;
}

function choice(item: CourseItem, title: string, prompt: string, correct: string, others: string[], rnd: () => number, long = false) {
  const options = shuffle([correct, ...others], rnd);
  return { item, title, prompt, options, correct: options.indexOf(correct), long };
}

const PL_STOP = new Set(
  "który która które których którym oraz jako przez między według poprzez także również jednak dzięki których więcej mniej ponad wobec przede wszystkim innych inne inny tylko często zwykle danego danej dany jego jej ich tego tych temu takie taki taka".split(" "),
);

/** Słowo do wycięcia w ćwiczeniu „uzupełnij lukę”: długie, nie z nazwy hasła i nie z listy słów pomocniczych. */
function clozeWord(item: CourseItem, rnd: () => number): string | null {
  const title = normalize(item.t);
  const words = (item.d.match(/[A-Za-zÀ-žąćęłńóśźżĄĆĘŁŃÓŚŹŻ]{7,}/g) ?? []).filter((w) => {
    const n = normalize(w);
    return !PL_STOP.has(w.toLowerCase()) && !title.includes(n.slice(0, 5)) && w === w.toLowerCase();
  });
  if (words.length === 0) return null;
  const top = [...new Set(words)].sort((a, b) => b.length - a.length).slice(0, 4);
  return top[Math.floor(rnd() * top.length)];
}

export interface BuildOptions {
  level?: number;
  rnd?: () => number;
}

export function buildExercises(p: LessonPayload, opts: BuildOptions = {}): Exercise[] {
  const rnd = opts.rnd ?? Math.random;
  if (p.zrozum) return buildZrozum(p.zrozum.exercises, p.items[0], rnd);
  const level = opts.level ?? 0;
  // hasła omawiane w lekcji: jej hasła i nowe hasła z jej pytań olimpijskich/słownikowych
  const fromQ = new Set((p.extra ?? []).map((i) => i.id));
  const taught = [...p.items, ...(p.extra ?? []).filter((i) => !p.items.some((o) => o.id === i.id))];
  // lekcja z 1–2 haseł: dobierz hasła tego samego rodzaju z puli, żeby ćwiczeń było co najmniej kilka
  const pad = taught.length >= 3 ? [] : p.pool.filter((o) => taught.some((i) => i.kind === o.kind) && !fromQ.has(o.id)).slice(0, 3 - taught.length);
  const items = [...taught, ...pad];
  // hasła z pytań poznane wcześniej: w „Ćwicz” i „Utrwal” po jednym ćwiczeniu (do 8 losowych na podejście)
  const repeat = shuffle((p.repeat ?? []).filter((i) => !items.some((o) => o.id === i.id)), rnd).slice(0, 8);
  const all = [...items, ...repeat, ...p.pool.filter((o) => !items.includes(o) && !repeat.includes(o))];
  const others = (it: CourseItem) => all.filter((o) => o.id !== it.id);
  const sameKind = (it: CourseItem) => others(it).filter((o) => o.kind === it.kind);
  const kindOrAll = (it: CourseItem) => (sameKind(it).length >= 3 ? sameKind(it) : others(it));

  const recognize = (it: CourseItem): Exercise | null => {
    if (it.kind === "data") {
      const y = yearOf(it);
      if (!y) return null;
      const years = distractors(others(it).filter((o) => o.kind === "data"), yearOf, y, 3, rnd);
      while (years.length < 3) {
        const v: string = String(Number(y) + Math.round((rnd() - 0.5) * 40) || 1);
        if (v !== y && !years.includes(v)) years.push(v);
      }
      return { type: "wybor", ...choice(it, "W którym roku?", `${eventOf(it)} — ${clip(it.d, 160)}`, y, years, rnd) };
    }
    const prompt = masked(it);
    if (!prompt.replace(/[…\s.,;:]/g, "")) return null;
    const title = it.kind === "osoba" ? "Kogo dotyczy opis?" : it.kind === "instytucja" ? "Jaka to instytucja?" : "Które to hasło?";
    const ds = distractors(kindOrAll(it), (o) => o.s, it.s, 3, rnd);
    if (ds.length < 3) return null;
    return { type: "wybor", ...choice(it, title, prompt, it.s, ds, rnd) };
  };

  const termToDef = (it: CourseItem): Exercise | null => {
    const ds = distractors(kindOrAll(it), (o) => clip(o.m, 200), clip(it.m, 200), 3, rnd);
    if (ds.length < 3) return null;
    return { type: "wybor", ...choice(it, "Wybierz poprawny opis", it.s, clip(it.m, 200), ds, rnd, true) };
  };

  const trueFalse = (it: CourseItem): Exercise | null => {
    const truth = rnd() < 0.5;
    const trueDef = clip(it.d, 220);
    if (truth) return { type: "prawda-falsz", item: it, term: it.s, statement: clip(it.m, 220), truth, trueDef };
    const ds = distractors(kindOrAll(it), (o) => clip(o.m, 220), clip(it.m, 220), 1, rnd);
    if (!ds.length) return null;
    return { type: "prawda-falsz", item: it, term: it.s, statement: ds[0], truth, trueDef };
  };

  const cloze = (it: CourseItem): Exercise | null => {
    const word = clozeWord(it, rnd);
    if (!word) return null;
    const text = clip(it.d, 300);
    const at = text.indexOf(word);
    if (at < 0) return null;
    const words = others(it)
      .flatMap((o) => o.d.match(/[a-ząćęłńóśźż]{7,}/g) ?? [])
      .filter((w) => Math.abs(w.length - word.length) <= 4 && !PL_STOP.has(w) && normalize(w) !== normalize(word));
    // najpierw słowa o tej samej końcówce (ta sama forma gramatyczna), żeby nie dało się zgadnąć z odmiany
    const end = word.slice(-2);
    const uniq = [...new Set(shuffle(words, rnd))];
    const opts = [...uniq.filter((w) => w.endsWith(end)), ...uniq.filter((w) => !w.endsWith(end))].slice(0, 3);
    if (opts.length < 3) return null;
    return { type: "luka", item: it, before: text.slice(0, at), after: text.slice(at + word.length), options: shuffle([word, ...opts], rnd), answer: word };
  };

  const typing = (it: CourseItem): Exercise | null => {
    if (it.kind === "data") {
      return yearOf(it) ? { type: "wpisz", item: it, title: "Wpisz rok", prompt: `${eventOf(it)} — ${clip(it.d, 160)}`, hint: "np. 1997" } : null;
    }
    if (it.s.length > 45) return null;
    const prompt = masked(it);
    if (!prompt.replace(/[…\s.,;:]/g, "")) return null;
    const title = it.kind === "osoba" ? "Wpisz nazwisko" : "Wpisz nazwę hasła";
    const hint = it.kind === "osoba" ? "wystarczy nazwisko" : `${it.s.split(/\s+/).length} sł. · pierwsza litera: ${it.s[0]}`;
    return { type: "wpisz", item: it, title, prompt, hint };
  };

  const formula = (it: CourseItem, reverse: boolean): Exercise | null => {
    if (!it.w) return null;
    const withW = others(it).filter((o) => o.w);
    if (reverse) {
      const ds = distractors(withW, (o) => o.s, it.s, 3, rnd);
      if (ds.length < 3) return null;
      return { type: "wzor", ...choice(it, "Do czego służy ten wzór?", clip(it.w, 240), it.s, ds, rnd) };
    }
    const ds = distractors(withW, (o) => clip(o.w ?? "", 200), clip(it.w, 200), 3, rnd);
    if (ds.length < 3) return null;
    return { type: "wzor", ...choice(it, "Wybierz właściwy wzór", it.s, clip(it.w, 200), ds, rnd, true) };
  };

  const pairs = (list: CourseItem[]): Exercise | null => {
    let chosen = shuffle(list, rnd).slice(0, 5);
    if (chosen.length < 4) chosen = [...chosen, ...shuffle(p.pool, rnd).slice(0, 4 - chosen.length)];
    if (chosen.length < 3) return null;
    const def = (o: CourseItem) => (o.kind === "data" ? eventOf(o) : clip(o.m, 110));
    const label = (o: CourseItem) => (o.kind === "data" ? yearOf(o) ?? o.s : o.s);
    if (new Set(chosen.map(label)).size < chosen.length) return null;
    return {
      type: "pary",
      items: chosen,
      left: shuffle(chosen.map((o) => ({ id: o.id, text: label(o) })), rnd),
      right: shuffle(chosen.map((o) => ({ id: o.id, text: def(o) })), rnd),
    };
  };

  const ordering = (): Exercise | null => {
    const dates = [...items, ...p.pool].filter((o) => o.kind === "data" && yearOf(o));
    const uniq = new Map<string, CourseItem>();
    for (const d of shuffle(dates, rnd)) if (!uniq.has(yearOf(d)!)) uniq.set(yearOf(d)!, d);
    const chosen = [...uniq.values()].slice(0, 4);
    if (chosen.length < 3) return null;
    const sorted = [...chosen].sort((a, b) => Number(yearOf(a)) - Number(yearOf(b)));
    let shuffled = shuffle(chosen, rnd);
    if (shuffled.every((o, i) => o === sorted[i])) shuffled = [...sorted].reverse();
    return { type: "kolejnosc", items: sorted, shuffled };
  };

  const add = (out: Exercise[], ...ex: (Exercise | null)[]) => {
    for (const e of ex) if (e) out.push(e);
  };
  const out: Exercise[] = [];
  const typeMore = level >= 2;

  if (p.sub === 1) {
    for (const it of items) {
      out.push({ type: "intro", item: it, fromQuestions: fromQ.has(it.id) });
      add(out, recognize(it) ?? trueFalse(it));
    }
    for (const it of shuffle(items, rnd)) add(out, it.kind === "data" ? trueFalse(it) : termToDef(it) ?? trueFalse(it));
    add(out, pairs(items));
  } else if (p.sub === 2) {
    const mixed: Exercise[] = [];
    for (const it of items) {
      add(mixed, cloze(it) ?? recognize(it), trueFalse(it));
      if (typeMore) add(mixed, typing(it));
      else if (it.w) add(mixed, formula(it, false));
    }
    for (const it of repeat) add(mixed, recognize(it) ?? trueFalse(it));
    out.push(...shuffle(mixed, rnd));
    add(out, items.some((i) => i.kind === "data") ? ordering() : null, pairs(items));
  } else if (p.sub === 3) {
    const mixed: Exercise[] = [];
    for (const it of items) {
      add(mixed, typing(it) ?? recognize(it));
      if (it.w) add(mixed, formula(it, rnd() < 0.5));
      else if (typeMore) add(mixed, termToDef(it));
      else add(mixed, { type: "fiszka", item: it });
    }
    for (const it of repeat) add(mixed, typing(it) ?? termToDef(it) ?? recognize(it));
    out.push(...shuffle(mixed, rnd));
    add(out, items.some((i) => i.kind === "data") ? ordering() : pairs(items));
  } else {
    const qs = shuffle(p.questions, rnd).slice(0, typeMore ? 7 : 8);
    for (const q of qs) out.push({ type: "pytanie", item: itemForQuestion(q, [...items, ...(p.repeat ?? [])]), question: q });
    const typed = shuffle(items, rnd)
      .map(typing)
      .filter(Boolean)
      .slice(0, 10 - qs.length) as Exercise[];
    out.push(...typed);
    // za mało pytań z baz – uzupełnij rozpoznawaniem haseł
    for (const it of shuffle(items, rnd)) {
      if (out.length >= 10) break;
      add(out, recognize(it) ?? termToDef(it));
    }
  }
  return out;
}

/** Hasło lekcji, którego dotyczy pytanie z bazy (po słowach kluczowych); domyślnie pierwsze. */
export function itemForQuestion(q: Question, items: CourseItem[]): CourseItem {
  const text = normalize(`${q.question} ${q.options.join(" ")} ${q.explanation}`);
  let best = items[0], score = 0;
  for (const it of items) {
    const s = it.k.reduce((n, k) => (k.length >= 3 && text.includes(normalize(k)) ? n + 1 : n), 0);
    if (s > score) [best, score] = [it, s];
  }
  return best;
}

/** Wynik ćwiczenia „pytanie z bazy”: poprawne, gdy zaznaczenie dokładnie zgadza się z kluczem. */
export function questionCorrect(q: Question, selected: number[]): boolean {
  const a = [...selected].sort(), b = [...q.correct].sort();
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function accuracy(answers: Pick<AnswerLog, "correct">[]): number {
  return answers.length ? answers.filter((a) => a.correct).length / answers.length : 0;
}
