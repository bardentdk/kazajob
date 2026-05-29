-- ============================================================
-- KAZAJOB — XP, Streak, Interviews
-- Coller dans Supabase SQL Editor
-- ============================================================

-- ── Interviews ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  recruiter_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id         UUID REFERENCES jobs(id) ON DELETE SET NULL,
  scheduled_at   TIMESTAMPTZ NOT NULL,
  duration_min   INTEGER NOT NULL DEFAULT 45,
  type           TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('video','phone','onsite')),
  visio_type     TEXT DEFAULT 'jitsi' CHECK (visio_type IN ('jitsi','external')),
  visio_link     TEXT,
  location       TEXT,
  notes          TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','done')),
  reminder_sent  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_candidate  ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_recruiter  ON interviews(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled  ON interviews(scheduled_at);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidats voient leurs entretiens"
  ON interviews FOR SELECT
  USING (candidate_id = auth.uid());

CREATE POLICY "Recruteurs voient leurs entretiens"
  ON interviews FOR SELECT
  USING (recruiter_id = auth.uid());

CREATE POLICY "Recruteurs créent des entretiens"
  ON interviews FOR INSERT
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruteurs mettent à jour leurs entretiens"
  ON interviews FOR UPDATE
  USING (recruiter_id = auth.uid() OR candidate_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE interviews;

-- ── XP functions ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_xp(user_id UUID, points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET xp = xp + points, updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- XP auto quand une candidature est soumise
CREATE OR REPLACE FUNCTION handle_application_xp()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM add_xp(NEW.candidate_id, 20);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_created ON applications;
CREATE TRIGGER on_application_created
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION handle_application_xp();

-- ── Streak : update au login (appelé côté client) ─────────────
CREATE OR REPLACE FUNCTION update_streak(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_login TIMESTAMPTZ;
  current_streak INTEGER;
BEGIN
  SELECT updated_at, streak INTO last_login, current_streak
  FROM profiles WHERE id = user_id;

  -- Si dernière activité < 48h → incrémenter streak, sinon reset à 1
  IF last_login > NOW() - INTERVAL '48 hours' AND last_login < NOW() - INTERVAL '20 hours' THEN
    UPDATE profiles SET streak = streak + 1, updated_at = NOW() WHERE id = user_id;
    RETURN current_streak + 1;
  ELSIF last_login <= NOW() - INTERVAL '48 hours' THEN
    UPDATE profiles SET streak = 1, updated_at = NOW() WHERE id = user_id;
    RETURN 1;
  END IF;

  RETURN current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Annulation candidature — statut withdrawn ─────────────────
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending','viewed','interview','offer','hired','rejected','withdrawn'));

-- ── Champs supplémentaires pour les offres ────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS benefits        TEXT,
  ADD COLUMN IF NOT EXISTS required_level  TEXT,
  ADD COLUMN IF NOT EXISTS start_date      TEXT,
  ADD COLUMN IF NOT EXISTS languages       TEXT[],
  ADD COLUMN IF NOT EXISTS company_size    TEXT,
  ADD COLUMN IF NOT EXISTS perks           TEXT[];
