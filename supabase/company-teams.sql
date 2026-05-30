-- ═══════════════════════════════════════════════════════════════════
-- KAZAJOB — Company Teams, Subscriptions & Partners
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Storage bucket logos entreprises ───────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company-logos', 'company-logos', true, 2097152, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "company_logos_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "company_logos_auth_write"    ON storage.objects;

CREATE POLICY "company_logos_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "company_logos_auth_write"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

-- ── 2. Enrichissement table companies ─────────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_name   TEXT;          -- Raison sociale
ALTER TABLE companies ADD COLUMN IF NOT EXISTS siret        TEXT;          -- SIRET (14 chiffres)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone        TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address      TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city         TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS zip_code     TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS founded_year INT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_setup_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 3. Membres d'entreprise (groupe recruteurs) ───────────────────
CREATE TABLE IF NOT EXISTS company_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('owner','admin','member')) DEFAULT 'member',
  status       TEXT NOT NULL CHECK (status IN ('pending','active','suspended')) DEFAULT 'active',
  invited_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, recruiter_id)
);

-- ── 4. Demandes de rejoindre une entreprise ────────────────────────
CREATE TABLE IF NOT EXISTS company_join_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  message      TEXT,
  status       TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  reviewed_by  UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, recruiter_id)
);

-- ── 5. company_id sur profiles (lookup rapide) ───────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- ── 6. Plans tarifaires ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  price_cts    INT  NOT NULL,   -- centimes d'euro/mois (2900 = 29,00€)
  max_members  INT  NOT NULL,
  max_jobs     INT  NOT NULL,   -- -1 = illimité
  partners     TEXT[] NOT NULL DEFAULT '{}',
  api_access   BOOLEAN NOT NULL DEFAULT FALSE,
  trial_days   INT  NOT NULL DEFAULT 14,
  highlight    BOOLEAN NOT NULL DEFAULT FALSE,  -- badge "Populaire"
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO subscription_plans
  (id, name, price_cts, max_members, max_jobs, partners, api_access, highlight)
VALUES
  ('starter',    'Starter',    2900,  1,   3,
    ARRAY[]::TEXT[],
    FALSE, FALSE),
  ('pro',        'Pro',        8900,  3,  10,
    ARRAY['france_travail'],
    FALSE, TRUE),
  ('business',   'Business',  17900, 10,  -1,
    ARRAY['france_travail','mission_locale','apec'],
    FALSE, FALSE),
  ('enterprise', 'Entreprise',34900, 50,  -1,
    ARRAY['france_travail','mission_locale','apec','indeed','aggregator'],
    TRUE,  FALSE)
ON CONFLICT (id) DO NOTHING;

-- ── 7. Abonnements entreprises ────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id)          ON DELETE CASCADE,
  plan_id             TEXT NOT NULL REFERENCES subscription_plans(id),
  status              TEXT NOT NULL
    CHECK (status IN ('trial','active','cancelled','expired')) DEFAULT 'trial',
  trial_ends_at       TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ,
  seats_used          INT NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id)
);

-- ── 8. RLS ───────────────────────────────────────────────────────
ALTER TABLE company_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans    ENABLE ROW LEVEL SECURITY;

-- subscription_plans : lecture publique
DROP POLICY IF EXISTS "plans_read_all" ON subscription_plans;
CREATE POLICY "plans_read_all" ON subscription_plans FOR SELECT USING (true);

-- company_members : lecture pour les membres de la même entreprise
DROP POLICY IF EXISTS "members_read_own"     ON company_members;
DROP POLICY IF EXISTS "members_insert_owner" ON company_members;
DROP POLICY IF EXISTS "members_update_owner" ON company_members;
DROP POLICY IF EXISTS "members_delete_owner" ON company_members;
DROP POLICY IF EXISTS "members_admin_all"    ON company_members;

CREATE POLICY "members_read_own" ON company_members FOR SELECT
  USING (
    auth.uid() = recruiter_id OR
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
        AND cm.recruiter_id = auth.uid()
        AND cm.status = 'active'
    )
  );

CREATE POLICY "members_insert_owner" ON company_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
        AND cm.recruiter_id = auth.uid()
        AND cm.role IN ('owner','admin')
        AND cm.status = 'active'
    ) OR auth.uid() = recruiter_id
  );

CREATE POLICY "members_update_owner" ON company_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
        AND cm.recruiter_id = auth.uid()
        AND cm.role IN ('owner','admin')
    )
  );

CREATE POLICY "members_delete_owner" ON company_members FOR DELETE
  USING (
    auth.uid() = recruiter_id OR
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
        AND cm.recruiter_id = auth.uid()
        AND cm.role IN ('owner','admin')
    )
  );

CREATE POLICY "members_admin_all" ON company_members FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- company_join_requests
DROP POLICY IF EXISTS "jreq_read"   ON company_join_requests;
DROP POLICY IF EXISTS "jreq_insert" ON company_join_requests;
DROP POLICY IF EXISTS "jreq_update" ON company_join_requests;
DROP POLICY IF EXISTS "jreq_admin"  ON company_join_requests;

CREATE POLICY "jreq_read" ON company_join_requests FOR SELECT
  USING (
    auth.uid() = recruiter_id OR
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_join_requests.company_id
        AND cm.recruiter_id = auth.uid()
        AND cm.role IN ('owner','admin')
    )
  );

CREATE POLICY "jreq_insert" ON company_join_requests FOR INSERT
  WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "jreq_update" ON company_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_join_requests.company_id
        AND cm.recruiter_id = auth.uid()
        AND cm.role IN ('owner','admin')
    )
  );

CREATE POLICY "jreq_admin" ON company_join_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- company_subscriptions
DROP POLICY IF EXISTS "sub_read_member"  ON company_subscriptions;
DROP POLICY IF EXISTS "sub_insert_owner" ON company_subscriptions;
DROP POLICY IF EXISTS "sub_update_owner" ON company_subscriptions;
DROP POLICY IF EXISTS "sub_admin"        ON company_subscriptions;

CREATE POLICY "sub_read_member" ON company_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_subscriptions.company_id
        AND cm.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "sub_insert_owner" ON company_subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_subscriptions.company_id
        AND cm.recruiter_id = auth.uid()
        AND cm.role = 'owner'
    )
  );

CREATE POLICY "sub_update_owner" ON company_subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_subscriptions.company_id
        AND cm.recruiter_id = auth.uid()
        AND cm.role IN ('owner','admin')
    )
  );

CREATE POLICY "sub_admin" ON company_subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 9. Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_company_members_company    ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_recruiter  ON company_members(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_company_jreq_company       ON company_join_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id        ON profiles(company_id);

SELECT 'company-teams.sql exécuté avec succès ✅' AS status;
