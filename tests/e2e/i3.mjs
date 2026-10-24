// I3: bezpieczeństwo – regulamin i polityka bez logowania, rejestracja z wiekiem i zgodą rodzica, eksport danych, sesje
// i „wyloguj wszędzie”, usunięcie konta, weryfikacja dwuetapowa (TOTP + kody zapasowe), klucz dostępu (wirtualny
// uwierzytelniacz Chromium), dziennik działań admina; Google i Turnstile ukryte bez kluczy
import { chromium } from "playwright-core";
import { createHmac } from "node:crypto";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const stamp = Date.now().toString(36);
async function page(width = 390) {
  const c = await browser.newContext({ viewport: { width, height: 844 }, acceptDownloads: true });
  const p = await c.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("response", (r) => { if (r.status() >= 500) errs.push(`${r.status()} ${r.url()}`); });
  p.on("dialog", (d) => d.accept());
  return { c, p };
}
const api = async (p, url, method = "GET", data) => {
  const r = await p.request.fetch(`${B}${url}`, { method, data, headers: { origin: B } });
  return { status: r.status(), data: await r.json().catch(() => null) };
};
const noScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
// TOTP jak w aplikacji uwierzytelniającej
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const b32 = (s) => { let bits = 0, v = 0; const o = []; for (const c of s) { v = (v << 5) | B32.indexOf(c); bits += 5; if (bits >= 8) { o.push((v >>> (bits - 8)) & 255); bits -= 8; } } return Buffer.from(o); };
const totp = (secret, shift = 0) => {
  const m = Buffer.alloc(8); m.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + shift));
  const h = createHmac("sha1", b32(secret)).update(m).digest(); const o = h[19] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, "0");
};
async function login(p, email, password) {
  await p.goto(`${B}/konto/logowanie`);
  await p.fill('input[name="email"]', email); await p.fill('input[name="password"]', password);
  await p.click("form button.btn");
}

// 1. strony publiczne, stopka, brak Google i Turnstile bez kluczy
const X = await page();
await X.p.goto(`${B}/regulamin`);
check(await X.p.locator('[data-testid="terms"] h1').innerText() === "Regulamin", "/regulamin bez logowania");
await X.p.goto(`${B}/prywatnosc`);
check(/Polityka prywatności/.test(await X.p.locator('[data-testid="privacy"] h1').innerText()), "/prywatnosc bez logowania");
check(await noScroll(X.p), "polityka na telefonie bez poziomego przewijania");
const lr = await X.p.goto(`${B}/konto/logowanie`);
check(await X.p.locator('[data-testid="footer"] a[href="/regulamin"]').count() === 1, "stopka z regulaminem");
check(await X.p.locator('[data-testid="google-login"]').count() === 0, "bez kluczy Google – brak przycisku");
check(!/cloudflare/.test(lr.headers()["content-security-policy"] ?? ""), "CSP bez Turnstile, gdy wyłączony");
check((await X.p.request.get(`${B}/api/konto/google`, { maxRedirects: 0 })).status() === 404, "/api/konto/google → 404 bez kluczy");
check(await X.p.locator('[data-testid="passkey-login"]').count() === 1, "przycisk „Zaloguj kluczem dostępu”");

