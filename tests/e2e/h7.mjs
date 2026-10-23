// H7: Prognoza XL – filtr źródła (zapis na koncie), etykieta, rozwiązanie zadania i eseju z podpowiedziami, osobne wiersze w statystykach
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const p = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(`${B}/konto/logowanie`);
await p.fill('input[name="email"]', "drugi@example.com"); await p.fill('input[name="password"]', "nowe-haslo-123");
await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
const noScroll = async (m) => check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${m}: bez poziomego przewijania`);
const count = async () => Number((await p.locator('[data-testid="open-count"]').innerText()).match(/Pokazano (\d+)/)[1]);
// 1. lista zadań: filtr źródła
await p.goto(`${B}/zadania`); await p.waitForSelector('[data-testid="open-item"]');
const all = await count();
await p.click('[data-src="prognoza"]'); await p.waitForTimeout(300);
const nProg = await count();
check(nProg === 50, `Zadania: 50 pozycji Prognozy XL (${nProg})`);
check(await p.locator('[data-testid="open-item"] [data-testid="src-label"]').count() === nProg, "każda pozycja z etykietą „🔮 Prognoza XL (własne)”");
check(/zrodlo=prognoza/.test(p.url()), "filtr źródła w adresie");
await p.screenshot({ path: `${OUT}/h7_lista_390.png` });
await noScroll("lista");
await p.click('[data-src="owe"]'); await p.waitForTimeout(300);
check(await count() === all - 50 && await p.locator('[data-testid="src-label"]').count() === 0, "filtr „z kluczy OWE” bez Prognozy");
// zapis filtra na koncie: powrót bez parametrów odtwarza wybór
await p.click('[data-src="prognoza"]'); await p.waitForTimeout(1500);
await p.goto(`${B}/zadania`); await p.waitForSelector('[data-testid="open-item"]'); await p.waitForTimeout(800);
check(await count() === 50 && (await p.getAttribute('[data-src="prognoza"]', "aria-pressed")) === "true", "filtr źródła zapamiętany na koncie");
// losowanie z filtrem źródła
await p.click('[data-testid="open-random"]'); await p.waitForURL(/\/zadania\/.+/);
check(/prognoza-xl-\d\d-zadanie/.test(p.url()), `losowanie z Prognozy XL (${p.url()})`);
// 2. zadanie: treść bez klucza, rozwiązanie z poprawnymi wynikami
const pub = await (await p.request.get(`${B}/api/otwarte/prognoza-xl-01-zadanie`)).text();
check(!/calc|"lets"|"vars"|"value"/.test(pub), "API: treść zadania bez wyników i danych pośrednich");
const set = JSON.parse(readFileSync("data/otwarte/sets/prognoza-xl-01.json", "utf8"));
await p.goto(`${B}/zadania/prognoza-xl-01-zadanie`); await p.waitForSelector('[data-testid="task-part"]');
check(/prognoz/i.test(await p.locator('[data-testid="own-note"]').innerText()), "zadanie: nota o Prognozie XL");
check(await p.locator('[data-testid="src-label"]').count() === 1, "zadanie: etykieta źródła");
for (const part of set.task.parts) {
  const inputs = p.locator(`[data-testid="task-part"][data-label="${part.label}"] [data-testid="task-input"]`);
  for (let i = 0; i < part.answers.length; i++) await inputs.nth(i).fill(String(part.answers[i].value).replace(".", ","));
}
await p.click('[data-testid="task-check"]'); await p.waitForSelector('[data-testid="task-result"]');
const numPts = set.task.parts.filter((x) => x.answers.length).reduce((a, x) => a + x.pts, 0);
const got = await p.locator('[data-testid="task-result"] .big').innerText();
check(got.startsWith(`${numPts} /`) || got.startsWith(`${numPts},0 /`), `zadanie: komplet punktów za wyniki liczbowe (${got}, oczekiwano ${numPts})`);
check(await p.locator('[data-testid="task-solution"]').count() === set.task.parts.length, "zadanie: rozwiązanie każdego podpunktu");
await noScroll("zadanie");
// 3. esej prognozy: podpowiedzi po zakończeniu, samoocena
await p.goto(`${B}/eseje?zrodlo=prognoza&etap=o`); await p.waitForSelector('[data-testid="open-item"]');
check(await count() === 17, `Eseje: 17 tematów Prognozy na etap okręgowy (${await count()})`);
await p.goto(`${B}/eseje/prognoza-xl-20-esej`); await p.waitForSelector('[data-testid="essay-finish"]');
await p.click('[data-testid="essay-finish"]'); await p.waitForSelector('[data-testid="essay-result"]');
for (const k of ["s", "d", "b"]) check(await p.locator(`[data-testid="essay-hints-${k}"] li`).count() > 0, `esej: podpowiedzi „${k}”`);
const boxes = p.locator('[data-testid="essay-check"]');
for (let i = 0; i < 4; i++) await boxes.nth(i).check();
await p.click('[data-testid="essay-save"]'); await p.waitForSelector('[data-testid="essay-score"]');
check(/\/ 25 pkt/.test(await p.locator('[data-testid="essay-score"]').innerText()), "esej: samoocena zapisana");
await p.screenshot({ path: `${OUT}/h7_esej_390.png`, fullPage: false });
// 4. statystyki: osobne wiersze źródła
await p.goto(`${B}/stats`); await p.waitForSelector('[data-testid="open-stats"]');
check(await p.locator('[data-testid="open-stats"] [data-kind="zadanie"] [data-src="prognoza"]').count() === 1, "statystyki zadań: wiersz Prognozy XL");
check(await p.locator('[data-testid="open-stats"] [data-kind="esej"] [data-src="prognoza"]').count() === 1, "statystyki esejów: wiersz Prognozy XL");
// 5. statystyki tematów OWE (hasło przewodnie) bez Prognozy
const owe = await (await p.request.get(`${B}/api/dane/owe-stats`)).text();
check(!owe.includes("prognoza-xl"), "statystyki OWE bez pozycji Prognozy");
// sprzątanie: domyślny filtr źródła
await p.goto(`${B}/zadania`); await p.waitForSelector('[data-testid="open-item"]');
await p.click('[data-src=""]'); await p.waitForTimeout(1500);
check(errs.length === 0, `błędy JS: ${errs.join(" | ")}`);
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, fails);
process.exit(fails.length ? 1 : 0);
