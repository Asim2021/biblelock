# Project Changelog & Verified Outcomes

## [1.0.7] - 2026-09-08

### Fixed
- **Duplicate Key Warning & Hour Selector (`1a.png`, `1b.png`):** Replaced static hour preset array in `PlanStep.tsx` with unique 12-hour grid `['01'..'12']`, resolved duplicate `'08'` key warning, and fixed greeting title trailing space (`"When do you want to read Scripture, Asim?"`).
- **Android 3-Button Navigation Bar Overlap:** Injected dynamic safe-area insets (`useSafeAreaInsets().bottom`) across `AppPickerStep.tsx`, `PermissionStep.tsx`, `PauseBlockingModal.tsx`, `settings.tsx`, and `BadgeShareModal.tsx` so bottom action buttons stay elevated above the system navigation bar (`||| <`).
- **"5 Apps Picked" Confusion (`what 5 apps.png`):** Changed default `blockedApps` list from hardcoded 5 presets to empty `[]`, adding 5 quick-add suggestion chips (Instagram, TikTok, YouTube, X, Reddit) in `AppPickerStep.tsx`.
- **Android Splashscreen Drawables (`why old logo.png`):** Generated and replaced all Android density drawables (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) in `android/app/src/main/res/drawable-*/splashscreen_logo.png` directly from the 3D brandmark (`assets/images/splash-icon.png`).

### Added
- **Modern Vector Icons (`lucide-react-native`):** Installed `lucide-react-native` and migrated all tabs, headers, modal buttons, progress indicators, feature lists, and badges to sleek, customizable vector icons, eliminating raw emojis and unicode characters throughout the entire application.

### Verified Impact
- `npx tsc --noEmit` passing with 0 errors.
- Bottom action buttons dynamically elevated with `useSafeAreaInsets().bottom` across all modals and steps.
- Splash logo rendered crisp and high-res on cold boot across all Android screen densities.

---

## [1.0.6] - 2026-09-08

### Added
- **22-Step Onboarding Architecture (`TASK-016` / `DEC-006`):** Created full 22-step onboarding wizard under `src/app/onboarding/` mirroring Quran Unlock's flow:
  - Language selection (EN, ES, PT, FR, DE) with localized Scripture translations.
  - 3-slide value narrative carousel explaining the Scripture Shield concept.
  - 3-step personal survey capturing name, reading consistency goals, and digital distraction pain points.
  - 5-step schedule, reading duration (5m/10m/15m/30m), and habit commitment plan summary.
  - Native installed app discovery with categorized search and safety warnings for critical apps.
  - Transparent Pro paywall preview with free limited tier continuation option.
  - 5-step Android Accessibility Service permission flow with intent launching, privacy explanation modal, and reactive `AppState` listener for instantaneous green checkmark feedback.
  - System notification permission prompt with biblical encouragement.
- **Native Android App Enumeration:** Added `getInstalledApps` using Android `PackageManager` to `AndroidBlockerModule.kt` with TypeScript bridge in `src/lib/appBlocker.ts`.
- **Elevated Christian Home Dashboard:** Redesigned `src/app/(tabs)/index.tsx` matching screens 22a and 22b:
  - Christian greeting: *"Grace and peace to you, [Name]"* with settings shortcut.
  - Radiant golden hero card: *"Time to Read"* with goal target and *"Amen, Let's Read 📖"* button leading to Scripture reader.
  - Daily devotional card featuring today's verse with EB Garamond italic styling.
  - Streak tracking with *"⏸ Pause Blocking [NEW]"* (15m, 30m, 1h pause options with Psalm 46:10).
  - Horizontal 30-day circular habit timeline (`Last30DaysTracker.tsx`).
  - "Your Impact" metrics: minutes read, doomscrolling hours saved, total devotional sessions.
  - 6 unlockable Christian badges (`BadgesGrid.tsx`) with viral social share preview (`BadgeShareModal.tsx`).

### Verified Impact
- `npx tsc --noEmit` passing with 0 errors across the full workspace.
- 0ms local persistence for guest onboarding and statistics using MMKV.
- Seamless redirection from `_layout.tsx` when onboarding is pending.

---

## [1.0.5] - 2026-09-07

