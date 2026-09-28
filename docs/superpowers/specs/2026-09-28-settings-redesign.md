# Settings Page Architectural Redesign Specification

**Date:** 2026-09-28  
**Status:** Approved  
**Scope:** Settings Page Information Architecture, Store Compliance, Android Blocker Reliability, Local Data Portability, and Growth Loops.

---

## 1. Problem & Trigger
`src/app/(tabs)/settings.tsx` has grown to 2,379 lines with 15+ disconnected sections rendered in an unsegmented linear scroll. Key vulnerabilities and gaps:
1. **Store Compliance & Monetization:** No in-app "Restore Purchases" or "Manage Subscription" link inside Settings (a standard App Store / Google Play review requirement).
2. **Offline Data Vulnerability:** All reading progress, streaks, bookmarks, collections, and custom verse notes are stored in local MMKV. If a user gets a new phone or uninstalls, all spiritual history is lost with zero export/import capability.
3. **Android Blocker Reliability (OEM Killers):** Aggressive manufacturer battery savers (Samsung OneUI, Xiaomi MIUI, Oppo ColorOS) terminate the background accessibility blocker service after 1–2 hours unless battery optimization is set to "Unrestricted". Users blame the app when blocking fails.
4. **Growth & Discovery:** No word-of-mouth viral share button, store rating prompt, or direct support feedback link.
5. **Information Overload:** Habit goals, blocker permissions, app picking, theme modes, download managers, notification intervals, and profile settings are stacked without semantic grouping.

---

## 2. Information Architecture: 4 Semantic Card Clusters

The refactored Settings screen groups all features into 4 distinct semantic sections:

### Section A: Spiritual Habit & Shield Protection
- **Sanctuary Banner:** Tier state ("Sanctuary Member" with crown vs. "Enter the Sanctuary" with radiant gold CTA linking to `/paywall`).
- **My Stats & Badges Navigation Card:** Clean link to `/stats-detail`.
- **Shield Permission & Battery Guard:**
  - Status indicator (Active / Disabled) with "Manage in Settings" and "Verify Status".
  - "Battery Optimization Guard" button opening an interactive guide modal with a 1-tap shortcut to system battery settings.
- **Daily Scripture Goal:** [5m, 10m, 15m, 30m, Custom (1–120m)] with Sanctuary gates for >15m.
- **Shielded Applications:** List with icons, package names, not-installed pills, trash deletion, "+ Add Apps" modal, and "Reset Defaults" for free tier.

### Section B: Reading Experience & Media Assets
- **Appearance & Theme:** Celestial Dark, Parchment Light, System Auto.
- **Bible Translations & Languages:** WEB and KJV quick-select cards, active downloaded indicator, and "Browse & Download (50+) →" modal.
- **Bible Scroll Sacred Artwork:** HD background pack counter (`artworkCount/30`), download progress bar, and Sanctuary gate.

### Section C: Reminders & Quiet Hours
- **Daily Reading Reminders:** List of scheduled notification times with `TimePickerModal` trigger and Sanctuary multi-reminder gating.
- **Evening Reflection Prompt:** 8:00 PM reminder toggle.
- **Daily Devotional Verse Notifications:** Master toggle, daytime quiet hours guarantee banner (7:00 AM – 10:00 PM), stepper + quick chips [1, 2, 3, 6, 12, 24], schedule preview.

### Section D: Account, Data & Support
- **Reader Profile:** Display name + "Edit" modal.
- **Data Backup & Portability:**
  - "Export Backup (JSON)": Generates a validated JSON snapshot of local bookmarks, collections, reading history, and notes via React Native `Share.share`.
  - "Restore from Backup": Modal allowing the user to paste or load backup JSON with schema validation before applying to MMKV.
- **Subscription & Purchases:**
  - "Restore Purchases" button with feedback alert.
  - "Manage Subscription" button deep-linking to Google Play or App Store subscription settings.
- **Community & Feedback:**
  - "Share Bible Unlock": Native share sheet with invitation message and `https://bibleunlock.app`.
  - "Rate on Google Play": Opens store page review.
  - "Help & Feedback": Opens `mailto:support@bibleunlock.app?subject=Bible Unlock Support`.
- **Legal & Version:**
  - Privacy Policy (`https://bibleunlock.app/privacy`) and Terms of Service (`https://bibleunlock.app/terms`).
  - App Version indicator (`Bible Unlock v1.0.0 (Build 1)`).
- **Developer Controls (when `__DEV__`):** "Reset Reading Progress" and "Simulate Free / Pro".

---

## 3. Data Schemas & Interfaces

### 3.1 Backup Export/Import Schema (Version 1)
```typescript
export interface AppBackupData {
  version: 1;
  exportedAt: string; // ISO 8601
  userName: string;
  dailyGoalMinutes: number;
  blockedApps: string[];
  scheduledTimes: string[];
  bookmarks: any[];
  collections: any[];
  readingHistory: any[];
}
```

### 3.2 Battery Optimization Flow
- Platform: Android
- Action: Guide the user with specific OEM steps (Samsung, Pixel, Xiaomi) and invoke `Linking.openSettings()` to open system application details so the user can switch Battery usage to "Unrestricted".

---

## 4. Non-Functional & Compatibility Requirements
- Full dynamic theme support for both Celestial Dark (`#0d120f`) and Parchment Light (`#f8f6f0`).
- Minimum 44x44pt touch targets on all interactive buttons and icons.
- Strict preservation of all existing MMKV keys and methods.
- Zero extra third-party dependencies (use React Native built-in `Share`, `Linking`, and existing `expo-linking`).
