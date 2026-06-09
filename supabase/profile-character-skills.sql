-- ============================================================
-- KAZAJOB — Soft skills, hobbies & personnage candidat
-- Idempotent · compatible Supabase ET Neon (PostgreSQL standard)
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS soft_skills      TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hobbies          TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS character_domain TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender           TEXT;

-- Rappel (si pas déjà présentes) — avatar & gamification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gamification_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_config        JSONB;
