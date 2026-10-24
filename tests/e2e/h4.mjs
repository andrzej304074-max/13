// H4: panel admina – statystyki pytań (flagi, podgląd), zwykłe konto bez dostępu
import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
async function login(email, pass) {
  const p = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(`${B}/konto/logowanie`);
  await p.fill('input[name="email"]', email); await p.fill('input[name="password"]', pass);
  await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
  return p;
}
const u = await login("drugi@example.com", "nowe-haslo-123");
check((await u.request.get(`${B}/api/admin/pytania`)).status() === 403, "zwykłe konto → 403");
const a = await login("owner@example.com", "haslo-wlasciciela");
const d = await (await a.request.get(`${B}/api/admin/pytania`)).json();
check(Array.isArray(d.rows) && d.rows.length > 0, `pytania z odpowiedziami: ${d.rows?.length}`);
check(d.rows.every((r) => r.n >= 1 && r.pct >= 0 && r.pct <= 100 && r.picks.length === 4), "poprawne wiersze");
await a.goto(`${B}/admin`); await a.click('[data-testid="qa-load"]'); await a.waitForSelector('[data-testid="questions-admin"]');
await a.locator('[data-testid="questions-admin"] select').nth(2).selectOption("1");
await a.waitForSelector('[data-testid="qa-row"]');
await a.locator('[data-testid="qa-row"]').first().click(); await a.waitForSelector('[data-testid="qa-full"]');
check(/✓ klucz/.test(await a.locator('[data-testid="qa-full"]').innerText()), "podgląd pytania z kluczem");
await a.locator('[data-testid="qa-full"]').scrollIntoViewIfNeeded();
await a.screenshot({ path: `${OUT}/h4_admin_1280.png` });
check(errs.length === 0, `błędy strony: ${errs.join(" | ")}`);
console.log(`OK: ${ok} błędów: ${fails.length}`, fails);
await browser.close(); process.exit(fails.length ? 1 : 0);
