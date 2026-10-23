// G10: Podręcznik – „Czytaj następną lekcję →” (także przez granicę działu), „Czytaj dalej” na końcu działu, wykresy w artykułach.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const book = JSON.parse(readFileSync("data/nauka/podrecznik.json", "utf8")).units;
const course = JSON.parse(readFileSync("data/nauka/course.json", "utf8"));
const units = course.units.map((u) => u.id).filter((id) => book[id]?.chapters.length);
const [U1, U2] = units;
const chs = book[U1].chapters;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const errs = [];
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const page = await ctx.newPage();
page.on("pageerror", (e) => errs.push(e.message));
await page.goto(`${B}/konto/logowanie`);
await page.fill('input[name="email"]', "drugi@example.com"); await page.fill('input[name="password"]', "nowe-haslo-123");
await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"));

// w dziale: następny rozdział
await page.goto(`${B}/nauka/podrecznik/${U1}/${chs[0].lesson}`);
const n1 = page.locator('[data-testid="read-next"]');
check((await n1.getAttribute("href")) === `/nauka/podrecznik/${U1}/${chs[1].lesson}`, "następna lekcja w tym samym dziale");
check((await n1.innerText()).includes("Czytaj następną lekcję"), "napis „Czytaj następną lekcję”");
// ostatni rozdział działu → pierwszy rozdział następnego działu
await page.goto(`${B}/nauka/podrecznik/${U1}/${chs.at(-1).lesson}`);
const n2 = page.locator('[data-testid="read-next"]');
check((await n2.getAttribute("href")) === `/nauka/podrecznik/${U2}/${book[U2].chapters[0].lesson}`, "po ostatnim rozdziale – następny dział");
check(/Następny dział/.test(await n2.innerText()), "oznaczenie nowego działu");
await n2.click(); await page.waitForURL(new RegExp(`/podrecznik/${U2}/`));
check(true, "przejście działa");
// artykuł działu → następny dział
await page.goto(`${B}/nauka/podrecznik/${U1}`);
check((await page.locator('[data-testid="read-next-unit"]').getAttribute("href")) === `/nauka/podrecznik/${U2}`, "artykuł działu – czytaj dalej");
check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "telefon: bez poziomego przewijania");

// wykresy: każdy blok „g” w danych renderuje się jako SVG
const withGraph = [];
for (const [uid, u] of Object.entries(book)) for (const c of u.chapters) if (c.blocks.some((b) => b.fig)) withGraph.push([uid, c.lesson, c.blocks.filter((b) => b.fig).length]);
if (withGraph.length) {
  for (const [uid, l, n] of withGraph.slice(0, 12)) {
    await page.goto(`${B}/nauka/podrecznik/${uid}/${l}`);
    await page.waitForSelector('[data-testid="reader-body"]');
    const got = await page.locator('[data-testid="reader-body"] figure.book-fig svg').count();
    check(got === n, `${uid}/${l}: wykresy ${got}/${n}`);
  }
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "wykres: bez poziomego przewijania");
}

// podkreślenie sprzed zmiany tekstu rozdziału jest ukryte (z informacją), nowsze zostaje
const changedCh = Object.entries(book).flatMap(([uid, u]) => u.chapters.filter((c) => c.ch > "2001").map((c) => [uid, c.lesson, c.ch]))[0];
if (changedCh) {
  const [uid, l, ch] = changedCh;
  const sql = (q) => execFileSync("psql", ["-h", "localhost", "-U", "postgres", "-d", "owe", "-qtAc", q], { env: { ...process.env, PGPASSWORD: "dev" } }).toString().trim();
  const uidUser = sql("SELECT id FROM users WHERE email = 'drugi@example.com'");
  sql(`DELETE FROM highlights WHERE user_id = '${uidUser}' AND article = '${uid}:${l}'`);
  sql(`INSERT INTO highlights (user_id, article, block, start_at, end_at, color, created_at) VALUES ('${uidUser}', '${uid}:${l}', 0, 0, 5, 'y', '${ch}'::timestamptz - interval '1 day'), ('${uidUser}', '${uid}:${l}', 0, 0, 5, 'g', '${ch}'::timestamptz + interval '1 second')`);
  await page.goto(`${B}/nauka/podrecznik/${uid}/${l}`);
  await page.waitForSelector('[data-testid="reader-body"]');
  check(/1 podkreślenie z poprzedniej wersji/.test(await page.locator('[data-testid="hl-stale"]').innerText().catch(() => "")), `${l}: informacja o ukrytym podkreśleniu`);
  check(await page.locator('[data-testid="reader-body"] mark').count() === 1, `${l}: widoczne tylko nowsze podkreślenie (${await page.locator('[data-testid="reader-body"] mark').count()})`);
  sql(`DELETE FROM highlights WHERE user_id = '${uidUser}' AND article = '${uid}:${l}'`);
}

await browser.close();
console.log(fails.length ? "BŁĘDY:" : "OK:", ok, "błędów:", fails.length, fails, `rozdziały z wykresami: ${withGraph.length}`, errs.length ? `pageerror: ${errs}` : "");
process.exit(fails.length ? 1 : 0);
