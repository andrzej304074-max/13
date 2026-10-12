import { createHash } from "node:crypto";
import { COURSE } from "@/data/nauka";
import { oweCountByItem, oweStatsData } from "./owe-stats-data";

/** Hasło kursu w tabeli pojęć i fiszkach. */
export interface Haslo { id: string; t: string; d: string; w: string | null; kind: string; topic: string; n: number }

function hasla() {
  const owe = oweCountByItem();
  // kolejność jak w kursie Nauka: tematy → działy → lekcje → hasła (każde hasło raz), bez lekcji „Zrozumienie”
  const seen = new Set<string>();
  const rows: Haslo[] = [];
  for (const u of COURSE.units) for (const lid of u.lessons) for (const id of COURSE.lessons[lid].items) {
    const it = COURSE.items[id];
    if (!it || it.kind === "zrozumienie" || seen.has(id)) continue;
    seen.add(id);
    rows.push({ id, t: it.t, d: it.d, w: it.w ?? null, kind: it.kind, topic: it.topic, n: owe[id] ?? 0 });
  }
  return {
    rows,
    topics: COURSE.topics.map(({ id, title, emoji }) => ({ id, title, emoji })),
    kinds: COURSE.kinds.filter((k) => k.id !== "zrozumienie"),
  };
}

/** Zserializowane dane (raz na proces) z ETagiem – dane zmieniają się tylko przy nowym buildzie. */
function cached(make: () => unknown) {
  let v: { body: string; etag: string } | null = null;
  return () => {
    if (!v) {
      const body = JSON.stringify(make());
      v = { body, etag: `"${createHash("sha1").update(body).digest("base64url").slice(0, 16)}"` };
    }
    return v;
  };
}
export const HASLA = cached(hasla);
export const OWE_DATA = cached(oweStatsData);

/** Odpowiedź z ETagiem: 304, gdy przeglądarka ma aktualną wersję. */
export function jsonCached(req: Request, v: { body: string; etag: string }): Response {
  const headers = { "Content-Type": "application/json; charset=utf-8", ETag: v.etag, "Cache-Control": "private, max-age=300, stale-while-revalidate=86400" };
  if (req.headers.get("if-none-match") === v.etag) return new Response(null, { status: 304, headers });
  return new Response(v.body, { headers });
}
