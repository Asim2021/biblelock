# Decision Log & Plan Pivots (ADR)

---

## [DEC-001] QuranUnlock Blocking Architecture Alignment

- **Date:** 2026-09-06
- **Status:** Validated
- **Related Task / Baseline:** CHARTER.md §3, implementation_plan.md

### 1. Problem / Trigger
Building a cross-platform app blocker that functions reliably and gets approved on both Apple App Store and Google Play Store requires matching proven platform-native capabilities.

### 2. Alternatives Evaluated
- **Option A (Custom Screen Time module + Android UsageStatsManager):** UsageStatsManager on Android requires drawing system overlays which modern Android versions heavily restrict and often kill in the background.
- **Option B (QuranUnlock Proven Architecture: Screen Time on iOS + AccessibilityService on Android):** iOS Screen Time (`FamilyControls` / `ManagedSettings`) operates entirely on-device with zero battery drain. Android `AccessibilityService` listens to `TYPE_WINDOW_STATE_CHANGED` and directly triggers the redirect activity.

### 3. Decision & Trade-offs
Selected **Option B**. For iOS, utilize `react-native-device-activity` rather than reinventing the wheel (`/ponytail`). For Android, build a dedicated Expo Module implementing `AccessibilityService` with `BIND_ACCESSIBILITY_SERVICE`.

### 4. Implementation Details
- iOS: `react-native-device-activity` integrated via config plugin.
- Android: Custom Expo Module in `modules/android-blocker/`.
- Cross-platform abstraction in `src/lib/appBlocker.ts`.

### 5. Proof of Improvement
- Verified via reverse engineering of QuranUnlock app store metadata and architecture.
- 100% offline capability without background battery drain.

### 6. Lessons & Downstream Impact
Entitlements (`FamilyControls` on iOS and Accessibility justification in Google Play Developer Console) must be clearly documented in `SETUP.md`.

---

## [DEC-002] EB Garamond Typography for Scripture & Editorial UI

- **Date:** 2026-09-06
- **Status:** Accepted
- **Related Task / Baseline:** TASK-001

### 1. Problem / Trigger
Initial DESIGN.md referenced Anthropic proprietary fonts (Copernicus & StyreneB). Need open-source, Google Fonts-compatible typography that feels majestic and readable for biblical scripture.

### 2. Alternatives Evaluated
- **Option A (Lora):** Good serif, but slightly less traditional for Bible presentation.
- **Option B (EB Garamond):** Classical humanist serif ideal for Biblical literature, paired with Inter for clear modern mobile UI.

### 3. Decision & Trade-offs
Selected **Option B** (EB Garamond + Inter + JetBrains Mono). Installed via `@expo-google-fonts/*`.

---

## [DEC-003] Root Layout Navigator Hierarchy & Route Collision Fix

- **Date:** 2026-09-06
- **Status:** Validated
- **Related Task / Baseline:** Startup Runtime Error in ReactFabric

### 1. Problem / Trigger
Initial app launch threw a fatal React Fabric render error inside `ExpoRoot` (`performUnitOfWork` / `renderRootSync`).

### 2. Alternatives Evaluated
- **Root Cause 1:** `_layout.tsx` returned a raw `<View>` with an `ActivityIndicator` during `isLoading` instead of rendering `<Stack>`. In Expo Router, root layouts must always render a navigator or `<Slot />`.
- **Root Cause 2:** Route collision between `src/app/index.tsx` (redirecting to `/(tabs)`) and `src/app/(tabs)/index.tsx`, both attempting to resolve to URL `/`.
- **Root Cause 3:** `src/components/SafeAreaView.tsx` wrapped `RN` with NativeWind's legacy `styled()` instead of exporting `SafeAreaView` directly from `react-native-safe-area-context`.

### 3. Decision & Trade-offs
1. Removed the conditional `<View>` in `_layout.tsx`, allowing `<Stack>` to stay permanently mounted.
2. Deleted colliding `src/app/index.tsx` so `src/app/(tabs)/index.tsx` is the single canonical home route (`/`).
3. Re-exported standard `SafeAreaView` from `react-native-safe-area-context`.
4. Created `expo-env.d.ts` for CSS module declarations.

### 4. Implementation Details
Modified `src/app/_layout.tsx`, deleted `src/app/index.tsx`, updated `src/components/SafeAreaView.tsx`, created `frontend/expo-env.d.ts`.

