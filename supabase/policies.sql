-- ============================================================
-- KAZAJOB — Row Level Security (RLS) Policies
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills       ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages         ENABLE ROW LEVEL SECURITY;

-- ── Profiles ─────────────────────────────────────────────────
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ── Companies ─────────────────────────────────────────────────
CREATE POLICY "Companies are viewable by everyone"
  ON companies FOR SELECT USING (true);

CREATE POLICY "Recruiters can manage their companies"
  ON companies FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all companies"
  ON companies FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Jobs ──────────────────────────────────────────────────────
CREATE POLICY "Active jobs are viewable by everyone"
  ON jobs FOR SELECT USING (is_active = true OR recruiter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Recruiters can manage their jobs"
  ON jobs FOR INSERT WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update their jobs"
  ON jobs FOR UPDATE USING (auth.uid() = recruiter_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Recruiters can delete their jobs"
  ON jobs FOR DELETE USING (auth.uid() = recruiter_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Job Skills ────────────────────────────────────────────────
CREATE POLICY "Job skills viewable by all"
  ON job_skills FOR SELECT USING (true);

CREATE POLICY "Recruiters can manage job skills"
  ON job_skills FOR ALL USING (
    EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND recruiter_id = auth.uid())
  );

-- ── Candidate Skills ──────────────────────────────────────────
CREATE POLICY "Candidate skills viewable by all"
  ON candidate_skills FOR SELECT USING (true);

CREATE POLICY "Candidates manage own skills"
  ON candidate_skills FOR ALL USING (auth.uid() = candidate_id);

-- ── Applications ──────────────────────────────────────────────
CREATE POLICY "Candidates see their own applications"
  ON applications FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters see applications for their jobs"
  ON applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND recruiter_id = auth.uid())
  );

CREATE POLICY "Admins see all applications"
  ON applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Candidates can apply"
  ON applications FOR INSERT WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Recruiters can update application status"
  ON applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND recruiter_id = auth.uid())
  );

-- ── Favorites ─────────────────────────────────────────────────
CREATE POLICY "Candidates see their own favorites"
  ON favorites FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates manage their favorites"
  ON favorites FOR ALL USING (auth.uid() = candidate_id);

-- ── Conversations ─────────────────────────────────────────────
CREATE POLICY "Users see their conversations"
  ON conversations FOR SELECT USING (
    auth.uid() = candidate_id OR auth.uid() = recruiter_id
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT WITH CHECK (
    auth.uid() = candidate_id OR auth.uid() = recruiter_id
  );

CREATE POLICY "Users can update conversations they're part of"
  ON conversations FOR UPDATE USING (
    auth.uid() = candidate_id OR auth.uid() = recruiter_id
  );

-- ── Messages ──────────────────────────────────────────────────
CREATE POLICY "Users see messages in their conversations"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (candidate_id = auth.uid() OR recruiter_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (candidate_id = auth.uid() OR recruiter_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (candidate_id = auth.uid() OR recruiter_id = auth.uid())
    )
  );

-- Skills table (public read)
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);

-- ── Enable Realtime for messages ──────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
