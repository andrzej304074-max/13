#!/bin/bash
# Pełna regresja e2e (Playwright) na lokalnym serwerze produkcyjnym – TYLKO na lokalnej bazie testowej:
# na początku czyści konta, ustawienia, limity i dziennik bezpieczeństwa.
#
# Wymagania: Postgres na localhost (baza `owe`, hasło `dev`), `npx next build` i serwer na porcie 3100:
#   DATABASE_URL=postgres://postgres:dev@localhost:5432/owe MAIL_TEST=1 APP_URL=http://localhost:3100 \
#     npx next start -p 3100 > next.log 2>&1 &
# Uruchomienie z katalogu repozytorium: bash tests/e2e/run.sh [katalog-na-zrzuty] [plik-logu-serwera]
# Chromium: zmienna CHROMIUM (domyślnie /opt/pw-browsers/chromium-1194/chrome-linux/chrome).
set -u
cd "$(dirname "$0")/../.."
OUT=${1:-/tmp/owe-e2e}; LOG=${2:-next.log}; mkdir -p "$OUT"
export PGPASSWORD=dev
PSQL="psql -h localhost -U postgres -d owe -q -c"
$PSQL "UPDATE tests SET user_id=NULL; UPDATE learn_sessions SET user_id=NULL; DELETE FROM flash_ratings; DELETE FROM users; DELETE FROM settings; DELETE FROM admin_codes; DELETE FROM code_failures; DELETE FROM password_resets;"
# limity i dziennik bezpieczeństwa (tabele mogą jeszcze nie istnieć przed pierwszym startem nowej wersji)
$PSQL "DO \$\$ BEGIN IF to_regclass('rate_hits') IS NOT NULL THEN DELETE FROM rate_hits; DELETE FROM security_events; END IF; END \$\$;"
run() { echo "== $1"; timeout 1500 node "tests/e2e/$1" "$OUT" "${@:2}" 2>&1 | grep -E "^FAIL|^OK|OK:|stron:|problem|błędów|fails|errors|BAD|Error" | tail -6; }
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
run authsweep.mjs
run security.mjs
run crawl.mjs
run playsample.mjs mikro-rynek-1,mikro-rynek-z1,makro-inflacja-z5,fin-obligacje-4,zarz-podstawy-z3,demo-teorie-1,pol-sektorowa-z3