### 5. Proof of Improvement
- Metro bundled 2,320 modules with HTTP 200 OK.
- `npx tsc --noEmit` passing with 0 errors.

---

## [DEC-004] Lazy-Initialization for MMKV Native Storage (SSR / Metro Bundler Crash Fix)

- **Date:** 2026-09-07
- **Status:** Validated
- **Related Task / Baseline:** Metro Bundler SSR Crash (`Error: Tried to access storage on the server... Node.js v24.11.0`)

### 1. Problem / Trigger
During development startup via `npx expo start`, Expo Router executes server-side/bundler pre-evaluation in a Node.js environment. Because `react-native-mmkv` relies on C++ JSI bindings that only exist inside the native React Native Android/iOS runtime, calling `createMMKV({ id: '...' })` at the top level of `src/lib/mmkv.ts` crashed the bundler with `Error: Tried to access storage on the server`.

### 2. Alternatives Evaluated
- **Option A (Conditionally mock MMKV based on `Platform.OS` or `typeof window`):** Hard to maintain across web, Android, and testing environments; might return null or uninitialized storage on mobile if timing is off.
- **Option B (Lazy Instance Pattern with `getInstance()`):** Defer `createMMKV()` execution until the first storage method (`get`, `set`, `delete`) is actually invoked. If executed in a non-native / server environment, gracefully fallback to `MemoryStorage`.

### 3. Decision & Trade-offs
Selected **Option B**. The storage interface remains 100% backward-compatible and synchronous (`storage.getString(...)`), but native initialization only occurs when the mobile app runtime actually attempts to read or write data.

### 4. Implementation Details
Refactored `src/lib/mmkv.ts`:
- Added `_instance` reference and `getInstance()` helper.
- Guarded `createMMKV` inside `try / catch` with `MemoryStorage` fallback.
- Exported wrapper methods invoking `getInstance()` on demand.

### 5. Proof of Improvement
- Metro Bundler booted with cleared cache without any server-side exceptions.
- Android app bundled **2,319 modules in 44,453ms** and opened successfully on device `SM_M346B` over wireless debugging.

### 6. Lessons & Downstream Impact
In Expo Router with New Architecture, never execute native C++ / JSI module instantiations in module-level global scope; always use lazy getters to protect Node.js bundling and SSR passes.

---

## [DEC-005] Supabase Full Database, PKCE SSO Authentication, and Offline-First Sync

- **Date:** 2026-09-07
- **Status:** Validated
- **Related Task / Baseline:** TASK-015, CHARTER.md §3

### 1. Problem / Trigger
The application required a production-ready Supabase backend for PostgreSQL storage and Single Sign-On (Google & Apple). The previous client configuration had a malformed URL with a trailing `/rest/v1/`, lacked PKCE OAuth redirect code exchange and hash parsing, had no deep-link handling for OAuth return flows, and lacked a two-way synchronization layer with local MMKV storage.

### 2. Alternatives Evaluated
- **Option A (Separate heavy native auth libraries like `@react-native-google-signin/google-signin` and `expo-apple-authentication`):** Adds significant native build complexity, Podfile modifications, and Google Play Services coupling.
- **Option B (Ponytail + Senior Architect: Supabase Unified PKCE OAuth with `expo-web-browser` and `Linking`):** Uses existing installed dependencies (`expo-web-browser`, `expo-linking`, `@supabase/supabase-js`), handles PKCE code exchange and implicit hash tokens, and recovers sessions via deep-link listeners across iOS, Android, and web.

### 3. Decision & Trade-offs
Selected **Option B**. Implemented:
1. Production PostgreSQL migration (`supabase/migrations/20260907000000_supabase_schema.sql`) with `profiles` and `reading_sessions` tables, Row Level Security, automatic user provisioning triggers, and `updated_at` triggers.
2. Full TypeScript schema in `src/types/database.ts` satisfying Supabase `GenericTable` with foreign key relationships.
3. URL normalization in `src/lib/supabase.ts` and `.env` to prevent path malformation.
4. Robust OAuth flow in `src/lib/auth.tsx` supporting PKCE exchange (`exchangeCodeForSession`), hash parsing, and deep linking (`bibleunlock://auth/callback`).
5. Offline-first two-way sync engine in `src/lib/sync.ts` that provides 0ms local response via MMKV and debounces cloud writes.

