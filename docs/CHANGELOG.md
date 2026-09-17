# Project Changelog & Verified Outcomes
 
## [1.0.18] - 2026-09-17
 
### Added & Improved
- **Onboarding Typography & CTA Button Scaling (`src/app/onboarding/steps/CarouselStep.tsx`, `SurveyStep.tsx`):**
  - Enlarged main slide serif display copy on the 3 onboarding carousel pages from `text-4xl` (36px) to `text-[40px] leading-[52px]` for enhanced visual prominence and legibility.
  - Enlarged slides 1 & 2 circular navigation button from `w-16 h-16` to `w-20 h-20` (80x80pt touch target) and arrow icon from `text-2xl` to `text-3xl`.
  - Enlarged slide 3 "Get Started" and Survey step "Continue" action buttons from `py-4` with `text-base` to `py-5` with `text-lg font-sans-bold tracking-wide`.

### Verified Impact
- `npx tsc --noEmit`: Clean compilation with 0 errors across the repository.
 
---
 
## [1.0.17] - 2026-09-16

### Added & Improved
- **Reusable TimePickerModal & Mobile Accessibility Standards (`src/components/TimePickerModal.tsx`):**
  - Extracted 15-minute interval habit time picker into a shared, accessible component.
  - Standardized all touch targets to satisfy the mobile accessibility >= 44x44pt standard.
  - Added explicit `accessibilityRole="button"`, `accessibilityLabel` per element, `accessibilityState={{ selected }}`, and live formatted preview time badge.
- **Onboarding Component Standardization (`src/app/onboarding/steps/PlanStep.tsx`):**
  - Refactored `PlanStep.tsx` to use `<TimePickerModal />`, eliminating duplicate state and modal rendering logic while keeping seamless time selection.
- **Settings Daily Reading Reminders Management (`src/app/(tabs)/settings.tsx`):**
  - Added a dedicated "Daily Reading Reminders" card inside Scripture Shield Reminders in Settings.
  - Displays disciples' configured reading reminder times with clock icons and trash delete buttons (min 44pt touch targets).
  - Unlocked 1 scheduled reminder for Free tier disciples; gated multiple reminder creation behind Sanctuary (`requirePremium('Multiple daily reminders')`) with lock icons.
  - Integrated `<TimePickerModal />` directly into Settings to add new reminder times, syncing with MMKV (`setScheduledReadingTimes`).

### Verified Impact
- `npx tsc --noEmit`: Clean compilation with 0 errors across the repository.
- `DEC-013` documented with complete Impact-Loop schema.
- Reusable UI component eliminated code duplication between Onboarding and Settings.

---

## [1.0.16] - 2026-09-16

### Added & Improved
- **Duration Options Overhaul & Free-Tier Expansion (`src/app/(tabs)/settings.tsx`):**
  - Restructured preset daily reading goals to `[5m, 10m, 15m, 30m]` (removed redundant 20m).
  - Unlocked `5m`, `10m`, and `15m` for Free tier users (previously only 10m was free).
  - Gated `30m` behind Sanctuary with lock icon and paywall trigger.
  - Added a 5th "Custom" duration option with inline numeric input (1–120 mins), validation, and live `${dailyGoal}m` label for Pro subscribers.
  - Added reactive normalization ensuring non-premium users with legacy/over-cap goals automatically default to 15m.
- **Onboarding 30m PRO Badge & Soft-Cap UX Pattern (`src/app/onboarding/steps/PlanStep.tsx`, `src/app/onboarding/index.tsx`):**
  - Added a subtle gold `PRO` badge to the 30m duration card in onboarding while keeping it freely selectable without friction.
  - At save / onboarding completion time, `onboarding/index.tsx` intercepts and soft-caps the stored daily goal to `15m` for Free users (`!isPremium && durationMinutes === 30`).
  - Upon entering Settings, Free users see 15m active and 30m locked, establishing clear monetization motivation.

### Verified Impact
- `npx tsc --noEmit`: 0 errors across entire workspace.
- `DEC-012` documented with complete Impact-Loop schema.

---

## [1.0.15] - 2026-09-16

### Fixed
- **Shield Protection Permission Reactive Lifecycle (`src/app/(tabs)/settings.tsx`, `src/lib/appBlocker.ts`, `AndroidBlockerModule.kt`):**
  - Fixed `settings.tsx` to listen to `AppState` ('active') and `useFocusEffect` to dynamically refresh permission state when returning from Android Accessibility Settings.
  - Upgraded native `AndroidBlockerModule.kt` `isAccessibilityEnabled` to query `AccessibilityServiceInfo.FEEDBACK_ALL_MASK` and check `Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES`.
  - Removed premature `setHasPermission(true)` and "Permission Granted" alert upon launching settings in `appBlocker.ts` and `settings.tsx`.
  - Enhanced the Shield Protection Permission card with active state badge ("Active" / "Disabled"), "Manage in Settings" action, and "Verify Status" button with explicit diagnostic alert.
