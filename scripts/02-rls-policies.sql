-- Row Level Security (RLS) Policies
-- Ensures users can only access their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_charity_selection ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE winner_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_contributions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Subscriptions table policies
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Golf scores table policies
CREATE POLICY "Users can view their own scores"
  ON golf_scores FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own scores"
  ON golf_scores FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own scores"
  ON golf_scores FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own scores"
  ON golf_scores FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all scores"
  ON golf_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Charities table policies (public read)
CREATE POLICY "Everyone can view charities"
  ON charities FOR SELECT
  USING (true);

CREATE POLICY "Admins can create charities"
  ON charities FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update charities"
  ON charities FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete charities"
  ON charities FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- User charity selection policies
CREATE POLICY "Users can view their own charity selection"
  ON user_charity_selection FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their charity selection"
  ON user_charity_selection FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their charity selection"
  ON user_charity_selection FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all charity selections"
  ON user_charity_selection FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Draws table policies (public read)
CREATE POLICY "Everyone can view published draws"
  ON draws FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can create draws"
  ON draws FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update draws"
  ON draws FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Draw results policies
CREATE POLICY "Everyone can view published draw results"
  ON draw_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM draws WHERE draws.id = draw_results.draw_id AND draws.status = 'published'
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage draw results"
  ON draw_results FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Winners table policies
CREATE POLICY "Users can view their own winners"
  ON winners FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all winners"
  ON winners FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update winners"
  ON winners FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Winner verification policies
CREATE POLICY "Users can view their own verifications"
  ON winner_verification FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM winners WHERE winners.id = winner_verification.winner_id AND winners.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own verifications"
  ON winner_verification FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM winners WHERE winners.id = winner_verification.winner_id AND winners.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all verifications"
  ON winner_verification FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update verifications"
  ON winner_verification FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Prize pools policies
CREATE POLICY "Everyone can view prize pools"
  ON prize_pools FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage prize pools"
  ON prize_pools FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admin logs policies (admin only)
CREATE POLICY "Admins can view admin logs"
  ON admin_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can insert admin logs"
  ON admin_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Charity contributions policies
CREATE POLICY "Everyone can view charity contributions"
  ON charity_contributions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage charity contributions"
  ON charity_contributions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));
