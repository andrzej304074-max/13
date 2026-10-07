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
`;
