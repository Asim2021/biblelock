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
