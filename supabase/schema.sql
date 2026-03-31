-- supabase/schema.sql
-- Complete Supabase PostgreSQL Schema for Golf Charity Subscription Platform

-- ==========================================
-- 0. CLEANUP (Idempotency)
-- ==========================================
DROP TABLE IF EXISTS charities CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS draws CASCADE;
DROP TABLE IF EXISTS winnings CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS draw_status CASCADE;
DROP TYPE IF EXISTS winnings_status CASCADE;
DROP TYPE IF EXISTS draw_type_enum CASCADE;

-- Create enum for User Roles
CREATE TYPE user_role AS ENUM ('public', 'subscriber', 'admin');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'unpaid', 'incomplete');
CREATE TYPE draw_status AS ENUM ('pending', 'completed');
CREATE TYPE winnings_status AS ENUM ('pending_verification', 'approved', 'rejected', 'paid');
CREATE TYPE draw_type_enum AS ENUM ('random', 'algorithmic');

-- ==========================================
-- 1. BASE TABLES DEPLOYMENT
-- ==========================================

-- CHARITIES TABLE 
CREATE TABLE charities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    website_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- PROFILES TABLE
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'public',
    selected_charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
    charity_percentage NUMERIC DEFAULT 10.0 CHECK (charity_percentage >= 10.0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- SUBSCRIPTIONS TABLE
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    status subscription_status DEFAULT 'incomplete',
    plan_type TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- SCORES TABLE
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45), -- Stableford
    score_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- DRAWS TABLE
CREATE TABLE draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date TIMESTAMPTZ DEFAULT now(),
    prize_pool NUMERIC DEFAULT 0,
    status draw_status DEFAULT 'pending',
    draw_type draw_type_enum DEFAULT 'random',
    jackpot_carried_forward NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- WINNINGS TABLE
CREATE TABLE winnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    match_tier INTEGER CHECK (match_tier IN (3, 4, 5)),
    amount NUMERIC NOT NULL,
    status winnings_status DEFAULT 'pending_verification',
    proof_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE winnings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. SECURITY BYPASS (PREVENTS INFINITE RECURSION)
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 4. RLS POLICIES
-- ==========================================

-- Charities Policies
CREATE POLICY "Charities are viewable by everyone" ON charities FOR SELECT USING (true);
CREATE POLICY "Only admins can insert charities" ON charities FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update charities" ON charities FOR UPDATE USING (is_admin());

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Subscriptions Policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all subscriptions" ON subscriptions FOR SELECT USING (is_admin());

-- Scores Policies
CREATE POLICY "Users can manage their own scores" ON scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all scores" ON scores FOR SELECT USING (is_admin());

-- Draws Policies
CREATE POLICY "Draws viewable by everyone" ON draws FOR SELECT USING (true);
CREATE POLICY "Admins manage draws" ON draws FOR ALL USING (is_admin());

-- Winnings Policies
CREATE POLICY "Users view own winnings" ON winnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload winning proof" ON winnings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage winnings" ON winnings FOR ALL USING (is_admin());


-- ==========================================
-- 5. TRIGGERS AND FUNCTIONS
-- ==========================================

-- Trigger to create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'subscriber');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROLLING 5-SCORE LOGIC
CREATE OR REPLACE FUNCTION enforce_rolling_5_scores()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM scores
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id
    FROM scores
    WHERE user_id = NEW.user_id
    ORDER BY score_date DESC, created_at DESC
    LIMIT 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_enforce_rolling_5_scores
AFTER INSERT OR UPDATE ON scores
FOR EACH ROW
EXECUTE FUNCTION enforce_rolling_5_scores();

-- MONTHLY DRAW LOGIC
CREATE OR REPLACE FUNCTION execute_monthly_draw(
    p_draw_type draw_type_enum,
    p_alloc_per_sub NUMERIC,
    p_previous_jackpot NUMERIC DEFAULT 0
) RETURNS UUID AS $$
DECLARE
    v_active_subs INT;
    v_prize_pool NUMERIC;
    v_draw_id UUID;
    v_tier_5_pool NUMERIC;
    v_tier_4_pool NUMERIC;
    v_tier_3_pool NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_active_subs
    FROM subscriptions
    WHERE status = 'active';

    v_prize_pool := (v_active_subs * p_alloc_per_sub) + p_previous_jackpot;
    v_tier_5_pool := v_prize_pool * 0.40;
    v_tier_4_pool := v_prize_pool * 0.35;
    v_tier_3_pool := v_prize_pool * 0.25;

    INSERT INTO draws (prize_pool, status, draw_type, jackpot_carried_forward)
    VALUES (v_prize_pool, 'completed', p_draw_type, p_previous_jackpot)
    RETURNING id INTO v_draw_id;

    RETURN v_draw_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
