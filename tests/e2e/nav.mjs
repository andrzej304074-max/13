import { chromium } from "playwright-core";
import fs from "node:fs";
const OUT = process.argv[2];
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0, bad = 0;
const check = (c, m) => { if (c) ok++; else { bad++; console.log("FAIL", m); } };
const S = JSON.parse(fs.readFileSync("./data/nauka/owe-stats.json", "utf8"));
const errors = [];
for (const [name, vp] of [["430", { width: 430, height: 900 }], ["1280", { width: 1280, height: 900 }]]) {
  const page = await browser.newPage({ viewport: vp });
  page.on("pageerror", (e) => errors.push(name + " " + e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(name + " " + m.text()));
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', "owner@example.com");
  await page.fill('input[name="password"]', "haslo-wlasciciela");
  await page.click("form button.btn"); await page.waitForTimeout(1500);
  const navSel = name === "430" ? "nav.bottom-bar" : "nav.sections";
  const sections = [["Testy", ["Olimpiada", "Słownik"]], ["Nauka", ["Kurs", "Podręcznik", "Fiszki", "Powtórka"]], ["Pojęcia", ["Tabela", "Statystyki OWE", "Pokrycie olimpiad"]], ["Notatki", ["Notatki", "Brudnopisy"]], ["Statystyki", ["Wyniki testów", "Działy i pojęcia", "Nauka"]]];
  for (const [sec, tabs] of sections) {
    await page.click(`${navSel} a:has-text("${sec}")`);
    await page.waitForTimeout(1200);
    check(await page.isVisible(`${navSel} a.active:has-text("${sec}")`), `${name}: dział ${sec} aktywny (${page.url()})`);
    for (const t of tabs) {
      await page.click(`.subtabs a:has-text("${t}")`);
      await page.waitForFunction((t) => document.querySelector(".subtabs a.active")?.textContent === t, t, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(900);
      check((await page.textContent(".subtabs a.active")) === t, `${name}: zakładka ${t}`);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(over <= 1, `${name}: poziome przewijanie ${over}px na ${t}`);
      await page.screenshot({ path: `${OUT}/${name}-${sec}-${t.replace(/\s+/g, "_")}.png` });
    }
  }
  // pokrycie: szkolny ← szkolny + okręgowy, XXXIX
  await page.goto(`${B}/pojecia/pokrycie?od=39&etap=s&zetap=so`);
  await page.waitForSelector('[data-testid="cov-repeat"]');
  const target = S.filter((r) => r.ed === 39 && r.st === "s");
  const items = new Set(target.flatMap((r) => r.items));
  const hist = new Set(S.filter((r) => r.ed < 39 && (r.st === "s" || r.st === "o")).flatMap((r) => r.items));
  const rep = [...items].filter((i) => hist.has(i)).length;
  check(Number(await page.textContent('[data-testid="cov-repeat"]')) === rep, `${name}: s←s+o powtórki ${rep}`);
  const qrep = target.filter((r) => r.items.length && r.items.every((i) => hist.has(i))).length;
  check(Number(await page.textContent('[data-testid="cov-qrepeat"]')) === qrep, `${name}: s←s+o pytania ${qrep}`);
  // komórka tabeli: centralny ← okręgowy
  await page.click('[data-testid="m-c-o"]');
  await page.waitForTimeout(500);
  check(page.url().includes("etap=c") && page.url().includes("zetap=o"), `${name}: komórka ustawia filtry ${page.url()}`);
  const t2 = S.filter((r) => r.ed === 39 && r.st === "c"), h2 = new Set(S.filter((r) => r.ed < 39 && r.st === "o").flatMap((r) => r.items));
  const i2 = new Set(t2.flatMap((r) => r.items));
  check(Number(await page.textContent('[data-testid="cov-repeat"]')) === [...i2].filter((i) => h2.has(i)).length, `${name}: c←o`);
  await page.screenshot({ path: `${OUT}/${name}-pokrycie.png`, fullPage: true });
  await page.close();
}
check(errors.length === 0, "konsola: " + errors.slice(0, 3).join(" | "));
console.log("OK:", ok, "błędów:", bad);
await browser.close();
