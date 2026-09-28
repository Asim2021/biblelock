# Home Page Transformation & Prayer Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Home screen into an elevated spiritual launchpad with authentic shielded app icons, dual Reader/Scroll launch actions, unified habit tracking with Grace Day protection, and full integration of the 27-prayer catalog across both Home and Library with active goal timer credit.

**Architecture:**
- **Prayer Data Layer:** Typed offline normalization of `assets/bible/en_prayers.json` into `src/lib/prayers.ts` with time-of-day resolution and category grouping.
- **Prayer Meditation Modal:** Reverent prayer viewer (`PrayerMeditationModal.tsx`) with active timer synchronization incrementing daily reading progress.
- **Dual-Mode Devotional Card:** Upgraded `DailyDevotionalCard.tsx` with a 2-segment switcher (`[ Scripture | Daily Prayer ]`), reflection takeaway, and time-of-day prayer serving.
- **Shielded Distractions Strip:** Compact `ShieldedAppsStrip.tsx` rendering authentic SVG app icons with lock badges and demoted pause control.
- **Smart Launchpad:** Enhanced hero card with contextual last-read location preview and dual CTA routing to both Reader and Bible Scroll.
- **Consolidated Habit Tracking:** Merged standalone streak card into `WeeklyStreakTracker.tsx` with Sanctuary Grace Day protection indicator.
- **Library Catalog Expansion:** Added `Prayers` segment to `LibraryTab` (`src/app/(tabs)/library.tsx`) supporting category filtering, search, and instant prayer meditation.

**Tech Stack:** React Native 0.86, Expo SDK 57, Expo Router, `lucide-react-native`, `react-native-mmkv`, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-28-home-page-improvements-design.md`

## Global Constraints

- 100% offline functionality; bundled static JSON in `assets/bible/en_prayers.json`.
- Strict TypeScript types across all components; `npx tsc --noEmit` must pass with 0 errors.
- No new external dependencies (leverage existing `lucide-react-native`, NativeWind, and theme tokens).
- Dual-theme engine compliance (`useTheme()` tokens across Celestial Dark and Parchment Light).
- Minimum 44x44pt touch targets on all interactive controls.

---

### Task 1: Prayer Data Layer & Devotional Reflection Dataset

**Files:**
- Create: `src/lib/prayers.ts`
- Create: `src/data/devotionalReflections.ts`

**Interfaces:**
- Consumes: `assets/bible/en_prayers.json`, `INSPIRATIONAL_VERSES` from `src/lib/bible.ts`
- Produces: `getAllPrayers()`, `getPrayerById()`, `getPrayersByCategory()`, `getTimeOfDayPrayer()`, `getDevotionalReflection()`

- [ ] **Step 1: Implement `src/lib/prayers.ts`**
  Parse and normalize `en_prayers.json` with strict types:
  ```typescript
  export type PrayerCategory = 'daily' | 'foundations' | 'traditional';

  export interface PrayerItem {
    id: string;
    title: string;
    prayerText: string;
    category: PrayerCategory;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
  }
  ```
  Implement `getAllPrayers()`, `getPrayerById(id)`, `getPrayersByCategory(cat)`, and `getTimeOfDayPrayer(date?: Date)` (maps hours 5–11:59 to Morning, 12–16:59 to Afternoon, 17–4:59 to Evening).

- [ ] **Step 2: Implement `src/data/devotionalReflections.ts`**
  Create 20 practical 1-sentence reflections and prayer prompts mapped to the 20 `INSPIRATIONAL_VERSES` entries in `src/lib/bible.ts`.

- [ ] **Step 3: Run TypeScript verification**
  Run: `npx tsc --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**
  ```bash
  git add src/lib/prayers.ts src/data/devotionalReflections.ts
  git commit -m "feat: add prayer normalization engine and devotional reflection dataset"
  ```

---

### Task 2: Build `PrayerMeditationModal` with Active Goal Timer Credit

**Files:**
- Create: `src/components/PrayerMeditationModal.tsx`

**Interfaces:**
- Consumes: `PrayerItem` from `src/lib/prayers.ts`, `useTheme` from `src/lib/themeContext.tsx`, `addReadingTimeSeconds` / `useReadingTimer`
- Produces: `<PrayerMeditationModal visible={boolean} prayer={PrayerItem} onClose={() => void} />`