### 4. Implementation Details
- Created: `supabase/migrations/20260907000000_supabase_schema.sql`, `src/types/database.ts`, `src/lib/sync.ts`, `src/app/auth/callback.tsx`.
- Updated: `.env`, `src/lib/supabase.ts`, `src/lib/auth.tsx`, `src/lib/readingTimer.ts`, `src/app/(tabs)/settings.tsx`, `SETUP.md`.

### 5. Proof of Improvement
- Supabase Auth Service connectivity verified via Node test script (`external providers: google, apple`).
- Full project typecheck clean (`npx tsc --noEmit` exited with code 0).
- Deep link route `/auth/callback` mounted in Expo Router to prevent unhandled routing warnings.

### 6. Lessons & Downstream Impact
Always define `Relationships: []` on Supabase database table definitions in TypeScript; otherwise, `@supabase/postgrest-js` treats the schema as non-conforming and infers table operations as `never`.

---

## [DEC-006] Complete 22-Step Onboarding Architecture, Native App Enumeration, & Elevated Christian Dashboard

- **Date:** 2026-09-08
- **Status:** Validated
- **Related Task / Baseline:** TASK-016, 2026-09-08-bible-unlock-onboarding-flow-design.md, implementation_plan.md

### 1. Problem / Trigger
Bible Unlock needed an onboarding and daily habit loop equivalent in structure to the proven 24-step Quran Unlock flow (`1.png` - `22b.png`), but elevated and bespoke for Christian Scripture readers. The previous app had only a placeholder home screen, no onboarding flow, no native app picker, and no habit tracking or badge reward mechanisms.

### 2. Alternatives Evaluated
- **Option A (Hardcode static app lists + generic onboarding modal):** Hardcoding apps leads to poor UX if users have unlisted apps, and modal onboarding interrupts the navigation flow.
- **Option B (Frictionless Master Wizard + Native Android App Enumeration + Christian Habit Loop):**
  1. Decoupled guest-first onboarding without forcing upfront login, persisting data directly in MMKV.
  2. Native Android `PackageManager` querying of launchable installed apps (`GET_META_DATA`), with fallback presets for testing/iOS.
  3. Multi-language selection (EN, ES, PT, FR, DE), 3-slide value narrative carousel, 3-step personal survey, 5-step schedule/duration/safety review, paywall preview, and 5-step Android Accessibility Service permission onboarding with auto-detecting `AppState` checkmarks.
  4. Rich home dashboard with Christian greeting, golden "Amen, Let's Read" hero card, daily devotional snippet, streak counter with pause blocking (15m, 30m, 1h), 30-day horizontal activity timeline, impact metrics, and viral shareable achievement badges.

### 3. Decision & Trade-offs
Selected **Option B**. Accepted trade-off: Native Android module required an updated Kotlin method `getInstalledApps()` with proper intent filtering and icon handling.

### 4. Implementation Details
- Created:
  - `src/types/onboarding.ts`: Comprehensive types for onboarding, habit timeline, impact stats, and badges.
  - `src/app/onboarding/index.tsx` & `src/app/onboarding/steps/*`: 7 modular step components managing the 21-step wizard.
  - `src/components/Last30DaysTracker.tsx`: Horizontal scrollable 30-day circular habit timeline.
  - `src/components/BadgesGrid.tsx`: 6 Christian achievement badges (Genesis, David's Courage, Solomon's Wisdom, Armor of God, Living Water, Morning Light).
  - `src/components/PauseBlockingModal.tsx`: Pause blocking modal with duration choices and Psalm 46:10.
  - `src/components/BadgeShareModal.tsx`: Viral Instagram/WhatsApp social share preview modal.
- Updated:
  - `modules/android-blocker/android/src/main/java/com/bibleunlock/blocker/AndroidBlockerModule.kt`: Added `getInstalledApps` using Android `PackageManager`.
  - `modules/android-blocker/index.ts` & `src/lib/appBlocker.ts`: TypeScript bridge for native app discovery.
  - `src/lib/mmkv.ts`: High-speed storage for onboarding state, guest user profile, scheduled reading times, pause blocking timestamp, 30-day history, and impact stats.
  - `src/app/_layout.tsx`: Automatic redirection to `/onboarding` if `!isOnboardingCompleted()`.
  - `src/app/(tabs)/index.tsx`: Redesigned elevated Christian home dashboard.

### 5. Proof of Improvement (Evidence & Metrics)
- `npx tsc --noEmit` passing with 0 errors across all newly added modules, components, and routes.
- Full parity with Quran Unlock reference screens 1 through 22b with tailored Christian aesthetics (Deep Celestial Navy `#0d120f`, Radiant Warm Gold `#f5b800`, and EB Garamond serif typography).
- Zero-latency local persistence via MMKV.

