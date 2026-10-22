// G2: pytania obliczeniowe w filtrze „Rodzaj haseł”: „wzory” je obejmują, „pojęcia” nie
import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage();
page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${B}/konto/logowanie`);
await page.fill('input[name="email"]', "drugi@example.com"); await page.fill('input[name="password"]', "nowe-haslo-123");
await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"));
const total = async (q) => {
  await page.goto(`${B}/pojecia/statystyki${q}`); await page.waitForSelector('[data-testid="owe-total"]');
  return Number((await page.locator('[data-testid="owe-total"] strong').first().innerText()).replace(/\D/g, ""));
};
const all = await total(""), wz = await total("?rodzaj=wzor"), po = await total("?rodzaj=pojecie");
check(wz >= 180, `„wzory” obejmują pytania obliczeniowe (${wz})`);
check(po < all && po + wz >= all - 40, `„pojęcia” bez obliczeniowych (${po} + ${wz} vs ${all})`);
const names = await page.goto(`${B}/pojecia/statystyki?rodzaj=wzor`).then(() => page.waitForSelector('[data-testid="owe-item"]')).then(() => page.locator('[data-testid="owe-item"] .item-name').allInnerTexts());
check(names.some((n) => /Równowaga rynkowa – obliczanie/.test(n)), "hasło „Równowaga rynkowa – obliczanie” w pojęciach przy filtrze wzorów");
check(errs.length === 0, `błędy JS: ${errs.join(" | ")}`);
await browser.close();
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
