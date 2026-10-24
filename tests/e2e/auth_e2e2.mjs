import { chromium } from "playwright-core";
import fs from "node:fs";

const B = "http://localhost:3100";
const OUT = process.argv[2];
const LOG = process.argv[3];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const errors = [];
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? "OK   " : "FAIL ") + msg); if (!cond) fails++; };

async function ctx(name) {
  const c = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const p = await c.newPage();
  p.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  p.on("dialog", (d) => d.accept());
  p.on("console", (m) => m.type() === "error" && !/40[0-9]|429/.test(m.text()) && errors.push(`${name}: ${m.text()}`));
  return { c, p };
}
async function approveInPanel(admin, email, testid, label = "Zatwierdź") {
  await admin.goto(`${B}/admin`);
  await admin.waitForSelector("[data-testid=pending]");

  await admin.click(`[data-testid=${testid}]:has-text("${email}") button:has-text("${label}")`);
  await admin.waitForTimeout(900);
}
const fill = async (p, name, v) => p.fill(`input[name="${name}"]`, v);
// rejestracja (I3): rok urodzenia i akceptacja regulaminu
const consent = async (p, year = "2000") => { await fill(p, "birthYear", year); await p.check('input[name="terms"]'); };
const submit = async (p) => { await p.click("form button.btn"); await p.waitForTimeout(900); };
const api = (p, url, method = "GET", body) => p.evaluate(async ([url, method, body]) => {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}, [url, method, body]);

// 1. bez konta
const A = await ctx("A");
await A.p.goto(`${B}/stats`);
ok(A.p.url().includes("/konto/logowanie"), "bez konta /stats → logowanie");

// 2. pierwsze konto = właściciel, admin, przejmuje stare dane
await A.p.goto(`${B}/konto/rejestracja`);
await fill(A.p, "email", "Owner@Example.com");
await fill(A.p, "password", "haslo-wlasciciela");
await fill(A.p, "password2", "haslo-wlasciciela");
await consent(A.p);
await submit(A.p);
await A.p.waitForURL(`${B}/`);
ok(true, "pierwsze konto bez kodu → strona główna");
let r = await api(A.p, "/api/konto/ja");
ok(r.data.user.isAdmin && r.data.user.isOwner && r.data.user.active, "pierwsze konto: admin, właściciel, aktywne");
r = await api(A.p, "/api/stats");
ok(r.data.overall.tests > 0, `właściciel widzi stare testy (${r.data.overall.tests})`);
r = await api(A.p, "/api/nauka/progress");
ok(r.data.summary.sessions > 0, `właściciel widzi stary postęp nauki (${r.data.summary.sessions} sesji)`);
await A.p.goto(`${B}/admin`);
await A.p.click("text=Generuj kod");
await A.p.waitForTimeout(800);
const code = (await A.p.textContent("[data-testid=activation-code]")).trim();
ok(/^\d{5}$/.test(code), `kod aktywacji wygenerowany: ${code}`);
await A.p.screenshot({ path: `${OUT}/admin.png`, fullPage: true });

// 3. drugie konto bez kodu → aktywacja; złe kody → blokada
const Bc = await ctx("B");
await Bc.p.goto(`${B}/konto/rejestracja`);
await fill(Bc.p, "email", "uczen@example.com");
await fill(Bc.p, "password", "haslo-ucznia1");
await fill(Bc.p, "password2", "haslo-ucznia1");
await consent(Bc.p);
await submit(Bc.p);
await Bc.p.waitForURL(/konto\/aktywacja/);
ok(true, "drugie konto bez kodu → aktywacja");
await Bc.p.goto(`${B}/nauka`);
ok(Bc.p.url().includes("/konto/aktywacja"), "nieaktywne konto: /nauka → aktywacja");
r = await api(Bc.p, "/api/stats");
ok(r.status === 403, "nieaktywne konto: API 403");
const wrong = code === "00000" ? "11111" : "00000";
for (let i = 0; i < 5; i++) r = await api(Bc.p, "/api/konto/aktywacja", "POST", { code: wrong });
ok(r.status === 400 && /15 min/.test(r.data.error), `5 złych kodów → blokada (${r.data.error})`);
r = await api(Bc.p, "/api/konto/aktywacja", "POST", { code });
ok(r.status === 429, "w czasie blokady nawet dobry kod odrzucony");
await Bc.c.close();

