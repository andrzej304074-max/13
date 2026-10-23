// G12 + G13: zgłoszenie błędu w wyskakującym panelu (rodzaj, sekcja z miejsca przewinięcia), filtr rodzaju u admina;
// Literatura – zastrzeżenie o darmowych materiałach, Scribd, „Jak się uczyć”.
import { chromium } from "playwright-core";
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

for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 500 });
  const u = await login(ctx, "drugi@example.com", "nowe-haslo-123");
  const tag = vp.width < 500 ? "telefon" : "komputer";
  // G13: Literatura
  await u.goto(`${B}/nauka/literatura`);
  await u.waitForSelector('[data-testid="lit-disclaimer"]');
  check(/nie wskazuje/i.test(await u.locator('[data-testid="lit-disclaimer"]').innerText()), `${tag}: zastrzeżenie – organizator nie wskazuje darmowych materiałów`);
  check(/Scribd/.test(await u.locator('[data-testid="lit-scribd"]').innerText()), `${tag}: informacja o Scribd`);
  const howto = await u.locator('[data-testid="lit-howto"]').innerText();
  check(/AI/.test(howto) && /własnymi słowami/.test(howto), `${tag}: „Jak się uczyć” – AI i tłumaczenie sobie`);
  check(await u.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${tag}: Literatura bez poziomego przewijania`);

  // G12: przewiń do „Jak się uczyć” i zgłoś z menu konta
  await u.locator("#jak-sie-uczyc h2").evaluate((e) => e.scrollIntoView({ block: "start" }));
  await u.waitForTimeout(300);
  await u.click(".account-menu summary"); await u.click('[data-testid="bug-link"]');
  await u.waitForSelector('[data-testid="bug-popup"]');
  check(/\/nauka\/literatura/.test(u.url()), `${tag}: okienko nie zmienia strony`);
  const sec = await u.inputValue('[data-testid="bug-section"]');
  check(sec === "Jak się uczyć z tej literatury", `${tag}: sekcja podpowiedziana z miejsca przewinięcia (${sec})`);
  const opts = await u.locator('[data-testid="bug-section"] option').allInnerTexts();
  check(opts[0] === "cała strona" && opts.includes("📚 Literatura"), `${tag}: lista sekcji z nagłówków strony`);
  check(await u.locator('[data-testid="bug-send"]').isDisabled(), `${tag}: bez rodzaju i opisu nie wyśle`);
  const txt = `G12 ${tag} ${Date.now()}`;
  await u.click('[data-testid="bug-kind-merytoryczny"]');
  await u.fill('[data-testid="bug-text"]', txt);
  await u.click('[data-testid="bug-send"]');
  await u.waitForSelector('[data-testid="bug-popup"] .ok-msg');
  check(await u.locator('[data-testid="bug-mine-link"]').isVisible(), `${tag}: link do moich zgłoszeń`);
  const box = await u.locator('[data-testid="bug-popup"]').boundingBox();
  check(box && box.x >= 0 && box.x + box.width <= vp.width + 1, `${tag}: okienko mieści się na ekranie`);
  await u.keyboard.press("Escape");
  check(await u.locator('[data-testid="bug-popup"]').count() === 0, `${tag}: Esc zamyka okienko`);
  const mine = await (await u.request.get(`${B}/api/zgloszenia`)).json();
  const r = mine.find((b) => b.text === txt);
  check(r && r.kind === "merytoryczny" && r.section === "Jak się uczyć z tej literatury" && r.page === "/nauka/literatura",
    `${tag}: zapisane rodzaj, sekcja i strona (${JSON.stringify(r && { kind: r.kind, section: r.section, page: r.page })})`);
  await ctx.close();
}

// API: zły rodzaj odrzucony
{
  const ctx = await browser.newContext();
  const u = await login(ctx, "drugi@example.com", "nowe-haslo-123");
  const bad = await u.request.post(`${B}/api/zgloszenia`, { headers: { Origin: B }, data: { text: "zły rodzaj zgłoszenia", kind: "inny" } });
  check(bad.status() === 400, `API: nieznany rodzaj → 400 (${bad.status()})`);
  await ctx.close();
}

// admin: filtr rodzaju, sekcja widoczna
const actx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const a = await login(actx, "owner@example.com", "haslo-wlasciciela");
const tech = await (await a.request.get(`${B}/api/admin/zgloszenia?rodzaj=techniczny`)).json();
check(tech.reports.every((r) => r.kind === "techniczny"), "admin API: filtr rodzaju");
await a.goto(`${B}/admin`);
await a.waitForSelector('[data-testid="bugs-admin"]');
await a.click('[data-testid="bugs-admin"] [data-status=""]');
await a.waitForSelector('[data-testid="bug-admin-item"]');
await Promise.all([
  a.waitForResponse((r) => r.url().includes("rodzaj=merytoryczny")),
  a.click('[data-testid="bug-kind-filter"] [data-kind="merytoryczny"]'),
]);
await a.waitForTimeout(300);
const kinds = await a.locator('[data-testid="bug-admin-kind"]').allInnerTexts();
check(kinds.length > 0 && kinds.every((k) => k === "merytoryczny"), `admin: lista tylko merytorycznych (${kinds.length})`);
check(await a.locator('[data-testid="bug-admin-section"]', { hasText: "Jak się uczyć" }).count() > 0, "admin: sekcja strony przy zgłoszeniu");

await browser.close();
console.log(fails.length ? "BŁĘDY:" : "OK:", ok, "błędów:", fails.length, fails, errs.length ? `pageerror: ${errs}` : "");
process.exit(fails.length ? 1 : 0);
