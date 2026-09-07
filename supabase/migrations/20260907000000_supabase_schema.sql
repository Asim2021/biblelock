-- ==============================================================================
-- BIBLE UNLOCK: Supabase Database Schema Migration
-- Features: Profiles, Daily Reading Sessions, Row Level Security, Triggers
-- ==============================================================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE NOT NULL,
  daily_goal_minutes INTEGER DEFAULT 10 NOT NULL,
  translation TEXT DEFAULT 'WEB' NOT NULL CHECK (translation IN ('WEB', 'KJV')),
  blocked_apps JSONB DEFAULT '["com.instagram.android","com.zhiliaoapp.musically","com.google.android.youtube","com.twitter.android","com.reddit.frontpage"]'::jsonb NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  last_read_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create Reading Sessions Table (Daily Reading History & Streaks)
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  seconds_read INTEGER DEFAULT 0 NOT NULL,
  goal_minutes INTEGER DEFAULT 10 NOT NULL,
  is_goal_met BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_reading_date UNIQUE (user_id, date)
);

-- 3. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_date 
  ON public.reading_sessions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_streak 
  ON public.profiles(current_streak DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to ensure idempotency
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Users can insert own reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Users can update own reading sessions" ON public.reading_sessions;

-- 5. Profiles RLS Policies (Tenant Isolation)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. Reading Sessions RLS Policies
CREATE POLICY "Users can view own reading sessions"
  ON public.reading_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading sessions"
  ON public.reading_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading sessions"
  ON public.reading_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Automated Timestamps Function & Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_reading_sessions_updated_at ON public.reading_sessions;
CREATE TRIGGER tr_reading_sessions_updated_at
  BEFORE UPDATE ON public.reading_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Automatic Profile Provisioning on User Signup / SSO Login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Extract name from OAuth metadata (Google, Apple, or custom)
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    SPLIT_PART(NEW.email, '@', 1),
    'Disciple'
  );

  -- Extract avatar from OAuth metadata
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    avatar_url,
    is_premium,
    daily_goal_minutes,
    translation,
    current_streak,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_avatar_url,
    FALSE,
    10,
    'WEB',
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
