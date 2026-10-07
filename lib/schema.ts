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
`;
