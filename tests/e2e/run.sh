#!/bin/bash
# Pełna regresja e2e (Playwright) na lokalnym serwerze produkcyjnym – TYLKO na lokalnej bazie testowej:
# na początku czyści konta, ustawienia, limity i dziennik bezpieczeństwa.
#
# Wymagania: Postgres na localhost (baza `owe`, hasło `dev`), `npx next build` i serwer na porcie 3100:
#   DATABASE_URL=postgres://postgres:dev@localhost:5432/owe MAIL_TEST=1 ADMIN_MFA=optional APP_URL=http://localhost:3100 \
#     npx next start -p 3100 > next.log 2>&1 &
# Uruchomienie z katalogu repozytorium: bash tests/e2e/run.sh [katalog-na-zrzuty] [plik-logu-serwera]
# ADMIN_MFA=optional – skrypty logują się do panelu admina bez weryfikacji dwuetapowej (sam wymóg sprawdza vitest: tests/auth-security.test.ts).
# Chromium: zmienna CHROMIUM (domyślnie /opt/pw-browsers/chromium-1194/chrome-linux/chrome).
set -u
cd "$(dirname "$0")/../.."
OUT=${1:-/tmp/owe-e2e}; LOG=${2:-next.log}; mkdir -p "$OUT"
export PGPASSWORD=dev
PSQL="psql -h localhost -U postgres -d owe -q -c"
$PSQL "UPDATE tests SET user_id=NULL; UPDATE learn_sessions SET user_id=NULL; DELETE FROM flash_ratings; DELETE FROM users; DELETE FROM settings; DELETE FROM admin_codes; DELETE FROM code_failures; DELETE FROM password_resets;"
# limity i dziennik bezpieczeństwa (tabele mogą jeszcze nie istnieć przed pierwszym startem nowej wersji)
$PSQL "DO \$\$ BEGIN IF to_regclass('rate_hits') IS NOT NULL THEN DELETE FROM rate_hits; DELETE FROM security_events; END IF; END \$\$;"
# zapisane filtry (user_prefs) czyszczone przed każdym skryptem – skrypty zaczynają od domyślnych filtrów
run() { echo "== $1"; $PSQL "DO \$\$ BEGIN IF to_regclass('user_prefs') IS NOT NULL THEN DELETE FROM user_prefs; END IF; END \$\$;" >/dev/null; timeout 1500 node "tests/e2e/$1" "$OUT" "${@:2}" 2>&1 | grep -E "^FAIL|^OK|OK:|stron:|problem|błędów|fails|errors|BAD|Error" | tail -6; }
# kolejność ma znaczenie: auth_e2e2 zakłada konta (właściciel, drugi), na których pracują pozostałe skrypty
run auth_e2e2.mjs "$LOG"
run tests_ui.mjs
run nav.mjs
run feat.mjs
run verify.mjs
run notes.mjs
run book.mjs
run decks.mjs
run mapa.mjs
run bar.mjs
run endless.mjs
run access.mjs
run speech.mjs
run feed.mjs
run own.mjs
run back.mjs
run resume.mjs
run notecard.mjs
run stars.mjs
run stage.mjs
run offline.mjs
run bugs.mjs
run olimpiada.mjs
run otwarte.mjs
run haslo.mjs
run ogloszenia.mjs
run powtorki.mjs
run probes.mjs
run g1.mjs
run g2.mjs
run g4.mjs
run g5.mjs
run g6.mjs
run g7.mjs
run g10.mjs
run g11.mjs
# bugs.mjs wyczerpuje dzienny limit zgłoszeń konta „drugi” – g12 wysyła własne
$PSQL "DELETE FROM bug_reports WHERE text LIKE 'limit % test zgłoszenia'" >/dev/null
run g12.mjs
run g14.mjs
run h1.mjs
run h2.mjs
run h3.mjs
run h4.mjs
run h5.mjs
run h6.mjs
run h7.mjs
run i1.mjs
run i2.mjs
run i3.mjs "$LOG"
run i4.mjs
run options.mjs
run authsweep.mjs
run security.mjs
run crawl.mjs
run playsample.mjs mikro-rynek-1,mikro-rynek-z1,makro-inflacja-z5,fin-obligacje-4,zarz-podstawy-z3,demo-teorie-1,pol-sektorowa-z3
