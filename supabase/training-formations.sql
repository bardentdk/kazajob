-- ═══════════════════════════════════════════════════════════════
-- KAZAJOB — Offres de Formation + Sessions IC
-- ═══════════════════════════════════════════════════════════════

-- ── Storage : images des formations ──────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('training-images', 'training-images', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "training_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "training_images_auth_write"  ON storage.objects;
DROP POLICY IF EXISTS "training_images_auth_delete" ON storage.objects;

CREATE POLICY "training_images_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'training-images');
CREATE POLICY "training_images_auth_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'training-images' AND auth.role() = 'authenticated');
CREATE POLICY "training_images_auth_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'training-images' AND auth.role() = 'authenticated');

-- ── Table : offres de formation ───────────────────────────────────
CREATE TABLE IF NOT EXISTS training_offers (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id        UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  company_id          UUID        REFERENCES companies(id)          ON DELETE SET NULL,

  -- Contenu
  title               TEXT        NOT NULL,             -- doit contenir (H/F)
  description         TEXT        NOT NULL,
  program             TEXT,                             -- contenu pédagogique
  prerequisites       TEXT,                             -- prérequis d'accès

  -- Certification
  certification       TEXT,                             -- ex: "Titre Pro Développeur Web"
  certification_level TEXT CHECK (certification_level IN (
    '1','2','3','4','5','6','7','8','non_certifiante'
  )),

  -- Durée
  duration_value      INT         NOT NULL DEFAULT 1,
  duration_unit       TEXT        NOT NULL DEFAULT 'heures'
    CHECK (duration_unit IN ('heures','jours','semaines','mois')),

  -- Lieu
  location            TEXT        NOT NULL,
  remote              BOOLEAN     NOT NULL DEFAULT FALSE,
  sector              TEXT,

  -- Planning
  start_date          DATE,
  max_participants    INT         NOT NULL DEFAULT 20,

  -- Financement
  is_financed         BOOLEAN     NOT NULL DEFAULT FALSE,
  financing_options   TEXT[]      NOT NULL DEFAULT '{}',

  -- Médias
  image_url           TEXT,

  -- Session d'Information Collective (KazaEvent lié)
  info_session_id     UUID        REFERENCES events(id) ON DELETE SET NULL,

  -- Stats
  views               INT         NOT NULL DEFAULT 0,
  applications_count  INT         NOT NULL DEFAULT 0,

  is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_recruiter ON training_offers(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_training_active    ON training_offers(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_sector    ON training_offers(sector);

ALTER TABLE training_offers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON training_offers TO authenticated;
GRANT SELECT ON training_offers TO anon;

DROP POLICY IF EXISTS "training_read_all"      ON training_offers;
DROP POLICY IF EXISTS "training_insert_own"    ON training_offers;
DROP POLICY IF EXISTS "training_update_own"    ON training_offers;
DROP POLICY IF EXISTS "training_delete_own"    ON training_offers;

CREATE POLICY "training_read_all"
  ON training_offers FOR SELECT USING (is_active = true OR auth.uid() = recruiter_id);
CREATE POLICY "training_insert_own"
  ON training_offers FOR INSERT WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "training_update_own"
  ON training_offers FOR UPDATE USING (auth.uid() = recruiter_id);
CREATE POLICY "training_delete_own"
  ON training_offers FOR DELETE USING (auth.uid() = recruiter_id);

-- ── Table : candidatures formations ──────────────────────────────
CREATE TABLE IF NOT EXISTS training_applications (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  training_offer_id UUID        NOT NULL REFERENCES training_offers(id) ON DELETE CASCADE,
  candidate_id      UUID        NOT NULL REFERENCES profiles(id)        ON DELETE CASCADE,
  motivation        TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','viewed','accepted','rejected','withdrawn')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(training_offer_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_training_apps_candidate ON training_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_training_apps_offer     ON training_applications(training_offer_id);

ALTER TABLE training_applications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON training_applications TO authenticated;

DROP POLICY IF EXISTS "tapp_read_own"      ON training_applications;
DROP POLICY IF EXISTS "tapp_insert_own"    ON training_applications;
DROP POLICY IF EXISTS "tapp_update_own"    ON training_applications;
DROP POLICY IF EXISTS "tapp_read_recruiter" ON training_applications;

CREATE POLICY "tapp_read_own"
  ON training_applications FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "tapp_insert_own"
  ON training_applications FOR INSERT WITH CHECK (auth.uid() = candidate_id);
CREATE POLICY "tapp_update_own"
  ON training_applications FOR UPDATE USING (auth.uid() = candidate_id);
CREATE POLICY "tapp_read_recruiter"
  ON training_applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM training_offers t
    WHERE t.id = training_applications.training_offer_id
      AND t.recruiter_id = auth.uid()
  ));

-- ── Trigger : incrémenter applications_count ──────────────────────
CREATE OR REPLACE FUNCTION increment_training_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE training_offers
  SET applications_count = applications_count + 1
  WHERE id = NEW.training_offer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_training_application ON training_applications;
CREATE TRIGGER on_training_application
  AFTER INSERT ON training_applications
  FOR EACH ROW EXECUTE FUNCTION increment_training_applications_count();

-- ── Ajout type 'info_collective' aux events ───────────────────────
-- (si la contrainte CHECK existante le bloque, la supprimer d'abord)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE events ADD CONSTRAINT events_type_check
  CHECK (type IN ('job_dating','webinar','atelier','info_collective'));

SELECT 'training-formations.sql exécuté avec succès ✅' AS status;
