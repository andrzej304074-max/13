import { chromium } from "playwright-core";
const OUT = process.argv[2];
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const seen = new Set();
const shot = async (name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });

let fromQ = 0;
async function play(lesson, sub, maxSteps = 80) {
  fromQ = 0;
  await page.goto(`${B}/nauka/lekcja/${lesson}?sub=${sub}`);
  await page.waitForSelector(".learn, .learn-end", { timeout: 15000 });
  for (let step = 0; step < maxSteps; step++) {
    await page.waitForTimeout(120);
    if (await page.$(".learn-end")) break;
    const fb = await page.$(".learn-feedback button");
    if (fb) {
      const key = "fb-" + (await page.$eval(".learn-feedback", (e) => e.className));
      if (!seen.has(key)) { seen.add(key); await shot(key.replace(/ /g, "_")); }
      await fb.click(); continue;
    }
    const badge = (await page.$eval(".learn-badge", (e) => e.textContent).catch(() => "")) ?? "";
    const key = badge.split("·")[0].trim();
    if (!seen.has(key)) { seen.add(key); await shot(`ex-${seen.size}-${key.replace(/[^\p{L}]+/gu, "_")}`); }
    if (badge.startsWith("Wyjaśnienie") && await page.$(".learn-intro")) { await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".buckets")) {
      for (const row of await page.$$(".bucket-row")) await (await row.$$(".seg button"))[step % 2].click();
      await page.click(".learn-actions .btn"); continue;
    }
    if (await page.$(".number-row")) { await page.fill("input.learn-input", "500"); await page.click(".learn-actions .btn"); continue; }
    if (badge.startsWith("Nowe hasło")) { if (badge.includes("z pytań Sprawdzianu")) fromQ++; await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".pairs")) {
      const L = await page.$$(".pairs > div:first-child .pair:not([disabled])");
      for (const l of L) {
        for (let j = 0; ; j++) {
          const R = await page.$$(".pairs > div:last-child .pair:not([disabled])");
          if (!R.length || j >= R.length) break;
          await l.click(); await R[j].click(); await page.waitForTimeout(500);
          if (await l.isDisabled()) break;
        }
      }
      continue;
    }
    if (await page.$(".order-slots")) {
      while (await page.$(".chips .chip:not([disabled])")) await page.click(".chips .chip:not([disabled])");
      await page.click(".learn-actions .btn"); continue;
    }
    if (await page.$(".flashcard")) {
      if (await page.$(".flashcard:not([disabled])")) await page.click(".flashcard");
      await page.click(".tile.correct"); continue;
    }
    if (await page.$("input.learn-input")) {
      await page.fill("input.learn-input", step % 2 ? "elastycznosc" : "1990");
      await page.click(".learn-actions .btn"); continue;
    }
    if (await page.$(".chips .chip")) { await page.click(".chips .chip"); await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".option")) {
      await page.click(".option"); await page.click(".learn-actions .btn"); continue;
    }
    if (await page.$(".tile:not([disabled])")) {
      const tiles = await page.$$(".tile:not([disabled])");
      await tiles[step % tiles.length].click();
      const btn = await page.$(".learn-actions .btn");
      if (btn) await btn.click();
      continue;
    }
    throw new Error("unknown state at " + lesson + "/" + sub + ": " + badge);
  }
  await page.waitForSelector(".learn-end");
  await page.waitForFunction(() => !document.body.innerText.includes("Zapisywanie wyniku"), null, { timeout: 10000 });
  const text = await page.$eval(".learn-end", (e) => e.innerText.slice(0, 200).replace(/\n/g, " | "));
  if (!/skuteczność/.test(text)) console.log("BAD", lesson, sub, text);
  return text;
}

import fs from "node:fs";
const C = JSON.parse(fs.readFileSync("./data/nauka/course.json", "utf8"));
await page.goto(`${B}/konto/logowanie`);
await page.fill('input[name="email"]', "owner@example.com");
await page.fill('input[name="password"]', "haslo-wlasciciela");
await page.click("form button.btn");
await page.waitForTimeout(1500);
const only = process.argv[3] ? new Set(process.argv[3].split(",")) : null;
let n = 0;
const L = C.units.flatMap((u) => u.lessons).map((id) => C.lessons[id]).filter((l) => !only || only.has(l.id));
for (const l of L) {
  for (const sub of [1, 2, 3, 4]) {
    const txt = await play(l.id, sub, 200);
    n++;
    if (sub === 1 && l.type !== "zrozum" && fromQ !== (l.extra ?? []).length) console.log("BAD extra", l.id, fromQ, (l.extra ?? []).length);
  }
  console.log("ok", l.id, l.type ?? "hasla");
}
await page.goto(`${B}/nauka/demografia`); await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/p-topic.png`, fullPage: false });
console.log("pod-lekcji:", n, "errors:", errors);
await browser.close();