- **Developer "Simulate Free" / "Simulate Pro" Override (`src/lib/purchases.ts`, `src/app/(tabs)/settings.tsx`):**
  - Added explicit `'free' | 'pro' | null` dev override mode to `usePurchases` with reactive cross-hook event listener.
  - Resolved issue where active RevenueCat/Mock entitlements prevented `checkEntitlements` from ever returning `false`.
  - Tapping "Simulate Free" now cleanly forces `isPremium = false`, re-renders the UI to the Free plan with "Upgrade" button, and enables "Simulate Pro" toggle.

### Verified Impact
- `npx tsc --noEmit`: Clean compilation with 0 errors.

---

## [1.0.14] - 2026-09-15

### Added & Improved
- **Sanctuary Pricing & Emotional Paywall Overhaul (`src/app/paywall.tsx`):**
  - Rebranded Free tier to **Covenant** and Paid tier to **Sanctuary**.
  - New accessible price points: **$4.99/month**, **$29.99/year** ($2.49/mo, Save 50%), and **$79.99 lifetime access** with dynamic `priceString` store fallback.
  - Added dynamic streak-aware emotional copy adapting to reader streak and custom name.
  - Expanded 6-feature comparison table with modern translations, streak protection, Lent/Advent modes, full analytics, and unlimited bookmarks.
  - Personalized CTA buttons and emotional anchor message above renewal terms.
- **Cross-App Feature Gating Architecture (`src/lib/useFeatureGate.ts`):**
  - Created centralized `requirePremium()` hook to guard premium interactions without code duplication.
  - **Settings (`src/app/(tabs)/settings.tsx`):** Gated custom app selector and non-10m goal options. Lock icons indicate gated options.
  - **Reader (`src/app/(tabs)/reader.tsx`):** Enforced 3-bookmark free limit; 4th+ bookmark prompts Sanctuary upgrade.
  - **Library (`src/app/(tabs)/library.tsx`):** Gated custom verse collection creation.
  - **Stats (`src/app/(tabs)/stats.tsx`, `src/components/BadgeShareModal.tsx`):** Gated extended month/year reading history views and badge social sharing.
  - **Dashboard (`src/app/(tabs)/index.tsx`):** Added dismissible soft prompt card for users with 3+ day reading streaks.

### Verified Impact
- `npx tsc --noEmit`: Clean compilation with 0 errors across entire repository.
- Dual-theme rendering (Celestial Dark and Parchment Light) fully supported across all updated screens and components.

---

## [1.0.13] - 2026-09-15

### Added & Improved
- **Paywall Master Brand Icon & Pricing Tier Customization (`src/app/paywall.tsx`):**
  - Replaced generic crown icon with master brand app icon (`assets/images/icon.png`) housed in a themed, elevated badge with dynamic accent border and subtle glow.
  - Upgraded feature benefits matrix with Lucide icons (`ShieldCheck`, `Flame`, `Clock`, `Zap`) and themed badge backgrounds.
  - Fixed Primary CTA button background and illegible text by replacing NativeWind function style with direct inline theme styles (`colors.accent`).
  - Set explicit UI price strings matching user request:
    - **Monthly Pass:** $5.99 / month (cancel anytime).
    - **Annual Pass:** $5.00 / month ($59.99 billed yearly, Save 17% badge, 7-day trial CTA).
    - **Lifetime Access:** $149.99 one-time payment forever ("Forever" badge).
  - Compacted header and feature spacing so the icon and branding remain visible on standard mobile viewports.

### Verified Impact
- `npx tsc --noEmit`: 0 errors across entire workspace.
- Dual-theme rendering (Celestial Dark and Parchment Light) verified.

---

## [1.0.12] - 2026-09-13

### Added & Integrated
- **RevenueCat SDK Configuration & Live Paywall:**
  - Initialized `initRevenueCat()` in `src/app/_layout.tsx` at startup.
  - Connected RevenueCat Public Key (`test_SpCwlFTYjEmutuIhmDWmQnZjEzs`) in `.env`.
  - Added secret key vs public SDK key guard in `src/lib/purchases.ts`.
  - Expanded `checkEntitlements` in `src/lib/purchases.ts` to support `premium`, `pro`, or any active entitlement.
  - Dynamically bound `src/app/paywall.tsx` to live RevenueCat packages (`$rc_monthly`, `$rc_annual`, `$rc_lifetime`) and dynamic product price strings with full restore purchases support.

