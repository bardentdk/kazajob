-- ============================================================
-- KAZAJOB — Notifications realtime + email alerts
-- Coller dans Supabase SQL Editor
-- ============================================================

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,   -- 'application_status' | 'new_job_match' | 'interview_scheduled' | 'application_withdrawn'
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  data       JSONB,           -- payload optionnel (ex: { jobId, applicationId })
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs voient leurs notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Utilisateurs marquent leurs notifications comme lues"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ── Email alerts toggle ────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_alerts_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_alert_frequency  TEXT NOT NULL DEFAULT 'daily'
    CHECK (email_alert_frequency IN ('instant','daily','weekly'));

-- ── Trigger : notification auto au changement de statut candidature ──
CREATE OR REPLACE FUNCTION notify_application_status()
RETURNS TRIGGER AS $$
DECLARE
  job_title TEXT;
  company_name TEXT;
  status_label TEXT;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  SELECT j.title, c.name INTO job_title, company_name
  FROM jobs j LEFT JOIN companies c ON c.id = j.company_id
  WHERE j.id = NEW.job_id;

  status_label := CASE NEW.status
    WHEN 'viewed'    THEN 'Ton CV a été consulté'
    WHEN 'interview' THEN 'Entretien planifié'
    WHEN 'offer'     THEN 'Offre reçue'
    WHEN 'hired'     THEN 'Félicitations — tu es embauché(e) !'
    WHEN 'rejected'  THEN 'Candidature non retenue'
    WHEN 'withdrawn' THEN 'Candidature retirée'
    ELSE 'Mise à jour de ta candidature'
  END;

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.candidate_id,
    'application_status',
    status_label,
    COALESCE(job_title, 'Poste') || ' — ' || COALESCE(company_name, 'Entreprise'),
    jsonb_build_object('applicationId', NEW.id, 'jobId', NEW.job_id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_status_change ON applications;
CREATE TRIGGER on_application_status_change
  AFTER UPDATE OF status ON applications
  FOR EACH ROW EXECUTE FUNCTION notify_application_status();

-- ── Trigger : notification entretien planifié ─────────────────
CREATE OR REPLACE FUNCTION notify_interview_created()
RETURNS TRIGGER AS $$
DECLARE
  job_title TEXT;
  scheduled_label TEXT;
BEGIN
  SELECT title INTO job_title FROM jobs WHERE id = NEW.job_id;

  scheduled_label := TO_CHAR(NEW.scheduled_at AT TIME ZONE 'Indian/Reunion', 'DD/MM/YYYY à HH24:MI');

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.candidate_id,
    'interview_scheduled',
    'Entretien planifié',
    COALESCE(job_title, 'Entretien') || ' — ' || scheduled_label,
    jsonb_build_object('interviewId', NEW.id, 'scheduledAt', NEW.scheduled_at)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_interview_created ON interviews;
CREATE TRIGGER on_interview_created
  AFTER INSERT ON interviews
  FOR EACH ROW EXECUTE FUNCTION notify_interview_created();

-- ── Fonction service : créer une notif manuellement ──────────
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type    TEXT,
  p_title   TEXT,
  p_message TEXT,
  p_data    JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
