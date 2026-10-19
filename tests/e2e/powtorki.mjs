import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
const B = "http://localhost:3100";
const c = JSON.parse(readFileSync("./data/nauka/course.json", "utf8"));
let ok = 0; const fails = [];
const check = (v, m) => (v ? ok++ : fails.push(m));
const sql = (q) => execSync(`PGPASSWORD=dev psql -h localhost -U postgres -d owe -tAq -c ${JSON.stringify(q)}`).toString().trim();
// lekcja z kilkoma wcześniejszymi lekcjami w temacie; słabe hasło = hasło wcześniejszej lekcji spoza tej lekcji
const units = c.units.filter((u) => u.topic === "makro");
const order = units.flatMap((u) => u.lessons).filter((id) => c.lessons[id].type !== "zrozum");
const L = order[6], lesson = c.lessons[L];
const own = new Set([...lesson.items, ...(lesson.extra ?? []), ...(lesson.review ?? [])]);
const W = order.slice(0, 6).flatMap((id) => c.lessons[id].items).find((i) => !own.has(i) && c.items[i].kind !== "zrozumienie");
const uid = sql("SELECT id FROM users WHERE email = 'drugi@example.com'");
sql(`DELETE FROM learn_sessions WHERE user_id = '${uid}' AND lesson = 'e2e-powtorki'`);
const sid = sql(`INSERT INTO learn_sessions (topic, unit, lesson, sub, kind, user_id, finished_at, total) VALUES ('makro','e2e','e2e-powtorki',3,'pojecie','${uid}',now(),4) RETURNING id`).split("\n")[0];
for (let i = 0; i < 4; i++) sql(`INSERT INTO learn_answers (session_id, seq, item_id, item_kind, exercise, correct, ms) VALUES ('${sid}', ${i}, '${W}', '${c.items[W].kind}', 'wybor', false, 3000)`);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${B}/konto/logowanie`);
await page.fill('input[name="email"]', "drugi@example.com"); await page.fill('input[name="password"]', "nowe-haslo-123");
await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"));
for (const sub of [2, 3]) {
  const html = await (await page.request.get(`${B}/nauka/lekcja/${L}?sub=${sub}`)).text();
  const r = html.indexOf("repeatRanked"), rep = html.search(/repeat\\?":\[/);
  check(r > 0, `${L}/${sub}: powtórki dobrane wg wyników użytkownika`);
  check(rep > 0 && html.indexOf(W, rep) > rep && html.indexOf(W, rep) < rep + 400, `${L}/${sub}: słabe hasło „${c.items[W].s}” pierwsze w powtórkach`);
}
// sub 1 i 4: bez personalizacji
const h1 = await (await page.request.get(`${B}/nauka/lekcja/${L}?sub=1`)).text();
check(!h1.includes("repeatRanked"), "Poznaj bez personalizacji powtórek");
// lekcja działa w przeglądarce
await page.goto(`${B}/nauka/lekcja/${L}?sub=3`); await page.waitForSelector(".learn-card, .learn-ex, [data-testid=learn-exercise], main h1", { timeout: 15000 });
check(!errs.length, `bez błędów strony (${errs.join("; ")})`);
sql(`DELETE FROM learn_sessions WHERE id = '${sid}'`);
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails, null, 1), `lekcja ${L}, słabe hasło ${W}`);