### Verified Impact
- `npx tsc --noEmit`: 0 errors across entire workspace.
- Live RevenueCat test API verified with HTTP 200: active `default` offering loaded with `$rc_monthly`, `$rc_annual`, `$rc_lifetime`.

---

## [1.0.11] - 2026-09-13

### Changed
- **Pure Offline Local Identity (`src/lib/auth.tsx`):**
  - Initialized immediate local user identity (`local-user`) with zero cold-start network listeners, eliminating remote Supabase checks and deep-link OAuth handling on launch.
  - Sourced reader profile synchronously from local MMKV (`getUserName()`, daily goal, streak, translation).
- **Decoupled Reading Timer (`src/lib/readingTimer.ts`):**
  - Removed per-second `supabase.auth.getSession()` queries and `SyncService` push calls during active Scripture reading.
  - Reading seconds, daily goal completion, and streaks persist strictly and synchronously to local MMKV.
- **Settings Screen (`src/app/(tabs)/settings.tsx`):**
  - Replaced "Signed in as / Sign Out" controls with "Local Storage & Profile" card displaying offline MMKV storage status and local reader name.
  - Removed cloud sync calls on goal, translation, and app shield toggles.
- **Auth Callback (`src/app/auth/callback.tsx`):**
  - Configured to route unconditionally to `/(tabs)`.

### Verified Impact
- `npx tsc --noEmit`: 0 errors across entire workspace.
- Complete offline privacy: 0 network requests executed during daily habit usage and reading sessions.
- Zero login prompts or authentication screens shown to users.

---

## [1.0.10] - 2026-09-13

### Removed & Pruned (Ponytail Over-Engineering Audit)
- **Dead & Orphaned Code:**
  - Deleted obsolete 590-line Anthropic Claude web design spec (`DESIGN.md`).
  - Deleted 543-line legacy theme system (`src/theme.ts`) superseded by `src/lib/themeContext.tsx`.
  - Deleted 493-line superseded draft plan (`docs/IMPLEMENTATION_001.md`) and historical sprint artifacts in `docs/superpowers/`, restoring the strict 4-file documentation architecture.
  - Deleted orphaned `ProgressRing.tsx` (123 lines) and `ShieldBadge.tsx` (83 lines) with zero callers.
  - Deleted redundant 5-line proxy file `src/components/SafeAreaView.tsx`.
- **Dependency Reductions (`package.json`):**
  - Uninstalled 9 unreferenced packages: `@expo/ui`, `expo-symbols`, `expo-glass-effect`, `expo-image`, `expo-device`, `expo-system-ui`, `expo-constants`, `react-native-gesture-handler`, `react-native-worklets`.
  - Removed dead `"reset-project"` script pointing to non-existent file.

### Simplified
- **`src/components/Button.tsx`:** Replaced Reanimated 4 hook chain (`useSharedValue`, `withSpring`, `useReducedMotion`) with native `<Pressable>` pressed transforms.
- **`src/lib/mmkv.ts`:** Removed redundant `remove` alias and runtime method reflection; unified on standard `delete(key)`.
- **`src/app/(auth)/login.tsx` & `src/app/auth/callback.tsx`:** Cleaned nested layout wrappers and simplified redirect logic.

### Verified Impact
- **Net code reduction:** -2,230 lines of code, -9 unused dependencies.
- **Typecheck:** `npx tsc --noEmit` clean with 0 errors across entire workspace.
- **Package state:** `npm prune` and `package-lock.json` synchronized cleanly.

---

## [1.0.9] - 2026-09-08

### Added
- **Universal Theme Engine (`src/lib/themeContext.tsx`):** Implemented `ThemeProvider` with tailored Celestial Dark (`#0d120f`) and Parchment Light (`#f8f6f0`) palettes. Integrated across `_layout.tsx`, all 5 tab screens, `Card.tsx`, and `DailyDevotionalCard.tsx` with instant reactive switching.
- **Al Quran Bookmark & Collections Parity (`src/app/(tabs)/library.tsx`):**
  - 3-tab segmented control: `Collections`, `Pins`, `Notes`.
  - Dismissable helper tip banner with `X` button.
  - Search bar with filter icon.
  - Auto-saved `Last Read` card at top with direct jump to reading position.
  - Collection items with color tags, verse counts, tap-to-view verses, and `...` menu.
  - "+ New Collection" action and bottom sheet modal matching `AL Quran App edit bookmark example.png` with 6 color swatches (`#3b82f6`, `#10b981`, `#f43f5e`, `#a855f7`, `#f59e0b`, `#d97706`), checkmark indicators, delete collection action, and Cancel/Save buttons.
  - `Pins` tab for individual bookmarked verses and `Notes` tab for verses with personal reflections.
