import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const OUT = process.argv[2];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0, bad = 0;
const check = (c, m) => { if (c) ok++; else { bad++; console.log("FAIL", m); } };
const errors = [];
for (const [name, vp] of [["430", { width: 430, height: 900 }], ["1280", { width: 1280, height: 900 }]]) {
  const page = await browser.newPage({ viewport: vp });
  page.on("dialog", (d) => d.accept());
  page.on("pageerror", (e) => errors.push(name + " " + e.message));
  page.on("console", (m) => m.type() === "error" && !/40[0-9]/.test(m.text()) && errors.push(name + " " + m.text()));
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', "owner@example.com");
  await page.fill('input[name="password"]', "haslo-wlasciciela");
  await page.click("form button.btn"); await page.waitForTimeout(1500);
  for (const [path, type, count, n] of [["/", "Jednokrotny wybór", "30 pytań", 4], ["/?zrodlo=slownik", "Wielokrotny wybór", "Bez limitu", 3]]) {
    await page.goto(B + path); await page.waitForSelector("button.choice");
    await page.click(`button.choice:has-text("${type}")`);
    await page.click(`button.choice:has-text("${count}")`);
    await page.click('button.btn:has-text("Rozpocznij test")');
    await page.waitForURL(/\/test\//, { timeout: 15000 });
    await page.waitForSelector("button.option");
    check(page.url().includes("/test/"), `${name} ${path}: start testu`);
    for (let i = 0; i < n; i++) {
      await page.waitForSelector("button.option:not([disabled])");
      await page.click("button.option >> nth=0");
      if (type.startsWith("Wielo")) await page.click("button.option >> nth=1");
      await page.click('button.btn:has-text("Sprawdź")');
      await page.waitForSelector("button.option.correct, button.option.wrong, button.option.missed");
      check(await page.$("button.option.correct, button.option.missed") !== null || /Poprawna odpowiedź: żadna/.test(await page.textContent(".feedback")), `${name} ${path}: pytanie ${i + 1} sprawdzone (pokazana poprawna)`);
      const next = await page.$('button.btn:has-text("Dalej")');
      if (next) await next.click();
      await page.waitForTimeout(200);
    }
    if (name === "430" && path === "/") await page.screenshot({ path: `${OUT}/test-${name}.png` });
    await page.click('button:has-text("Zakończ test")');
    await page.waitForSelector(".big", { timeout: 15000 });
    check(/%/.test(await page.textContent(".big")), `${name} ${path}: wynik testu`);
    await page.screenshot({ path: `${OUT}/wynik-${name}-${path.replace(/[/?=]/g, "") || "wszystkie"}.png`, fullPage: true });
  }
  await page.goto(`${B}/stats`); await page.waitForSelector(".big");
  check(await page.$$eval("table tbody tr", (r) => r.length) > 0, `${name}: historia testów w statystykach`);
  await page.goto(`${B}/nauka/powtorka`); await page.waitForTimeout(1500);
  check(await page.$("main h1, .learn") !== null, `${name}: powtórka`);
  // podgląd admina innego konta
  const users = await page.evaluate(async () => (await (await fetch("/api/admin/uzytkownicy")).json()));
  const other = (users.users ?? users).find?.((u) => u.email !== "owner@example.com");
  if (other) for (const p of ["/stats", "/stats/dzialy", "/nauka", "/nauka/statystyki", "/fiszki"]) {
    await page.goto(`${B}${p}?user=${other.id}`); await page.waitForTimeout(1800);
    check(await page.$(".preview-banner") !== null, `${name}: podgląd admina ${p}`);
  } else console.log("brak innego konta do podglądu");
  await page.close();
}
check(errors.length === 0, "konsola: " + errors.slice(0, 3).join(" | "));
console.log("OK:", ok, "błędów:", bad);
await browser.close();
