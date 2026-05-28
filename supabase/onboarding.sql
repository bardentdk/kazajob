-- ============================================================
-- KAZAJOB — Onboarding & CV Builder
-- Coller dans Supabase SQL Editor
-- ============================================================

-- Colonnes onboarding sur profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS avatar_category       TEXT,          -- ex: 'tech', 'sante', 'btp'
  ADD COLUMN IF NOT EXISTS avatar_categories     TEXT[],        -- plusieurs catégories
  ADD COLUMN IF NOT EXISTS cv_template           TEXT DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS cv_color              TEXT DEFAULT '#FF6B35',
  ADD COLUMN IF NOT EXISTS cv_data               JSONB;         -- données CV structurées

-- Pour les profils existants, marquer onboarding comme complété
-- (ne pas forcer le flux pour les comptes déjà créés)
UPDATE profiles SET onboarding_completed = TRUE
WHERE created_at < NOW() - INTERVAL '1 minute';