// 2. rejestracja osoby poniżej 16 lat: zgoda rodzica i jego e-mail
const emailB = `i3-uczen-${stamp}@example.com`, passB = "haslo-ucznia-i3";
await X.p.goto(`${B}/konto/rejestracja`);
check(await X.p.locator('[data-testid="turnstile"]').count() === 0, "bez kluczy Turnstile – brak widżetu");
await X.p.fill('input[name="email"]', emailB); await X.p.fill('input[name="password"]', passB); await X.p.fill('input[name="password2"]', passB);
await X.p.fill('input[name="birthYear"]', String(new Date().getFullYear() - 13));
await X.p.waitForSelector('[data-testid="parent-consent"]');
await X.p.check('input[name="terms"]'); await X.p.fill('input[name="parentEmail"]', `rodzic-${stamp}@example.com`);
await X.p.click("form button.btn"); await X.p.waitForSelector(".error");
check(/rodzica/.test(await X.p.locator(".error").innerText()), "poniżej 16 lat bez zgody → błąd");
await X.p.check('input[name="parentConsent"]');
await X.p.screenshot({ path: `${OUT}/i3_rejestracja_390.png`, fullPage: true });
check(await noScroll(X.p), "rejestracja na telefonie bez poziomego przewijania");
await X.p.click("form button.btn"); await X.p.waitForURL(/konto\/aktywacja/);
check(true, "konto osoby poniżej 16 lat założone");
check((await api(X.p, "/api/konto/rejestracja", "POST", { email: `i3-x-${stamp}@example.com`, password: "haslo-xxxxxxx" })).status === 400, "API bez roku urodzenia → 400");
const log = await (await import("node:fs/promises")).readFile(process.argv[3] ?? "/dev/null", "utf8").catch(() => "");
check(!process.argv[3] || log.includes(`rodzic-${stamp}@example.com`), "e-mail do rodzica (MAIL_TEST – w logu serwera)");

// 3. eksport danych (plik JSON do pobrania)
await X.p.goto(`${B}/konto/ustawienia`); await X.p.waitForSelector('[data-testid="usage"]');
check(await X.p.locator('[data-testid="usage"] tr').count() >= 5, "Twoje dane: zużycie limitów");
const [dl] = await Promise.all([X.p.waitForEvent("download"), X.p.click('[data-testid="export"]')]);
const exp = JSON.parse(await (await import("node:fs/promises")).readFile(await dl.path(), "utf8"));
check(/owe-moje-dane-\d{4}-\d\d-\d\d\.json/.test(dl.suggestedFilename()), `nazwa pliku eksportu: ${dl.suggestedFilename()}`);
check(exp.user.email === emailB && exp.user.parent_email === `rodzic-${stamp}@example.com` && exp.user.parent_consent_at && Array.isArray(exp.tests), "eksport: konto, zgoda rodzica, tabele");
check(!JSON.stringify(exp).includes("pass_hash") && !JSON.stringify(exp).includes("token_hash"), "eksport bez skrótów hasła i sesji");

// 4. sesje: drugie urządzenie, wylogowanie pozostałych
const Y = await page(1280);
await login(Y.p, emailB, passB); await Y.p.waitForURL(/konto\/aktywacja/);
await X.p.goto(`${B}/konto/ustawienia`); await X.p.waitForSelector('[data-testid="sessions"] li');
check(await X.p.locator('[data-testid="sessions"] li').count() === 2 && await X.p.locator('[data-testid="sessions"] li[data-current="1"]').count() === 1, "dwie sesje, bieżąca oznaczona");
await X.p.click('[data-testid="logout-everywhere"]'); await X.p.waitForTimeout(600);
check(await X.p.locator('[data-testid="sessions"] li').count() === 1, "po „Zakończ sesje na innych urządzeniach” – jedna");
check((await api(Y.p, "/api/konto/ja")).data.user === null, "drugie urządzenie wylogowane");

// 5. usunięcie konta: złe hasło, potem poprawne
await X.p.locator('[data-testid="delete-account"] summary').click();
await X.p.fill('input[name="delete-secret"]', "zle-haslo-123"); await X.p.fill('input[name="delete-confirm"]', "USUŃ");
await X.p.click('[data-testid="delete-submit"]'); await X.p.waitForSelector('[data-testid="delete-account"] .error');
check(/hasło/i.test(await X.p.locator('[data-testid="delete-account"] .error').innerText()), "złe hasło – konto zostaje");
await X.p.fill('input[name="delete-secret"]', passB);
await X.p.click('[data-testid="delete-submit"]'); await X.p.waitForURL(/konto\/logowanie/);
await login(Y.p, emailB, passB); await Y.p.waitForSelector(".error");
check(/nieprawidłowy|błędny/i.test(await Y.p.locator(".error").innerText()), "po usunięciu nie da się zalogować");

