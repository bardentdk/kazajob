-- ============================================================
-- KAZAJOB — Video Pitch + KazaScore
-- ============================================================

-- ── Bucket vidéo ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('video-pitches', 'video-pitches', false, 52428800,
  ARRAY['video/webm','video/mp4','video/ogg','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Candidats uploadent leur pitch"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'video-pitches' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidats voient leur pitch"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'video-pitches' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Recruteurs voient les pitchs des candidats ayant postulé"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'video-pitches' AND
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.recruiter_id = auth.uid()
        AND a.candidate_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Candidats suppriment leur pitch"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'video-pitches' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── Colonne video_pitch_url ───────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS video_pitch_url TEXT;

-- ── KazaScore — fonction de calcul ───────────────────────────
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
BEGIN
  -- Toutes les candidatures sur les offres du recruteur
  SELECT COUNT(*) INTO v_total
  FROM applications a
  JOIN jobs j ON a.job_id = j.id
  WHERE j.recruiter_id = p_recruiter_id
    AND a.created_at > NOW() - INTERVAL '90 days';

  IF v_total = 0 THEN
    RETURN QUERY SELECT 0, 'Nouveau recruteur'::TEXT, 0, 0, 0.0::NUMERIC, 0;
    RETURN;
  END IF;

  -- Candidatures avec une réponse (status != pending)
  SELECT COUNT(*) INTO v_responded
  FROM applications a
  JOIN jobs j ON a.job_id = j.id
  WHERE j.recruiter_id = p_recruiter_id
    AND a.status != 'pending'
    AND a.created_at > NOW() - INTERVAL '90 days';

  -- Délai moyen de réponse (heures) entre created_at et updated_at
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at)) / 3600), 0)
  INTO v_avg_hours
  FROM applications a
  JOIN jobs j ON a.job_id = j.id
  WHERE j.recruiter_id = p_recruiter_id
    AND a.status != 'pending'
    AND a.created_at > NOW() - INTERVAL '90 days';

  -- Candidatures avec entretien
  SELECT COUNT(*) INTO v_interviews
  FROM applications a
  JOIN jobs j ON a.job_id = j.id
  WHERE j.recruiter_id = p_recruiter_id
    AND a.status IN ('interview','offer','hired')
    AND a.created_at > NOW() - INTERVAL '90 days';

  -- Score : réactivité 50% + rapidité 30% + progression 20%
  DECLARE
    rate_score    INTEGER := LEAST(100, ROUND((v_responded::NUMERIC / v_total) * 100));
    speed_score   INTEGER := CASE
      WHEN v_avg_hours <= 24  THEN 100
      WHEN v_avg_hours <= 48  THEN 80
      WHEN v_avg_hours <= 96  THEN 60
      WHEN v_avg_hours <= 168 THEN 40
      ELSE 20
    END;
    interv_score  INTEGER := LEAST(100, ROUND((v_interviews::NUMERIC / GREATEST(v_responded,1)) * 100));
  BEGIN
    v_score := ROUND(rate_score * 0.5 + speed_score * 0.3 + interv_score * 0.2);
  END;

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