- [ ] **Step 1: Implement `PrayerMeditationModal.tsx`**
  - Full-screen or high-profile sheet with dark sacred backdrop.
  - Active meditation timer hook (1-second tick counting active foreground prayer time).
  - Floating pill at top: `⏱️ 0:45 • Reading Goal Active`.
  - Serene typography (`EBGaramond` for prayer text, `Inter` for headers).
  - Footer actions:
    - `"Amen • Complete Prayer"`: Adds elapsed prayer seconds to MMKV daily progress via `addReadingTimeSeconds(seconds)` (or `storage.set`) and triggers gentle feedback.
    - Share Prayer button.
    - Close button.

- [ ] **Step 2: Run TypeScript verification**
  Run: `npx tsc --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/PrayerMeditationModal.tsx
  git commit -m "feat: build PrayerMeditationModal with active goal timer credit"
  ```

---

### Task 3: Upgrade `DailyDevotionalCard` with Dual Scripture/Prayer Modes

**Files:**
- Modify: `src/components/DailyDevotionalCard.tsx`

**Interfaces:**
- Consumes: `getDevotionalReflection()`, `getTimeOfDayPrayer()`, `PrayerMeditationModal`
- Produces: `<DailyDevotionalCard />` with dual tab selector

- [ ] **Step 1: Add segmented tab control to `DailyDevotionalCard.tsx`**
  - State: `mode: 'scripture' | 'prayer'`.
  - Top header: Pill switcher `[ 📖 Daily Scripture | 🙏 Daily Prayer ]`.
  - In `scripture` mode: Renders current verse, active translation badge, practical reflection box, and Goto/Share/Refresh actions.
  - In `prayer` mode: Renders dynamic time-of-day prayer badge (`🌅 Morning Prayer` / `☀️ Afternoon Prayer` / `🌙 Evening Prayer`), prayer title, truncated/formatted text preview, and `"Pray & Meditate"` CTA button triggering `PrayerMeditationModal`.

- [ ] **Step 2: Run TypeScript verification**
  Run: `npx tsc --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/DailyDevotionalCard.tsx
  git commit -m "feat: upgrade DailyDevotionalCard with dual Scripture and Prayer modes"
  ```

---

### Task 4: Build `ShieldedAppsStrip` Component

**Files:**
- Create: `src/components/ShieldedAppsStrip.tsx`

**Interfaces:**
- Consumes: `AppIcon` from `src/components/AppIcon.tsx`, `InstalledAppInfo` from `src/types/onboarding.ts`
- Produces: `<ShieldedAppsStrip />` component for Home screen

- [ ] **Step 1: Implement `ShieldedAppsStrip.tsx`**
  - Left: Shield icon + badge:
    - If `isPaused`: `Paused (${remainingMins}m)` with accent color.
    - If `isShielded`: `${blockedApps.length} Apps Guarded` with green indicator.
    - If unshielded (goal met): `All Apps Unlocked` with checkmark.
  - Center: Horizontal row of up to 5 authentic SVG app icons (`AppIcon.tsx`) with small lock overlay badges.
  - Right: Tactile secondary control button (`Pause` / `Resume`).
  - Tap on strip opens Settings app blocker configuration.

- [ ] **Step 2: Run TypeScript verification**
  Run: `npx tsc --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/ShieldedAppsStrip.tsx
  git commit -m "feat: create ShieldedAppsStrip component with authentic app icons and lock badges"
  ```

---

### Task 5: Consolidate `WeeklyStreakTracker` with Grace Day Indicator

**Files:**
- Modify: `src/components/WeeklyStreakTracker.tsx`

**Interfaces:**
- Consumes: `getGraceDayStatus()` from `src/lib/mmkv.ts`, `HabitDay`
- Produces: Consolidated `<WeeklyStreakTracker history={history} streak={streak} isPremium={isPremium} />`

- [ ] **Step 1: Upgrade props and add unified streak header**
  - Extend props to: `WeeklyStreakTrackerProps { history: HabitDay[]; streak: number; isPremium: boolean; }`.
  - Header displays:
    - Left: Flame icon + `${streak} Day Streak` with subtitle `"Keep your spiritual flame burning"`.
    - Right: If `isPremium`, displays radiant gold badge (`🛡️ Grace Protected`); if free, displays `${completedCount}/7 days` with chevron link to `/stats-detail`.
  - Preserves 7-day completion matrix with checkmarks and today dot.