// 6. weryfikacja dwuetapowa na nowym koncie
const emailA = `i3-mfa-${stamp}@example.com`, passA = "haslo-mfa-i3-xx";
const Z = await page(1280);
await Z.p.goto(`${B}/konto/logowanie`);
check((await api(Z.p, "/api/konto/rejestracja", "POST", { email: emailA, password: passA, birthYear: 1999, terms: true })).status === 201, "konto przez API z rokiem i zgodą");
await Z.p.goto(`${B}/konto/ustawienia`); await Z.p.click('[data-testid="mfa-start"]');
await Z.p.waitForSelector('[data-testid="mfa-qr"] svg');
const secret = (await Z.p.locator('[data-testid="mfa-secret"]').innerText()).trim();
check(/^[A-Z2-7]{32}$/.test(secret), "kod QR i klucz do wpisania ręcznie");
await Z.p.fill('input[name="mfa-code"]', totp(secret) === "000000" ? "111111" : "000000".replace(/0/g, (_, i) => String((Number(totp(secret)[i]) + 1) % 10)));
await Z.p.click('[data-testid="mfa-enable"]'); await Z.p.waitForSelector('[data-testid="mfa-card"] .error');
check(true, "zły kod – weryfikacja nie włączona");
await Z.p.fill('input[name="mfa-code"]', totp(secret));
await Z.p.click('[data-testid="mfa-enable"]'); await Z.p.waitForSelector('[data-testid="mfa-backup"]');
const backup = (await Z.p.locator(".backup-codes").innerText()).trim().split(/\s+/);
check(backup.length === 8 && await Z.p.locator('[data-testid="mfa-card"]').getAttribute("data-enabled") === "1", `włączona, ${backup.length} kodów zapasowych`);
await Z.p.screenshot({ path: `${OUT}/i3_mfa_1280.png`, fullPage: false });
// logowanie: drugi krok
await Z.c.clearCookies();
await login(Z.p, emailA, passA); await Z.p.waitForSelector('[data-testid="mfa-step"]');
check((await api(Z.p, "/api/konto/ja")).data.user === null, "po haśle – jeszcze bez sesji");
await Z.p.fill('input[name="mfa"]', "123456"); await Z.p.click('[data-testid="mfa-step"] button'); await Z.p.waitForSelector('[data-testid="mfa-step"] .error');
check(true, "zły kod w drugim kroku → błąd");
await Z.p.fill('input[name="mfa"]', totp(secret, 1)); await Z.p.click('[data-testid="mfa-step"] button');
await Z.p.waitForURL((u) => !u.pathname.startsWith("/konto/logowanie"));
check((await api(Z.p, "/api/konto/ja")).data.user?.email === emailA, "kod z aplikacji → zalogowany");
// ten sam kod drugi raz (powtórzenie) – odrzucony; kod zapasowy działa raz
await Z.c.clearCookies();
let r = await api(Z.p, "/api/konto/logowanie", "POST", { email: emailA, password: passA });
check(r.data?.mfa === true && typeof r.data.ticket === "string", "API logowania zwraca bilet drugiego kroku");
check((await api(Z.p, "/api/konto/mfa/logowanie", "POST", { ticket: r.data.ticket, code: totp(secret, 1) })).status === 400, "powtórzony kod TOTP odrzucony");
check((await api(Z.p, "/api/konto/mfa/logowanie", "POST", { ticket: r.data.ticket, code: backup[0].toLowerCase() })).status === 200, "kod zapasowy (małe litery) działa");
await Z.c.clearCookies();
r = await api(Z.p, "/api/konto/logowanie", "POST", { email: emailA, password: passA });
check((await api(Z.p, "/api/konto/mfa/logowanie", "POST", { ticket: r.data.ticket, code: backup[0] })).status === 400, "zużyty kod zapasowy odrzucony");
for (let i = 0; i < 5; i++) await api(Z.p, "/api/konto/mfa/logowanie", "POST", { ticket: r.data.ticket, code: "000000" });
check((await api(Z.p, "/api/konto/mfa/logowanie", "POST", { ticket: r.data.ticket, code: backup[1] })).status >= 400, "po 5 złych kodach bilet unieważniony");
r = await api(Z.p, "/api/konto/logowanie", "POST", { email: emailA, password: passA });
check((await api(Z.p, "/api/konto/mfa/logowanie", "POST", { ticket: r.data.ticket, code: backup[1] })).status === 200, "nowy bilet – kod zapasowy");

