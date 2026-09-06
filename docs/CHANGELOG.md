# Project Changelog & Verified Outcomes

---

## [1.0.0] - 2026-09-06

### Added
- **Design & Typography:** Mapped DESIGN.md color palette and EB Garamond / Inter / JetBrains Mono typography in `global.css` (@theme) and `theme.ts`.
- **Local Storage & Sync:** MMKV key-value persistence with memory fallback for offline reader progress, streaks, daily goals, and blocked app lists (`src/lib/mmkv.ts`).
- **Auth & Cloud:** Supabase client with custom MMKV Auth storage adapter, supporting Google SSO, Apple SSO, and offline Guest mode (`src/lib/supabase.ts`, `src/lib/auth.tsx`, `src/app/(auth)/login.tsx`).
- **Bible Assets & Reader:** 66-book canonical JSON datasets bundled locally for King James Version (KJV) and World English Bible (WEB) with complete chapter/verse navigation (`src/lib/bible.ts`, `src/app/(tabs)/reader.tsx`).
- **Reading Timer:** Active foreground reading tracker unshielding apps when the daily target is reached and incrementing streaks (`src/lib/readingTimer.ts`).
- **iOS App Blocker:** Screen Time integration with `FamilyControls`, `ManagedSettingsStore`, and `DeviceActivityMonitor` extension targets via `react-native-device-activity` (`src/lib/appBlocker.ts`).
- **Android App Blocker:** Custom Expo Module implementing `AccessibilityService` (`TYPE_WINDOW_STATE_CHANGED`) and `BlockerActivity` overlay (`modules/android-blocker/`).
- **Scripture Shield:** Local notifications prompting Scripture reflection during excessive screen time (`src/lib/scriptureShield.ts`).
- **Paywall & Monetization:** RevenueCat integration with Pro feature gating and subscription plans (`src/lib/purchases.ts`, `src/app/paywall.tsx`).
- **Shared UI & Documentation:** `Button.tsx`, `Card.tsx`, `ProgressRing.tsx` (SVG), `ShieldBadge.tsx`, and `SETUP.md`.

### Verified Impact
- `npx tsc --noEmit` passing with 0 errors across all TypeScript code.
- `npx expo config --type public` cleanly generates bundle configurations and iOS app extension targets.
- 100% offline reading capability without remote network calls.