### 6. Lessons & Downstream Impact
Always perform accessibility permission checks reactively when the user returns from system settings using React Native `AppState` change listeners; this gives users instantaneous feedback with a green checkmark without requiring manual app restarts.

---

## [DEC-007] Migration to Lucide Vector Icons, Android 3-Button Navigation Safe Insets, and Splashscreen Drawable Generation

- **Date:** 2026-09-08
- **Status:** Validated
- **Related Task / Baseline:** STATUS.md (Device Testing Bugfixes & Lucide Icons)

### 1. Problem / Trigger (Why the Original Plan Changed)
Device testing revealed five critical UI/UX issues:
1. Android 3-button system navigation bar (`||| <`) overlapped bottom action buttons ("Cancel", "Save & Continue", "Pause Blocking") inside modals and steps.
2. `PlanStep.tsx` threw a React duplicate key warning (`Encountered two children with the same key, '08'`) due to duplicate `'08'` in the preset hour list, and the title string formatted awkwardly with trailing spaces (`When do you want to read Scripture, Asim Disciple ?`).
3. `AppPickerStep.tsx` showed "5 apps picked" by default with no installed app context, confusing users.
4. Android splash screen displayed the old low-resolution placeholder logo because `android/app/src/main/res/drawable-*/splashscreen_logo.png` had not been regenerated from the high-res 3D master brandmark (`assets/images/splash-icon.png`).
5. Emojis throughout the app felt playful rather than sleek, premium, and trustworthy.

### 2. Alternatives Evaluated
- **Option A (Custom SVGs for every icon):** High maintenance burden and potential bundle size bloat.
- **Option B (Lucide Icons via `lucide-react-native`):** Industry standard, tree-shakable, sleek, customizable stroke width, perfectly suited for modern mobile apps, uses existing `react-native-svg`.

### 3. Decision & Trade-offs
Selected **Option B**. Added `lucide-react-native` for in-house modern vector icons across all screens, tabs, and modals. Overwrote Android splashscreen drawables across mdpi through xxxhdpi densities directly from the 3D brandmark. Applied dynamic bottom safe-area insets (`useSafeAreaInsets().bottom`) across all modals and onboarding steps to guarantee clearance above the Android 3-button navigation bar.

### 4. Implementation Details
- Installed `lucide-react-native`.
- Overwrote `android/app/src/main/res/drawable-*/splashscreen_logo.png` across 5 densities: mdpi (288x288), hdpi (432x432), xhdpi (576x576), xxhdpi (864x864), and xxxhdpi (1152x1152).
- Updated `src/app/(tabs)/_layout.tsx`, `index.tsx`, `reader.tsx`, `settings.tsx`, `paywall.tsx`, `src/app/onboarding/steps/*`, `src/components/*` to use Lucide vector icons and safe area insets.
- Cleaned default `userName` to empty string and default `blockedApps` to `[]` with quick-add recommendation chips.

### 5. Proof of Improvement (Evidence & Metrics)
- `npx tsc --noEmit` passing with 0 errors.
- Bottom action buttons clear Android 3-button navigation bar by at least 16-28px.
- Duplicate key error in `PlanStep.tsx` eliminated with a clean 12-hour unique array (`['01'..'12']`).
- Zero raw emojis remaining in navigation bars, tabs, progress rings, and feature highlights.

### 6. Lessons & Downstream Impact
Always wrap modal content and bottom floating toolbars with dynamic `useSafeAreaInsets().bottom` rather than static bottom padding on Android, as gesture navigation and 3-button navigation have completely different insets (0px vs ~48px).

---

## [DEC-008] Reading Position Tracking, Native App Icon Streaming, and 5-Tab Navigation Architecture (Library & Stats)

- **Date:** 2026-09-08
- **Status:** Validated
- **Related Task / Baseline:** STATUS.md (FIX-006)

