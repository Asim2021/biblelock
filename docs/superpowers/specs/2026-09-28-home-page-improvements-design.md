# Home Page Transformation & Prayer Integration Specification

**Date:** 2026-09-28  
**Feature:** Elevated Home Dashboard, Dual Launchpad, Shielded Apps Strip, and Prayer Integration  
**Target:** `src/app/(tabs)/index.tsx`, `src/components/`, `src/lib/prayers.ts`, `src/app/(tabs)/library.tsx`  

---

## 1. Problem & Product Rationale

The current [HomeScreen](file:///d:/My%20Projects/bibleunlock.app/src/app/%28tabs%29/index.tsx) functions adequately as an MVP dashboard, but suffers from key behavioral and product deficits:

1. **Redundant Streak Real Estate & De-motivating "Pause" Prominence:**
   - Lines 431–475 display a standalone card showing `X Days Streak` and a prominent `Pause Blocking` button, immediately followed by [WeeklyStreakTracker](file:///d:/My%20Projects/bibleunlock.app/src/components/WeeklyStreakTracker.tsx).
   - This wastes critical vertical space with two consecutive streak cards. Furthermore, an overt "Pause Blocking" button in the primary feed invites friction avoidance, weakening habit formation.
2. **Opaque "Time to Read" Hero CTA:**
   - The hero button says `"Amen, Let's Read"`, but gives no contextual hint of *where* the user is heading (e.g., `Romans 8:1 • WEB`).
   - It ignores the newly added [ScrollTab](file:///d:/My%20Projects/bibleunlock.app/src/app/%28tabs%29/scroll.tsx) visual feed, which also counts towards daily reading minutes.
3. **Absence of Shielded App Icons ("The Why I Am Here" Factor):**
   - The top bar only shows a tiny text pill (`Shielded` / `Unshielded`).
   - In habit blockers (Opal, Quran Unlock), seeing the authentic installed app icons (Instagram, TikTok, YouTube, Reddit) with lock indicators provides immediate behavioral reinforcement of what distraction is actively being held at bay.
4. **Untapped Prayer Potential (Market Opportunity):**
   - The app now contains 27 curated prayers in `assets/bible/en_prayers.json`.
   - Scripture reading happens 1x/day, but prayer routines create **3 natural daily touchpoints** (Morning, Afternoon, Evening). Integrating prayers with the reading timer gives disciples flexibility to fulfill their unlock goal through Scripture reading, prayer meditation, or both.

---

## 2. Architecture & Screen Composition

### 2.1 Home Screen Layout Order:
```
+-------------------------------------------------------------+
| Top Bar: Greeting ("Grace & peace...") | Trophy | Settings  |
+-------------------------------------------------------------+
| Shielded Apps Strip:                                        |
| [Shield 5 Apps Guarded] (IG) (TT) (YT) (RD) (X) [Pause]     |
+-------------------------------------------------------------+
| Smart Resume Hero Card:                                     |
| Time to Read • 10m target                                   |
| Progress Bar (45%)                                          |
| Context: "📖 Romans 8 • WEB"                                |
| [ Primary: Read Chapter ]    [ Secondary: Visual Scroll ]   |
+-------------------------------------------------------------+
| Daily Devotional & Prayer Card:                             |
| Segmented Switcher: [ 📖 Daily Scripture | 🙏 Daily Prayer ] |
| - If Scripture: Verse + Reflection + [Goto/Share/Refresh]   |
| - If Prayer: Time-of-Day Prayer (Morning/Afternoon/Evening) |
|   + [Pray & Meditate (Timer Active)]                        |
+-------------------------------------------------------------+
| Unified Habit & Grace Day Card:                             |
| 🔥 5-Day Streak  |  🛡️ Sanctuary Grace Day: Active          |
| 7-Day Matrix: [Sun] [Mon] [Tue] [Wed] [Thu] [Fri] [Sat]     |
+-------------------------------------------------------------+
| Your Impact Grid:                                           |
| [ Minutes in Word ]   [ Scroll Saved ]   [ Devotions ]      |
+-------------------------------------------------------------+
```

### 2.2 Library Tab Enhancement:
```
+-------------------------------------------------------------+
| Header: My Library & Prayers                                |
| Segmented Control: [ Collections | Prayers | Pins | Notes ] |
| (When "Prayers" selected):                                  |
| Category Filter: [ All (27) | Daily Rhythm | Foundations...]|
| Search: "Search 27 prayers..."                              |
| Prayer List Cards: Title, preview text, Pray button         |
+-------------------------------------------------------------+
```

---

## 3. Component & Data Specifications

### 3.1 Data Layer: `src/lib/prayers.ts`
- **Source:** Bundled offline from `assets/bible/en_prayers.json`.
- **Type Contract:**
  ```typescript
  export type PrayerCategory = 'daily' | 'foundations' | 'traditional';

  export interface PrayerItem {
    id: string;
    title: string; // normalized from 'tilte'
    prayerText: string;
    category: PrayerCategory;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
  }
  ```
- **Categorization:**
  - `daily`: Morning Prayer (#25), Afternoon Prayer (#27), Evening Prayer (#26), Morning Offering (#6), Vocation Prayer (#24).
  - `foundations`: Our Father (#1), Apostles' Creed (#9), Nicene Creed (#7), Gloria (#8), Glory Be (#4), Acts of Contrition (#10, #11, #12), Acts of Faith/Hope/Love (#13, #14, #15).
  - `traditional`: Hail Mary (#2), Sign of the Cross (#3), Guardian Angel (#5), Angelus (#16), Anima Christi (#17), Divine Praises (#18), Hail Holy Queen (#19), Memorare (#20), O Sacrum Convivium (#21), Tantum Ergo (#22), Oh My Jesus (#23).
- **Functions:**
  - `getAllPrayers(): PrayerItem[]`
  - `getPrayerById(id: string): PrayerItem | null`
  - `getPrayersByCategory(category: PrayerCategory): PrayerItem[]`
  - `getTimeOfDayPrayer(): PrayerItem`: Automatically picks based on device hour (5–11:59 Morning, 12–16:59 Afternoon, 17–23:59 & 0–4:59 Evening).

### 3.2 Component: `ShieldedAppsStrip` (`src/components/ShieldedAppsStrip.tsx`)
- Displays active shield status with authentic `<AppIcon />` vector SVGs and small lock overlay badges.
- Compact tactile button for secondary control (`Pause` / `Resume`) triggering `PauseBlockingModal`.
- Tap on strip opens Settings shielded apps management.

### 3.3 Component: `DailyDevotionalCard` (`src/components/DailyDevotionalCard.tsx`)
- Top row: Interactive 2-way pill `[ 📖 Daily Scripture | 🙏 Daily Prayer ]`.
- **Scripture View:**
  - Active translation badge (`WEB`, `KJV`, etc.).
  - Scripture verse text.
  - Practical 1-sentence reflection from `src/data/devotionalReflections.ts`.
  - Action buttons: Share, Goto in Reader, Refresh.
- **Prayer View:**
  - Dynamic Time-of-Day prayer badge (e.g. `🌅 MORNING PRAYER` / `☀️ AFTERNOON PRAYER` / `🌙 EVENING PRAYER`).
  - Prayer title & prayer text.
  - Action buttons:
    - `"Pray & Meditate"`: Opens `PrayerMeditationModal` with active timer counting toward the daily goal.
    - Share Prayer.
    - Switch/Next prayer.

### 3.4 Component: `PrayerMeditationModal` (`src/components/PrayerMeditationModal.tsx`)
- Serene full-screen or bottom sheet prayer interface with dark sacred aesthetic.
- Displays live reading timer badge (`⏱️ 0:45 • Counts to Goal`).
- Tapping `"Amen • Complete Prayer"` logs active elapsed seconds to MMKV reading progress and increments the goal timer.

### 3.5 Component: `WeeklyStreakTracker` (`src/components/WeeklyStreakTracker.tsx`)
- Merges the standalone streak flame card into `WeeklyStreakTracker`.
- Displays streak count (`X Days Streak`) and Sanctuary Grace Day protection indicator (`🛡️ Grace Protected`).
- 7-day completion matrix linking to `/stats-detail`.

### 3.6 Screen: `LibraryTab` (`src/app/(tabs)/library.tsx`)
- Adds `Prayers` segment to the top control: `[ Collections | Prayers | Pins | Notes ]`.
- Renders full catalog of 27 prayers with instant category filtering and search.
- Tapping any prayer opens `PrayerMeditationModal`.

---

## 4. Invariants & Performance Standards

- **100% Offline:** All 27 prayers and reflections bundled statically; zero network dependencies.
- **Type Safety:** 100% TypeScript with zero warnings/errors (`npx tsc --noEmit`).
- **Performance:** In-memory caching for prayer lookups; zero re-render loops on Home.
- **Thumb Ergonomics:** Strict adherence to 44x44pt minimum mobile touch targets.
