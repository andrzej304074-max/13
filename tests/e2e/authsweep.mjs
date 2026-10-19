// Sondy autoryzacji wszystkich tras API (lista z app/api/**/route.ts): bez logowania → 401, zwykłe konto do tras admina → 403,
// trasy konta i cron – osobno. Segmenty dynamiczne zastępowane losowym UUID.
import { request } from "playwright-core";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const B = "http://localhost:3100", ROOT = `${process.cwd()}/app/api`;
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const routes = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f === "route.ts") {
      const methods = [...readFileSync(p, "utf8").matchAll(/export async function (GET|POST|PATCH|PUT|DELETE)/g)].map((m) => m[1]);
      routes.push({ path: "/api" + d.slice(ROOT.length).replace(/\[[^\]]+\]/g, "00000000-0000-4000-8000-000000000000"), methods });
    }
  }
})(ROOT);
const anon = await request.newContext({ baseURL: B });
// fałszywe ciasteczko sesji – przechodzi przez proxy, więc sprawdza samą trasę (requireUser)
const fake = await request.newContext({ baseURL: B, extraHTTPHeaders: { Cookie: "owe_session=nieprawidlowy-token" } });
const user = await request.newContext({ baseURL: B });
const r = await user.post("/api/konto/logowanie", { data: { email: "drugi@example.com", password: "nowe-haslo-123" } });
if (!r.ok()) throw new Error(`logowanie ${r.status()}`);
let n = 0;
for (const { path, methods } of routes) {
  const open = path.startsWith("/api/konto/");
  for (const m of methods) {
    n++;
    const opts = m === "GET" ? {} : { data: {} };
    const a = (await anon.fetch(path, { method: m, ...opts })).status();
    if (path.startsWith("/api/cron/")) check(a === 401, `${m} ${path} bez sekretu → 401 (${a})`);
    else if (!open) {
      check(a === 401, `${m} ${path} bez logowania → 401 (${a})`);
      const f = (await fake.fetch(path, { method: m, ...opts })).status();
      check(f === 401, `${m} ${path} zła sesja → 401 (${f})`);
    }
    else check(a < 500, `${m} ${path} bez logowania – bez błędu serwera (${a})`);
    if (path.startsWith("/api/admin/")) {
      const u = (await user.fetch(path, { method: m, ...opts })).status();
      check(u === 403, `${m} ${path} zwykłe konto → 403 (${u})`);
    }
  }
}
console.log("tras:", routes.length, "metod:", n);
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
