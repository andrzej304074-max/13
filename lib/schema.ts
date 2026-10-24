import xlIds from "@/data/slownik/xl-ids.json";

/**
 * Plan IV: pytania o hasło XL pisane w aplikacji to osobne źródło – ich id zmieniły się z `sl-…` na `xl-…`
 * (tools/slownik/wydziel_xl.py). Jednorazowo przenosimy stare id w odpowiedziach, testach i brudnopisach pytań oraz
 * ustawienia formularza testu z dawnych zakładek na wspólny klucz `testy`.
 */
const XL_OLD = (xlIds as string[]).map((id) => `'sl-${id.slice(3)}'`).join(",");
const XL_MIGRATION = `
DO $xl$ DECLARE ids text[] := ARRAY[${XL_OLD}]::text[]; BEGIN
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'xl_ids') THEN
    UPDATE answers SET question_id = 'xl-' || substr(question_id, 4) WHERE question_id = ANY(ids);
    UPDATE tests SET question_ids = ARRAY(
      SELECT CASE WHEN x = ANY(ids) THEN 'xl-' || substr(x, 4) ELSE x END FROM unnest(question_ids) WITH ORDINALITY u(x, o) ORDER BY o)
    WHERE question_ids && ids;
    UPDATE notes SET ref = 'xl:xl-' || substr(ref, 12) WHERE kind = 'scratch' AND ref LIKE 'slownik:sl-%' AND substr(ref, 9) = ANY(ids);
    INSERT INTO user_prefs (user_id, key, value) SELECT user_id, 'testy', value FROM user_prefs WHERE key = 'testy-mix' ON CONFLICT DO NOTHING;
    INSERT INTO user_prefs (user_id, key, value) SELECT user_id, 'testy', value FROM user_prefs WHERE key = 'testy-owe' ON CONFLICT DO NOTHING;
    INSERT INTO user_prefs (user_id, key, value) SELECT user_id, 'testy', value FROM user_prefs WHERE key = 'testy-slownik' ON CONFLICT DO NOTHING;
    INSERT INTO settings (key, value) VALUES ('xl_ids', 'v1');
  END IF;
END $xl$;
`;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS tests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text NOT NULL CHECK (type IN ('single', 'multi')),
  question_ids text[] NOT NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  deadline     timestamptz NOT NULL,
  finished_at  timestamptz,
  score        double precision NOT NULL DEFAULT 0,
  max_score    double precision NOT NULL
);

CREATE TABLE IF NOT EXISTS answers (
  test_id     uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  selected    int[] NOT NULL,
  points      double precision NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (test_id, question_id)
);

CREATE INDEX IF NOT EXISTS tests_finished_idx ON tests (finished_at);

-- Tryb „bez limitu”: brak terminu, wynik liczony tylko z odpowiedzianych/pominiętych pytań.
ALTER TABLE tests ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'timed';
ALTER TABLE tests ALTER COLUMN deadline DROP NOT NULL;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS skipped boolean NOT NULL DEFAULT false;

-- Osobna baza pytań ze słownika pojęć – własne testy i statystyki.
ALTER TABLE tests ADD COLUMN IF NOT EXISTS bank text NOT NULL DEFAULT 'owe';
-- Test „bez limitu”: filtr losowania (pytania dolosowywane porcjami, żeby nie zapisywać całej puli w wierszu).
ALTER TABLE tests ADD COLUMN IF NOT EXISTS draw jsonb;
CREATE INDEX IF NOT EXISTS tests_bank_idx ON tests (bank);

-- Zakładka „Nauka”: sesje pod-lekcji i odpowiedzi w ćwiczeniach.
CREATE TABLE IF NOT EXISTS learn_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic       text NOT NULL,
  unit        text NOT NULL,
  lesson      text NOT NULL,
  sub         int NOT NULL,
  kind        text NOT NULL,
  level       int NOT NULL DEFAULT 0,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms int,
  correct     int NOT NULL DEFAULT 0,
  total       int NOT NULL DEFAULT 0,
  xp          int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS learn_sessions_finished_idx ON learn_sessions (finished_at);
CREATE INDEX IF NOT EXISTS learn_sessions_lesson_idx ON learn_sessions (lesson);

