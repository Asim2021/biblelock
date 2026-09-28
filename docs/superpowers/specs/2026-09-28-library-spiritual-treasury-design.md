# Library & Spiritual Treasury Architectural Specification

**Date:** 2026-09-28  
**Status:** Approved (Marketing Council Validated)  
**Scope:** Library Tab Information Architecture, Personal Prayer Journal & Answered Prayers Engine, Scripture Vault Consolidation, Last Read Telemetry Hero, Social Verse Art Generation, and Industrial Brutalist UI Alignment with Sacred Reverence.

---

## 1. Problem & Trigger

`src/app/(tabs)/library.tsx` currently functions as an unpolished, fragmented list viewer. Key issues and product gaps:
1. **Redundant & Confusing Navigation Artifacts:**
   - Top-left contains a hamburger `<Menu />` button linking to `/settings`, despite `Settings` already existing as Tab 5 in the bottom navigation bar.
   - Top-right contains a manual `<RotateCw />` reload icon, which is unnecessary because MMKV provides instantaneous synchronous in-memory caching and `useFocusEffect` auto-syncs on tab focus.
   - A dismissible informational banner contains an unclickable `"Learn More"` link.
2. **Information Architecture Fragmentation:**
   - The current 4-tab model (`Collections`, `Prayers`, `Pins`, `Notes`) has heavy semantic overlap. `Pins` is simply a flat list of all bookmarks, and `Notes` is a flat list of bookmarks with notes. A single verse saved with a note is scattered across three different tabs.
   - `"Last Read"` is hardcoded as row 0 inside the `Collections` list with an auto badge. It is a reading position, not a verse collection.
3. **Missed Market Retention Drivers:**
   - The `Prayers` tab is 100% static read-only text (27 liturgies). Top Christian habit applications (Glorify, Echo Prayer, Hallow, YouVersion) identify personal prayer requests and **"Answered Prayers"** tracking as the primary switching barrier and daily retention hook.
   - Saved bookmarks lack visual shareability; users can only copy plain unformatted text.
4. **Visual & Emotional Tone:**
   - The Library screen lacks the high-contrast typography, crisp 1px structural dividing lines, and telemetry precision of Settings, yet needs to balance mechanical rigor with the **warmth and reverent stillness of a sanctuary**.

---

## 2. Information Architecture: 3 Semantic Pillars

The Library is restructured into 3 clear functional pillars:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [ SANCTUARY VAULT ]                                                    │
│ Library & Treasury                                                     │
│ Telemetry: SAVED: 14 • COLLECTIONS: 3 • PRAYERS: 6 • ANSWERED: 2       │
├────────────────────────────────────────────────────────────────────────┤
│ [ RESUME READING HERO CARD — ZERO FRICTION FOR LIGHT BUYERS ]          │
│ Romans 8:28 • WEB (Read 2h ago)                    [ RESUME READING → ]│
├────────────────────────────────────────────────────────────────────────┤
│ [ 01 SCRIPTURE ]       │ [ 02 PRAYERS ]        │ [ 03 JOURNAL ]        │
│                        │                       │                       │
│ • Sub: Collections     │ • Sub: My Prayers     │ • Chronological Study │
│   vs All Verses        │   vs Liturgies        │   Notes & Reflections │
│ • OT / NT filter chips │ • Active Petitions    │ • Verse Citation      │
│ • Color-coded swatches │ • Answered Archive ✨ │ • Copy & Export Notes │
│ • Full Detail Takeover │ • 27 Curated Creeds   │                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Unconditional Top Level: Resume Reading Telemetry Hero
- Positioned above all tabs to satisfy Byron Sharp's usability directive for light category buyers who just want to complete their daily reading without managing a journal.
- Displays current last read book, chapter, verse, and translation.
- Displays relative time since last read (`Just now`, `3 hours ago`, `Yesterday`).
- High-contrast tactile CTA `[ RESUME READING → ]` deep-linking directly to `/reader`.

### Pillar 01: Scripture Vault (`collections`)
- **Sub-segment switch:** `[ Collections (N) | All Verses (M) ]`.
- **Collections View:**
  - Grid/List of user collections with color swatches, verse counts, relative timestamps, and edit actions.
  - Prominent `+ New Collection` CTA.
  - Tapping a collection opens the dedicated full-screen detail view with sort options (`Date Added` vs `Canonical Book Order`), expand/collapse toggles, and per-verse options sheet.
- **All Verses View (Unified replacement for legacy "Pins"):**
  - Searchable list of all bookmarked verses across all collections.
  - Filter chips: `All`, `Old Testament`, `New Testament`, `Has Notes`.
  - Action buttons: Jump to Reader, Options sheet.

