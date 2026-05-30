-- ═══════════════════════════════════════════════════════════════════
-- KAZAJOB — Jobs : auteur de publication + anonymat
-- À exécuter dans l'éditeur SQL Supabase
-- ═══════════════════════════════════════════════════════════════════

-- Auteur de la publication (recruteur dans l'organisation)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES profiles(id);

-- Publication anonyme (cache le nom de l'entreprise aux candidats)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill : les offres existantes ont published_by = recruiter_id
UPDATE jobs SET published_by = recruiter_id WHERE published_by IS NULL;

-- Index pour les requêtes par auteur
CREATE INDEX IF NOT EXISTS idx_jobs_published_by ON jobs(published_by);

SELECT 'fix-jobs-published.sql exécuté ✅' AS status;
