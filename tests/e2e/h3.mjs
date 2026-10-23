// H3: „Tylko moje błędy” – błędna odpowiedź trafia do puli, poprawna ją usuwa; przycisk „Powtórz błędy”
import { chromium } from "playwright-core";
import fs from "node:fs";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const Q = {};
for (const f of fs.readdirSync("./data/questions").filter((f) => f.endsWith(".json"))) for (const q of JSON.parse(fs.readFileSync("./data/questions/" + f))) Q[q.id] = q;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const p = await (await browser.newContext({ viewport: { width: 390, height: 900 } })).newPage();
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(`${B}/konto/logowanie`);
await p.fill('input[name="email"]', "drugi@example.com"); await p.fill('input[name="password"]', "nowe-haslo-123");
await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
const post = async (u, d) => (await p.request.post(`${B}${u}`, { data: d })).json();
const pula = async () => (await post("/api/tests/pula", { bank: "mix", sources: ["owe"], mistakes: true })).single;
// 1. błędna odpowiedź na pytanie z Archiwum → w puli błędów
const t = await post("/api/tests", { bank: "owe", type: "single", count: "endless", edFrom: 39, edTo: 39 });
const q = t.questions[0];
const before = await pula();
await post(`/api/tests/${t.id}/answer`, { questionId: q.id, selected: [(Q[q.id].correct[0] + 1) % 4] });
await post(`/api/tests/${t.id}/finish`);
const after = await pula();
check(after === before + 1 || after >= 1, `pula błędów: ${before} → ${after}`);
// 2. test „tylko moje błędy” (zawężony do edycji i etapu tego pytania – starsze błędy konta nie wypychają go z puli)
const [, ed, st] = /^owe(\d+)-([soc])-/.exec(q.id) ?? [];
const narrow = { bank: "mix", type: "single", count: 50, sources: ["owe"], edFrom: Number(ed), edTo: Number(ed), stages: [st], mistakes: true };
const m = await post("/api/tests", narrow);
check(m.questions?.some((x) => x.id === q.id), `pytanie z błędem w teście błędów (${m.questions?.length})`);
// 3. poprawna odpowiedź usuwa z puli
await post(`/api/tests/${m.id}/answer`, { questionId: q.id, selected: [Q[q.id].correct[0]] });
await post(`/api/tests/${m.id}/finish`);
const r2 = await p.request.post(`${B}/api/tests`, { data: narrow });
const m2 = r2.ok() ? await r2.json() : { questions: [] };
check(!m2.questions.some((x) => x.id === q.id), "po poprawnej odpowiedzi pytanie wypada z puli");
if (r2.ok()) await post(`/api/tests/${m2.id}/finish`);
// 4. UI: link „Powtórz błędy” włącza przełącznik
await p.goto(`${B}/stats`); await p.waitForSelector('[data-testid="retry-mistakes"]');
await p.click('[data-testid="retry-mistakes"]'); await p.waitForURL(/\/testy\/wszystkie\?bledy=1/); await p.waitForSelector('[data-testid="mistakes"]');
await p.waitForTimeout(800);
check(await p.locator('[data-testid="mistakes"]').getAttribute("aria-pressed") === "true", "„Powtórz błędy” włącza „Tylko moje błędy”");
check(/do powtórki/.test(await p.locator('[data-testid="mistakes"]').innerText()), "liczba pytań do powtórki");
await p.screenshot({ path: `${OUT}/h3_mistakes_390.png` });
check(errs.length === 0, `błędy strony: ${errs.join(" | ")}`);
console.log(`OK: ${ok} błędów: ${fails.length}`, fails);
await browser.close(); process.exit(fails.length ? 1 : 0);
