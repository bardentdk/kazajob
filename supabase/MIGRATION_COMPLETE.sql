-- ═══════════════════════════════════════════════════════════════════════
-- KAZAJOB — Migration complète et idempotente
-- Exécuter UNE SEULE FOIS dans Supabase SQL Editor
-- Peut être re-exécuté sans erreur (CREATE IF NOT EXISTS / DROP IF EXISTS)
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- 0. PERMISSIONS DE BASE
-- ─────────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 1. TRIGGER CRÉATION PROFIL (inscription)
-- ─────────────────────────────────────────────────────────────────────
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
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        role      = COALESCE(EXCLUDED.role,      profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- 2. COLONNES PROFILES (toutes les features)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS avatar_category        TEXT,
  ADD COLUMN IF NOT EXISTS avatar_categories      TEXT[],
  ADD COLUMN IF NOT EXISTS cv_template            TEXT        DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS cv_color               TEXT        DEFAULT '#FF6B35',
  ADD COLUMN IF NOT EXISTS cv_data                JSONB,
  ADD COLUMN IF NOT EXISTS email_alerts_enabled   BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_alert_frequency  TEXT        NOT NULL DEFAULT 'daily'
    CHECK (email_alert_frequency IN ('instant','daily','weekly')),
  ADD COLUMN IF NOT EXISTS video_pitch_url        TEXT,
  ADD COLUMN IF NOT EXISTS boosted_until          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS referral_code          TEXT        UNIQUE,
  ADD COLUMN IF NOT EXISTS company_id             UUID;  -- FK ajoutée après la table companies

-- Marquer l'onboarding comme complété pour les profils existants
UPDATE profiles SET onboarding_completed = TRUE
WHERE created_at < NOW() - INTERVAL '1 minute' AND onboarding_completed = FALSE;

-- Générer des codes de parrainage pour les profils sans code
UPDATE profiles
SET referral_code = upper(substr(md5(random()::text || id::text), 0, 9))
WHERE referral_code IS NULL;

-- ─────────────────────────────────────────────────────────────────────
-- 3. ENRICHISSEMENT TABLE COMPANIES
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS legal_name        TEXT,
  ADD COLUMN IF NOT EXISTS siret             TEXT,
  ADD COLUMN IF NOT EXISTS phone             TEXT,
  ADD COLUMN IF NOT EXISTS address           TEXT,
  ADD COLUMN IF NOT EXISTS city              TEXT,
  ADD COLUMN IF NOT EXISTS zip_code          TEXT,
  ADD COLUMN IF NOT EXISTS founded_year      INT,
  ADD COLUMN IF NOT EXISTS linkedin_url      TEXT,
  ADD COLUMN IF NOT EXISTS is_setup_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- FK profiles → companies (maintenant que companies existe)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- ─────────────────────────────────────────────────────────────────────
-- 4. COLONNES JOBS
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS benefits        TEXT,
  ADD COLUMN IF NOT EXISTS required_level  TEXT,
  ADD COLUMN IF NOT EXISTS start_date      TEXT,
  ADD COLUMN IF NOT EXISTS languages       TEXT[],
  ADD COLUMN IF NOT EXISTS perks           TEXT[],
  ADD COLUMN IF NOT EXISTS published_by    UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS is_anonymous    BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill published_by
UPDATE jobs SET published_by = recruiter_id WHERE published_by IS NULL;

-- Contrainte de statut candidature (ajout withdrawn)
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending','viewed','interview','offer','hired','rejected','withdrawn'));

-- ─────────────────────────────────────────────────────────────────────
-- 5. TABLE INTERVIEWS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  recruiter_id   UUID        NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  candidate_id   UUID        NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  job_id         UUID        REFERENCES jobs(id) ON DELETE SET NULL,
  scheduled_at   TIMESTAMPTZ NOT NULL,
  duration_min   INT         NOT NULL DEFAULT 45,
  type           TEXT        NOT NULL DEFAULT 'video'
    CHECK (type IN ('video','phone','onsite')),
  visio_type     TEXT        DEFAULT 'jitsi'
    CHECK (visio_type IN ('jitsi','external')),
  visio_link     TEXT,
  location       TEXT,
  notes          TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','cancelled','done')),
  reminder_sent  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_recruiter ON interviews(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled ON interviews(scheduled_at);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON interviews TO authenticated;

DROP POLICY IF EXISTS "Candidats voient leurs entretiens"          ON interviews;
DROP POLICY IF EXISTS "Recruteurs voient leurs entretiens"         ON interviews;
DROP POLICY IF EXISTS "Recruteurs créent des entretiens"           ON interviews;
DROP POLICY IF EXISTS "Recruteurs mettent à jour leurs entretiens" ON interviews;

CREATE POLICY "Candidats voient leurs entretiens"
  ON interviews FOR SELECT USING (candidate_id = auth.uid());

CREATE POLICY "Recruteurs voient leurs entretiens"
  ON interviews FOR SELECT USING (recruiter_id = auth.uid());

CREATE POLICY "Recruteurs créent des entretiens"
  ON interviews FOR INSERT WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruteurs mettent à jour leurs entretiens"
  ON interviews FOR UPDATE
  USING (recruiter_id = auth.uid() OR candidate_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- 6. TABLE NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────

-- Si la table existe déjà avec la colonne "read", on la renomme en "is_read"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  link       TEXT,
  data       JSONB,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ajouter les colonnes manquantes si la table existait déjà sans elles
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link    TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

DROP POLICY IF EXISTS "Utilisateurs voient leurs notifications"               ON notifications;
DROP POLICY IF EXISTS "Utilisateurs marquent leurs notifications comme lues"  ON notifications;
DROP POLICY IF EXISTS "System insère des notifications"                       ON notifications;

CREATE POLICY "Utilisateurs voient leurs notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Utilisateurs marquent leurs notifications comme lues"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System insère des notifications"
  ON notifications FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────
-- 7. TABLE REFERRALS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rewarded    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON referrals TO authenticated;

DROP POLICY IF EXISTS "referrals_select_own"     ON referrals;
DROP POLICY IF EXISTS "referrals_insert_referred" ON referrals;

CREATE POLICY "referrals_select_own"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "referrals_insert_referred"
  ON referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- ─────────────────────────────────────────────────────────────────────
-- 8. TABLES EVENTS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  description      TEXT,
  type             TEXT        NOT NULL CHECK (type IN ('job_dating','webinar','atelier')),
  date             TIMESTAMPTZ NOT NULL,
  duration_minutes INT         NOT NULL DEFAULT 60,
  max_participants INT         NOT NULL DEFAULT 50,
  location         TEXT        NOT NULL DEFAULT 'En ligne',
  jitsi_room       TEXT,
  is_published     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  candidate_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_events_date        ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_organizer   ON events(organizer_id);

ALTER TABLE events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON events              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_registrations TO authenticated;

DROP POLICY IF EXISTS "events_select_published"    ON events;
DROP POLICY IF EXISTS "events_insert_organizer"    ON events;
DROP POLICY IF EXISTS "events_update_organizer"    ON events;
DROP POLICY IF EXISTS "events_delete_organizer"    ON events;
DROP POLICY IF EXISTS "event_reg_select_own"       ON event_registrations;
DROP POLICY IF EXISTS "event_reg_insert_candidate" ON event_registrations;
DROP POLICY IF EXISTS "event_reg_delete_candidate" ON event_registrations;
DROP POLICY IF EXISTS "event_reg_select_organizer" ON event_registrations;

CREATE POLICY "events_select_published"
  ON events FOR SELECT
  USING (is_published = true OR auth.uid() = organizer_id);

CREATE POLICY "events_insert_organizer"
  ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "events_update_organizer"
  ON events FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "events_delete_organizer"
  ON events FOR DELETE USING (auth.uid() = organizer_id);

CREATE POLICY "event_reg_select_own"
  ON event_registrations FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY "event_reg_insert_candidate"
  ON event_registrations FOR INSERT WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "event_reg_delete_candidate"
  ON event_registrations FOR DELETE USING (auth.uid() = candidate_id);

CREATE POLICY "event_reg_select_organizer"
  ON event_registrations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_registrations.event_id AND e.organizer_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────────────────
-- 9. COMPANY TEAMS, PLANS, ABONNEMENTS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID        NOT NULL REFERENCES companies(id)  ON DELETE CASCADE,
  recruiter_id UUID        NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  role         TEXT        NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner','admin','member')),
  status       TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending','active','suspended')),
  invited_by   UUID        REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, recruiter_id)
);

CREATE TABLE IF NOT EXISTS company_join_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID        NOT NULL REFERENCES companies(id)  ON DELETE CASCADE,
  recruiter_id UUID        NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  message      TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  reviewed_by  UUID        REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, recruiter_id)
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  price_cts   INT     NOT NULL,
  max_members INT     NOT NULL,
  max_jobs    INT     NOT NULL,
  partners    TEXT[]  NOT NULL DEFAULT '{}',
  api_access  BOOLEAN NOT NULL DEFAULT FALSE,
  trial_days  INT     NOT NULL DEFAULT 14,
  highlight   BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO subscription_plans (id, name, price_cts, max_members, max_jobs, partners, api_access, highlight)