### Pillar 02: Prayer Treasury (`prayers`)
- **Sub-segment switch:** `[ My Prayers (N) | Liturgies (27) ]`.
- **My Prayers View (Personal Prayer Journal):**
  - **Active Petitions:** List of personal prayer requests showing title, notes, creation date, and an intentional `[ Mark Answered ✨ ]` action button.
  - **The Answered Prayer Celebration (Sutherland Psycho-Logic):**
    - Tapping `Mark Answered` triggers celebratory golden styling (`colors.accent`), haptic feedback, and a reverent prompt: *"How did God answer this prayer? (Praise Testimony)"*.
  - **Answered Prayers Archive:** Collapsible golden-themed section celebrating answered prayers with original petition, date answered, and user praise reflection.
  - Top action button: `+ New Prayer Request`.
- **Liturgies View:**
  - 27 curated prayers with category filters (`All`, `Daily Rhythm`, `Foundations`, `Traditional`).
  - Gated Traditional Liturgies with Sanctuary lock badges.
  - 1-tap "Pray & Meditate →" opening `PrayerMeditationModal` with active habit timer.

### Pillar 03: Spiritual Journal (`notes`)
- Aggregated chronological timeline of all verses that contain user reflection notes.
- Card includes: Book chapter:verse pill, italic Scripture snippet, user reflection note, and relative timestamp.
- Quick actions: Edit Note, View in Reader, and `Copy Reflection`.

---

## 3. High-Impact Features

### 3.1 Sacred Verse Card Generator (Godin Remarkability & Social Share)
- In the per-verse options sheet, add `"Share as Image Card"`.
- Opens `VerseCardShareModal.tsx`:
  - Renders a 4:5 social-formatted card with bundled WebP sacred artwork (`assets/scroll-backgrounds/`).
  - Overlay gradient with calibrated opacity for high text contrast.
  - Serif Scripture quote (`EBGaramond_400Regular_Italic`), clean citation badge.
  - **Understated Organic Attribution:** Dignified, subtle watermark: `BIBLE UNLOCK • bibleunlock.app` (10px tracking), avoiding loud commercial banners to ensure genuine identity-based peer sharing.
  - Invokes `react-native-view-shot` for crisp PNG capture and triggers the native OS share sheet.

---

## 4. Data Layer & Storage Extensions (`src/lib/mmkv.ts`, `src/lib/backup.ts`)

### 4.1 `UserPrayer` Model
```typescript
export interface UserPrayer {
  id: string; // Format: prayer_${Date.now()}
  title: string;
  request: string;
  createdAt: number;
  isAnswered: boolean;
  answeredAt?: number;
  answerReflection?: string;
}
```

### 4.2 Storage Methods
- `getUserPrayers(): UserPrayer[]`
- `saveUserPrayer(prayer: UserPrayer): void`
- `deleteUserPrayer(id: string): void`
- `markPrayerAnswered(id: string, reflection?: string): void`
- `restoreUserPrayers(prayers: UserPrayer[]): void`

### 4.3 Data Backup Integration
- Update `AppBackupData` in `src/lib/backup.ts` to include `prayers: UserPrayer[]`.
- Ensure JSON export and restore include all personal prayers and answered logs.

---

## 5. Monetization & Freemium Matrix (Hormozi Value Equation Calibrated)

To avoid killing switching barriers before users invest deep personal sweat equity, free quotas are expanded to allow genuine habit formation:

| Discipline | Free Tier (Covenant) | Sanctuary Member | Strategic Rationale |
|---|---|---|---|
| **Collections** | 1 Collection | Unlimited Collections | Allows initial organization; heavy organizers upgrade. |
| **Bookmarks** | **10 Bookmarks** *(raised from 5)* | Unlimited Bookmarks | **Hormozi Barrier:** 10 bookmarked verses create a real switching cost. |
| **Personal Prayers** | **Up to 5 Active Prayers** *(raised from 3)* | Unlimited Prayers & Answered Archive | 5 active petitions allow a full family/personal prayer routine. |
| **Answered Prayers Archive** | View last 3 answered | Unlimited Answered Archive & History | Seeing answered prayers triggers the upgrade to preserve testimony history. |
| **Liturgies** | 16 Daily & Foundation Liturgies | 27 Liturgies (includes 11 Traditional Creeds) | Preserves basic prayer habit; gates deep historical litanies. |
| **Verse Art Card Export** | Standard Share (Text) | High-Res Sacred Art Card Generator | Viral growth feature gated for premium subscribers. |
| **Spiritual Notes** | Unlimited (200 char/note) | Unlimited (200 char/note) | Zero friction for writing personal reflections. |

---

## 6. Non-Functional & Visual Design Directives
- **Industrial Brutalist UI + Sacred Reverence:** Monospace telemetry tags (`[ SANCTUARY VAULT ]`), visible 1px borders, strict typography scale contrast, balanced with warm amber accents (`#f5b800`) and quiet serif reflection blocks.
- **Dual Theme Tokens:** Dynamic adaptation across Celestial Dark (`#0d120f`) and Parchment Light (`#f8f6f0`).
- **Touch Target Accessibility:** All buttons and interactive rows adhere to the 44x44pt minimum touch standard.
- **Zero Third-Party Bloat:** Reuses existing `react-native-view-shot`, `lucide-react-native`, `react-native-safe-area-context`, and MMKV.
