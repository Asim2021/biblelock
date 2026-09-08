# Bible Unlock: End-to-End Onboarding Flow & Elevated Christian Home Dashboard

- **Date:** 2026-09-08
- **Status:** Validated Design Spec
- **Target:** Elevate Bible Unlock into a #1 trending faith habit app inspired by Quran Unlock's user journey.

---

## 1. Executive Summary & Core Objective

The goal is to provide a world-class, spiritually uplifting user experience tailored for Christian Scripture readers. It replicates and improves upon the high-converting 22-step flow seen in Quran Unlock:
1. Frictionless, zero-barrier entry (onboarding wizard runs upfront with local/guest storage).
2. Deeply resonant Christian messaging ("Social media addiction is pulling your heart away from God", "Grace and peace to you", "Amen, Let's Read").
3. Seamless time scheduling and reading duration selection.
4. Native Android app discovery to let users block their real installed apps.
5. High-converting Pro tier value proposition ("Start 7-Day Free Trial").
6. Clear, privacy-first Accessibility service enablement with real-time detection.
7. Habit-forming Home Dashboard featuring a 30-day dot tracker, streak freeze/pause blocking, impact metrics, and unlockable Christian achievement badges.

---

## 2. Onboarding Experience Architecture (Screens 1 to 21)

### Phase 1: Language Selection (Screen 1)
- **Path:** `src/app/onboarding/index.tsx` (Step 1)
- **Options:**
  - 🇺🇸 English (Default, King James Version & World English Bible)
  - 🇪🇸 Español (Reina-Valera)
  - 🇧🇷 Português (João Ferreira de Almeida)
  - 🇫🇷 Français (Louis Segond)
  - 🇩🇪 Deutsch (Lutherbibel)
- **Design:** Deep celestial background (`#0d1117`), gold border highlight on selected card, large "Continue" button with haptic feedback.

### Phase 2: Value Proposition Carousel (Screens 2–4)
- **Path:** `src/app/onboarding/index.tsx` (Steps 2–4)
- **Slides:**
  - **Slide 1:** *"Social media addiction is pulling your heart away from God."*
  - **Slide 2:** *"Bible Unlock helps you walk closely with Christ every single day."*
  - **Slide 3:** *"It's simple. Once a day, you read Scripture to unlock your apps."* → **"Get Started"**
- **Design:** 3-bar progress indicator at top, serif accent typography (`EBGaramond_600SemiBold`), glowing gold keywords, smooth horizontal pager with arrow navigation button.

### Phase 3: Personal Spiritual Survey (Screens 5–7: "X of 3")
- **Step 1 (Name):** Friendly greeting 👋, *"What's your name?"* Text input with auto-focus and clear button.
- **Step 2 (Habit Frequency):** *"How often do you currently read the Bible?"*
  - ✨ Every day
  * 📖 A few times a week
  * 🌙 Rarely
  * 🌱 I want to start a consistent habit
- **Step 3 (Spiritual Distraction):** *"What is your biggest spiritual challenge?"*
  - ⏰ Finding quiet time
  - 📅 Staying consistent
  - 📱 Mindless screen time & distractions
  - 💭 Losing focus & motivation

### Phase 4: Plan Configuration (Screens 8–11: "X of 5")
- **Step 1 (Reading Times):**
  - Header: *"When do you want to read Scripture, [Name]?"*
  - Tip box: *"💡 Morning devotions, lunch breaks, or before sleep work best."*
  - List of configured times (e.g. "Reading Time 1: 7:00 AM", "Reading Time 2: 8:00 PM") with delete action.
  - Button: `+ Add a Reading Time` invoking time picker modal.
- **Step 2 (Duration):**
  - Header: *"[Name]'s reading plan is ready. Choose your reading duration"*
  - Cards: `5 min`, `10 min` (Default/Recommended), `15 min`, `30 min`.
  - Dynamic summary card: *"Your apps will be shielded every day at [Times] for [Duration] per session."*

### Phase 5: App Shield Selection (Screens 12–14: Step 3 of 5)
- Header: *"Now shield the apps stealing your quiet time."*
- Card: *"Select Apps to Block"* showing count badge (e.g. "5 apps picked").
- Warning banner: *"⚠️ IMPORTANT: Do NOT block Phone, Messages, or Google Play to keep vital services active."*
- Selection sheet:
  - Search bar to instantly filter apps.
  - Native list of installed launchable apps with real icons and checkboxes.
  - Pinned popular distractions shortcut: Instagram, TikTok, YouTube, X, Reddit, Facebook, Netflix, Games.
  - Bottom actions: "Cancel" & "Save & Continue".

