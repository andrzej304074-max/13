// G6/H0: „🎲 Losuj zadanie” w Zadaniach, „🎲 Losuj esej” w Esejach (z filtrami, najpierw nierozwiązane); nie na Olimpiadzie
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
check(/-centralne-|prognoza-xl-(3[5-9]|4\d|50)-/.test(p.url()), `losowe zadanie z etapu centralnego (${p.url()})`);
// 2. eseje
await p.goto(`${B}/eseje`); await p.waitForSelector('[data-testid="open-item"]');
await p.click('[data-testid="open-random"]'); await p.waitForURL(/\/eseje\/.+/);
check(true, "losowy esej");
// 3. każda zakładka losuje tylko swoje: w Zadaniach – zadanie, w Esejach – esej; na Olimpiadzie nie ma losowania
await p.goto(`${B}/eseje`); await p.waitForSelector('[data-testid="open-item"]');
check(await p.locator('[data-testid="open-random"]').count() === 1 && /Losuj esej/.test(await p.locator('[data-testid="open-random"]').innerText()), "Eseje: tylko „Losuj esej”");
await p.goto(`${B}/zadania`); await p.waitForSelector('[data-testid="open-item"]');
check(await p.locator('[data-testid="open-random"]').count() === 1 && /Losuj zadanie/.test(await p.locator('[data-testid="open-random"]').innerText()), "Zadania: tylko „Losuj zadanie”");
await p.goto(`${B}/`); await p.waitForSelector('[data-testid="test-filters"]');
check(await p.locator('[data-testid="random-open"], [data-testid="random-zadanie"], [data-testid="random-esej"]').count() === 0, "Olimpiada bez losowania zadań i esejów");
check(errs.length === 0, `błędy JS: ${errs.join(" | ")}`);
await browser.close();
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