VALUES
  ('starter',    'Starter',    2900,  1,   3,  ARRAY[]::TEXT[],                                                                 FALSE, FALSE),
  ('pro',        'Pro',        8900,  3,  10,  ARRAY['france_travail'],                                                         FALSE, TRUE),
  ('business',   'Business',  17900, 10,  -1,  ARRAY['france_travail','mission_locale','apec'],                                 FALSE, FALSE),
  ('enterprise', 'Entreprise',34900, 50,  -1,  ARRAY['france_travail','mission_locale','apec','indeed','aggregator'],           TRUE,  FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS company_subscriptions (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         UUID        NOT NULL REFERENCES companies(id)         ON DELETE CASCADE,
  plan_id            TEXT        NOT NULL REFERENCES subscription_plans(id),
  status             TEXT        NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial','active','cancelled','expired')),
  trial_ends_at      TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  seats_used         INT         NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id)
);

CREATE INDEX IF NOT EXISTS idx_company_members_company   ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_recruiter ON company_members(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_company_jreq_company      ON company_join_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id       ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code    ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_jobs_published_by         ON jobs(published_by);

ALTER TABLE company_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans    ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON company_members       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON company_join_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON company_subscriptions TO authenticated;
GRANT SELECT                          ON subscription_plans   TO anon, authenticated;

-- Policies company_members
DROP POLICY IF EXISTS "members_read_own"     ON company_members;
DROP POLICY IF EXISTS "members_insert_owner" ON company_members;
DROP POLICY IF EXISTS "members_update_owner" ON company_members;
DROP POLICY IF EXISTS "members_delete_owner" ON company_members;
DROP POLICY IF EXISTS "members_admin_all"    ON company_members;

CREATE POLICY "members_read_own" ON company_members FOR SELECT
  USING (auth.uid() = recruiter_id OR EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = company_members.company_id
      AND cm.recruiter_id = auth.uid() AND cm.status = 'active'
  ));

