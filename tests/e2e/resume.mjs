// Wznawianie pod-lekcji: wyjście po kilku ćwiczeniach → ścieżka „w trakcie” → „Kontynuuj” → dokończenie
import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
page.on("pageerror", (e) => errs.push(e.message));
page.on("dialog", (d) => d.accept());
await page.goto(`${B}/konto/logowanie`);
await page.fill("input[name=email]", "owner@example.com"); await page.fill("input[name=password]", "haslo-wlasciciela");
await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"));
await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith("owe:lesson:")) localStorage.removeItem(k); });
const pos = () => page.$eval(".learn-progress[role=progressbar]", (e) => Number(e.getAttribute("aria-valuenow"))).catch(() => -1);
/** Jedno ćwiczenie dalej (odpowiedź byle jaka). */
async function step(k) {
  const p0 = await pos();
  for (let t = 0; t < 12 && (await pos()) === p0; t++) {
    await page.waitForTimeout(120);
    if (await page.$(".learn-end")) return;
    const fb = await page.$(".learn-feedback button"); if (fb) { await fb.click(); continue; }
    const badge = (await page.$eval(".learn-badge", (e) => e.textContent).catch(() => "")) ?? "";
    if (await page.$(".learn-intro") || badge.startsWith("Nowe hasło")) { await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".buckets")) { for (const row of await page.$$(".bucket-row")) await (await row.$$(".seg button"))[0].click(); await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".number-row")) { await page.fill("input.learn-input", "500"); await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".pairs")) {
      for (const l of await page.$$(".pairs > div:first-child .pair:not([disabled])")) {
        for (let j = 0; ; j++) {
          const R = await page.$$(".pairs > div:last-child .pair:not([disabled])");
          if (!R.length || j >= R.length) break;
          await l.click(); await R[j].click(); await page.waitForTimeout(450);
          if (await l.isDisabled()) break;
        }
      }
      continue;
    }
    if (await page.$(".order-slots")) { while (await page.$(".chips .chip:not([disabled])")) await page.click(".chips .chip:not([disabled])"); await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".flashcard")) { if (await page.$(".flashcard:not([disabled])")) await page.click(".flashcard"); await page.click(".tile.correct"); continue; }
    if (await page.$("input.learn-input")) { await page.fill("input.learn-input", "x"); await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".chips .chip")) { await page.click(".chips .chip"); await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".option")) { await page.click(".option"); await page.click(".learn-actions .btn"); continue; }
    const tiles = await page.$$(".tile:not([disabled])"); if (tiles.length) { await tiles[k % tiles.length].click(); const b = await page.$(".learn-actions .btn"); if (b) await b.click(); continue; }
  }
}
const L = "mikro-rynek-1", SUB = 2;
await page.goto(`${B}/nauka/lekcja/${L}?sub=${SUB}`); await page.waitForSelector(".learn");
for (let k = 0; k < 4; k++) await step(k);
const p4 = await pos();
const total = await page.$eval(".learn-progress[role=progressbar]", (e) => Number(e.getAttribute("aria-valuemax")));
check(p4 >= 3, `przeszliśmy kilka ćwiczeń (${p4}/${total})`);
const ex4 = await page.$eval(".learn-ex", (e) => e.innerText.slice(0, 80));
await page.waitForTimeout(1600); // zapis postępu na serwerze (opóźnienie)
// wyjście ✕ do ścieżki
await page.click(".learn-close"); await page.waitForURL(/\/nauka\/mikro/); await page.waitForTimeout(800);
// panel lekcji otwiera się sam z adresu (#lekcja)
if (!(await page.locator(`#${L} .lesson-panel`).count())) await page.locator(`#${L} button.node`).click();
await page.waitForSelector('[data-testid="sub-partial"]', { timeout: 5000 }).catch(() => {});
const partTxt = await page.locator('[data-testid="sub-partial"]').first().textContent().catch(() => "");
check(partTxt.includes(`${p4}/${total}`), `ścieżka: „w trakcie ${p4}/${total}” (${partTxt})`);
check(await page.locator(`#${L} .node-partial`).count() === 1, "węzeł lekcji ze znacznikiem ⏸");
// ponowne wejście → propozycja kontynuacji
await page.goto(`${B}/nauka/lekcja/${L}?sub=${SUB}`); await page.waitForSelector('[data-testid="resume-offer"]');
check((await page.textContent('[data-testid="resume-continue"]')).includes(`${p4 + 1}`), "„Kontynuuj od ćwiczenia N+1”");
await page.click('[data-testid="resume-continue"]'); await page.waitForSelector(".learn");
check((await pos()) === p4, `kontynuacja od tego samego miejsca (${await pos()})`);
check((await page.$eval(".learn-ex", (e) => e.innerText.slice(0, 80))) === ex4, "to samo ćwiczenie co przed wyjściem");
// dokończenie
for (let k = 0; k < 120 && !(await page.$(".learn-end")); k++) { await step(k); if (k % 10 === 0) console.log("krok", k, await pos()); }
await page.waitForSelector(".learn-end");
await page.waitForFunction(() => !document.body.innerText.includes("Zapisywanie wyniku"), null, { timeout: 10000 });
const endTxt = await page.$eval(".learn-end", (e) => e.innerText);
check(/skuteczność/i.test(endTxt), "wynik zapisany po dokończeniu");
check(await page.evaluate(() => !Object.keys(localStorage).some((k) => k.startsWith("owe:lesson:mikro-rynek-1:2"))), "stan w trakcie usunięty po ukończeniu");
await page.goto(`${B}/nauka/mikro#${L}`); await page.waitForTimeout(800);
if (!(await page.locator(`#${L} .lesson-panel`).count())) await page.locator(`#${L} button.node`).click();
await page.waitForTimeout(400);
check(await page.locator('[data-testid="sub-partial"]').count() === 0, "po ukończeniu bez „w trakcie”");
// „Zacznij od nowa”
await page.goto(`${B}/nauka/lekcja/${L}?sub=${SUB}`); await page.waitForSelector(".learn");
for (let k = 0; k < 2; k++) await step(k);
await page.goto(`${B}/nauka/lekcja/${L}?sub=${SUB}`); await page.waitForSelector('[data-testid="resume-offer"]');
await page.click('[data-testid="resume-restart"]'); await page.waitForSelector(".learn");
check((await pos()) === 0, "„Zacznij od nowa” – od pierwszego ćwiczenia");
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails, null, 1), JSON.stringify(errs.slice(0, 5)));