// 3b. trzecie konto z dobrym kodem przy rejestracji
const C = await ctx("C");
await C.p.goto(`${B}/konto/rejestracja`);
await fill(C.p, "email", "drugi@example.com");
await fill(C.p, "password", "haslo-drugiego");
await fill(C.p, "password2", "haslo-drugiego");
await consent(C.p);
await fill(C.p, "code", code);
await submit(C.p);
await C.p.waitForURL(/konto\/aktywacja/);
ok(await C.p.isVisible("[data-testid=waiting]"), "rejestracja z dobrym kodem → czeka na zatwierdzenie");
r = await api(C.p, "/api/stats");
ok(r.status === 403, "przed zatwierdzeniem API 403");
await C.p.goto(`${B}/nauka`);
ok(C.p.url().includes("/konto/aktywacja"), "przed zatwierdzeniem /nauka → aktywacja");
await A.p.goto(`${B}/admin`);
await A.p.waitForSelector("[data-testid=pending-user]");
await A.p.screenshot({ path: `${OUT}/pending.png`, fullPage: true });
await approveInPanel(A.p, "drugi@example.com", "pending-user");
await C.p.goto(`${B}/nauka`);
ok(C.p.url().endsWith("/nauka"), "po zatwierdzeniu w panelu – dostęp");
// odrzucenie nowego konta
const H = await ctx("H");
await H.p.goto(`${B}/konto/rejestracja`);
await fill(H.p, "email", "odrzucony@example.com");
await fill(H.p, "password", "haslo-odrzuc");
await fill(H.p, "password2", "haslo-odrzuc");
await consent(H.p);
await fill(H.p, "code", code);
await submit(H.p);
await approveInPanel(A.p, "odrzucony@example.com", "pending-user", "Odrzuć");
r = await api(H.p, "/api/konto/ja");
ok(r.data.user === null, "odrzucone konto usunięte");
r = await api(C.p, "/api/stats");
ok(r.data.overall.tests === 0, "nowe konto ma puste statystyki");
const ownerTest = (await api(A.p, "/api/stats")).data.history.at(-1).id;
r = await api(C.p, `/api/tests/${ownerTest}`);
ok(r.status === 404, "cudzy test → 404");
r = await api(C.p, `/api/stats?user=${(await api(A.p, "/api/konto/ja")).data.user.id}`);
ok(r.status === 403, "zwykły użytkownik nie podgląda cudzych statystyk");
await C.p.goto(`${B}/admin`);
ok(!C.p.url().includes("/admin"), "zwykły użytkownik: /admin → przekierowanie");
// test i lekcja na nowym koncie
r = await api(C.p, "/api/tests", "POST", { type: "single", count: 30 });
ok(r.status === 201, "nowe konto tworzy test");
await C.p.goto(`${B}/nauka/lekcja/${Object.keys(JSON.parse(fs.readFileSync("./data/nauka/course.json", "utf8")).lessons)[0]}?sub=1`);
await C.p.waitForSelector(".learn, .learn-end", { timeout: 15000 });
ok(true, "nowe konto otwiera lekcję");

// 4. kod admina
await A.p.goto(`${B}/admin`);
await A.p.click("text=Generuj kod administratora");
await A.p.waitForTimeout(800);
const adminCode = (await A.p.textContent("[data-testid=admin-code]")).trim();
ok(/^[A-Z0-9]{8}$/.test(adminCode), `kod admina: ${adminCode}`);
await C.p.goto(`${B}/konto/ustawienia`);
await C.p.fill('input[name="admincode"]', adminCode);
await C.p.click("text=Zostań administratorem");
await C.p.waitForSelector("[data-testid=admin-waiting]", { timeout: 10000 });
ok(true, "kod admina → prośba czeka");
await C.p.goto(`${B}/admin`);
ok(!C.p.url().includes("/admin"), "przed zatwierdzeniem /admin niedostępny");
await approveInPanel(A.p, "drugi@example.com", "pending-admin");
await C.p.goto(`${B}/admin`);
ok(C.p.url().includes("/admin"), "po zatwierdzeniu drugie konto jest adminem");
await C.p.screenshot({ path: `${OUT}/admin2.png`, fullPage: true });
const D = await ctx("D");
await D.p.goto(`${B}/konto/rejestracja`);
await fill(D.p, "email", "trzeci@example.com");
await fill(D.p, "password", "haslo-trzeciego");
await fill(D.p, "password2", "haslo-trzeciego");
await consent(D.p);
await fill(D.p, "code", code);
await submit(D.p);
await approveInPanel(C.p, "trzeci@example.com", "pending-user");
r = await api(D.p, "/api/konto/admin-kod", "POST", { code: adminCode });
ok(r.status === 400, "zużyty kod admina odrzucony");
await A.p.goto(`${B}/admin`);
await A.p.click("text=Generuj kod administratora");
await A.p.waitForTimeout(800);
const adminCode2 = (await A.p.locator("[data-testid=admin-code]").first().textContent()).trim();
r = await api(D.p, "/api/konto/admin-kod", "POST", { code: adminCode2 });
ok(r.status === 200 && r.data.adminPending, "trzecie konto prosi o admina");
await approveInPanel(A.p, "trzeci@example.com", "pending-admin", "Odrzuć");
r = await api(D.p, "/api/konto/ja");
ok(!r.data.user.isAdmin && !r.data.user.adminPending, "odrzucona prośba – zostaje użytkownikiem");
await A.p.goto(`${B}/admin`);
ok((await A.p.textContent("[data-testid=admins]")).includes("drugi@example.com") && (await A.p.textContent("[data-testid=users]")).includes("trzeci@example.com"), "osobne listy adminów i użytkowników");

