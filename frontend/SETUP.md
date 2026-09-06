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

Bible Unlock uses Supabase for user authentication (Google & Apple SSO) and syncing reading streaks, goals, and profiles.

### Step 2.1: Run the Database Migration
In your Supabase project dashboard, navigate to the **SQL Editor** and run the following schema:

```sql
-- 1. Create Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  daily_goal_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Automatic User Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Disciple'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 2.2: Configure Authentication Providers
1. Go to **Authentication** → **Providers**.
2. Enable **Google**:
   - Client ID & Client Secret from Google Cloud Console.
3. Enable **Apple**:
   - Service ID, Team ID, Key ID, and Private Key from Apple Developer Portal.
4. Add your redirect URI: `bibleunlock://auth/callback` in **URL Configuration** → **Redirect URLs**.

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
