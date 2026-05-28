-- ============================================================
-- KAZAJOB — Supabase Storage : buckets & policies
-- Coller dans Supabase SQL Editor et exécuter
-- ============================================================

-- 1. Créer les buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('cvs',     'cvs',     false, 10485760, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- 2. Policies avatars (public read, auth write)
CREATE POLICY "Avatars sont publics"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Utilisateurs peuvent uploader leur avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Utilisateurs peuvent mettre a jour leur avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Utilisateurs peuvent supprimer leur avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Policies CVs (auth only)
CREATE POLICY "Candidats voient leur propre CV"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Recruteurs peuvent voir les CVs des candidats qui ont postule"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cvs' AND
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.recruiter_id = auth.uid()
      AND a.candidate_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Candidats peuvent uploader leur CV"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidats peuvent mettre a jour leur CV"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidats peuvent supprimer leur CV"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
