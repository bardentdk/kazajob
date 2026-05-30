-- ═══════════════════════════════════════════════════════════════════
-- KAZAJOB — Nouvelles features (Batch 1→4)
-- À exécuter dans l'éditeur SQL Supabase
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. KazaBoost Candidat ─────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ;

-- ── 2. Parrainage communautaire ────────────────────────────────────
-- Code de parrainage unique par profil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Générer un code pour les profils existants (idempotent)
UPDATE profiles
SET referral_code = upper(substr(md5(random()::text || id::text), 0, 9))
WHERE referral_code IS NULL;

-- Table des parrainages
CREATE TABLE IF NOT EXISTS referrals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rewarded    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referred_id)   -- un filleul ne peut avoir qu'un parrain
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_select_own"      ON referrals;
DROP POLICY IF EXISTS "referrals_insert_referred"  ON referrals;

CREATE POLICY "referrals_select_own"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "referrals_insert_referred"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

-- ── 3. KazaEvents — Job Dating numérique ──────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  type              TEXT NOT NULL CHECK (type IN ('job_dating', 'webinar', 'atelier')),
  date              TIMESTAMPTZ NOT NULL,
  duration_minutes  INT NOT NULL DEFAULT 60,
  max_participants  INT NOT NULL DEFAULT 50,
  location          TEXT NOT NULL DEFAULT 'En ligne',
  jitsi_room        TEXT,
  is_published      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, candidate_id)
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Drop avant recréation (idempotent)
DROP POLICY IF EXISTS "events_select_published"     ON events;
DROP POLICY IF EXISTS "events_insert_organizer"     ON events;
DROP POLICY IF EXISTS "events_update_organizer"     ON events;
DROP POLICY IF EXISTS "events_delete_organizer"     ON events;
DROP POLICY IF EXISTS "event_reg_select_own"        ON event_registrations;
DROP POLICY IF EXISTS "event_reg_insert_candidate"  ON event_registrations;
DROP POLICY IF EXISTS "event_reg_delete_candidate"  ON event_registrations;
DROP POLICY IF EXISTS "event_reg_select_organizer"  ON event_registrations;

-- Events : tout le monde peut lire les publiés
CREATE POLICY "events_select_published"
  ON events FOR SELECT
  USING (is_published = true OR auth.uid() = organizer_id);

-- Events : seul l'organisateur peut créer/modifier/supprimer
CREATE POLICY "events_insert_organizer"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "events_update_organizer"
  ON events FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "events_delete_organizer"
  ON events FOR DELETE
  USING (auth.uid() = organizer_id);

-- Registrations
CREATE POLICY "event_reg_select_own"
  ON event_registrations FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "event_reg_insert_candidate"
  ON event_registrations FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "event_reg_delete_candidate"
  ON event_registrations FOR DELETE
  USING (auth.uid() = candidate_id);

-- L'organisateur peut lire les inscriptions à ses événements
CREATE POLICY "event_reg_select_organizer"
  ON event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
        AND events.organizer_id = auth.uid()
    )
  );

-- ── 4. Trigger XP Parrainage (+200 XP pour les deux parties) ──────
CREATE OR REPLACE FUNCTION reward_referral()
RETURNS TRIGGER AS $$
BEGIN
  -- Récompenser le parrain
  UPDATE profiles SET xp = xp + 200 WHERE id = NEW.referrer_id;
  -- Récompenser le filleul
  UPDATE profiles SET xp = xp + 200 WHERE id = NEW.referred_id;
  -- Marquer comme récompensé
  NEW.rewarded = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_reward_referral ON referrals;
CREATE TRIGGER trg_reward_referral
  BEFORE INSERT ON referrals
  FOR EACH ROW EXECUTE FUNCTION reward_referral();

-- ── 5. Trigger : attribuer XP boost au recruteur sur KazaScore ────
-- (Déjà couvert par compute_kaza_score, pas de trigger nécessaire)

-- ── 6. Index performance ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_date       ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_organizer  ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- ── 7. Boosted candidates : vues prioritaires ─────────────────────
-- Vue optionnelle pour trier les candidats boostés en premier
CREATE OR REPLACE VIEW boosted_candidates AS
  SELECT *, (boosted_until IS NOT NULL AND boosted_until > NOW()) AS is_boosted_active
  FROM profiles
  WHERE role = 'candidate'
  ORDER BY is_boosted_active DESC, xp DESC;

-- Fin des migrations
SELECT 'Migrations new-features.sql exécutées avec succès ✅' AS status;
