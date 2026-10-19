// Fiszki – feed: strona się nie przewija, feed kończy się nad dolnym paskiem, przewinięcie = następna karta
import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
for (const vp of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 1280, height: 900 }]) {
  const mobile = vp.width < 700, tag = `${vp.width}x${vp.height}`;
  const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(`${tag} ${e.message}`));
  await p.goto(`${B}/konto/logowanie`);
  await p.fill("input[name=email]", "owner@example.com"); await p.fill("input[name=password]", "haslo-wlasciciela");
  await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
  await p.goto(`${B}/fiszki`); await p.waitForSelector("[data-testid=feed] .reel"); await p.waitForTimeout(800);
  const m = () => p.evaluate(() => {
    const f = document.querySelector("[data-testid=feed]"), fb = f.getBoundingClientRect();
    const bar = document.querySelector(".bottom-bar"); const bt = bar && getComputedStyle(bar).display !== "none" ? bar.getBoundingClientRect().top : innerHeight;
    const reel = f.querySelector(".reel"), rb = reel.querySelector(".reel-bar");
    return { docOver: document.documentElement.scrollHeight - innerHeight, feedBottom: fb.bottom, barTop: bt, feedH: f.clientHeight, reelH: reel.getBoundingClientRect().height,
      rbOver: rb.scrollWidth - rb.clientWidth, reelOver: reel.scrollWidth - reel.clientWidth, feedXOver: f.scrollWidth - f.clientWidth };
  });
  let r = await m();
  check(r.docOver <= 1, `${tag} strona nie przewija się (+${r.docOver}px)`);
  check(r.feedBottom <= r.barTop + 1, `${tag} feed kończy się nad dolnym paskiem (${Math.round(r.feedBottom)} ≤ ${Math.round(r.barTop)})`);
  check(r.feedH >= 240, `${tag} feed ma sensowną wysokość (${r.feedH})`);
  check(Math.abs(r.reelH - r.feedH) <= 1, `${tag} karta = wysokość feedu (${r.reelH} vs ${r.feedH})`);
  check(r.rbOver <= 0 && r.reelOver <= 0 && r.feedXOver <= 0, `${tag} bez poziomego wystawania (${r.rbOver}/${r.reelOver}/${r.feedXOver})`);
  // przewinięcie o ekran → dokładnie następna karta (przyciąganie)
  await p.evaluate(() => { const f = document.querySelector("[data-testid=feed]"); f.scrollBy({ top: f.clientHeight * 0.6, behavior: "instant" }); });
  await p.waitForTimeout(900);
  const pos = await p.evaluate(() => { const f = document.querySelector("[data-testid=feed]"); return [f.scrollTop, f.clientHeight]; });
  check(Math.abs(pos[0] - pos[1]) <= 2, `${tag} przyciąganie do następnej karty (scrollTop ${pos[0]} ≈ ${pos[1]})`);
  // po rozwinięciu filtrów strona dalej się nie przewija ponad feed
  const filt = p.locator("summary:has-text('Filtry')").first();
  if (await filt.count()) {
    await filt.click(); await p.waitForTimeout(500);
    await filt.click(); await p.waitForTimeout(500);
    r = await m();
    check(r.feedBottom <= r.barTop + 1 && r.docOver <= 1, `${tag} po zwinięciu filtrów feed wraca nad pasek (${Math.round(r.feedBottom)} / +${r.docOver})`);
  }
  await ctx.close();
}
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails, null, 1), JSON.stringify(errs.slice(0, 5)));
