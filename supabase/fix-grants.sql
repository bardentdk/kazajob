-- ═══════════════════════════════════════════════════════════════════
-- KAZAJOB — Fix permissions (GRANT) pour les nouvelles tables
-- À exécuter dans l'éditeur SQL Supabase
-- ═══════════════════════════════════════════════════════════════════

-- ── Tables créées dans new-features.sql ───────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON events               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_registrations  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON referrals            TO authenticated;
GRANT SELECT                          ON subscription_plans  TO anon, authenticated;

-- ── Tables créées dans company-teams.sql ──────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON company_members       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON company_join_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON company_subscriptions TO authenticated;

-- ── Séquences UUID (si gen_random_uuid() via extension) ───────────
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ── Vérification rapide ───────────────────────────────────────────
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('events','event_registrations','referrals','company_members','subscription_plans')
  AND grantee = 'authenticated'
ORDER BY table_name;
