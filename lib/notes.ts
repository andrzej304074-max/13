import { COURSE } from "@/data/nauka";
import { query } from "./db";
import { getQuestion } from "./questions";
import { HttpError } from "./tests";
import {
  isNoteKind, isStarKind, MAX_BODY, MAX_TITLE, NoteError, sanitizeHighlight, sanitizeInk, sanitizeRef, sanitizeText,
  type Ink, type NoteKind, type StarKind,
} from "./notes-core";

/** Notatki, brudnopisy, gwiazdki i podkreślenia w bazie (logika walidacji: notes-core.ts). */

export interface NoteRow {
  id: string; kind: NoteKind; title: string; body: string; ink: Ink; ref: string | null; starred: boolean;
  created_at: string; updated_at: string;
  /** Skąd pochodzi brudnopis: treść pytania albo tytuł lekcji/artykułu. */
  context?: string | null;
}
export type NoteSummary = Omit<NoteRow, "ink" | "body"> & { excerpt: string; strokes: number };

const wrap = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof NoteError) throw new HttpError(400, e.message);
    throw e;
  }
};

/** Opis źródła notatki do listy i nagłówka brudnopisu. */
export function refContext(ref: string | null): string | null {
  if (!ref) return null;
  const [kind, id, sub] = ref.split(":");
  if (kind === "owe" || kind === "slownik") {
    const q = getQuestion(id);
    if (!q) return null;
    const t = q.question.replace(/\s+/g, " ");
    return `${kind === "owe" ? `OWE ${q.edition}` : "Słownik"}: ${t.length > 140 ? t.slice(0, 139) + "…" : t}`;
  }
  if (kind === "lekcja") {
    const l = COURSE.lessons[id];
    if (!l) return null;
    const u = COURSE.units.find((x) => x.id === l.unit);
    return `${u ? u.title + " · " : ""}${l.type === "zrozum" ? "🧠 Zrozumienie" : "Lekcja"} ${l.no}${sub ? ` · część ${sub}` : ""}`;
  }
  if (kind === "artykul") {
    const u = COURSE.units.find((x) => x.id === id);
    const l = sub ? COURSE.lessons[sub] : undefined;
    return u ? `📖 ${u.title}${l ? ` · ${l.title}` : ""}` : null;
  }
  return null;
}

const COLS = "id, kind, title, body, ink, ref, starred, created_at, updated_at";

export async function listNotes(userId: string, f: { kind?: unknown; starred?: unknown; q?: unknown; limit?: number }): Promise<NoteSummary[]> {
  const kind = isNoteKind(f.kind) ? f.kind : "note";
  const params: unknown[] = [userId, kind];
  let where = "user_id = $1 AND kind = $2";
  if (f.starred === "1" || f.starred === "0") where += ` AND starred = ${f.starred === "1"}`;
  if (typeof f.q === "string" && f.q.trim()) {
    params.push(`%${f.q.trim().replace(/[\\%_]/g, (m) => "\\" + m)}%`);
    where += ` AND (title ILIKE $${params.length} OR body ILIKE $${params.length})`;
  }
  const { rows } = await query<NoteRow>(
    `SELECT ${COLS} FROM notes WHERE ${where} ORDER BY starred DESC, updated_at DESC LIMIT ${Math.min(500, f.limit ?? 500)}`, params);
  return rows.map(({ body, ink, ...r }) => ({
    ...r, excerpt: body.slice(0, 220), strokes: ink.s.length, context: refContext(r.ref),
  }));
}

export async function getNote(userId: string, id: string): Promise<NoteRow> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Nie ma takiej notatki.");
  const { rows } = await query<NoteRow>(`SELECT ${COLS} FROM notes WHERE id = $1 AND user_id = $2`, [id, userId]);
  if (!rows[0]) throw new HttpError(404, "Nie ma takiej notatki.");
  return { ...rows[0], context: refContext(rows[0].ref) };
}

/** Brudnopis pytania/lekcji – jeden na odnośnik; null, gdy jeszcze go nie ma. */
export async function getScratch(userId: string, ref: unknown): Promise<NoteRow | null> {
  return wrap(async () => {
    const r = sanitizeRef(ref);
    if (!r) throw new NoteError("Brak odnośnika brudnopisu.");
    const { rows } = await query<NoteRow>(`SELECT ${COLS} FROM notes WHERE user_id = $1 AND kind = 'scratch' AND ref = $2`, [userId, r]);
    return rows[0] ? { ...rows[0], context: refContext(r) } : null;
  });
}

