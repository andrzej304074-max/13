import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const check = (c, m) => (c ? ok++ : fails.push(m));
const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, hasTouch: true });
const p = await ctx.newPage();
await p.goto(B + "/konto/logowanie"); await p.fill('input[name="email"]', "owner@example.com"); await p.fill('input[name="password"]', "haslo-wlasciciela"); await p.click("form button.btn"); await p.waitForTimeout(1500);
const barTop = async () => (await p.locator("nav.bottom-bar").boundingBox())?.y ?? null;
for (const path of ["/", "/slownik", "/nauka", "/nauka/podrecznik", "/fiszki", "/pojecia", "/notatki", "/stats", "/admin", "/konto/ustawienia"]) {
  await p.goto(B + path); await p.waitForLoadState("networkidle").catch(() => {});
  check(await p.locator("nav.bottom-bar").isVisible(), `pasek na ${path}`);
}
// test
await p.goto(B + "/"); await p.click('button.btn:has-text("Rozpocznij test")'); await p.waitForSelector("button.option");
check(await p.locator("nav.bottom-bar").isVisible(), "pasek w teście");
await p.locator('button.btn:has-text("Zakończ test")').scrollIntoViewIfNeeded();
const zb = await p.locator('button.btn:has-text("Zakończ test")').boundingBox(); const t1 = await barTop();
check(zb.y + zb.height <= t1, `przycisk „Zakończ test” nad paskiem (${zb.y + zb.height} ≤ ${t1})`);
await p.screenshot({ path: `${OUT}/bar-test.png` });
// lekcja
await p.goto(B + "/nauka/lekcja/mikro-rynek-1?sub=2"); await p.waitForSelector(".learn");
check(await p.locator("nav.bottom-bar").isVisible(), "pasek w lekcji");
const act = p.locator(".learn-actions .btn").first();
if (await act.count()) { const ab = await act.boundingBox(); const t2 = await barTop(); check(ab.y + ab.height <= t2 + 1, `„Sprawdź” w lekcji nad paskiem (${ab.y + ab.height} ≤ ${t2})`); }
await p.screenshot({ path: `${OUT}/bar-lekcja.png` });
const tf = p.locator('.learn button:has-text("Prawda")').first();
if (await tf.count()) { await tf.click(); await p.waitForSelector(".learn-feedback"); await p.waitForTimeout(500);
  const fb = await p.locator(".learn-feedback").boundingBox(); const t3 = await barTop();
  check(Math.abs(fb.y + fb.height - t3) <= 2, `panel odpowiedzi tuż nad paskiem (${fb.y + fb.height} vs ${t3})`);
  const nx = await p.locator(".learn-feedback .btn").first().boundingBox();
  check(nx && nx.y + nx.height <= t3, "przycisk „Dalej” widoczny nad paskiem");
  await p.screenshot({ path: `${OUT}/bar-lekcja-feedback.png` }); }
const tile = p.locator(".learn .tile:not([disabled]), .learn .chip:not([disabled]), .learn .option:not([disabled])").first();
if (!(await p.locator(".learn-feedback").count()) && await tile.count()) {
  await tile.click(); const chk = p.locator(".learn-actions .btn");
  if (await chk.count() && await chk.isEnabled()) { await chk.click(); await p.waitForSelector(".learn-feedback"); await p.waitForTimeout(500);
    const fb = await p.locator(".learn-feedback").boundingBox(); const t3 = await barTop();
    check(Math.abs(fb.y + fb.height - t3) <= 2, `panel odpowiedzi tuż nad paskiem (${fb.y + fb.height} vs ${t3})`);
    await p.screenshot({ path: `${OUT}/bar-lekcja-feedback.png` }); }
}
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
await b.close();
