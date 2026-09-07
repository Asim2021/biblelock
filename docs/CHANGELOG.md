# Project Changelog & Verified Outcomes

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