CREATE POLICY "members_insert_owner" ON company_members FOR INSERT
  WITH CHECK (auth.uid() = recruiter_id OR EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = company_members.company_id
      AND cm.recruiter_id = auth.uid() AND cm.role IN ('owner','admin') AND cm.status = 'active'
  ));

CREATE POLICY "members_update_owner" ON company_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = company_members.company_id
      AND cm.recruiter_id = auth.uid() AND cm.role IN ('owner','admin')
  ));

CREATE POLICY "members_delete_owner" ON company_members FOR DELETE
  USING (auth.uid() = recruiter_id OR EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = company_members.company_id
      AND cm.recruiter_id = auth.uid() AND cm.role IN ('owner','admin')
  ));

CREATE POLICY "members_admin_all" ON company_members FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies company_join_requests
DROP POLICY IF EXISTS "jreq_read"   ON company_join_requests;
DROP POLICY IF EXISTS "jreq_insert" ON company_join_requests;
DROP POLICY IF EXISTS "jreq_update" ON company_join_requests;
DROP POLICY IF EXISTS "jreq_admin"  ON company_join_requests;

CREATE POLICY "jreq_read" ON company_join_requests FOR SELECT
  USING (auth.uid() = recruiter_id OR EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = company_join_requests.company_id
      AND cm.recruiter_id = auth.uid() AND cm.role IN ('owner','admin')
  ));

CREATE POLICY "jreq_insert" ON company_join_requests FOR INSERT
  WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "jreq_update" ON company_join_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = company_join_requests.company_id
      AND cm.recruiter_id = auth.uid() AND cm.role IN ('owner','admin')
  ));

