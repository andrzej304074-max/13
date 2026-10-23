// G6: „🎲 Losuj zadanie/esej” – na liście (z filtrami, najpierw nierozwiązane) i na stronie Olimpiady
import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const p = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(`${B}/konto/logowanie`);
await p.fill('input[name="email"]', "drugi@example.com"); await p.fill('input[name="password"]', "nowe-haslo-123");
await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
// 1. lista zadań z filtrem etapu centralnego
await p.goto(`${B}/zadania?etap=c`); await p.waitForSelector('[data-testid="open-item"]');
await p.click('[data-testid="open-random"]'); await p.waitForURL(/\/zadania\/.+/);
check(/-centralne-/.test(p.url()), `losowe zadanie z etapu centralnego (${p.url()})`);
// 2. eseje
await p.goto(`${B}/eseje`); await p.waitForSelector('[data-testid="open-item"]');
await p.click('[data-testid="open-random"]'); await p.waitForURL(/\/eseje\/.+/);
check(true, "losowy esej");
// 3. strona Olimpiady: zakres edycji z filtrów
await p.goto(`${B}/`); await p.waitForSelector('[data-testid="random-open"]');
await p.locator('details[data-testid="test-filters"] summary').click();
await p.selectOption('[data-testid="ed-from"]', "38"); await p.waitForTimeout(400);
await p.click('[data-testid="random-zadanie"]'); await p.waitForURL(/\/zadania\/.+/);
check(/owe-3[89]-/.test(p.url()), `zadanie z XXXVIII–XXXIX (${p.url()})`);
await p.goto(`${B}/`); await p.waitForSelector('[data-testid="random-open"]');
await p.click('[data-testid="random-esej"]'); await p.waitForURL(/\/eseje\/.+/);
check(true, "esej z Olimpiady");
check(errs.length === 0, `błędy JS: ${errs.join(" | ")}`);
await browser.close();
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
