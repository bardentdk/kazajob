-- ============================================================
-- KAZAJOB — Fix permissions (403 Forbidden)
-- Coller dans Supabase SQL Editor et exécuter
-- ============================================================

-- 1. Accorder les droits d'accès aux rôles Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. S'assurer que le trigger utilise bien le rôle passé en metadata
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
    SET
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      role      = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Corriger manuellement le rôle d'un compte existant si nécessaire
-- (remplacer l'email par celui du compte recruteur créé)
-- UPDATE profiles SET role = 'recruiter' WHERE email = 'ton@email.re';
