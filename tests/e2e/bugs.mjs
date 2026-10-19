import { chromium, request } from "playwright-core";
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const errs = [];
const login = async (ctx, email, pass) => {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', email); await page.fill('input[name="password"]', pass);
  await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"));
  return page;
};
// sprzątanie
const pg = await (await request.newContext()).post(`${B}/api/konto/logowanie`, { data: { email: "x", password: "x" } }).catch(() => null);
const uctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const u = await login(uctx, "drugi@example.com", "nowe-haslo-123");
// 1. z menu konta – strona zapamiętana
await u.goto(`${B}/fiszki`); await u.waitForSelector('[data-testid="reel"]').catch(() => {});
await u.click(".account-menu summary"); await u.click('[data-testid="bug-link"]');
await u.waitForURL(/\/zgloszenia/); await u.waitForSelector('[data-testid="bug-form"]');
check((await u.inputValue('[data-testid="bug-page"]')) === "/fiszki", `strona z której zgłoszono (${await u.inputValue('[data-testid="bug-page"]')})`);
check(/ekran \d+×\d+/.test(await u.locator('[data-testid="bug-form"]').innerText()), "urządzenie dołączone");
check(await u.locator('[data-testid="bug-send"]').isDisabled(), "bez opisu przycisk nieaktywny");
const txt = `Test zgłoszenia ${Date.now()}`;
await u.fill('[data-testid="bug-text"]', txt);
await u.click('[data-testid="bug-send"]');
await u.waitForSelector(".ok-msg");
check((await u.locator('[data-testid="bug-mine"]').innerText()).includes(txt), "zgłoszenie na mojej liście");
check(/nowe/.test(await u.locator('[data-testid="bug-mine"] li').first().innerText()), "status „nowe”");
check(await u.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "telefon: brak poziomego przewijania");
// 2. admin widzi z e-mailem, zmienia status i odpowiada
const actx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const a = await login(actx, "owner@example.com", "haslo-wlasciciela");
await a.goto(`${B}/admin`); await a.waitForSelector('[data-testid="bugs-admin"]');
const item = a.locator('[data-testid="bug-admin-item"]', { hasText: txt });
await item.waitFor();
check((await item.innerText()).includes("drugi@example.com"), "admin: e-mail zgłaszającego");
check((await item.innerText()).includes("/fiszki"), "admin: strona");
await item.locator('[data-testid="bug-note"]').fill("Dzięki, naprawione.");
await item.locator('[data-testid="bug-note-save"]').click(); await a.waitForTimeout(500);
await item.locator('[data-testid="bug-status"]').selectOption("naprawione"); await a.waitForTimeout(600);
check(await a.locator('[data-testid="bug-admin-item"]', { hasText: txt }).count() === 1, "admin: zgłoszenie dalej widoczne po zmianie statusu");
await u.reload(); await u.waitForSelector('[data-testid="bug-mine"]');
const first = await u.locator('[data-testid="bug-mine"] li', { hasText: txt }).innerText();
check(/naprawione/.test(first) && /Dzięki, naprawione/.test(first), "użytkownik widzi status i odpowiedź");
// 3. uprawnienia i limit
check((await u.request.get(`${B}/api/admin/zgloszenia`)).status() === 403, "zwykły użytkownik: brak dostępu do listy admina");
const mineA = await (await a.request.get(`${B}/api/zgloszenia`)).json();
check(!mineA.some((r) => r.text === txt), "admin nie widzi cudzego na liście „moje”");
const id = (await (await u.request.get(`${B}/api/zgloszenia`)).json())[0].id;
check((await u.request.patch(`${B}/api/admin/zgloszenia/${id}`, { data: { status: "odrzucone" } })).status() === 403, "zwykły użytkownik nie zmieni statusu");
check((await u.request.post(`${B}/api/zgloszenia`, { data: { text: "a" } })).status() === 400, "za krótki opis → 400");
let last = 0;
for (let i = 0; i < 12; i++) last = (await u.request.post(`${B}/api/zgloszenia`, { data: { text: `limit ${i} test zgłoszenia` } })).status();
check(last === 429, `limit dzienny → 429 (${last})`);
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails, null, 1), JSON.stringify(errs.slice(0, 5)));