export async function createNote(userId: string, v: Record<string, unknown>): Promise<NoteRow> {
  return wrap(async () => {
    const kind = isNoteKind(v.kind) ? v.kind : "note";
    const ref = sanitizeRef(v.ref);
    const title = sanitizeText(v.title, MAX_TITLE, "tytuł"), body = sanitizeText(v.body, MAX_BODY, "treść");
    const ink = sanitizeInk(v.ink);
    const starred = v.starred === true;
    if (kind === "scratch" && ref) {
      // brudnopis pytania: drugi zapis tego samego pytania nadpisuje treść (wyścig dwóch kart)
      const { rows } = await query<NoteRow>(
        `INSERT INTO notes (user_id, kind, title, body, ink, ref, starred) VALUES ($1, 'scratch', $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, ref) WHERE kind = 'scratch' AND ref IS NOT NULL
         DO UPDATE SET body = EXCLUDED.body, ink = EXCLUDED.ink, updated_at = now() RETURNING ${COLS}`,
        [userId, title, body, JSON.stringify(ink), ref, starred]);
      return { ...rows[0], context: refContext(ref) };
    }
    const { rows } = await query<NoteRow>(
      `INSERT INTO notes (user_id, kind, title, body, ink, ref, starred) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${COLS}`,
      [userId, kind, title, body, JSON.stringify(ink), ref, starred]);
    return { ...rows[0], context: refContext(ref) };
  });
}

export async function updateNote(userId: string, id: string, v: Record<string, unknown>): Promise<NoteRow> {
  return wrap(async () => {
    await getNote(userId, id);
    const sets: string[] = [], params: unknown[] = [id, userId];
    const add = (col: string, val: unknown) => { params.push(val); sets.push(`${col} = $${params.length}`); };
    if ("title" in v) add("title", sanitizeText(v.title, MAX_TITLE, "tytuł"));
    if ("body" in v) add("body", sanitizeText(v.body, MAX_BODY, "treść"));
    if ("ink" in v) add("ink", JSON.stringify(sanitizeInk(v.ink)));
    if ("starred" in v) {
      if (typeof v.starred !== "boolean") throw new NoteError("Nieprawidłowa gwiazdka.");
      add("starred", v.starred);
    }
    if (!sets.length) throw new NoteError("Brak zmian.");
    // sama gwiazdka nie zmienia daty edycji (kolejność listy wg ostatniej zmiany treści)
    const touch = sets.some((s) => !s.startsWith("starred")) ? ", updated_at = now()" : "";
    const { rows } = await query<NoteRow>(
      `UPDATE notes SET ${sets.join(", ")}${touch} WHERE id = $1 AND user_id = $2 RETURNING ${COLS}`, params);
    return { ...rows[0], context: refContext(rows[0].ref) };
  });
}

export async function deleteNote(userId: string, id: string) {
  await getNote(userId, id);
  await query("DELETE FROM notes WHERE id = $1 AND user_id = $2", [id, userId]);
  return { ok: true };
}

export async function listStars(userId: string, kind: unknown): Promise<string[]> {
  if (!isStarKind(kind)) throw new HttpError(400, "Nieznany rodzaj gwiazdki.");
  const { rows } = await query<{ ref: string }>("SELECT ref FROM stars WHERE user_id = $1 AND kind = $2 ORDER BY at DESC", [userId, kind]);
  return rows.map((r) => r.ref);
}

/** Ustawia albo zdejmuje gwiazdkę. Fiszka: id hasła z kursu; artykuł: id działu albo lekcji. */
export async function setStar(userId: string, kind: unknown, ref: unknown, on: unknown) {
  if (!isStarKind(kind)) throw new HttpError(400, "Nieznany rodzaj gwiazdki.");
  if (typeof ref !== "string") throw new HttpError(400, "Brak odnośnika.");
  const ok = kind === "fiszka" ? Boolean(COURSE.items[ref]) : Boolean(COURSE.lessons[ref] || COURSE.units.some((u) => u.id === ref));
  if (!ok) throw new HttpError(400, "Nieznany element.");
  if (typeof on !== "boolean") throw new HttpError(400, "Brak stanu gwiazdki.");
  if (on) await query("INSERT INTO stars (user_id, kind, ref) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [userId, kind, ref]);
  else await query("DELETE FROM stars WHERE user_id = $1 AND kind = $2 AND ref = $3", [userId, kind, ref]);
  return { ok: true, on };
}

export interface HighlightRow { id: string; article: string; block: number; start: number; end: number; color: string }

export async function listHighlights(userId: string, article: unknown): Promise<HighlightRow[]> {
  if (typeof article !== "string" || !article) throw new HttpError(400, "Brak artykułu.");
  // artykuł działu pokazuje też podkreślenia z jego rozdziałów (ten sam tekst), więc prefiks
  const { rows } = await query<HighlightRow>(
    `SELECT id, article, block, start_at AS start, end_at AS "end", color FROM highlights
     WHERE user_id = $1 AND (article = $2 OR article LIKE $3) ORDER BY created_at`, [userId, article, `${article}:%`]);
  return rows;
}

export async function addHighlight(userId: string, v: Record<string, unknown>): Promise<HighlightRow> {
  return wrap(async () => {
    const h = sanitizeHighlight(v);
    const { rows } = await query<HighlightRow>(
      `INSERT INTO highlights (user_id, article, block, start_at, end_at, color) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, article, block, start_at AS start, end_at AS "end", color`, [userId, h.article, h.block, h.start, h.end, h.color]);
    return rows[0];
  });
}

export async function deleteHighlight(userId: string, id: unknown) {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, "Nieprawidłowe podkreślenie.");
  await query("DELETE FROM highlights WHERE id = $1 AND user_id = $2", [id, userId]);
  return { ok: true };
}
