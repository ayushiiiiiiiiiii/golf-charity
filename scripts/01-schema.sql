-- Golf Charity Platform Database Schema
-- Phase 1: Core Tables and Structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'pending')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  amount_paid DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stripe_subscription_id)
);

-- Golf scores table (rolling 5-score window)
CREATE TABLE IF NOT EXISTS golf_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Charities table
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(2048),
  website VARCHAR(2048),
  impact_area VARCHAR(255),
  region VARCHAR(255),
  is_featured BOOLEAN DEFAULT false,
  is_spotlight BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User charity selection
CREATE TABLE IF NOT EXISTS user_charity_selection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE RESTRICT,
  contribution_percentage SMALLINT NOT NULL DEFAULT 10 CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Draws table (monthly draws)
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_month DATE NOT NULL UNIQUE,
  draw_numbers INTEGER[] NOT NULL DEFAULT '{}',
  total_participants INTEGER DEFAULT 0,
  total_prize_pool DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published', 'archived')),
  generated_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Draw results by tier
CREATE TABLE IF NOT EXISTS draw_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  tier INTEGER NOT NULL CHECK (tier IN (3, 4, 5)),
  number_of_winners INTEGER DEFAULT 0,
  prize_per_winner DECIMAL(15, 2) DEFAULT 0,
  total_tier_prize DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(draw_id, tier)
);

-- Winners table
CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  tier INTEGER NOT NULL CHECK (tier IN (3, 4, 5)),
  matched_numbers INTEGER[] NOT NULL DEFAULT '{}',
  prize_amount DECIMAL(15, 2) NOT NULL,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  verification_submitted_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, draw_id, tier)
);

-- Winner verification submissions
CREATE TABLE IF NOT EXISTS winner_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  winner_id UUID NOT NULL REFERENCES winners(id) ON DELETE CASCADE,
  proof_image_url VARCHAR(2048) NOT NULL,
  admin_notes TEXT,
  admin_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prize pools (monthly totals for tracking)
CREATE TABLE IF NOT EXISTS prize_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_subscriptions INTEGER DEFAULT 0,
  monthly_fee_per_subscriber DECIMAL(10, 2),
  total_pool DECIMAL(15, 2) DEFAULT 0,
  tier_5_pool DECIMAL(15, 2) DEFAULT 0,
  tier_4_pool DECIMAL(15, 2) DEFAULT 0,
  tier_3_pool DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(draw_id)
);

-- Admin audit logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Charity contributions tracking
CREATE TABLE IF NOT EXISTS charity_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_contribution DECIMAL(15, 2) DEFAULT 0,
  number_of_contributors INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(charity_id, month)
);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_golf_scores_user_id ON golf_scores(user_id);
CREATE INDEX idx_golf_scores_date ON golf_scores(score_date);
CREATE INDEX idx_user_charity_selection_user_id ON user_charity_selection(user_id);
CREATE INDEX idx_user_charity_selection_charity_id ON user_charity_selection(charity_id);
CREATE INDEX idx_draws_month ON draws(draw_month);
CREATE INDEX idx_draw_results_draw_id ON draw_results(draw_id);
CREATE INDEX idx_winners_user_id ON winners(user_id);
CREATE INDEX idx_winners_draw_id ON winners(draw_id);
CREATE INDEX idx_winners_verification_status ON winners(verification_status);
CREATE INDEX idx_winner_verification_winner_id ON winner_verification(winner_id);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX idx_charity_contributions_charity_id ON charity_contributions(charity_id);
CREATE INDEX idx_charity_contributions_month ON charity_contributions(month);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_golf_scores_updated_at BEFORE UPDATE ON golf_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charities_updated_at BEFORE UPDATE ON charities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_charity_selection_updated_at BEFORE UPDATE ON user_charity_selection
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_draws_updated_at BEFORE UPDATE ON draws
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_draw_results_updated_at BEFORE UPDATE ON draw_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_winners_updated_at BEFORE UPDATE ON winners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_winner_verification_updated_at BEFORE UPDATE ON winner_verification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prize_pools_updated_at BEFORE UPDATE ON prize_pools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charity_contributions_updated_at BEFORE UPDATE ON charity_contributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
