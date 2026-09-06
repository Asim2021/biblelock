# Project Charter & Baseline Specifications

## 1. Project Overview & Origin

- **Project Name:** Bible Unlock
- **Created Date:** 2026-09-06
- **Target Audience:** Christians and individuals seeking to cultivate daily Scripture reading habits by breaking phone and social media addictions.
- **Core Value Proposition:** A smart app blocker modeled on QuranUnlock where distracting apps (Instagram, TikTok, YouTube, etc.) remain locked on device until the user completes their daily Bible reading goal.

## 2. Product Requirements (PRD)

- **Smart App Blocker:** Apps selected for blocking remain inaccessible until the daily reading goal (e.g. 10 minutes) is completed.
- **Bible Reader:** Fast, offline, canonical Scripture reader supporting public-domain translations (World English Bible and King James Version).
- **Daily Reading Timer:** Tracks active reading foreground time, auto-unshields apps upon reaching the goal, and updates daily streaks.
- **Scripture Shield:** Local notifications prompting Scripture reflection if excessive screen time is detected without daily reading.
- **Authentication & Cloud Sync:** Supabase authentication (OAuth Google / Apple) and profile sync for reading streaks and preferences.
- **Monetization (Freemium):** Powered by RevenueCat. Free tier includes standard presets (Instagram, TikTok, YouTube, X, Reddit) and single goal; Premium tier unlocks custom app selection, flexible goals, and Lent Mode.
- **Non-Goals (Out of Scope for Initial Version):** Audio recitation, community feeds, reels-style video feeds, complex social sharing.

## 3. Starting Architecture & Tech Stack

- **Client / Mobile:** React Native, Expo (SDK 57), Expo Router, NativeWind v5 (Tailwind v4), Reanimated.
- **Typography:** EB Garamond (Scripture & Display Serif), Inter (UI Sans), JetBrains Mono (Code/Numbers).
- **Local Persistence:** `react-native-mmkv` for high-performance offline reading progress, app block state, and preferences.
- **iOS App Blocking:** Apple Screen Time API via `react-native-device-activity` (`FamilyControls`, `ManagedSettingsStore`, `DeviceActivityMonitor`).
- **Android App Blocking:** Custom Expo Module (`modules/android-blocker`) using Android `AccessibilityService` (`TYPE_WINDOW_STATE_CHANGED`) to detect and redirect blocked apps to Bible Unlock.
- **Backend & Auth:** Supabase (Auth + Postgres `profiles` table).
- **In-App Purchases:** RevenueCat (`react-native-purchases`).

## 4. Invariant Constraints & Standards

- Strict TypeScript types across all contracts and state models.
- All styling implemented via NativeWind (`className`).
- 100% offline-capable reader with bundled Bible JSON.
- Ponytail engineering principles: simplest robust implementation, minimal boilerplate.
