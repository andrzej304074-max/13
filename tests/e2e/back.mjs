// „←” – powrót do poprzedniej strony i miejsca (Tabela pojęć, feed fiszek, klasyczne), także systemowe „wstecz”
import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
for (const vp of [{ width: 430, height: 900 }, { width: 1280, height: 900 }]) {
  const tag = vp.width;
  const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 700, hasTouch: vp.width < 700 });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(`${tag} ${p.url()} ${e.message.slice(0, 60)}`));
  await p.goto(`${B}/konto/logowanie`);
  await p.fill("input[name=email]", "owner@example.com"); await p.fill("input[name=password]", "haslo-wlasciciela");
  await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
  await p.waitForTimeout(800);
  check(await p.locator('[data-testid="back"]').count() === 0, `${tag} pierwsza strona po zalogowaniu – bez „←”`);
  await p.goto(`${B}/pojecia`); await p.waitForSelector(".concept-row:not(.head)");
  await p.evaluate(() => window.scrollTo({ top: 3000, behavior: "instant" })); await p.waitForTimeout(500);
  const y0 = await p.evaluate(() => window.scrollY);
  // hasło widoczne na ekranie → mapa myśli (nawigacja w aplikacji)
  const link = p.locator(".concept-row .tag-link").filter({ has: p.locator("xpath=self::*") });
  const idx = await p.evaluate(() => [...document.querySelectorAll(".concept-row .tag-link")].findIndex((a) => { const r = a.getBoundingClientRect(); return r.top > 120 && r.bottom < innerHeight - 120; }));
  await p.locator(".concept-row .tag-link").nth(idx).click();
  await p.waitForURL(/\/pojecia\/mapa/); await p.waitForTimeout(800);
  check(await p.locator('[data-testid="back"]').count() === 1, `${tag} na mapie widać „←”`);
  await p.click('[data-testid="back"]');
  await p.waitForURL((u) => u.pathname === "/pojecia"); await p.waitForTimeout(2000);
  const y1 = await p.evaluate(() => window.scrollY);
  check(Math.abs(y1 - y0) < 60, `${tag} Tabela: powrót w to samo miejsce (${y0} → ${y1})`);
  // systemowe „wstecz” też
  await p.locator(".concept-row .tag-link").nth(idx).click(); await p.waitForURL(/\/pojecia\/mapa/); await p.waitForTimeout(600);
  await p.goBack(); await p.waitForURL((u) => u.pathname === "/pojecia"); await p.waitForTimeout(2000);
  const y2 = await p.evaluate(() => window.scrollY);
  check(Math.abs(y2 - y0) < 60, `${tag} systemowe „wstecz”: to samo miejsce (${y0} → ${y2})`);

  // feed fiszek: ta sama karta po powrocie
  await p.goto(`${B}/fiszki?kolejnosc=random`); await p.waitForSelector('[data-testid="reel"]'); await p.waitForTimeout(800);
  const first0 = await p.locator('[data-testid="reel"] .fc-title').first().textContent();
  const h = await p.evaluate(() => { const f = document.querySelector('[data-testid="feed"]'); f.scrollTo({ top: f.clientHeight * 5, behavior: "instant" }); return f.clientHeight; });
  await p.waitForTimeout(800);
  const title5 = await p.evaluate(() => { const f = document.querySelector('[data-testid="feed"]'); const i = Math.round(f.scrollTop / f.clientHeight); return f.querySelectorAll('[data-testid="reel"]')[i].querySelector(".fc-title").textContent; });
  await p.click('a[href="/pojecia/mapa"], .subtabs a:has-text("Moje talie")').catch(() => {});
  await p.waitForURL((u) => u.pathname !== "/fiszki", { timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(600);
  await p.click('[data-testid="back"]'); await p.waitForURL((u) => u.pathname === "/fiszki"); await p.waitForTimeout(1500);
  const after = await p.evaluate(() => { const f = document.querySelector('[data-testid="feed"]'); const i = Math.round(f.scrollTop / f.clientHeight); return { i, t: f.querySelectorAll('[data-testid="reel"]')[i]?.querySelector(".fc-title")?.textContent, first: f.querySelector('[data-testid="reel"] .fc-title').textContent }; });
  check(after.i === 5 && after.t === title5, `${tag} feed: ta sama karta po powrocie (${after.i}, ${after.t} = ${title5})`);
  check(after.first === first0, `${tag} feed: ta sama kolejność losowa`);
  await ctx.close();
}
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails, null, 1), JSON.stringify(errs.slice(0, 5)));
