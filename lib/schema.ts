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
`;