CREATE TABLE IF NOT EXISTS learn_answers (
  session_id  uuid NOT NULL REFERENCES learn_sessions(id) ON DELETE CASCADE,
  seq         int NOT NULL,
  item_id     text NOT NULL,
  item_kind   text NOT NULL,
  exercise    text NOT NULL,
  correct     boolean NOT NULL,
  ms          int NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, seq)
);
CREATE INDEX IF NOT EXISTS learn_answers_item_idx ON learn_answers (item_id);

-- Konta użytkowników. Pierwsze konto (is_owner) jest adminem, nie można go usunąć i przejęło dane sprzed kont.
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  pass_hash     text NOT NULL,
  is_admin      boolean NOT NULL DEFAULT false,
  is_owner      boolean NOT NULL DEFAULT false,
  activated_at  timestamptz,
  failed_codes  int NOT NULL DEFAULT 0,
  locked_until  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS users_one_owner_idx ON users (is_owner) WHERE is_owner;
-- Poprawny kod aktywacji / kod admina – konto czeka na zatwierdzenie w panelu admina.
ALTER TABLE users ADD COLUMN IF NOT EXISTS code_ok_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_requested_at timestamptz;

CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON user_sessions (user_id);

CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Jednorazowe kody nadające rolę admina (widoczne tylko w panelu adminów).
CREATE TABLE IF NOT EXISTS admin_codes (
  code       text PRIMARY KEY,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  used_at    timestamptz
);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz
);

-- Błędne kody (aktywacji i admina) – ogólny limit prób na wszystkie konta.
CREATE TABLE IF NOT EXISTS code_failures (
  at      timestamptz NOT NULL DEFAULT now(),
  user_id uuid
);
CREATE INDEX IF NOT EXISTS code_failures_at_idx ON code_failures (at);

-- Właściciel testów i sesji nauki (usunięcie konta usuwa jego dane).
ALTER TABLE tests ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE learn_sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS tests_user_idx ON tests (user_id);
CREATE INDEX IF NOT EXISTS learn_sessions_user_idx ON learn_sessions (user_id);

-- Fiszki: samoocena „znam / nie znam” – wpływa na kolor opanowania hasła (razem z testami i nauką).
CREATE TABLE IF NOT EXISTS flash_ratings (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  known   boolean NOT NULL,
  at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS flash_ratings_user_idx ON flash_ratings (user_id, item_id);

-- Notatki i brudnopisy (tekst + rysunek piórem); brudnopis pytania ma ref (np. owe:<id>, lekcja:<id>:<sub>), jeden na pytanie.
CREATE TABLE IF NOT EXISTS notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('note', 'scratch')),
  title      text NOT NULL DEFAULT '',
  body       text NOT NULL DEFAULT '',
  ink        jsonb NOT NULL DEFAULT '{"h":0,"s":[]}'::jsonb,
  ref        text,
  starred    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notes_user_idx ON notes (user_id, kind, updated_at DESC);
-- Fiszki przypięte do kartki notatki (przesuwane kwadraty): [{ id, x, y }] w jednostkach rysunku.
ALTER TABLE notes ADD COLUMN IF NOT EXISTS cards jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS notes_scratch_ref_idx ON notes (user_id, ref) WHERE kind = 'scratch' AND ref IS NOT NULL;
-- Sesja nauki z identyfikatorem z przeglądarki: ponowione założenie sesji (zgubiona odpowiedź) nie tworzy kolejnej.
ALTER TABLE learn_sessions ADD COLUMN IF NOT EXISTS client_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS learn_sessions_client_idx ON learn_sessions (user_id, client_id) WHERE client_id IS NOT NULL;
-- Identyfikator nadany przez przeglądarkę przy pierwszym zapisie notatki: ponowiony POST (zgubiona odpowiedź) nie tworzy kopii.
ALTER TABLE notes ADD COLUMN IF NOT EXISTS client_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS notes_client_idx ON notes (user_id, client_id) WHERE client_id IS NOT NULL;

-- Gwiazdki: fiszki (id hasła) i artykuły Podręcznika (id lekcji / działu).
CREATE TABLE IF NOT EXISTS stars (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind    text NOT NULL CHECK (kind IN ('fiszka', 'artykul')),
  ref     text NOT NULL,
  at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, ref)
);

