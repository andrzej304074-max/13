// Etap 8: nagłówki, CSP bez naruszeń, CSRF, limity logowania i pobrań, dziennik admina, blokada kopiowania, druk, rozmiar JSON, przeliczenie hasha
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
// SQL przez stdin – bez podstawiania „$” przez powłokę (hashe haseł zawierają „$”)
const sql = (q) => execSync("PGPASSWORD=dev psql -h localhost -U postgres -d owe -tA", { input: q }).toString().trim();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const csp = [];
async function ctxPage(w = 390) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 } });
  const page = await ctx.newPage();
  page.on("console", (m) => /Content Security Policy|Refused to/.test(m.text()) && csp.push(`${page.url()} ${m.text().slice(0, 200)}`));
  page.on("pageerror", (e) => csp.push(`pageerror ${e.message}`));
  return page;
}
async function login(email, password, w) {
  const page = await ctxPage(w);
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', email); await page.fill('input[name="password"]', password);
  await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"));
  return page;
}
sql("DELETE FROM rate_hits"); sql("DELETE FROM security_events");

// 1. nagłówki i robots
const r0 = await fetch(`${B}/konto/logowanie`);
const h = (k) => r0.headers.get(k) ?? "";
check(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/.test(h("content-security-policy")), `CSP z nonce (${h("content-security-policy").slice(0, 80)})`);
check(/frame-ancestors 'none'/.test(h("content-security-policy")), "CSP: frame-ancestors none");
check(/max-age=31536000/.test(h("strict-transport-security")), "HSTS");
check(h("cross-origin-opener-policy") === "same-origin" && h("cross-origin-resource-policy") === "same-origin", "COOP i CORP");
check(/noindex/.test(h("x-robots-tag")) && h("x-frame-options") === "DENY" && h("x-content-type-options") === "nosniff", "X-Robots-Tag, X-Frame-Options, nosniff");
const html = await r0.text();
const nonce = /'nonce-([^']+)'/.exec(h("content-security-policy"))?.[1];
check(nonce && html.includes(`nonce="${nonce}"`), "skrypty strony mają nonce z nagłówka");
const n2 = /'nonce-([^']+)'/.exec((await fetch(`${B}/konto/logowanie`)).headers.get("content-security-policy") ?? "")?.[1];
check(n2 && n2 !== nonce, "nonce inny przy każdym żądaniu");
const robots = await fetch(`${B}/robots.txt`);
check(robots.status === 200 && /Disallow: \//.test(await robots.text()), "robots.txt: Disallow /");

// 2. strony działają z CSP (logowanie, nauka, lekcja, podręcznik, admin) – bez naruszeń w konsoli
const admin = await login("owner@example.com", "haslo-wlasciciela", 1280);
for (const p of ["/", "/nauka", "/nauka/lekcja/mikro-rynek-2?sub=1", "/nauka/podrecznik", "/pojecia", "/fiszki", "/admin"]) {
  await admin.goto(B + p); await admin.waitForLoadState("networkidle");
}
await admin.goto(`${B}/nauka/lekcja/mikro-rynek-2?sub=1`); await admin.waitForLoadState("networkidle");
check(await admin.locator("button").count() > 3, "lekcja interaktywna przy CSP (React działa)");
await admin.goto(`${B}/admin`); await admin.waitForSelector('[data-testid="security-admin"]');
check(await admin.locator('[data-testid="watermark"]').count() === 0, "znak wodny: brak w panelu admina");

// 3. CSRF
const user = await login("drugi@example.com", "nowe-haslo-123");
const evil = await user.request.post(`${B}/api/notatki`, { headers: { Origin: "https://zla.example" }, data: { title: "CSRF", body: "x" } });
check(evil.status() === 403, `CSRF: obcy Origin → 403 (${evil.status()})`);
const evil2 = await user.request.post(`${B}/api/gwiazdki`, { headers: { "Sec-Fetch-Site": "cross-site" }, data: {} });
check(evil2.status() === 403, `CSRF: Sec-Fetch-Site cross-site → 403 (${evil2.status()})`);
const own = await user.request.post(`${B}/api/zgloszenia`, { headers: { Origin: B }, data: { text: "" } });
check(own.status() !== 403, `własny Origin przechodzi dalej (${own.status()})`);
check((await user.request.get(`${B}/api/stats`, { headers: { Origin: "https://zla.example" } })).status() === 200, "GET z obcym Origin nie jest blokowany przez CSRF");

// 4. rozmiar JSON
const big = await user.request.post(`${B}/api/zgloszenia`, { headers: { "Content-Type": "application/json" }, data: JSON.stringify({ text: "x".repeat(5 * 1024 * 1024) }) });
check(big.status() === 413, `JSON > 4 MB → 413 (${big.status()})`);

// 5. blokada logowania: 8 nieudanych prób na konto → 429 nawet z dobrym hasłem; reset hasła zdejmuje blokadę (tu: czyszczenie)
const api = (await browser.newContext()).request;
const codes = [];
for (let i = 0; i < 9; i++) codes.push((await api.post(`${B}/api/konto/logowanie`, { data: { email: "drugi@example.com", password: `zle-haslo-${i}` } })).status());
check(codes.slice(0, 8).every((c) => c === 401) && codes[8] === 429, `8 × 401, potem 429 (${codes.join(",")})`);
const good = await api.post(`${B}/api/konto/logowanie`, { data: { email: "drugi@example.com", password: "nowe-haslo-123" } });
check(good.status() === 429, `zablokowane konto: dobre hasło też 429 (${good.status()})`);
const other = await api.post(`${B}/api/konto/logowanie`, { data: { email: "owner@example.com", password: "haslo-wlasciciela" } });
check(other.status() === 200, `inne konto z tego samego IP loguje się (${other.status()})`);
const unknown = [];
for (let i = 0; i < 9; i++) unknown.push((await api.post(`${B}/api/konto/logowanie`, { data: { email: "nie-ma@example.com", password: "cokolwiek-1" } })).status());
check(unknown[8] === 429, "nieznany e-mail też blokowany (bez zdradzania, że konta nie ma)");
const log = await (await admin.request.get(`${B}/api/admin/bezpieczenstwo`)).json();
check(log.events.some((e) => e.kind === "login_lock" && e.email === "drugi@example.com"), "dziennik admina: blokada logowania z kontem");
check((log.day.login_fail ?? 0) >= 7, `dziennik: nieudane logowania w 24 h (${log.day.login_fail})`);
check((await user.request.get(`${B}/api/admin/bezpieczenstwo`)).status() === 403, "dziennik tylko dla admina");
sql("DELETE FROM rate_hits WHERE key LIKE 'login:%'");

// 6. limit pobrań treści: zadania – 30 w 10 min, potem 429 i wpis „masowe pobieranie”; admin bez limitu
const list = await (await user.request.get(`${B}/api/otwarte?rodzaj=zadanie`)).json();
const ids = (list.items ?? list).map((x) => x.id);
const st = [];
for (let i = 0; i < 31; i++) st.push((await user.request.get(`${B}/api/otwarte/${ids[i % ids.length]}`)).status());
check(st.slice(0, 30).every((c) => c === 200) && st[30] === 429, `zadania: 30 × 200, potem 429 (${st.slice(28).join(",")})`);
const st2 = [];
for (let i = 0; i < 31; i++) st2.push((await admin.request.get(`${B}/api/otwarte/${ids[i % ids.length]}`)).status());
check(st2.every((c) => c === 200), "admin bez limitu pobrań");
const log2 = await (await admin.request.get(`${B}/api/admin/bezpieczenstwo?kind=scrape`)).json();
check(log2.events.length === 1 && log2.events[0].email === "drugi@example.com", `dziennik: jedno zdarzenie „masowe pobieranie” (${log2.events.length})`);
const d304 = await user.request.get(`${B}/api/dane/hasla`);
const et = d304.headers()["etag"];
const before = Number(sql("SELECT COUNT(*) FROM rate_hits WHERE key LIKE 'c:dane:%'"));
check((await user.request.get(`${B}/api/dane/hasla`, { headers: { "If-None-Match": et } })).status() === 304, "dane: 304 przy aktualnej wersji");
check(Number(sql("SELECT COUNT(*) FROM rate_hits WHERE key LIKE 'c:dane:%'")) === before, "304 nie liczy się do limitu");
sql("DELETE FROM rate_hits WHERE key LIKE 'c:%'");
await admin.goto(`${B}/admin`); await admin.waitForSelector('[data-testid="security-admin"] table');
check(await admin.locator('[data-testid="security-admin"] tr[data-kind="scrape"]').count() >= 1, "karta Bezpieczeństwo pokazuje zdarzenia");
await admin.locator('[data-testid="security-admin"]').screenshot({ path: `${OUT}/security-admin.png` });

// 7. blokada kopiowania (telefon) – treść tak, pola edycji nie
await user.goto(`${B}/pojecia`); await user.waitForLoadState("networkidle");
check(await user.locator('[data-testid="watermark"]').count() === 1, "znak wodny na stronie z treścią");
check(await user.evaluate(() => getComputedStyle(document.body).userSelect) === "none", "user-select: none na treści");
const blocked = await user.evaluate(() => {
  const ev = (t, e) => { t.dispatchEvent(e); return e.defaultPrevented; };
  const target = document.querySelector("main h1, main h2, main p") ?? document.body;
  return {
    copy: ev(target, new ClipboardEvent("copy", { bubbles: true, cancelable: true })),
    menu: ev(target, new MouseEvent("contextmenu", { bubbles: true, cancelable: true })),
    ctrlC: ev(target, new KeyboardEvent("keydown", { key: "c", ctrlKey: true, bubbles: true, cancelable: true })),
    ctrlA: ev(target, new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true, cancelable: true })),
  };
});
check(blocked.copy && blocked.menu && blocked.ctrlC && blocked.ctrlA, `kopiowanie, menu, Ctrl+C/A zablokowane (${JSON.stringify(blocked)})`);
await user.goto(`${B}/notatki`); await user.waitForLoadState("networkidle");
const field = user.locator("textarea, input[type=text], input[type=search]").first();
if (await field.count()) {
  await field.click(); await field.fill("pisanie działa");
  const inField = await field.evaluate((el) => {
    const e = new ClipboardEvent("copy", { bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    const k = new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true, cancelable: true });
    el.dispatchEvent(k);
    return { copy: e.defaultPrevented, ctrlA: k.defaultPrevented, sel: getComputedStyle(el).userSelect };
  });
  check(await field.inputValue() === "pisanie działa" && !inField.copy && !inField.ctrlA && inField.sel !== "none", `pole edycji: pisanie, kopiowanie i Ctrl+A działają (${JSON.stringify(inField)})`);
} else check(false, "brak pola edycji na /notatki");
// Podręcznik: zaznaczanie działa (dymek „Podkreśl / Do notatki”), kopiowanie nie
await user.goto(`${B}/nauka/podrecznik/mikro-rynek`).catch(() => {});
const rb = user.locator('[data-testid="reader-body"]');
if (await rb.count()) {
  check(await rb.evaluate((el) => getComputedStyle(el).userSelect) !== "none", "Podręcznik: tekst da się zaznaczyć");
  const pc = await rb.evaluate((el) => { const e = new ClipboardEvent("copy", { bubbles: true, cancelable: true }); el.querySelector("p")?.dispatchEvent(e); return e.defaultPrevented; });
  check(pc, "Podręcznik: kopiowanie zaznaczenia zablokowane");
}
// druk
await user.goto(`${B}/pojecia`); await user.waitForLoadState("networkidle");
await user.emulateMedia({ media: "print" });
check(await user.evaluate(() => getComputedStyle(document.querySelector("main")).display) === "none", "druk: treść ukryta");
await user.emulateMedia({ media: "screen" });

// 8. stary hash hasła (N = 2^14) → po zalogowaniu nowy koszt
const salt = randomBytes(16);
const oldHash = `scrypt$${salt.toString("hex")}$${scryptSync("nowe-haslo-123", salt, 64).toString("hex")}`;
sql(`UPDATE users SET pass_hash = '${oldHash}' WHERE email = 'drugi@example.com'`);
const rl = await (await browser.newContext()).request.post(`${B}/api/konto/logowanie`, { data: { email: "drugi@example.com", password: "nowe-haslo-123" } });
check(rl.status() === 200 && sql("SELECT split_part(pass_hash, '$', 2) FROM users WHERE email = 'drugi@example.com'") === "16", "stary hash działa i zostaje przeliczony na 2^16");

check(csp.length === 0, `brak naruszeń CSP i błędów stron (${csp.slice(0, 3).join(" | ")})`);
sql("DELETE FROM rate_hits");
await browser.close();
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
