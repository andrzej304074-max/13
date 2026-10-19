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
const S = JSON.parse(fs.readFileSync("./data/nauka/owe-stats.json", "utf8"));
const C = JSON.parse(fs.readFileSync("./data/nauka/course.json", "utf8"));
let ok = 0, bad = 0;
const check = (c, msg) => { if (c) ok++; else { bad++; console.log("FAIL", msg); } };
await page.goto(`${B}/konto/logowanie`);
await page.fill('input[name="email"]', "owner@example.com");
await page.fill('input[name="password"]', "haslo-wlasciciela");
await page.click("form button.btn");
await page.waitForTimeout(1500);
check(!page.url().includes("/konto/"), "logowanie " + page.url());

// 1. Tabela pojęć: nowe hasła z liczbą pytań OWE
const NEW = { "Postęp techniczny": 3, "Deflacja długu (I. Fisher)": 1, "Papiery dyskontowe": 2, "Klasyczne podejście do zarządzania": 5, "Program leniency (łagodzenia kar)": 1 };
await page.goto(`${B}/pojecia`); await page.waitForSelector(".concept-row:not(.head)");
for (const [t, n] of Object.entries(NEW)) {
  await page.fill('input[type="search"]', t.split(" (")[0]); await page.waitForTimeout(400);
  const row = page.locator(".concept-row", { has: page.locator("strong", { hasText: t }) }).first();
  check(await row.count() === 1, "tabela: brak " + t);
  const tag = await row.locator(".tag.owe").textContent().catch(() => "");
  check(tag.includes(`${n}×`), `tabela: ${t} OWE ${tag} != ${n}`);
}
await shot("v-tabela");

// 2. Statystyki: suma, działy = JSON
await page.goto(`${B}/pojecia/statystyki`); await page.waitForSelector('[data-testid="owe-total"]');
check((await page.textContent('[data-testid="owe-total"]')).includes("1656"), "statystyki: 1656");
const topicN = {}; for (const r of S) topicN[r.topic] = (topicN[r.topic] ?? 0) + 1;
const rows = await page.$$eval('[data-testid="owe-topics"] .share-row', (els) => els.map((e) => e.querySelector(".share-val small").textContent));
const uiN = rows.map((s) => Number(s.replace(/\D/g, ""))).sort((a, b) => b - a);
check(JSON.stringify(uiN) === JSON.stringify(Object.values(topicN).sort((a, b) => b - a)), "działy UI " + uiN + " vs JSON " + JSON.stringify(topicN));
// 5 losowych pojęć: liczba w UI = JSON
const cnt = {}; for (const r of S) for (const i of r.items) cnt[i] = (cnt[i] ?? 0) + 1;
await page.click("text=Pokaż wszystkie"); // zagadnienia
const all = page.locator('[data-testid="owe-items"] button', { hasText: "Pokaż wszystkie" });
if (await all.count()) await all.click();
await page.waitForTimeout(500);
const ui = await page.$$eval('[data-testid="owe-item"]', (els) => els.map((e) => [e.querySelector(".item-name").textContent.slice(2).trim(), Number(e.querySelector("td.num strong").textContent)]));
const byT = Object.fromEntries(ui);
check(ui.length === Object.keys(cnt).length, `pojęć w UI ${ui.length} vs JSON ${Object.keys(cnt).length}`);
const ids = Object.keys(cnt).sort(() => Math.random() - 0.5).slice(0, 5).concat(Object.keys(cnt).filter((i) => C.items[i].t in NEW));
for (const i of ids) check(byT[C.items[i].t] === cnt[i], `pojęcie ${C.items[i].t}: UI ${byT[C.items[i].t]} vs JSON ${cnt[i]}`);
// kliknięcie nowego hasła pokazuje jego pytanie
const lr = page.locator('[data-testid="owe-item"]', { hasText: "Program leniency" });
await lr.click(); await page.waitForSelector(".q-list li");
check((await page.textContent(".q-list")).includes("Leniency to"), "leniency: pytanie owe24-o-26");
await shot("v-stat");

// 3. Nowe lekcje (hasła + Zrozumienie): wszystkie 4 pod-lekcje
for (const l of ["mikro-produkcja-6", "makro-inflacja-5", "fin-obligacje-4", "zarz-podstawy-4", "pol-sektorowa-2",
                 "mikro-produkcja-z3", "makro-inflacja-z5", "fin-obligacje-z2", "zarz-podstawy-z3", "pol-sektorowa-z3"]) {
  for (const sub of [1, 2, 3, 4]) { const t = await play(l, sub, 250); check(/skuteczność/.test(t), `${l}/${sub}: ${t.slice(0, 80)}`); }
  console.log("ok", l);
}
check(errors.length === 0, "błędy konsoli: " + errors.slice(0, 3).join(" | "));
console.log("sprawdzeń OK:", ok, "błędów:", bad);
await browser.close();
