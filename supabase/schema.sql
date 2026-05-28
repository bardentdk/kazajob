-- ============================================================
-- KAZAJOB — Schema Supabase
-- Copier ce fichier dans le SQL Editor de ton projet Supabase
-- ============================================================

-- Extension uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'recruiter', 'admin')),
  avatar_url    TEXT,
  location      TEXT,
  bio           TEXT,
  phone         TEXT,
  cv_url        TEXT,
  xp            INTEGER NOT NULL DEFAULT 0,
  streak        INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Companies ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  logo_url      TEXT,
  website       TEXT,
  description   TEXT,
  location      TEXT,
  sector        TEXT,
  size          TEXT,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Skills ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,
  category      TEXT
);

-- ── Jobs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID REFERENCES companies(id) ON DELETE SET NULL,
  recruiter_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  requirements        TEXT,
  location            TEXT NOT NULL,
  remote              BOOLEAN NOT NULL DEFAULT FALSE,
  job_type            TEXT NOT NULL DEFAULT 'CDI',
  sector              TEXT,
  salary_min          INTEGER,
  salary_max          INTEGER,
  salary_currency     TEXT NOT NULL DEFAULT '€',
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  is_boosted          BOOLEAN NOT NULL DEFAULT FALSE,
  boost_expires_at    TIMESTAMPTZ,
  views               INTEGER NOT NULL DEFAULT 0,
  applications_count  INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Job Skills ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_skills (
  job_id       UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id     UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  is_required  BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (job_id, skill_id)
);

-- ── Candidate Skills ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidate_skills (
  candidate_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id      UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level         TEXT NOT NULL DEFAULT 'intermediate' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  PRIMARY KEY (candidate_id, skill_id)
);

-- ── Applications ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cover_letter    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'viewed', 'interview', 'offer', 'hired', 'rejected')),
  recruiter_notes TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, candidate_id)
);

-- ── Favorites ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (candidate_id, job_id)
);

-- ── Conversations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id           UUID REFERENCES jobs(id) ON DELETE SET NULL,
  last_message_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Messages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_favorites_candidate ON favorites(candidate_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_candidate ON conversations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_conversations_recruiter ON conversations(recruiter_id);

-- ── Trigger updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── Trigger auto-create profile on signup ─────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Increment applications count ─────────────────────────────
CREATE OR REPLACE FUNCTION increment_applications_count(job_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE jobs SET applications_count = applications_count + 1 WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;