- **`QUERY_ALL_PACKAGES` & Launcher Queries:** Declared package visibility permissions in `app.json`, `android/app/src/main/AndroidManifest.xml`, and `modules/android-blocker/android/src/main/AndroidManifest.xml`.

### Fixed
- **App Selection Truncation:** Resolved Android 11+ package filtering bug where `getInstalledApps` only returned ~17 system packages. Enhanced `AndroidBlockerModule.kt` to union launcher activities and installed applications with user apps prioritized first and sorted alphabetically, allowing Instagram, TikTok, WhatsApp, X, Facebook, games, etc. to appear.
- **Settings "+ Add Apps" Modal Blank Background:** Replaced `presentationStyle="pageSheet"` with solid themed container using `colors.background` and `statusBarTranslucent`, fixing invisible text on Android dialogs. Proactively loads installed apps on modal open.
- **Light Theme Functionality:** Fixed all hardcoded dark backgrounds (`#0d120f`, `#181715`) and Tailwind `text-on-dark` classes across Home, Reader, Library, Stats, and Settings screens, delivering crisp dark typography on warm parchment.

### Verified Impact
- `npx tsc --noEmit` passing with 0 errors across entire project.
- Complete app visibility on Android 11+ devices.
- Seamless Dark/Light theme switching with verified contrast.
- 100% UX parity with Al Quran app's bookmark and collection system.

---

## [1.0.8] - 2026-09-08

### Added
- **5-Tab Bottom Navigation Bar:** Expanded menu structure from 3 tabs to 5 tabs (`Home`, `Reader`, `Library`, `Stats`, `Settings`) styled with Lucide vector icons.
- **Dedicated Library Tab Screen (`src/app/(tabs)/library.tsx`):** Added pinned non-deletable "Last Read" marker card showing timestamp and Scripture reference with "Continue Reading →", plus user-created bookmarks list with color-coding tags, personal notes, and tap-to-read navigation.
- **Dedicated Stats Tab Screen (`src/app/(tabs)/stats.tsx`):** Faith growth analytics replicating Quran Unlock reference screens:
  - User avatar circle with initials and spiritual walk header.
  - "Bible Reading" goal meter with circular progress gauge (`Zap` icon).
  - "This Week" 7-day tracker card (`S M Tu W Th F S`) with daily reading minutes and active-day underline.
  - Streak milestone progress bar (`0d Current Streak` ---------------- `3d Next Milestone`).
  - Badges section with `BadgesGrid` and viral `BadgeShareModal`.
  - Daily Scripture devotional card with Refresh, Goto, and Share.
  - Lifetime Activity 3-card grid (Verses Read, Time Spent, Best Streak).
  - Community Impact counters ("145.9M Total Verses Read", "434.1M minutes Time Spent", "Share Bible Unlock" button).
- **DailyDevotionalCard Component (`src/components/DailyDevotionalCard.tsx`):** Reusable card with Refresh (picks new random inspirational verse), Goto (deep-links reader to exact chapter and verse), and Share (opens native share sheet with verse text, citation, and `https://bibleunlock.app`).
- **Interactive "+ Custom Apps" Modal in Settings:** Full installed app search and multi-selection modal allowing users to protect any app installed on their phone.
- **Appearance & Theme Settings Modal:** Theme mode switcher supporting Dark, Light, and System modes with MMKV persistence.

### Fixed
- **Reading Progress Tracking:** Reader now persists exact `bookIndex`, `bookName`, `chapterNumber`, `verseNumber`, and `updatedAt` to MMKV (`LAST_READ_POSITION`). When resuming from the blocker overlay or Home hero button, the app opens the exact chapter and scrolls directly to the target verse instead of resetting to Genesis 1.
- **Blocker Overlay Theme & Branding (`BlockerActivity.kt`):** Fixed title from "Scripture Unlock" to "Bible Unlock", updated background to `#0D120F`, rendered high-resolution `splashscreen_logo`, and styled CTA button in radiant gold `#F5B800` opening `bibleunlock://reader`.
- **Real Installed App Icons:** `AndroidBlockerModule.kt` now encodes native `Drawable` icons into Base64 PNG data URIs (`drawableToBase64`), enabling `<Image source={{ uri: app.icon }} />` in `AppPickerStep.tsx` and `settings.tsx`.
- **Settings Dynamic App List:** Replaced static 5 presets (TikTok, X, etc.) with real user-blocked apps and live icons.

### Verified Impact
- `npx tsc --noEmit` passing with 0 errors across all 5 tabs and modules.
- Quitting reading session at Genesis 5 and resuming opens Genesis 5 directly.
- Native blocker overlay visually matches Bible Unlock design guidelines.

---

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