// 5. podgląd i usuwanie
const users = (await api(C.p, "/api/admin/uzytkownicy")).data;
const owner = users.find((u) => u.isOwner), third = users.find((u) => u.email === "trzeci@example.com");
r = await api(C.p, `/api/stats?user=${owner.id}`);
ok(r.status === 200 && r.data.overall.tests > 0, "drugi admin podgląda statystyki właściciela");
await C.p.goto(`${B}/nauka?user=${owner.id}`);
await C.p.waitForSelector(".preview-banner");
await C.p.waitForTimeout(800);
ok((await C.p.textContent(".preview-banner")).includes("owner@example.com"), "pasek podglądu z e-mailem");
await C.p.screenshot({ path: `${OUT}/preview.png`, fullPage: false });
r = await api(C.p, `/api/admin/uzytkownicy/${owner.id}`, "DELETE");
ok(r.status === 400, "właściciela nie da się usunąć");
r = await api(C.p, `/api/admin/uzytkownicy/${third.id}`, "DELETE");
ok(r.status === 200, "admin usuwa zwykłe konto");
r = await api(D.p, "/api/konto/ja");
ok(r.data.user === null, "sesja usuniętego konta wygasła");

// 5b. odbieranie roli
r = await api(C.p, `/api/admin/uzytkownicy/${owner.id}/odbierz-admina`, "POST");
ok(r.status === 400, "właścicielowi nie da się odebrać admina");
await A.p.goto(`${B}/admin`);

await A.p.click('[data-testid=admins] tr:has-text("drugi@example.com") button:has-text("Odbierz admina")');
await A.p.waitForTimeout(900);
ok((await A.p.textContent("[data-testid=users]")).includes("drugi@example.com"), "odebrany admin na liście użytkowników");
r = await api(C.p, "/api/admin/uzytkownicy");
ok(r.status === 403, "po odebraniu roli panel niedostępny od razu");

// 6. reset hasła mailem
const E = await ctx("E");
await E.p.goto(`${B}/konto/reset`);
await fill(E.p, "email", "drugi@example.com");
await submit(E.p);
ok((await E.p.textContent("body")).includes("wysłaliśmy"), "prośba o reset → komunikat");
await E.p.waitForTimeout(500);
const link = [...fs.readFileSync(LOG, "utf8").matchAll(/http:\/\/localhost:3100\/konto\/reset\/[\w-]+/g)].at(-1)[0];
await E.p.goto(link);
await fill(E.p, "password", "nowe-haslo-123");
await fill(E.p, "password2", "nowe-haslo-123");
await submit(E.p);
await E.p.waitForURL(`${B}/`);
ok(true, "nowe hasło ustawione z linku");
r = await api(C.p, "/api/konto/ja");
ok(r.data.user === null, "stare sesje wylogowane po resecie");
await E.p.goto(link);
await fill(E.p, "password", "jeszcze-inne-1");
await fill(E.p, "password2", "jeszcze-inne-1");
await submit(E.p);
ok((await E.p.textContent("body")).includes("wygasł albo został już użyty"), "link resetu jednorazowy");
const F = await ctx("F");
await F.p.goto(`${B}/konto/logowanie`);
r = await api(F.p, "/api/konto/logowanie", "POST", { email: "drugi@example.com", password: "haslo-drugiego" });
ok(r.status === 401, "stare hasło nie działa");
r = await api(F.p, "/api/konto/logowanie", "POST", { email: "drugi@example.com", password: "nowe-haslo-123" });
ok(r.status === 200, "logowanie nowym hasłem");

// 7. zmiana kodu aktywacji
await A.p.goto(`${B}/admin`);

await A.p.click("text=Generuj nowy");
await A.p.waitForTimeout(800);
const code2 = (await A.p.textContent("[data-testid=activation-code]")).trim();
ok(code2 !== code, `nowy kod aktywacji: ${code2}`);
r = await api(F.p, "/api/stats");
ok(r.status === 200, "istniejące konto działa po zmianie kodu");
const G = await ctx("G");
await G.p.goto(`${B}/konto/logowanie`);
r = await api(G.p, "/api/konto/rejestracja", "POST", { email: "g@example.com", password: "haslo-gggggg", code, birthYear: 2000, terms: true });
ok(r.status === 422, "stary kod nie aktywuje nowego konta");
r = await api(G.p, "/api/konto/aktywacja", "POST", { code: code2 });
ok(r.status === 200 && r.data.pending === "approval", "nowy kod przyjęty – czeka na zatwierdzenie");

// wylogowanie
await A.p.goto(`${B}/konto/ustawienia`);
await A.p.click("button.btn.secondary:has-text('Wyloguj')");
await A.p.waitForURL(/konto\/logowanie/);
ok(true, "wylogowanie");
await A.p.screenshot({ path: `${OUT}/login.png` });

console.log("FAILS:", fails, "errors:", errors);
await browser.close();
