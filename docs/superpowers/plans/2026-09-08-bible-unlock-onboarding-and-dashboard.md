# Bible Unlock Onboarding & Elevated Christian Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a frictionless, high-converting Christian onboarding flow and an elevated home dashboard inspired by Quran Unlock's 22-step user experience.

**Architecture:** A localized onboarding state machine in MMKV orchestrates a fluid multi-step wizard (`/onboarding`) prior to dashboard entry. Android's native `PackageManager` is queried via `AndroidBlockerModule` to list launchable user apps for distraction shielding, and real-time `AppState` detection verifies Accessibility service activation. The Home dashboard is redesigned into a sacred spiritual habit center with daily Scripture, a 30-day dot tracker, pause blocking, impact stats, and unlockable achievement badges.

**Tech Stack:** React Native (0.86), Expo Router (~57), React Native Reanimated (4.5), NativeWind (Tailwind v4), MMKV (v4), Kotlin (Android Expo Module).

**Spec:** [docs/superpowers/specs/2026-09-08-bible-unlock-onboarding-flow-design.md](file:///d:/My%20Projects/bibleunlock.app/docs/superpowers/specs/2026-09-08-bible-unlock-onboarding-flow-design.md)

## Global Constraints

- **Zero assumptions & strict type-safety:** Every TypeScript module must compile cleanly with `npx tsc --noEmit` (0 errors).
- **Frictionless guest-first onboarding:** Users enter the onboarding flow immediately without upfront authentication walls.
- **Sacred Christian Aesthetics:** Celestial Midnight background (`#0d1117`), warm sacred gold (`#d4a359` / `#f3c46b`), serif Scripture typography (`EBGaramond`), and Christian devotion terminology.
- **Living Documentation Protocol:** Update `docs/STATUS.md`, `docs/DECISIONS.md`, and `docs/CHANGELOG.md` upon completion.

---

### Task 1: MMKV Onboarding State & Habit Data Helpers

**Files:**
- Modify: `src/lib/mmkv.ts`
- Create: `src/types/onboarding.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface OnboardingData {
    language: 'en' | 'es' | 'pt' | 'fr' | 'de';
    userName: string;
    readingFrequency: string[];
    biggestChallenges: string[];
    readingTimes: string[];
    durationMinutes: number;
    blockedApps: string[];
    isCompleted: boolean;
  }
  export function getOnboardingData(): OnboardingData;
  export function setOnboardingData(data: Partial<OnboardingData>): void;
  export function isOnboardingCompleted(): boolean;
  export function setOnboardingCompleted(completed: boolean): void;
  export function getReadingHistory30Days(): { date: string; completed: boolean }[];
  export function getImpactStats(): { minutesRead: number; hoursSaved: number; sessions: number };
  ```

- [ ] **Step 1: Create `src/types/onboarding.ts`**
Define complete types for language, survey choices, onboarding state, and habit stats.

- [ ] **Step 2: Add storage keys and getters/setters in `src/lib/mmkv.ts`**
Add `ONBOARDING_DATA`, `ONBOARDING_COMPLETED`, `PAUSE_BLOCKING_UNTIL`, and habit calculation helpers.

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 1**
```bash
git add src/types/onboarding.ts src/lib/mmkv.ts
git commit -m "feat: add onboarding state models and mmkv storage helpers"
```

---

### Task 2: Android Native Module - Launchable App Discovery

**Files:**
- Modify: `modules/android-blocker/android/src/main/java/com/bibleunlock/blocker/AndroidBlockerModule.kt`
- Modify: `modules/android-blocker/index.ts`
- Modify: `src/lib/appBlocker.ts`

**Interfaces:**
- Consumes: Android `PackageManager`
- Produces:
  ```typescript
  export interface AppInfo {
    packageName: string;
    label: string;
    isSystemApp: boolean;
  }
  export function getInstalledApps(): Promise<AppInfo[]>;
  ```

- [ ] **Step 1: Update `AndroidBlockerModule.kt`**
Add an async function `getInstalledApps` using `context.packageManager.queryIntentActivities(...)` filtering out self and core system services, returning a list of Maps with `packageName` and `label`.

- [ ] **Step 2: Update TypeScript wrapper in `modules/android-blocker/index.ts`**
Add `getInstalledApps(): Promise<AppInfo[]>` with fallback for non-Android environments.

- [ ] **Step 3: Expose `AppBlocker.getInstalledApps()` in `src/lib/appBlocker.ts`**
Integrate popular defaults (Instagram, TikTok, YouTube, X, Reddit, Facebook, Netflix) for iOS/simulators.

- [ ] **Step 4: Verify TypeScript compilation**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 2**
```bash
git add modules/android-blocker/ src/lib/appBlocker.ts
git commit -m "feat: add native launchable app discovery to android-blocker module"
```

---

### Task 3: Complete Onboarding Flow Wizard (`/onboarding`)

**Files:**
- Create: `src/app/onboarding/index.tsx`
- Create: `src/app/onboarding/steps/LanguageStep.tsx`
- Create: `src/app/onboarding/steps/CarouselStep.tsx`
- Create: `src/app/onboarding/steps/SurveyStep.tsx`
- Create: `src/app/onboarding/steps/PlanStep.tsx`
- Create: `src/app/onboarding/steps/AppPickerStep.tsx`
- Create: `src/app/onboarding/steps/PaywallStep.tsx`
- Create: `src/app/onboarding/steps/PermissionStep.tsx`
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Consumes: `src/lib/mmkv.ts`, `src/lib/appBlocker.ts`, `src/lib/purchases.ts`
- Produces: Seamless user onboarding from Screen 1 to Screen 21.

- [ ] **Step 1: Create Language and Carousel steps**
Implement Screen 1 language cards and Screens 2–4 narrative slides with top progress bar.

- [ ] **Step 2: Create Spiritual Survey and Plan Configuration steps**
Implement Screens 5–7 ("What's your name?", frequency, spiritual challenges) and Screens 8–11 (multi-time scheduler, duration selection, dynamic summary card).

- [ ] **Step 3: Create App Picker with Search and Popular Presets**
Implement Screens 12–14 with instant search filter, real installed apps list, and safety warnings.

- [ ] **Step 4: Create Pro Paywall Preview step**
Implement Screen 15 with value pillars, "Try Pro Free" and "Continue with Limited Version".

- [ ] **Step 5: Create Accessibility Permission step with Real-Time Detection**
Implement Screens 16–21 with privacy guarantee dialog, "Open Settings" launcher, `AppState` auto-detecting green checkmark, and notification permission request.

- [ ] **Step 6: Update `src/app/_layout.tsx`**
Direct new users to `/onboarding` if `!isOnboardingCompleted()`.

- [ ] **Step 7: Verify TypeScript compilation**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 8: Commit Task 3**
```bash
git add src/app/onboarding/ src/app/_layout.tsx
git commit -m "feat: implement complete 21-screen onboarding flow"
```

---

### Task 4: Elevated Christian Home Dashboard

**Files:**
- Modify: `src/app/(tabs)/index.tsx`
- Create: `src/components/Last30DaysTracker.tsx`
- Create: `src/components/BadgesGrid.tsx`
- Create: `src/components/PauseBlockingModal.tsx`
- Create: `src/components/BadgeShareModal.tsx`

**Interfaces:**
- Consumes: `src/lib/mmkv.ts`, `src/lib/readingTimer.ts`, `src/lib/bible.ts`
- Produces: Screens 22a & 22b complete dashboard.

- [ ] **Step 1: Build `Last30DaysTracker.tsx`**
Horizontal scrollable row of 30 day circles with date labels, pulsing ring on today, and golden checkmarks for completed days.

- [ ] **Step 2: Build `BadgesGrid.tsx` and `BadgeShareModal.tsx`**
6 Christian achievement badges (First Step of Faith, 7-Day Disciple, 30-Day Pillar, Morning Watch, Shield of Truth, Crown of Perseverance) with viral Instagram/WhatsApp share preview.

- [ ] **Step 3: Build `PauseBlockingModal.tsx`**
Allows pausing blocking for 15m, 30m, or 1h with Scripture reflection reminder.

- [ ] **Step 4: Redesign `src/app/(tabs)/index.tsx`**
Integrate:
- Sacred greeting (*"Grace and peace to you, [Name]"*) + settings cog.
- "Time to Read" hero card with *"Amen, Let's Read"* CTA.
- Daily Devotional card.
- Streak card with `[⏸ Pause Blocking]` pill.
- Last 30 Days tracker.
- "Your Impact" 3-stat cards (minutes read, hours saved, sessions).
- Badges grid.

- [ ] **Step 5: Verify TypeScript compilation**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit Task 4**
```bash
git add src/components/ src/app/\(tabs\)/index.tsx
git commit -m "feat: build elevated christian home dashboard with 30-day tracker and badges"
```

---

### Task 5: End-to-End Validation & Living Documentation Update

**Files:**
- Modify: `docs/STATUS.md`
- Modify: `docs/DECISIONS.md`
- Modify: `docs/CHANGELOG.md`

- [ ] **Step 1: Run comprehensive TypeScript verification**
Run: `npx tsc --noEmit`
Verify: 0 errors.

- [ ] **Step 2: Document architectural decisions in `docs/DECISIONS.md`**
Record `[DEC-006]: Frictionless Guest-First Onboarding & Native App Discovery Architecture`.

- [ ] **Step 3: Update `docs/STATUS.md` and `docs/CHANGELOG.md`**
Mark onboarding and elevated dashboard tasks complete with verification proof.

- [ ] **Step 4: Commit Task 5**
```bash
git add docs/
git commit -m "docs: sync status, decisions, and changelog for onboarding flow release"
```