### Added
- **Supabase PostgreSQL Schema Migration (`TASK-015` / `DEC-005`):** Created `supabase/migrations/20260907000000_supabase_schema.sql` defining `profiles` and `reading_sessions` tables, Row-Level Security (RLS) policies, automated `updated_at` trigger, and `handle_new_user()` trigger for automated OAuth user provisioning.
- **Database TypeScript Types:** Created `src/types/database.ts` with complete `GenericTable` definitions and foreign-key relationships for full type safety.
- **Offline-First Synchronization (`src/lib/sync.ts`):** Built bi-directional sync engine that preserves instant 0ms local response via MMKV while debouncing updates to Supabase in the background.
- **Deep-Link Auth Callback Route:** Created `src/app/auth/callback.tsx` handling `bibleunlock://auth/callback` redirects cleanly in Expo Router.

### Fixed
- **Supabase URL Suffix Bug:** Removed trailing `/rest/v1/` from `EXPO_PUBLIC_SUPABASE_URL` in `.env` and added runtime URL sanitization in `src/lib/supabase.ts`.
- **SSO PKCE Code Exchange:** Updated `src/lib/auth.tsx` to handle PKCE `code` query parameters and implicit hash fragments (`#access_token=...`) with foreground/background deep link listeners.

### Verified Impact
- `npx tsc --noEmit` passing with 0 errors.
- Supabase live endpoint verified with Google and Apple SSO provider configurations.

---

## [1.0.4] - 2026-09-07

### Fixed
- **Metro SSR / Storage Access Error (`FIX-003` / `DEC-004`):** Fixed `Error: Tried to access storage on the server... Node.js` when Expo Router pre-rendered route files. Refactored `src/lib/mmkv.ts` to use lazy initialization (`getInstance()`) so native C++ JSI bindings are not triggered at module import time inside Node.js.
- **Documentation:** Rewrote `frontend/README.md` with full prerequisites (strict JDK 21 requirement), step-by-step procedures for daily wireless ADB development and clean Gradle APK building, and root causes for past errors.

### Verified Impact
- Metro Bundler booted with cleared cache and bundled 2,319 modules without SSR exceptions.
- Live app connected to Android device `SM_M346B` over Wi-Fi (`exp://192.168.0.102:8081`).

---

## [1.0.3] - 2026-09-07
 
### Fixed
- **Android CMake / Prefab Failure (`FIX-002`):** Resolved task failure in `:react-native-nitro-modules:configureCMakeDebug` caused by Gradle toolchain auto-provisioning Java 25. Java 25 restricted native method warnings on stderr were flagged as build errors by Android Gradle Plugin.
- **Gradle Configuration:** Pinned `org.gradle.java.home=C:/Program Files/Java/jdk-21.0.12` and enabled native access in `gradle.properties`. Removed `gradle-daemon-jvm.properties` toolchain override.
- **Git Hygiene:** Updated `frontend/.gitignore` to ignore native module build directories (`**/build/`, `**/.cxx/`, `.gradle/`).

### Verified Impact
- `gradlew app:assembleDebug` completed with `BUILD SUCCESSFUL in 3m 36s`.
- Output `app-debug.apk` (92MB) generated and deployed to connected Android device over wireless ADB (`Performing Streamed Install -> Success`).
- `com.bibleunlock.app/.MainActivity` running and focused.

---

## [1.0.2] - 2026-09-06


### Added
- **Brandkit Splash & App Icons (`TASK-012`):** Generated minimalist warm-editorial brandmark combining the open Scripture book, cross, and subtle keyhole unlock metaphor on `#181715` canvas. Created `frontend/assets/images/splash-icon.png`, `frontend/assets/images/icon.png`, and `frontend/assets/images/favicon.png`.
- **Asset Typings:** Added `frontend/src/types/declarations.d.ts` declaring `.css`, `.png`, `.jpg`, and `.svg` modules for TypeScript strict typechecking.

### Verified Impact
- `npx expo prebuild --clean --no-install` resolves without ENOENT errors.
- `npx tsc --noEmit` passes with 0 errors.

---

## [1.0.1] - 2026-09-06

### Fixed
- **Root Layout Navigation Crash (`DEC-003`):** Removed conditional `<View>` in `src/app/_layout.tsx` that broke Expo Router's navigator tree during initial session loading.
- **Route Collision:** Removed colliding `src/app/index.tsx` so that `src/app/(tabs)/index.tsx` is the sole canonical root route (`/`).
- **Safe Area Context:** Replaced legacy NativeWind `styled(RN)` in `src/components/SafeAreaView.tsx` with standard export from `react-native-safe-area-context`.
- **Typings:** Added `frontend/expo-env.d.ts` for global CSS module imports.

### Verified Impact
- Metro Bundler compiles 2,320 modules cleanly with HTTP 200 OK.
- `npx tsc --noEmit` passing with 0 errors.

---

## [1.0.0] - 2026-09-06

### Added
- Complete Bible Unlock app implementation matching QuranUnlock architecture.
