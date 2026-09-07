# Bible Unlock — Complete Setup & Deployment Guide

Welcome to **Bible Unlock**! This document provides end-to-end instructions for configuring Supabase, RevenueCat, native platform capabilities (iOS Screen Time and Android Accessibility Service), and building the mobile application for physical testing and production release.

---

## 1. System Architecture (QuranUnlock-Proven Model)

Bible Unlock helps users replace social media doomscrolling with daily Scripture reflection. Apps stay shielded until a daily Bible reading goal (e.g., 10 minutes) is completed in the offline reader.

| Platform | Native Mechanism | Permission Required | Offline? | Battery Impact |
|---|---|---|---|---|
| **iOS** | Apple Screen Time API (`FamilyControls`, `ManagedSettingsStore`, `DeviceActivityMonitor`) | FamilyControls Entitlement | 100% On-Device | Zero |
| **Android** | Android `AccessibilityService` (`TYPE_WINDOW_STATE_CHANGED`) | Accessibility Permission (`BIND_ACCESSIBILITY_SERVICE`) | 100% On-Device | Negligible |

---

## 2. Supabase Backend Setup

Bible Unlock uses Supabase for user authentication (Google & Apple SSO) and syncing reading streaks, goals, profiles, and daily reading sessions.

### Step 2.1: Run the Database Migration
You can run the migration via Supabase CLI (`npx supabase db push`) or copy and paste the migration script from [supabase/migrations/20260907000000_supabase_schema.sql](file:///d:/My%20Projects/bibleunlock.app/supabase/migrations/20260907000000_supabase_schema.sql) directly into the **SQL Editor** in your Supabase project dashboard:

```sql
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
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    SPLIT_PART(NEW.email, '@', 1),
    'Disciple'
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  INSERT INTO public.profiles (
    id, email, display_name, avatar_url, is_premium, daily_goal_minutes, translation, current_streak, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, v_display_name, v_avatar_url, FALSE, 10, 'WEB', 0, NOW(), NOW()
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
```

### Step 2.2: Configure URL Redirects for SSO
In your Supabase project dashboard:
1. Navigate to **Authentication** → **URL Configuration**.
2. Set **Site URL** to:
   ```text
   bibleunlock://auth/callback
   ```
3. In **Redirect URLs**, add:
   - `bibleunlock://*`
   - `bibleunlock://auth/callback`
   - `https://bkhldxyzmwgrybozqqve.supabase.co/auth/v1/callback`

### Step 2.3: Configure Google & Apple Authentication Providers
1. Go to **Authentication** → **Providers**.
2. **Google**:
   - Enable Google provider.
   - Enter **Client ID** and **Client Secret** from your Google Cloud Console OAuth 2.0 Client.
   - Add Supabase's callback URL (`https://bkhldxyzmwgrybozqqve.supabase.co/auth/v1/callback`) to your Google Cloud Console "Authorized redirect URIs".
3. **Apple**:
   - Enable Apple provider.
   - Enter **Service ID** (e.g., `com.bibleunlock.app.signin`), **Team ID**, **Key ID**, and **Private Key** (.p8 file) from Apple Developer Portal.
   - In Apple Developer Portal under "Sign in with Apple", add `https://bkhldxyzmwgrybozqqve.supabase.co/auth/v1/callback` as an Authorized Return URL.

---

## 3. RevenueCat In-App Purchases Setup

1. Create a project in [RevenueCat](https://app.revenuecat.com/).
2. Under **Project Settings** → **Apps**, add:
   - Apple App Store app (Bundle ID: `com.bibleunlock.app`)
   - Google Play Store app (Package: `com.bibleunlock.app`)
3. Under **Entitlements**:
   - Create an entitlement with identifier `premium`.
4. Under **Products / Offerings**:
   - Create `monthly` ($4.99/mo), `annual` ($29.99/yr), and `lifetime` ($49.99) products.
   - Attach them to the `default` offering and link to the `premium` entitlement.
5. Under **API Keys**:
   - Copy the iOS Public SDK key (`appl_...`)
   - Copy the Android Public SDK key (`goog_...`)

---

## 4. Environment Configuration

Create or update `.env` in the `frontend/` directory:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# RevenueCat
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_your_apple_key
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_your_google_key
```

---

## 5. iOS Platform Setup (Screen Time / FamilyControls)

> [!IMPORTANT]
> Apple requires an approved **FamilyControls entitlement** for distribution on the App Store.

1. **Request the Entitlement**:
   - Go to [Apple Developer Portal Request Form](https://developer.apple.com/contact/request/family-controls-distribution/).
   - Justify your app as a "Digital Wellbeing / Habit Formation" tool.
2. **For Development & Testing**:
   - In Xcode, select the main target → **Signing & Capabilities** → **+ Capability** → **Family Controls (Development Only)**.
3. **App Extensions**:
   - The `react-native-device-activity` config plugin automatically registers:
     - `ShieldConfiguration` (custom shield appearance)
     - `ShieldAction` (action buttons on shields)
     - `ActivityMonitorExtension` (on-device event monitor)
   - Sharing is managed via App Group `group.com.bibleunlock.app`.

---

## 6. Android Platform Setup (Accessibility Service)

1. **Custom Module**:
   - The native module is located in `frontend/modules/android-blocker/`.
   - It registers `BlockerAccessibilityService` listening for `TYPE_WINDOW_STATE_CHANGED`.
2. **Testing on Device**:
   - Install the debug APK or run via `npx expo run:android`.
   - On the Android device, go to **Settings** → **Accessibility** → **Downloaded apps** → **Bible Unlock Shield** → **Turn ON**.
3. **Google Play Store Policy Justification**:
   - Category: "Digital Wellbeing & Parental Controls".
   - State clearly in the declaration: "AccessibilityService is used solely to detect when designated distraction apps are opened in the foreground to redirect users to their daily Bible reading session, promoting digital health. No keystrokes or content are collected or stored."

---

## 7. Prebuilding and Running

Since both MMKV and native blockers require native code, build a development client or native project:

```bash
# Clean prebuild generating /ios and /android folders
cd frontend
npx expo prebuild --clean

# Run on iOS (requires macOS + Xcode)
npx expo run:ios

# Run on Android
npx expo run:android
```

---

## 8. Built-in Testing & Developer Tools

In `Settings` tab under **Account & Diagnostics**:
- **Reset Reading Progress**: Clears today's reading counter to 00:00 and reactivates app shields.
- **Simulate Pro / Free**: Toggles Pro status locally to preview paywall gating and custom app selection without requiring real App Store sandbox accounts.
- **Continue as Guest**: Instant access on the Login screen for 100% offline usage.