### Phase 6: Pro Value Proposition & Trial (Screen 15: Step 4 of 5)
- Headline: *"Walk Deeper in Scripture with Bible Unlock Pro"*.
- Subtitle: *"Join thousands who found peace and purpose through daily Word."*
- Value pillars:
  - 🔒 Unlimited App Shielding
  - 🛡️ Strict Lent & Fasting Mode
  - 🌅 Morning & Evening Prayer Targets
  - ❄️ Streak Freeze Protection
  - 📖 Complete Audio Bible & Devotionals
- Actions:
  - Gold Primary Button: **"Try Bible Unlock Pro for Free"** (Opens RevenueCat sheet / 7-day trial).
  - Subtle Ghost Button: *"Continue with Limited Version"*.

### Phase 7: Accessibility Service & Notification Permissions (Screens 16–21: Step 5 of 5)
- Header: *"Enable App Shielding — Grant accessibility permission to guard your time"*.
- Educational Privacy Card:
  - 100% Offline operation.
  - Zero data collection or remote transmission.
  - Only monitors apps explicitly selected by the user.
- Step-by-step instructions for Android settings.
- Button: **"Open Settings"** (fires intent to Android Accessibility Settings).
- **Auto-Detection:** Using `AppState` change listener, as soon as the user returns to Bible Unlock with the service enabled, the UI smoothly springs into a glowing green checkmark: *"Shield Service is Active!"* → **"Complete Setup"**.
- Notification permission request to enable morning & evening reading notifications.

---

## 3. Elevated Home Dashboard Architecture (Screens 22a & 22b)

### 1. Sacred Header & Settings
- Greeting: *"Grace and peace to you,"*
- User Name: Large EB Garamond serif headline (`[Name]`).
- Settings Cog icon in top-right corner to access translations, cloud account linking (Google/Apple), reminders, and support.

### 2. "Time to Read" Hero Card
- Tactile alarm clock icon ⏰.
- Goal state: *"0/1 steps on your Bible journey today"*.
- Radiant Golden Button: **"Amen, Let's Read"** (`#d4a359` / `#e5b869`) launching the Scripture Reader.

### 3. Daily Devotion Card
- Trophy icon 🏆: *"Daily Devotional — Build steady spiritual consistency"* with direct navigation into today's reflection.

### 4. Streak & "Pause Blocking" Card
- Flame icon 🔥: *"[X] Day Streak — Walking with God daily"*.
- **Pause Blocking Pill (`[⏸ Pause Blocking]`):** Allows pausing blocking for 15m, 30m, or 1 hour with a gentle reflection prompt.
- Progress bar: *"[N] days to Crown of Faith 👑"*.

### 5. "Last 30 Days" Habit Tracker
- Horizontal scrollable row showing 30 day circles with day and date.
- Today’s circle pulses with an active golden ring.
- Completed days display a solid golden cross/check.

### 6. "Your Impact" Metrics (3 Cards)
- `[N] min` Bible Read.
- `[N] hrs` Saved from Distractions.
- `[N]` Total Devotional Sessions.

### 7. Christian Achievement Badges Grid
- ☀️ **First Step of Faith**: Completed first session.
- ⭐ **7-Day Disciple**: 1 week consistency streak.
- 🌟 **30-Day Pillar**: 1 month devoted walk.
- 🌅 **Morning Watch**: Devotion completed before 9:00 AM.
- 💎 **Shield of Truth**: 10+ hours reclaimed from distractions.
- 👑 **Crown of Perseverance**: 100 days of faithful Scripture habit.
- **Viral Share**: Tapping any badge opens a high-aesthetic social share card for Instagram Stories or messaging.

---

## 4. Technical Implementation & Data Models

### 1. MMKV Onboarding State (`src/lib/mmkv.ts`)
Add typed getters and setters for onboarding status, user name, reading times, challenges, and habit stats:
- `isOnboardingCompleted(): boolean`
- `setOnboardingCompleted(completed: boolean): void`
- `getUserName(): string`
- `setUserName(name: string): void`
- `getScheduledReadingTimes(): string[]`
- `setScheduledReadingTimes(times: string[]): void`
- `getReadingHabitStats(): { minutesRead: number; hoursSaved: number; sessions: number }`

### 2. Android Native Module Enhancement (`AndroidBlockerModule.kt`)
Add `getInstalledApps` to `AndroidBlockerModule.kt`:
- Queries `PackageManager.queryIntentActivities(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER))`
- Returns list of `{ packageName: String, label: String }` excluding system apps and current package.
- Exposed to TypeScript via `modules/android-blocker/index.ts`.

### 3. Navigation Gating (`src/app/_layout.tsx`)
- On startup, check `isOnboardingCompleted()`.
- If `false`, redirect to `/onboarding`.
- If `true`, load `/ (tabs)`.
