import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const errs = [];
async function login(email, password) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/40[39]|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', email); await page.fill('input[name="password"]', password);
  await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"));
  return page;
}
const admin = await login("owner@example.com", "haslo-wlasciciela");
const user = await login("drugi@example.com", "nowe-haslo-123");
const T = `E2E ${Date.now()}`;
// czysty start dla użytkownika: przeczytaj wszystko, co już jest
const pre = await (await user.request.get(`${B}/api/ogloszenia`)).json();
await user.request.post(`${B}/api/ogloszenia/przeczytane`, { data: { ids: [...pre.announcements, ...pre.polls].map((x) => x.id) } });
// 1. uprawnienia
check((await user.request.get(`${B}/api/admin/ogloszenia`)).status() === 403, "zwykły użytkownik: GET admin → 403");
check((await user.request.post(`${B}/api/admin/ogloszenia`, { data: { title: "x", body: "y" } })).status() === 403, "zwykły użytkownik: POST admin → 403");
check((await user.request.post(`${B}/api/admin/ankiety`, { data: {} })).status() === 403, "zwykły użytkownik: ankieta admin → 403");
// 2. admin publikuje przez panel: ogłoszenie przypięte
await admin.goto(`${B}/admin`); await admin.waitForSelector('[data-testid="ann-admin"]');
await admin.fill('[data-testid="ann-title"]', `${T} ogłoszenie`);
await admin.fill('[data-testid="ann-body"]', "Pierwszy akapit.\n\nDrugi akapit z nową funkcją.");
await admin.check('[data-testid="ann-pinned-check"]');
await admin.click('[data-testid="ann-save"]');
await admin.waitForSelector(`[data-testid="ann-admin-item"]:has-text("${T} ogłoszenie")`);
check(true, "admin: ogłoszenie opublikowane");
// ankieta jawna (wyniki po głosie) przez panel
await admin.click('[data-testid="poll-tab"]');
await admin.fill('[data-testid="poll-question"]', `${T} ankieta`);
await admin.fill('[data-testid="poll-options"]', "Tryb ciemny\nWięcej zadań\nKrótsze lekcje");
await admin.uncheck('[data-testid="poll-anon"]');
await admin.click('[data-testid="poll-save"]');
await admin.waitForSelector(`[data-testid="poll-admin-item"]:has-text("${T} ankieta")`);
// druga ankieta przez API: wyniki dopiero po zamknięciu, wielokrotny wybór
check((await admin.request.post(`${B}/api/admin/ankiety`, { data: { question: `${T} ukryte wyniki`, options: ["A", "B", "C"], multi: true, anonymous: true, results_after: "close", published: true } })).status() === 201, "admin API: ankieta 2");
// szkic – niewidoczny dla użytkownika
await admin.request.post(`${B}/api/admin/ogloszenia`, { data: { title: `${T} szkic`, body: "nie pokazuj", published: false } });
check((await admin.request.post(`${B}/api/admin/ankiety`, { data: { question: "Q", options: ["A"] } })).status() === 400, "walidacja: ankieta z 1 odpowiedzią → 400");
// 3. użytkownik: licznik i pasek
await user.goto(`${B}/`); await user.waitForSelector('[data-testid="ann-bell"]');
await user.waitForSelector('[data-testid="ann-count"]');
check(await user.locator('[data-testid="ann-count"]').innerText() === "3", `🔔 licznik = 3 (${await user.locator('[data-testid="ann-count"]').innerText()})`);
check(/ogłoszenie/.test(await user.locator('[data-testid="ann-pinned"]').innerText()), "pasek przypiętego ogłoszenia");
check(await user.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "telefon: nagłówek z 🔔 bez poziomego przewijania");
await user.screenshot({ path: `${OUT}/ogloszenia-pasek-390.png` });
// 4. strona ogłoszeń
await user.click('[data-testid="ann-bell"]'); await user.waitForSelector('[data-testid="ann-item"]');
const page = await user.locator("main").innerText();
check(page.includes(`${T} ogłoszenie`) && page.includes("Drugi akapit") && !page.includes(`${T} szkic`), "lista: ogłoszenie widoczne, szkic ukryty");
check(await user.locator('[data-testid="ann-pinned"]').count() === 0, "na /ogloszenia bez paska");
await user.waitForTimeout(800);
check(await user.locator('[data-testid="ann-count"]').count() === 0, "po otwarciu licznik znika");
// 5. głosowanie
const p1 = user.locator('[data-testid="poll"]', { hasText: `${T} ankieta` });
await p1.locator('[data-testid="poll-option"]').nth(1).check();
await p1.locator('[data-testid="poll-vote"]').click();
await p1.locator('[data-testid="poll-results"]').waitFor();
check(/100%/.test(await p1.locator('[data-testid="poll-results"]').innerText()), "wyniki po głosie (100% dla wybranej)");
const ids = await (await user.request.get(`${B}/api/ogloszenia`)).json();
const pid1 = ids.polls.find((p) => p.question === `${T} ankieta`).id, pid2 = ids.polls.find((p) => p.question === `${T} ukryte wyniki`).id;
check((await user.request.post(`${B}/api/ankiety/${pid1}/glos`, { data: { choices: [0] } })).status() === 409, "drugi głos → 409");
const p2 = user.locator('[data-testid="poll"]', { hasText: `${T} ukryte wyniki` });
await p2.locator('[data-testid="poll-option"]').nth(0).check(); await p2.locator('[data-testid="poll-option"]').nth(2).check();
await p2.locator('[data-testid="poll-vote"]').click();
await p2.locator('[data-testid="poll-wait"]').waitFor();
check(true, "ankieta 2: wyniki ukryte do zamknięcia");
check((await user.request.post(`${B}/api/ankiety/${pid2}/glos`, { data: { choices: [9] } })).status() === 400, "zły indeks odpowiedzi → 400");
check((await user.request.post(`${B}/api/ankiety/${pid2}/glos`, { data: { choices: [1] } })).status() === 409, "ponowny głos → 409");
await user.screenshot({ path: `${OUT}/ogloszenia-390.png`, fullPage: true });
// 6. ukrycie paska
await user.goto(`${B}/nauka`); await user.waitForSelector('[data-testid="ann-pinned"]');
await user.click('[data-testid="ann-pinned-x"]'); await user.waitForTimeout(500);
await user.reload(); await user.waitForSelector('[data-testid="ann-bell"]'); await user.waitForTimeout(800);
check(await user.locator('[data-testid="ann-pinned"]').count() === 0, "pasek ukryty na stałe");
// 7. admin: wyniki, kto głosował, zamknięcie ankiety 2
await admin.goto(`${B}/admin`); await admin.waitForSelector('[data-testid="ann-admin"]');
await admin.click('[data-testid="poll-tab"]');
const a1 = admin.locator('[data-testid="poll-admin-item"]', { hasText: `${T} ankieta` });
check(/Głosujących: 1/.test(await a1.innerText()), "admin: liczba głosujących");
await a1.locator('[data-testid="poll-voters"] summary').click();
check(/drugi@example\.com: Więcej zadań/.test(await a1.innerText()), "admin: kto głosował (ankieta jawna)");
const a2 = admin.locator('[data-testid="poll-admin-item"]', { hasText: `${T} ukryte wyniki` });
check(await a2.locator('[data-testid="poll-voters"]').count() === 0, "admin: anonimowa bez listy głosujących");
check((await admin.request.patch(`${B}/api/admin/ankiety/${pid1}`, { data: { question: "zmiana", options: ["X", "Y"], published: true } })).status() === 409, "zmiana odpowiedzi po głosie → 409");
await a2.getByRole("button", { name: "Zamknij teraz" }).click(); await admin.waitForTimeout(800);
const after = (await (await user.request.get(`${B}/api/ogloszenia`)).json()).polls.find((p) => p.id === pid2);
check(after.closed && after.results && after.results.counts.join() === "1,0,1", `po zamknięciu wyniki widoczne (${JSON.stringify(after.results)})`);
check((await user.request.post(`${B}/api/ankiety/${pid2}/glos`, { data: { choices: [1] } })).status() === 409, "głos w zamkniętej → 409");
await admin.screenshot({ path: `${OUT}/ogloszenia-admin-390.png`, fullPage: true });
// 8. sprzątanie
const all = await (await admin.request.get(`${B}/api/admin/ogloszenia`)).json();
for (const a of all.announcements.filter((x) => x.title.startsWith(T))) check((await admin.request.delete(`${B}/api/admin/ogloszenia/${a.id}`)).status() === 200, "usunięcie ogłoszenia");
for (const p of all.polls.filter((x) => x.question.startsWith(T))) check((await admin.request.delete(`${B}/api/admin/ankiety/${p.id}`)).status() === 200, "usunięcie ankiety");
check((await admin.request.delete(`${B}/api/admin/ankiety/${pid1}`)).status() === 404, "ponowne usunięcie → 404");
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails, null, 1), JSON.stringify(errs.slice(0, 5)));