CREATE POLICY "jreq_admin" ON company_join_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies company_subscriptions
DROP POLICY IF EXISTS "sub_read_member"  ON company_subscriptions;
DROP POLICY IF EXISTS "sub_insert_owner" ON company_subscriptions;
DROP POLICY IF EXISTS "sub_update_owner" ON company_subscriptions;
DROP POLICY IF EXISTS "sub_admin"        ON company_subscriptions;

CREATE POLICY "sub_read_member" ON company_subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = company_subscriptions.company_id AND cm.recruiter_id = auth.uid()
  ));

CREATE POLICY "sub_insert_owner" ON company_subscriptions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = company_subscriptions.company_id
      AND cm.recruiter_id = auth.uid() AND cm.role = 'owner'
  ));

CREATE POLICY "sub_update_owner" ON company_subscriptions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = company_subscriptions.company_id
      AND cm.recruiter_id = auth.uid() AND cm.role IN ('owner','admin')
  ));

CREATE POLICY "sub_admin" ON company_subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "plans_read_all" ON subscription_plans;
CREATE POLICY "plans_read_all" ON subscription_plans FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- 10. STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('video-pitches', 'video-pitches', false, 52428800,
  ARRAY['video/webm','video/mp4','video/ogg','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company-logos', 'company-logos', true, 2097152,
  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies — video-pitches
DROP POLICY IF EXISTS "Candidats uploadent leur pitch"                       ON storage.objects;
DROP POLICY IF EXISTS "Candidats voient leur pitch"                          ON storage.objects;
DROP POLICY IF EXISTS "Recruteurs voient les pitchs des candidats ayant postulé" ON storage.objects;
DROP POLICY IF EXISTS "Candidats suppriment leur pitch"                      ON storage.objects;
DROP POLICY IF EXISTS "company_logos_public_read"                            ON storage.objects;
DROP POLICY IF EXISTS "company_logos_auth_write"                             ON storage.objects;

CREATE POLICY "Candidats uploadent leur pitch"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'video-pitches' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidats voient leur pitch"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'video-pitches' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Recruteurs voient les pitchs des candidats ayant postulé"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'video-pitches' AND EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.recruiter_id = auth.uid()
        AND a.candidate_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Candidats suppriment leur pitch"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'video-pitches' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "company_logos_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "company_logos_auth_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────
-- 11. FONCTIONS XP & STREAK
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_xp(user_id UUID, points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET xp = xp + points, updated_at = NOW() WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION update_streak(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_login     TIMESTAMPTZ;
  current_streak INTEGER;
BEGIN
  SELECT updated_at, streak INTO last_login, current_streak FROM profiles WHERE id = user_id;
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

-- ─────────────────────────────────────────────────────────────────────
-- 12. TRIGGER NOTIFICATIONS AUTO
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_application_status()
RETURNS TRIGGER AS $$
DECLARE
  job_title    TEXT;
  company_name TEXT;
  status_label TEXT;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  SELECT j.title, c.name INTO job_title, company_name
  FROM jobs j LEFT JOIN companies c ON c.id = j.company_id WHERE j.id = NEW.job_id;

  status_label := CASE NEW.status
    WHEN 'viewed'    THEN 'Ton CV a été consulté'
    WHEN 'interview' THEN 'Entretien planifié'
    WHEN 'offer'     THEN 'Offre reçue'
    WHEN 'hired'     THEN 'Félicitations — tu es embauché(e) !'
    WHEN 'rejected'  THEN 'Candidature non retenue'
    WHEN 'withdrawn' THEN 'Candidature retirée'
    ELSE 'Mise à jour de ta candidature'
  END;

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.candidate_id, 'application_status', status_label,
    COALESCE(job_title, 'Poste') || ' — ' || COALESCE(company_name, 'Entreprise'),
    jsonb_build_object('applicationId', NEW.id, 'jobId', NEW.job_id, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_status_change ON applications;
CREATE TRIGGER on_application_status_change
  AFTER UPDATE OF status ON applications
  FOR EACH ROW EXECUTE FUNCTION notify_application_status();

CREATE OR REPLACE FUNCTION notify_interview_created()
RETURNS TRIGGER AS $$
DECLARE
  job_title       TEXT;
  scheduled_label TEXT;
BEGIN
  SELECT title INTO job_title FROM jobs WHERE id = NEW.job_id;
  scheduled_label := TO_CHAR(NEW.scheduled_at AT TIME ZONE 'Indian/Reunion', 'DD/MM/YYYY à HH24:MI');

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.candidate_id, 'interview_scheduled', 'Entretien planifié',
    COALESCE(job_title, 'Entretien') || ' — ' || scheduled_label,
    jsonb_build_object('interviewId', NEW.id, 'scheduledAt', NEW.scheduled_at)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_interview_created ON interviews;
CREATE TRIGGER on_interview_created
  AFTER INSERT ON interviews
  FOR EACH ROW EXECUTE FUNCTION notify_interview_created();

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID, p_type TEXT, p_title TEXT, p_message TEXT, p_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_notification TO authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 13. TRIGGER XP PARRAINAGE
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reward_referral()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET xp = xp + 200 WHERE id = NEW.referrer_id;
  UPDATE profiles SET xp = xp + 200 WHERE id = NEW.referred_id;
  NEW.rewarded = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_reward_referral ON referrals;
CREATE TRIGGER trg_reward_referral
  BEFORE INSERT ON referrals
  FOR EACH ROW EXECUTE FUNCTION reward_referral();

-- ─────────────────────────────────────────────────────────────────────
-- 14. KAZASCORE — fonction de calcul
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION compute_kaza_score(p_recruiter_id UUID)
RETURNS TABLE (
  score         INTEGER,
  label         TEXT,
  total_apps    INTEGER,
  responded     INTEGER,
  avg_hours     NUMERIC,
  with_interview INTEGER
) AS $$
DECLARE
  v_total      INTEGER;
  v_responded  INTEGER;
  v_avg_hours  NUMERIC;
  v_interviews INTEGER;
  v_score      INTEGER;
  v_label      TEXT;
  rate_score   INTEGER;
  speed_score  INTEGER;
  interv_score INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM applications a
  JOIN jobs j ON a.job_id = j.id
  WHERE j.recruiter_id = p_recruiter_id AND a.created_at > NOW() - INTERVAL '90 days';

  IF v_total = 0 THEN
    RETURN QUERY SELECT 0,'Nouveau recruteur'::TEXT,0,0,0.0::NUMERIC,0;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_responded FROM applications a
  JOIN jobs j ON a.job_id = j.id
  WHERE j.recruiter_id = p_recruiter_id AND a.status != 'pending'
    AND a.created_at > NOW() - INTERVAL '90 days';

  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at)) / 3600), 0)
  INTO v_avg_hours FROM applications a
  JOIN jobs j ON a.job_id = j.id
  WHERE j.recruiter_id = p_recruiter_id AND a.status != 'pending'
    AND a.created_at > NOW() - INTERVAL '90 days';

  SELECT COUNT(*) INTO v_interviews FROM applications a
  JOIN jobs j ON a.job_id = j.id
  WHERE j.recruiter_id = p_recruiter_id AND a.status IN ('interview','offer','hired')
    AND a.created_at > NOW() - INTERVAL '90 days';

  rate_score   := LEAST(100, ROUND((v_responded::NUMERIC / v_total) * 100));
  speed_score  := CASE
    WHEN v_avg_hours <= 24  THEN 100
    WHEN v_avg_hours <= 48  THEN 80
    WHEN v_avg_hours <= 96  THEN 60
    WHEN v_avg_hours <= 168 THEN 40
    ELSE 20
  END;
  interv_score := LEAST(100, ROUND((v_interviews::NUMERIC / GREATEST(v_responded,1)) * 100));
  v_score      := ROUND(rate_score * 0.5 + speed_score * 0.3 + interv_score * 0.2);

  v_label := CASE
    WHEN v_score >= 85 THEN 'Très réactif'
    WHEN v_score >= 65 THEN 'Réactif'
    WHEN v_score >= 40 THEN 'Peu réactif'
    ELSE 'Inactif'
  END;

  RETURN QUERY SELECT v_score, v_label, v_total, v_responded, v_avg_hours, v_interviews;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION compute_kaza_score TO authenticated, anon;

-- ─────────────────────────────────────────────────────────────────────
-- 15. REALTIME (idempotent — ne plante pas si déjà membre)
-- ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'interviews') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE interviews;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 16. REFRESH GRANTS FINAL (pour les nouvelles tables)
-- ─────────────────────────────────────────────────────────────────────
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ─────────────────────────────────────────────────────────────────────
SELECT 'MIGRATION_COMPLETE.sql exécutée avec succès ✅' AS status;
-- ─────────────────────────────────────────────────────────────────────