// 7. klucz dostępu (wirtualny uwierzytelniacz)
const cdp = await Z.c.newCDPSession(Z.p);
await cdp.send("WebAuthn.enable");
await cdp.send("WebAuthn.addVirtualAuthenticator", { options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true } });
await Z.p.goto(`${B}/konto/ustawienia`); await Z.p.waitForSelector('[data-testid="passkey-add"]');
await Z.p.fill('input[name="passkey-name"]', "Laptop testowy"); await Z.p.click('[data-testid="passkey-add"]');
await Z.p.waitForSelector('[data-testid="passkeys"] li', { timeout: 10000 });
check(/Laptop testowy/.test(await Z.p.locator('[data-testid="passkeys"]').innerText()), "klucz dostępu dodany");
await Z.c.clearCookies();
await Z.p.goto(`${B}/konto/logowanie`); await Z.p.click('[data-testid="passkey-login"]');
await Z.p.waitForURL((u) => !u.pathname.startsWith("/konto/logowanie"), { timeout: 10000 });
check((await api(Z.p, "/api/konto/ja")).data.user?.email === emailA, "logowanie kluczem bez hasła");
await Z.p.goto(`${B}/konto/ustawienia`); await Z.p.waitForSelector('[data-testid="sessions"] li');
check(/klucz dostępu/.test(await Z.p.locator('[data-testid="sessions"] li[data-current="1"]').innerText()), "sesja oznaczona „klucz dostępu”");
await Z.p.click('[data-testid="passkey-delete"]'); await Z.p.waitForTimeout(600);
check(await Z.p.locator('[data-testid="passkeys"] li').count() === 0, "klucz usunięty");
// nowe kody zapasowe i wyłączenie MFA
r = await api(Z.p, "/api/konto/mfa/kody", "POST", { code: backup[2] });
check(r.status === 200 && r.data.backup.length === 8, "nowe kody zapasowe");
check((await api(Z.p, "/api/konto/mfa/wylacz", "POST", { password: passA, code: backup[3] })).status === 400, "stare kody nieważne po wymianie");
check((await api(Z.p, "/api/konto/mfa/wylacz", "POST", { password: "zle", code: r.data.backup[0] })).status === 400, "wyłączenie wymaga hasła");
check((await api(Z.p, "/api/konto/mfa/wylacz", "POST", { password: passA, code: r.data.backup[1] })).status === 200, "MFA wyłączona");
check((await api(Z.p, "/api/admin/dziennik")).status === 403, "dziennik admina – zwykłe konto 403");
check((await api(Z.p, "/api/konto/dane", "DELETE", { confirm: "USUŃ", password: passA })).status === 200, "sprzątanie: konto testowe usunięte");

// 8. dziennik działań admina
const O = await page(1280);
await login(O.p, "owner@example.com", "haslo-wlasciciela"); await O.p.waitForURL((u) => !u.pathname.startsWith("/konto"));
const an = await api(O.p, "/api/admin/ogloszenia", "POST", { title: `Test dziennika ${stamp}`, body: "x", published: false });
await api(O.p, `/api/admin/ogloszenia/${an.data?.id}`, "DELETE");
const dz = await api(O.p, "/api/admin/dziennik");
const acts = dz.data.log.filter((a) => a.target === `Test dziennika ${stamp}` || a.target === an.data?.id).map((a) => a.action);
check(acts.includes("ogloszenie-nowe") && acts.includes("ogloszenie-usuniete"), `dziennik: ${acts.join(", ")}`);
await O.p.goto(`${B}/admin`); await O.p.waitForSelector('[data-testid="audit-admin"] tr[data-action]');
check(await O.p.locator('[data-testid="audit-admin"] tr[data-action="ogloszenie-nowe"]').count() >= 1, "karta dziennika w panelu admina");

check(errs.length === 0, `błędy: ${errs.join(" | ")}`);
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails));
process.exit(fails.length ? 1 : 0);