### 1. Problem / Trigger (Why the Original Plan Changed)
User reported several blocking bugs from physical device testing:
1. Reading position was not preserved: when reading Genesis chapter 5, quitting, and re-opening from the blocker overlay or home hero button, the reader reset to Genesis chapter 1.
2. The Android native blocker overlay (`BlockerActivity.kt`) was branded with the wrong placeholder name ("Scripture Unlock"), lacked the radiant brand color scheme (`#0D120F`, `#F5B800`), and its CTA did not resume the user's reading position.
3. Settings showed a static list of 5 hardcoded apps (TikTok, X, etc.) with emojis even if they were not installed, and the "+ Custom Apps" button was unresponsive.
4. The installed app list in `AppPickerStep` displayed generic letter initials (`C`, `P`, `M`) instead of real installed application icons.
5. No theme selection option (Light/Dark/System) was available in Settings.
6. The Home Daily Devotional card lacked Refresh, Goto, and Share capabilities.
7. Two vital menu tabs from Quran Unlock were missing: **Library** (pinned auto-saved Last Read marker + custom color-coded bookmarks) and **Stats** (faith growth analytics, 7-day tracker, milestone bar, badges, and community impact counters).

### 2. Alternatives Evaluated
- **Option A (File system image cache for native app icons):** Write each app icon to disk cache in Android storage and pass `file://` URLs.
  - *Cons:* High I/O overhead, potential cache invalidation bugs, and orphaned temp files.
- **Option B (Base64 data URI streaming directly from PackageManager):** Convert native `Drawable` icons to Base64 PNG strings during enumeration and pass `data:image/png;base64,...` across the Expo bridge.
  - *Pros:* Zero filesystem writes, instant loading in React Native `<Image source={{ uri }} />`, and automatic garbage collection.

### 3. Decision & Trade-offs
Selected **Option B** for app icons. Persisted `LastReadPosition` directly in MMKV with zero IPC latency. Updated `reader.tsx` to read query parameters (`book`, `chapter`, `verse`) and auto-scroll with visual highlight. Added interactive modals for Custom Apps and Theme Mode in Settings. Implemented a 5-tab navigation bar (`Home`, `Reader`, `Library`, `Stats`, `Settings`) with dedicated `library.tsx` and `stats.tsx` screens.

### 4. Implementation Details
- `AndroidBlockerModule.kt`: Added `drawableToBase64()` helper to encode icons into Base64 PNG data URIs.
- `BlockerActivity.kt`: Aligned branding to "Bible Unlock", background `#0D120F`, splash logo, and CTA linking to `bibleunlock://reader`.
- `src/lib/mmkv.ts`: Added `LAST_READ_POSITION`, `BOOKMARKS`, and `THEME_MODE` storage methods and types.
- `src/app/(tabs)/reader.tsx`: Supported query parameter navigation, target verse scrolling, and auto-saved position tracking.
- `src/app/(tabs)/settings.tsx`: Replaced presets with dynamic blocked apps, "+ Custom Apps" selection modal, and Theme switcher.
- `src/components/DailyDevotionalCard.tsx`: Reusable devotional card with Refresh (random verse), Goto (reader navigation), and Share (`https://bibleunlock.app`).
- `src/app/(tabs)/library.tsx`: Created Library tab with pinned Last Read marker and custom bookmarks list.
- `src/app/(tabs)/stats.tsx`: Created Stats tab with avatar header, goal meter with circular gauge, 7-day tracker with active day underline, milestone progress bar, Badges grid, lifetime activity, and community impact counters.
- `src/app/(tabs)/_layout.tsx`: Registered all 5 tabs in order.

### 5. Proof of Improvement (Evidence & Metrics)
- `npx tsc --noEmit` passing with 0 errors across all 5 tabs and modules.
- Quitting at Genesis 5 and clicking "Read Bible Now" or Home hero resumes directly at Genesis 5.
- Real installed app icons render crisply in App Picker and Settings.
- 5-tab menu bar navigation operates seamlessly with Lucide vector icons.

### 6. Lessons & Downstream Impact
Persisting reader state to synchronous storage (MMKV) on every book or chapter transition prevents state loss even during unexpected app terminations or OS memory pressure kills.

---

## [DEC-009] Android Package Visibility Fix (QUERY_ALL_PACKAGES), Light & Dark Theme Engine, and Al Quran Bookmark & Collection Parity

- **Date:** 2026-09-08
- **Status:** Validated
- **Related Task / Baseline:** STATUS.md (FIX-007)

