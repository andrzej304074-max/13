import { createHash } from "node:crypto";
import { brotliCompressSync, gzipSync, constants as zc } from "node:zlib";
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
type Cached = { body: string; etag: string; gz: Buffer; br: Buffer };
function cached(make: () => unknown) {
  let v: Cached | null = null;
  return (): Cached => {
    if (!v) {
      const body = JSON.stringify(make());
      // skompresowane raz na proces (odpowiedzi tras API budowane ręcznie Next.js nie kompresuje)
      v = {
        body,
        etag: `"${createHash("sha1").update(body).digest("base64url").slice(0, 16)}"`,
        gz: gzipSync(body, { level: 9 }),
        br: brotliCompressSync(body, { params: { [zc.BROTLI_PARAM_QUALITY]: 8 } }),
      };
    }
    return v;
  };
}
export const HASLA = cached(hasla);
export const OWE_DATA = cached(oweStatsData);
/** Nazwy tematów, działów i lekcji do filtrów statystyk nauki. */
export const NAUKA_META = cached(() => ({
  topics: COURSE.topics.map(({ id, title, emoji }) => ({ id, title, emoji })),
  units: COURSE.units.map(({ id, title, topic }) => ({ id, title, topic })),
  lessons: Object.values(COURSE.lessons).map(({ id, title, unit, no, type }) => ({ id, title, unit, no, type })),
  kinds: COURSE.kinds,
}));

/** Odpowiedź z ETagiem: 304, gdy przeglądarka ma aktualną wersję. */
export function jsonCached(req: Request, v: Cached): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8", ETag: v.etag, Vary: "Accept-Encoding",
    "Cache-Control": "private, max-age=300, stale-while-revalidate=86400",
  };
  if (req.headers.get("if-none-match") === v.etag) return new Response(null, { status: 304, headers });
  const enc = req.headers.get("accept-encoding") ?? "";
  if (/\bbr\b/.test(enc)) return new Response(new Uint8Array(v.br), { headers: { ...headers, "Content-Encoding": "br" } });
  if (/\bgzip\b/.test(enc)) return new Response(new Uint8Array(v.gz), { headers: { ...headers, "Content-Encoding": "gzip" } });
  return new Response(v.body, { headers });
}