- [ ] **Step 2: Run TypeScript verification**
  Run: `npx tsc --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/WeeklyStreakTracker.tsx
  git commit -m "feat: consolidate streak header and Grace Day status into WeeklyStreakTracker"
  ```

---

### Task 6: Overhaul `HomeScreen` with Smart Resume Hero & Dual Action

**Files:**
- Modify: `src/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `<ShieldedAppsStrip />`, `<WeeklyStreakTracker />`, `<DailyDevotionalCard />`, `getLastReadPosition()`, `useReadingTimer()`
- Produces: Streamlined, high-converting `HomeScreen`

- [ ] **Step 1: Embed `ShieldedAppsStrip` and blocked apps state**
  - Fetch `blockedApps` via `AppBlocker.getBlockedApps()`.
  - Place `<ShieldedAppsStrip />` directly below the top greeting.
  - Wire `onPressPause` to open `PauseBlockingModal`.

- [ ] **Step 2: Upgrade "Time to Read" Hero with Reading Context and Dual Action**
  - Context preview chip: `📖 ${lastPos.bookName} ${lastPos.chapterNumber}`.
  - Dual Launch Buttons:
    - Primary CTA: Large radiant gold button `"Read Chapter"` (`BookOpen` icon) -> pushes to `/reader` with `{ book, chapter, verse }`.
    - Secondary CTA: Medium border pill `"Visual Scroll"` (`Sparkles` icon) -> pushes to `/scroll`.
  - If `timer.isGoalMet`:
    - Displays congratulatory header: `"Goal Fulfilled • Distractions Unlocked"`.
    - Both CTAs remain active for continued reading and meditation.

- [ ] **Step 3: Remove duplicate standalone streak card**
  - Remove lines 431–475 from `index.tsx`.
  - Pass `streak={timer.streak}` and `isPremium={isPremium}` into `<WeeklyStreakTracker />`.

- [ ] **Step 4: Clean up unused imports, dead variables, and verify screen responsiveness**

- [ ] **Step 5: Run TypeScript verification**
  Run: `npx tsc --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**
  ```bash
  git add src/app/(tabs)/index.tsx
  git commit -m "feat: overhaul HomeScreen with smart resume hero, dual launchpad, and streamlined layout"
  ```

---

### Task 7: Add Dedicated Prayers Catalog to `LibraryTab`

**Files:**
- Modify: `src/app/(tabs)/library.tsx`

**Interfaces:**
- Consumes: `getAllPrayers()`, `getPrayersByCategory()`, `PrayerMeditationModal`
- Produces: 4th tab segment `Prayers` in `LibraryTab`

- [ ] **Step 1: Extend Library segmented control**
  - Update `activeTab: 'collections' | 'prayers' | 'pins' | 'notes'`.
  - Add `Prayers` segment button with `Cross` or `Sparkles` icon.

- [ ] **Step 2: Implement Prayers tab content**
  - Category filter pills: `All (27)`, `Daily Rhythm (5)`, `Biblical Foundations (11)`, `Traditional (11)`.
  - Search input for real-time title/text search.
  - Prayer card list: Title, category tag, preview excerpt, and `"Pray"` action button opening `PrayerMeditationModal`.

- [ ] **Step 3: Run TypeScript verification**
  Run: `npx tsc --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**
  ```bash
  git add src/app/(tabs)/library.tsx
  git commit -m "feat: add dedicated Prayers catalog with search and categorization to Library tab"
  ```

---

### Task 8: End-to-End Verification & Protocol Documentation

**Files:**
- Modify: `docs/STATUS.md`
- Modify: `docs/CHANGELOG.md`

- [ ] **Step 1: Full TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 2: Update documentation**
  - Record consolidated task in `docs/STATUS.md` under `TASK-056`.
  - Record consolidated entry in `docs/CHANGELOG.md`.

- [ ] **Step 3: Final Commit**
  ```bash
  git add docs/STATUS.md docs/CHANGELOG.md
  git commit -m "docs: record home page overhaul and prayer integration in status and changelog"
  ```