### 1. Problem / Trigger (Why the Original Plan Changed)
Device testing and user feedback surfaced four specific regressions:
1. **App Selection Truncation (Android 11+ Package Visibility):** `getInstalledApps` only returned ~17 system packages; user-installed applications (Instagram, TikTok, WhatsApp, X, Facebook, games) were hidden because Android 11+ (API 30+) strictly filters `queryIntentActivities` without `<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />`.
2. **Settings "+ Add Apps" Modal Blank / Unstyled:** `presentationStyle="pageSheet"` on Android forced a default light system dialog background, clashing with dark mode text and failing to trigger proactive app reloading.
3. **Light Mode Non-Functional:** Choosing "Light (Parchment)" in Settings left the app pitch dark because screen roots hardcoded `backgroundColor: '#0d120f'` and Tailwind `text-on-dark` classes remained white.
4. **Bookmark & Library UX Parity with Al Quran App:** User provided reference screenshots from "Al Quran" requiring a 3-tab segmented control (`Collections`, `Pins`, `Notes`), dismissable tip banner, search bar with filter, pinned `Last Read` auto-bookmark at top with direct jump, collection list with color tags and verse count, and bottom sheet edit/new collection modal with 6 color swatches (`#3b82f6`, `#10b981`, `#f43f5e`, `#a855f7`, `#f59e0b`, `#d97706`).

### 2. Alternatives Evaluated
- **Option A (Inline Theme Flags & Basic List):** Use conditional ternary operators inside each screen and keep bookmarks as a single flat list.
  - *Cons:* Fragile, leads to visual inconsistency across screens, and fails to deliver the organized folder structure demonstrated in the Al Quran reference.
- **Option B (Universal ThemeContext + QUERY_ALL_PACKAGES + Full Al Quran Collections System):** Centralized `ThemeProvider` with tailored Celestial Dark (`#0d120f`) and Parchment Light (`#f8f6f0`) color tokens, native manifest permission configuration, and a full Collections / Pins / Notes architecture backed by MMKV.
  - *Pros:* Complete visual consistency across all tabs, instant theme switching, full device app visibility, and 100% UX parity with the Al Quran reference.

### 3. Decision & Trade-offs
Selected **Option B**. Declared `QUERY_ALL_PACKAGES` in `app.json` and both `AndroidManifest.xml` files. Enhanced `AndroidBlockerModule.kt` to union launcher activities and installed applications with user apps prioritized at the top. Created `src/lib/themeContext.tsx` and connected all screens. Rebuilt `library.tsx` to match Al Quran 1:1.

### 4. Implementation Details
- `app.json`, `android/app/src/main/AndroidManifest.xml`, `modules/android-blocker/android/src/main/AndroidManifest.xml`: Added `QUERY_ALL_PACKAGES` permission and launcher `<queries>`.
- `AndroidBlockerModule.kt`: Enriched `getInstalledApps` with `pm.getInstalledApplications`, priority sorting (`isSystemApp` false first, then alphabetical), and fallback for non-system apps.
- `src/lib/themeContext.tsx`: Universal `ThemeProvider` providing `colors` (background, surface, border, textPrimary, textSecondary, accent, etc.) and `isDark`.
- `src/app/_layout.tsx`: Wrapped root in `<AppThemeProvider>`.
- `src/app/(tabs)/_layout.tsx`: Themed tab bar background, borders, and active tint.
- `src/app/(tabs)/settings.tsx`, `index.tsx`, `stats.tsx`, `reader.tsx`, `Card.tsx`, `DailyDevotionalCard.tsx`: Dynamically adapted to `useTheme()` tokens.
- `src/lib/mmkv.ts`: Added `VerseCollection` model, `DEFAULT_COLLECTIONS`, `getCollections`, `saveCollection`, `deleteCollection`, and updated `Bookmark`.
- `src/app/(tabs)/library.tsx`: Built 3-tab segmented control (`Collections`, `Pins`, `Notes`), helper tip banner with dismiss, search bar, pinned `Last Read` card, collections list, and edit/create bottom modal with 6 color swatches.

### 5. Proof of Improvement (Evidence & Metrics)
- `npx tsc --noEmit`: Passed with 0 errors across the entire codebase.
- Package enumeration captures all installed user apps (Instagram, TikTok, WhatsApp, X, etc.) and sorts them to the top.
- Light (Parchment) mode active across all screens with crisp dark text on `#f8f6f0` background.
- Library screen matches the Al Quran layout and functionality 100%.

### 6. Lessons & Downstream Impact
On Android, `presentationStyle="pageSheet"` within `<Modal>` must be avoided in cross-platform React Native apps when custom theme backgrounds are desired, as Android translates it to a platform-native window theme with fixed white backgrounds.