-- Podkreślenia w artykułach: blok tekstu i zakres znaków w nim.
CREATE TABLE IF NOT EXISTS highlights (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article    text NOT NULL,
  block      int NOT NULL,
  start_at   int NOT NULL,
  end_at     int NOT NULL,
  color      text NOT NULL DEFAULT 'y',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS highlights_user_idx ON highlights (user_id, article);

-- Podręcznik: przeczytane artykuły (rozdział = id lekcji, przegląd działu = id działu).
CREATE TABLE IF NOT EXISTS article_reads (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ref     text NOT NULL,
  at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ref)
);
-- Blokady sekcji ustawiane przez admina dla konta (klucze z lib/access-core.ts) i wygląd zablokowanych pozycji.
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked text[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS block_mode text;
-- Własne talie fiszek: kolejność kart ustala użytkownik (przeciąganie).
CREATE TABLE IF NOT EXISTS decks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS decks_user_idx ON decks (user_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS deck_cards (
  deck_id  uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  item_id  text NOT NULL,
  pos      int NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (deck_id, item_id)
);
-- Sesja „artykuł”: przeczytanie rozdziału zamiast ćwiczeń Poznaj (bez odpowiedzi – nie wpływa na skuteczność).
ALTER TABLE learn_sessions ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'cwiczenia';
-- Pod-lekcja w trakcie (wyjście przed końcem): { pos, total } – ścieżka pokazuje „w trakcie 7/15”.
ALTER TABLE learn_sessions ADD COLUMN IF NOT EXISTS progress jsonb;
-- Nagrania akapitów Podręcznika głosem Azure (lib/tts.ts): klucz = skrót tekstu + głos, plik w Vercel Blob.
CREATE TABLE IF NOT EXISTS tts_clips (
  hash       text NOT NULL,
  voice      text NOT NULL,
  article    text NOT NULL,
  chars      int NOT NULL,
  bytes      int NOT NULL,
  url        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hash, voice)
);
-- Własne fiszki użytkownika (lib/own-cards.ts): id w taliach i gwiazdkach „u:<uuid>”; oceny tylko w karcie.
CREATE TABLE IF NOT EXISTS own_cards (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  t          text NOT NULL,
  d          text NOT NULL,
  w          text,
  topic      text NOT NULL,
  kind       text NOT NULL,
  c          int NOT NULL DEFAULT 0,
  n          int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS own_cards_user_idx ON own_cards (user_id, updated_at DESC);
-- Zgłoszenia błędów od użytkowników (lib/bugs.ts) – lista w panelu admina.
CREATE TABLE IF NOT EXISTS bug_reports (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       text NOT NULL,
  page       text,
  device     text,
  status     text NOT NULL DEFAULT 'nowe' CHECK (status IN ('nowe', 'w_toku', 'naprawione', 'odrzucone')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bug_reports_user_idx ON bug_reports (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bug_reports_status_idx ON bug_reports (status, created_at DESC);
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'techniczny' CHECK (kind IN ('merytoryczny', 'techniczny'));
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS section text;
-- Podejścia do zadań obliczeniowych i esejów z kluczy OWE (lib/otwarte.ts); statystyki osobno od testów.
CREATE TABLE IF NOT EXISTS open_attempts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  kind       text NOT NULL CHECK (kind IN ('zadanie', 'esej')),
  stage      text NOT NULL,
  topic      text NOT NULL,
  answers    jsonb NOT NULL DEFAULT '{}'::jsonb,
  score      real NOT NULL,
  max        real NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS open_attempts_user_idx ON open_attempts (user_id, kind, created_at DESC);
-- Zużycie znaków Azure: dzień × źródło („cron” – porcje w tle, id konta – nagrania na bieżąco).
CREATE TABLE IF NOT EXISTS tts_usage (
  day   date NOT NULL,
  who   text NOT NULL,
  chars int NOT NULL,
  PRIMARY KEY (day, who)
);
-- Ogłoszenia i ankiety prowadzone przez adminów (lib/announce.ts); przeczytane / ukryte – announcement_reads.
CREATE TABLE IF NOT EXISTS announcements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  body         text NOT NULL,
  pinned       boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  expires_at   timestamptz,
  author       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS announcements_pub_idx ON announcements (published_at DESC);
CREATE TABLE IF NOT EXISTS polls (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question      text NOT NULL,
  options       jsonb NOT NULL,
  multi         boolean NOT NULL DEFAULT false,
  anonymous     boolean NOT NULL DEFAULT true,
  results_after text NOT NULL DEFAULT 'vote' CHECK (results_after IN ('vote', 'close')),
  published_at  timestamptz,
  closes_at     timestamptz,
  author        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS polls_pub_idx ON polls (published_at DESC);
CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id    uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  choices    int[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, user_id)
);
CREATE TABLE IF NOT EXISTS announcement_reads (
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id   uuid NOT NULL,
  dismissed boolean NOT NULL DEFAULT false,
  read_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
-- Limity zapytań (okno przesuwne: wpisy z kluczem w ostatnich N sekundach) i dziennik zdarzeń bezpieczeństwa (lib/security.ts).
CREATE TABLE IF NOT EXISTS rate_hits (
  key text NOT NULL,
  at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_hits_key_at_idx ON rate_hits (key, at);
CREATE INDEX IF NOT EXISTS rate_hits_at_idx ON rate_hits (at);
CREATE TABLE IF NOT EXISTS security_events (
  id      bigserial PRIMARY KEY,
  at      timestamptz NOT NULL DEFAULT now(),
  kind    text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ip      text NOT NULL DEFAULT '',
  detail  text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS security_events_at_idx ON security_events (at DESC);
-- Zapisane ustawienia filtrów (lib/prefs.ts): klucz strony → wartość (parametry adresu albo JSON formularza).
CREATE TABLE IF NOT EXISTS user_prefs (
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key        text NOT NULL,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
-- Wspólny cel dzienny i seria (lib/xp.ts): XP dnia (strefa Europe/Warsaw) ze wszystkich aktywności, rozbite na źródła,
-- z celem obowiązującym tego dnia (dzień liczy się do serii, gdy xp >= goal).
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_goal int NOT NULL DEFAULT 100;
CREATE TABLE IF NOT EXISTS xp_days (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day     date NOT NULL,
  xp      int NOT NULL DEFAULT 0,
  by      jsonb NOT NULL DEFAULT '{}',
  goal    int NOT NULL DEFAULT 100,
  PRIMARY KEY (user_id, day)
);
CREATE INDEX IF NOT EXISTS xp_days_day_idx ON xp_days (day);
-- Ranking tygodniowy XP – tylko po zapisaniu się, pod pseudonimem (lib/world.ts).
ALTER TABLE users ADD COLUMN IF NOT EXISTS rank_opt boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rank_name text;
CREATE UNIQUE INDEX IF NOT EXISTS users_rank_name_idx ON users (lower(rank_name)) WHERE rank_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS learn_answers_at_idx ON learn_answers (answered_at);
CREATE INDEX IF NOT EXISTS answers_at_idx ON answers (answered_at);
-- jednorazowe uzupełnienie XP z historii (testy, kurs i czytanie, fiszki – maks. 100 XP/dzień, zadania i eseje – raz na pozycję dziennie)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'xp_backfill') THEN
    INSERT INTO xp_days (user_id, day, xp, by, goal)
    SELECT e.u, e.d, SUM(e.x), jsonb_object_agg(e.s, e.x), MAX(us.daily_goal)
    FROM (
      SELECT u, d, s, SUM(x)::int AS x FROM (
        SELECT t.user_id AS u, (a.answered_at AT TIME ZONE 'Europe/Warsaw')::date AS d, 'testy' AS s,
          CASE WHEN a.skipped OR cardinality(a.selected) = 0 THEN 0 WHEN a.points >= 2 THEN 10 WHEN a.points > 0 THEN 5 ELSE 2 END AS x
        FROM answers a JOIN tests t ON t.id = a.test_id WHERE t.user_id IS NOT NULL
        UNION ALL
        SELECT user_id, (finished_at AT TIME ZONE 'Europe/Warsaw')::date, CASE WHEN mode = 'artykul' THEN 'czytanie' ELSE 'kurs' END, xp
        FROM learn_sessions WHERE finished_at IS NOT NULL AND user_id IS NOT NULL
        UNION ALL
        SELECT user_id, d, 'fiszki', LEAST(2 * COUNT(*), 100) FROM (
          SELECT user_id, (at AT TIME ZONE 'Europe/Warsaw')::date AS d FROM flash_ratings) f GROUP BY 1, 2
        UNION ALL
        SELECT user_id, d, CASE WHEN kind = 'esej' THEN 'eseje' ELSE 'zadania' END, CASE WHEN kind = 'esej' THEN 50 ELSE 30 END
        FROM (SELECT DISTINCT user_id, item_id, kind, (created_at AT TIME ZONE 'Europe/Warsaw')::date AS d FROM open_attempts) o
      ) ev GROUP BY 1, 2, 3
    ) e JOIN users us ON us.id = e.u
    WHERE e.x > 0
    GROUP BY e.u, e.d
    ON CONFLICT (user_id, day) DO NOTHING;
    INSERT INTO settings (key, value) VALUES ('xp_backfill', 'v1');
  END IF;
END $$;
${XL_MIGRATION}
-- Plan IV – bezpieczeństwo: wiek i zgoda rodzica, akceptacja regulaminu, weryfikacja dwuetapowa (TOTP), logowanie Google
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_year int;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_email text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_consent_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_backup text[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_last bigint;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub text;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_idx ON users (google_sub) WHERE google_sub IS NOT NULL;
-- lista aktywnych sesji w Ustawieniach (urządzenie, początek, ostatnie użycie)
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS ua text;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS via text;
-- krótkotrwałe kroki logowania: druga weryfikacja (MFA), wyzwania kluczy dostępu, logowanie Google (state/nonce/PKCE)
CREATE TABLE IF NOT EXISTS auth_flows (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       text NOT NULL,
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts   int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_flows_exp_idx ON auth_flows (expires_at);
-- klucze dostępu (passkeys, WebAuthn)
CREATE TABLE IF NOT EXISTS passkeys (
  id           text PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key   bytea NOT NULL,
  counter      bigint NOT NULL DEFAULT 0,
  transports   text[] NOT NULL DEFAULT '{}',
  name         text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
CREATE INDEX IF NOT EXISTS passkeys_user_idx ON passkeys (user_id);
-- dziennik działań administratorów
CREATE TABLE IF NOT EXISTS admin_audit (
  id       bigserial PRIMARY KEY,
  at       timestamptz NOT NULL DEFAULT now(),
  admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action   text NOT NULL,
  target   text,
  detail   jsonb
);
CREATE INDEX IF NOT EXISTS admin_audit_at_idx ON admin_audit (at DESC);
-- Plan IV: XP w skali oszczędnej (lib/xp-core.ts) – XP przyznane za zadanie/esej przy podejściu, nowe cele (30/50/80/120)
ALTER TABLE open_attempts ADD COLUMN IF NOT EXISTS xp int NOT NULL DEFAULT 0;
ALTER TABLE users ALTER COLUMN daily_goal SET DEFAULT 50;
ALTER TABLE xp_days ALTER COLUMN goal SET DEFAULT 50;
-- jednorazowe przeliczenie historii według nowych zasad: cele na ten sam poziom, XP sesji kursu (2 za poprawną, premia
-- 5 + 3 tylko za pierwszą ukończoną sesję pod-lekcji danego dnia), rozdziałów (5 po ≥ 2 min, raz na rozdział dziennie),
-- zadań i esejów (20 / 30 przy wyniku ≥ 30%, raz na pozycję dziennie), testów (2/1/0 za pierwszą odpowiedź na pytanie
-- danego dnia) i fiszek (1 za ocenę, maks. 20 dziennie); xp_days od nowa z tych samych źródeł
DO $xp2$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'xp_backfill' AND value = 'v2') THEN
    UPDATE users SET daily_goal = CASE daily_goal WHEN 50 THEN 30 WHEN 100 THEN 50 WHEN 200 THEN 80 WHEN 300 THEN 120 ELSE 50 END;
    UPDATE xp_days SET goal = CASE goal WHEN 50 THEN 30 WHEN 100 THEN 50 WHEN 200 THEN 80 WHEN 300 THEN 120 ELSE 50 END;
    WITH r AS (
      SELECT id, row_number() OVER (PARTITION BY user_id, lesson, sub, (finished_at AT TIME ZONE 'Europe/Warsaw')::date ORDER BY finished_at) AS rn
      FROM learn_sessions WHERE finished_at IS NOT NULL AND mode IS DISTINCT FROM 'artykul')
    UPDATE learn_sessions s SET xp = 2 * s.correct + CASE WHEN r.rn = 1 AND s.total > 0 THEN 5 + CASE WHEN s.correct = s.total THEN 3 ELSE 0 END ELSE 0 END
    FROM r WHERE r.id = s.id;
    UPDATE learn_sessions SET xp = 0 WHERE mode = 'artykul';
    WITH r AS (
      SELECT id, row_number() OVER (PARTITION BY user_id, lesson, (finished_at AT TIME ZONE 'Europe/Warsaw')::date ORDER BY finished_at) AS rn
      FROM learn_sessions WHERE mode = 'artykul' AND finished_at IS NOT NULL AND duration_ms >= 120000)
    UPDATE learn_sessions s SET xp = 5 FROM r WHERE r.id = s.id AND r.rn = 1;
    UPDATE open_attempts SET xp = 0;
    WITH r AS (
      SELECT id, row_number() OVER (PARTITION BY user_id, item_id, (created_at AT TIME ZONE 'Europe/Warsaw')::date ORDER BY created_at) AS rn
      FROM open_attempts WHERE max > 0 AND score >= 0.3 * max)
    UPDATE open_attempts a SET xp = CASE WHEN a.kind = 'esej' THEN 30 ELSE 20 END FROM r WHERE r.id = a.id AND r.rn = 1;
    UPDATE xp_days SET xp = 0, by = '{}'::jsonb;
    INSERT INTO xp_days (user_id, day, xp, by, goal)
    SELECT e.u, e.d, SUM(e.x), jsonb_object_agg(e.s, e.x), MAX(us.daily_goal)
    FROM (
      SELECT u, d, s, SUM(x)::int AS x FROM (
        SELECT DISTINCT ON (t.user_id, (a.answered_at AT TIME ZONE 'Europe/Warsaw')::date, a.question_id)
          t.user_id AS u, (a.answered_at AT TIME ZONE 'Europe/Warsaw')::date AS d, 'testy' AS s,
          CASE WHEN a.skipped OR cardinality(a.selected) = 0 THEN 0 WHEN a.points >= 2 THEN 2 WHEN a.points > 0 THEN 1 ELSE 0 END AS x
        FROM answers a JOIN tests t ON t.id = a.test_id WHERE t.user_id IS NOT NULL
        ORDER BY t.user_id, (a.answered_at AT TIME ZONE 'Europe/Warsaw')::date, a.question_id, a.answered_at
      ) q GROUP BY 1, 2, 3
      UNION ALL
      SELECT user_id, (finished_at AT TIME ZONE 'Europe/Warsaw')::date, CASE WHEN mode = 'artykul' THEN 'czytanie' ELSE 'kurs' END, SUM(xp)::int
      FROM learn_sessions WHERE finished_at IS NOT NULL AND user_id IS NOT NULL GROUP BY 1, 2, 3
      UNION ALL
      SELECT user_id, (at AT TIME ZONE 'Europe/Warsaw')::date, 'fiszki', LEAST(COUNT(*), 20)::int FROM flash_ratings GROUP BY 1, 2
      UNION ALL
      SELECT user_id, (created_at AT TIME ZONE 'Europe/Warsaw')::date, CASE WHEN kind = 'esej' THEN 'eseje' ELSE 'zadania' END, SUM(xp)::int
      FROM open_attempts GROUP BY 1, 2, 3
    ) e JOIN users us ON us.id = e.u
    WHERE e.x > 0
    GROUP BY e.u, e.d
    ON CONFLICT (user_id, day) DO UPDATE SET xp = EXCLUDED.xp, by = EXCLUDED.by;
    INSERT INTO settings (key, value) VALUES ('xp_backfill', 'v2') ON CONFLICT (key) DO UPDATE SET value = 'v2', updated_at = now();
  END IF;
END $xp2$;
`;
