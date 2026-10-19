import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const errs = [];
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const page = await ctx.newPage();
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await page.goto(`${B}/konto/logowanie`);
await page.fill('input[name="email"]', "drugi@example.com"); await page.fill('input[name="password"]', "nowe-haslo-123");
await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"));
const TID = "owe-39-okregowe-zadanie", EID = "owe-39-okregowe-esej";
// 1. lista zadań
await page.goto(`${B}/zadania`); await page.waitForSelector('[data-testid="open-item"]');
check(await page.locator('a[href="/zadania"][role="tab"]').count() === 1, "zakładka Zadania w Testach");
check(await page.locator('[data-testid="open-item"]').count() >= 1, "lista zadań");
// 2. klucz niedostępny przed sprawdzeniem
const pub = await (await page.request.get(`${B}/api/otwarte/${TID}`)).text();
check(!pub.includes("21.875") && !pub.includes("solution"), "API zadania bez wyników i rozwiązań");
const epub = await (await page.request.get(`${B}/api/otwarte/${EID}`)).text();
check(!epub.includes("raczkujących"), "API eseju bez schematu");
// 3. zadanie: poprawny i błędny wynik
await page.goto(`${B}/zadania/${TID}`); await page.waitForSelector('[data-testid="task-part"]');
check(await page.locator(".ob-table table").count() === 1, "tabela z danymi");
check(await page.locator('[data-testid="task-input"]').count() === 2, "dwa pola wyników (a, b)");
await page.locator('[data-testid="task-input"]').nth(0).fill("21,88");
await page.locator('[data-testid="task-input"]').nth(1).fill("30");
check(await page.locator('[data-testid="scratch-toggle"]').count() === 1, "brudnopis pod zadaniem");
await page.click('[data-testid="task-check"]');
await page.waitForSelector('[data-testid="task-result"]');
const partA = await page.locator('[data-testid="task-part"][data-label="a"]').innerText();
const partB = await page.locator('[data-testid="task-part"][data-label="b"]').innerText();
check(/✓/.test(partA), "a) poprawny");
check(/✗ poprawnie: 26,25 %/.test(partB), `b) błędny z poprawnym wynikiem (${partB.slice(0, 120)})`);
check(/115,2/.test(partA) && /Interpretacja/.test(partA), "pełny tok obliczeń w rozwiązaniu");
check(/5 \/ 15 pkt/.test(await page.locator('[data-testid="task-result"]').innerText()), `wynik 5/15 (a za 5 pkt) (${await page.locator('[data-testid="task-result"] .big').innerText()})`);
check(await page.locator('[data-testid="task-input"]').first().isDisabled(), "wyniki zablokowane po sprawdzeniu");
// samoocena części opisowych
await page.locator('[data-testid="task-part"][data-label="c"] [data-testid="self-1"]').click(); await page.waitForTimeout(500);
await page.locator('[data-testid="task-part"][data-label="d"] [data-testid="self-0.5"]').click(); await page.waitForTimeout(700);
check(/10 \/ 15 pkt/.test(await page.locator('[data-testid="task-result"]').innerText()), `po samoocenie 5+2+3=10 (${await page.locator('[data-testid="task-result"] .big').innerText()})`);
check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "zadanie: brak poziomego przewijania");
await page.screenshot({ path: `${OUT}/zadanie-390.png`, fullPage: true });
// 4. esej
await page.goto(`${B}/eseje`); await page.waitForSelector('[data-testid="open-item"]');
await page.goto(`${B}/eseje/${EID}`); await page.waitForSelector('[data-testid="essay-topic"]');
await page.click('[data-testid="essay-finish"]'); await page.waitForSelector('[data-testid="essay-result"]');
check(await page.locator('[data-testid="essay-section"]').count() === 2, "dwie części schematu");
const boxes = page.locator('[data-testid="essay-check"]');
check(await boxes.count() === 12, `12 punktów schematu (${await boxes.count()})`);
for (let i = 0; i < 6; i++) await boxes.nth(i).check();
for (let i = 6; i < 9; i++) await boxes.nth(i).check();
await page.click('[data-testid="essay-save"]'); await page.waitForSelector('[data-testid="essay-score"]');
check(/20 \/ 25 pkt/.test(await page.locator('[data-testid="essay-score"]').innerText()), `esej 15+5=20 (${await page.locator('[data-testid="essay-score"]').innerText()})`);
await page.screenshot({ path: `${OUT}/esej-390.png`, fullPage: true });
// 5. lista pokazuje wynik, statystyki osobno od testów
await page.goto(`${B}/zadania`); await page.waitForSelector('[data-testid="open-item"]');
check(/najlepiej 10\/15/.test(await page.locator('[data-testid="open-item"]', { hasText: "analizy finansowej" }).first().innerText()), "lista: najlepszy wynik");
await page.goto(`${B}/stats`); await page.waitForSelector('[data-testid="open-stats"]');
const os = await page.locator('[data-testid="open-stats"]').innerText();
check(/zadania/.test(os) && /eseje/.test(os) && /66,7%/.test(os) && /80%/.test(os), `statystyki zadań i esejów (${os.slice(0, 160)})`);
// 6. uprawnienia i błędy
check((await page.request.post(`${B}/api/otwarte/nie-ma-zadanie/sprawdz`, { data: {} })).status() === 404, "nieznane zadanie → 404");
check((await page.request.post(`${B}/api/otwarte/${EID}/sprawdz`, { data: { topic: 5 } })).status() === 400, "zły temat → 400");
check((await page.request.post(`${B}/api/otwarte/${TID}/sprawdz`, { data: { attempt: "00000000-0000-0000-0000-000000000000", self: {} } })).status() === 404, "cudze/nieistniejące podejście → 404");
// 7. wszystkie zestawy, oznaczenie własnych rozwiązań, pytania sponsora, wyniki alternatywne
const lt = await (await page.request.get(`${B}/api/otwarte?rodzaj=zadanie`)).json();
const le = await (await page.request.get(`${B}/api/otwarte?rodzaj=esej`)).json();
const nT = (lt.items ?? lt).length, nE = (le.items ?? le).length;
check(nT === 54 && nE === 58, `54 zadania i 58 esejów (${nT}, ${nE})`);
await page.goto(`${B}/zadania/owe-36-okregowe-zadanie`); await page.waitForSelector('[data-testid="task-part"]');
check(await page.locator('[data-testid="own-note"]').count() === 1, "36o: oznaczenie rozwiązania własnego");
await page.goto(`${B}/zadania/${TID}`); await page.waitForSelector('[data-testid="task-part"]');
check(await page.locator('[data-testid="own-note"]').count() === 0, "39o: bez oznaczenia");
await page.goto(`${B}/eseje/owe-22-centralne-esej-sponsor`); await page.waitForSelector('[data-testid="essay-topic"]');
check(await page.locator('[data-testid="essay-topic"]').count() === 3, "sponsor: 3 tematy do wyboru");
await page.locator('[data-testid="essay-topic"]').nth(1).click();
await page.click('[data-testid="essay-finish"]'); await page.waitForSelector('[data-testid="essay-result"]');
check(/nie zawiera schematu/.test(await page.locator('main').innerText()), "sponsor: brak schematu – komunikat");
const alt = await (await page.request.post(`${B}/api/otwarte/owe-32-szkolne-zadanie/sprawdz`, { data: { answers: { c: ["19,6", "3,4"], d: ["7200"] }, self: {} } })).json();
const pc = alt.parts?.find((x) => x.label === "c"), pd = alt.parts?.find((x) => x.label === "d");
check(pc?.correct?.every(Boolean) && pd?.correct?.[0] === true, `32s: ścisłe wyniki akceptowane (${JSON.stringify(pc?.correct)} ${JSON.stringify(pd?.correct)})`);
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails, null, 1), JSON.stringify(errs.slice(0, 5)));
