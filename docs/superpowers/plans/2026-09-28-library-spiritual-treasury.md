# Library & Spiritual Treasury Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Library page into an industrial-brutalist Spiritual Treasury featuring a local-first Personal Prayer Journal with Answered Prayers celebration, a consolidated Scripture Vault with OT/NT filters, an unconditional Resume Reading Telemetry Hero for light users, and a Sacred Verse Art Card generator.

**Architecture:** Extend MMKV storage and backup schemas with the `UserPrayer` model; decompose modal workflows into dedicated components (`PersonalPrayerModal.tsx`, `VerseCardShareModal.tsx`); and re-architect `src/app/(tabs)/library.tsx` into 3 semantic pillars (`Scripture Vault`, `Prayer Treasury`, `Spiritual Journal`) with high-contrast telemetry headers and reverent sanctuary aesthetics.

**Tech Stack:** React Native, Expo Router, MMKV v4 Nitro, Lucide Vector Icons, `react-native-view-shot`, Native Share.

**Spec:** [`docs/superpowers/specs/2026-09-28-library-spiritual-treasury-design.md`](file:///d:/My%20Projects/bibleunlock.app/docs/superpowers/specs/2026-09-28-library-spiritual-treasury-design.md)

**UI Skills:** Use [ui-ux-pro-max](slashCommand;ui-ux-pro-max) and [industrial-brutalist-ui](slashCommand;industrial-brutalist-ui) consistent with existing application design.

## Global Constraints
- Preserve all existing MMKV keys and methods in `src/lib/mmkv.ts`.
- Zero new third-party dependencies; utilize existing `react-native-view-shot`, `lucide-react-native`, `Share`, and MMKV.
- Ensure strict dynamic theme adaptation across Celestial Dark (`#0d120f`) and Parchment Light (`#f8f6f0`).
- Satisfy 44x44pt minimum touch targets for all interactive buttons and list actions.
- Full compatibility with Android edge-to-edge system navigation and software keyboard insets.
- **Marketing Council Guardrails:**
  - Hormozi Gating: 10 Bookmarks, 5 Active Prayers on Free Covenant tier before triggering Sanctuary paywall.
  - Sutherland Psycho-Logic: Celebratory praise ritual for Answered Prayers (praise reflection prompt, radiant gold styling, haptic feedback).
  - Sharp Zero-Friction: Unconditional top Resume Reading Hero card visible without nested tab clicks.
  - Godin Identity Attribution: Understated, dignified watermark on shared cards (`BIBLE UNLOCK • bibleunlock.app`).

---

### Task 1: MMKV Data Layer & Backup Engine for Personal Prayers

**Files:**
- Modify: `src/lib/mmkv.ts`
- Modify: `src/lib/backup.ts`

**Interfaces:**
- Consumes: `storage` from `src/lib/mmkv.ts`.
- Produces:
  - `UserPrayer` interface:
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
  - `STORAGE_KEYS.USER_PRAYERS = 'user_prayers'`
  - `getUserPrayers(): UserPrayer[]`
  - `saveUserPrayer(prayer: UserPrayer): void`
  - `deleteUserPrayer(id: string): void`
  - `markPrayerAnswered(id: string, reflection?: string): void`
  - `restoreUserPrayers(prayers: UserPrayer[]): void`
  - Extended `AppBackupData` with `prayers: UserPrayer[]` in `src/lib/backup.ts`.

- [x] **Step 1: Add `UserPrayer` model and storage keys in `src/lib/mmkv.ts`**

Add the interface and key:
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
Add `USER_PRAYERS: 'user_prayers'` to `STORAGE_KEYS`. Add `_userPrayersCache: UserPrayer[] | null = null;` to the in-memory cache definitions and reset it in `clearAll()`.

- [x] **Step 2: Implement User Prayer CRUD helpers in `src/lib/mmkv.ts`**

```typescript
export function getUserPrayers(): UserPrayer[] {
  if (_userPrayersCache !== null) {
    return _userPrayersCache;
  }
  const json = storage.getString(STORAGE_KEYS.USER_PRAYERS);
  if (!json) {
    _userPrayersCache = [];
    return _userPrayersCache;
  }
  try {
    const list = JSON.parse(json);
    if (!Array.isArray(list)) {
      _userPrayersCache = [];
      return _userPrayersCache;
    }
    _userPrayersCache = list;
    return _userPrayersCache;
  } catch {
    _userPrayersCache = [];
    return _userPrayersCache;
  }
}

export function saveUserPrayer(prayer: UserPrayer): void {
  const list = getUserPrayers();
  const filtered = list.filter((p) => p.id !== prayer.id);
  const updated = [prayer, ...filtered];
  _userPrayersCache = updated;
  storage.set(STORAGE_KEYS.USER_PRAYERS, JSON.stringify(updated));
}

export function deleteUserPrayer(id: string): void {
  const list = getUserPrayers();
  const filtered = list.filter((p) => p.id !== id);
  _userPrayersCache = filtered;
  storage.set(STORAGE_KEYS.USER_PRAYERS, JSON.stringify(filtered));
}

export function markPrayerAnswered(id: string, reflection?: string): void {
  const list = getUserPrayers();
  const target = list.find((p) => p.id === id);
  if (!target) return;
  const updated: UserPrayer = {
    ...target,
    isAnswered: true,
    answeredAt: Date.now(),
    answerReflection: reflection?.trim() || undefined,
  };
  saveUserPrayer(updated);
}

export function restoreUserPrayers(prayers: UserPrayer[]): void {
  _userPrayersCache = prayers;
  storage.set(STORAGE_KEYS.USER_PRAYERS, JSON.stringify(prayers));
}
```

- [x] **Step 3: Update `src/lib/backup.ts` to export and import user prayers**

Update `AppBackupData`:
```typescript
export interface AppBackupData {
  version: 1;
  exportedAt: string;
  userName: string;
  dailyGoalMinutes: number;
  blockedApps: string[];
  scheduledTimes: string[];
  bookmarks: Bookmark[];
  collections: VerseCollection[];
  readingHistory: YearMonthData[];
  prayers?: UserPrayer[];
}
```
In `exportBackupJSON()`, include `prayers: getUserPrayers()`. In `importBackupJSON()`, call `restoreUserPrayers(parsed.prayers || [])` if present.

- [x] **Step 4: Typecheck verification**
Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 2: Personal Prayer Management Modal (`src/components/library/PersonalPrayerModal.tsx`)

**Files:**
- Create: `src/components/library/PersonalPrayerModal.tsx`
- Consumes: `useTheme` from `src/lib/themeContext`, `UserPrayer`, `saveUserPrayer`, `markPrayerAnswered`, `deleteUserPrayer` from `src/lib/mmkv.ts`.

**Interfaces:**
- Produces: `<PersonalPrayerModal />` component.
  - Props:
    - `visible: boolean`
    - `mode: 'create' | 'edit' | 'mark_answered'`
    - `prayer?: UserPrayer | null`
    - `onClose: () => void`
    - `onSaved: () => void`

- [x] **Step 1: Implement `PersonalPrayerModal.tsx` with Sutherland Praise Celebration Flow**

1. Handle `'create'` mode:
   - Header: `New Prayer Petition`
   - Inputs: Prayer Title (e.g. "For Peace in Decision") and Prayer Request text area.
   - Save CTA: `Save Petition`.
2. Handle `'edit'` mode:
   - Header: `Edit Prayer Request`
   - Pre-fills Title and Request.
   - Includes destructive `Delete Prayer` button with confirmation alert.
3. Handle `'mark_answered'` mode (**Sutherland Ritual**):
   - Header: `Praise & Answered Prayer ✨` with radiant amber badge.
   - Displays original prayer title and creation date.
   - Dedicated praise prompt: *"How did God answer this prayer? (Testimony / Praise Note)"*.
   - Multiline praise text area (max 300 chars) with character counter.
   - Save CTA: `Record God's Faithfulness ✨` with celebratory `colors.accent` styling.
4. Uses `<KeyboardAvoidingView>`, `<SafeAreaView>`, 44x44pt touch targets, and dynamic theme tokens (`colors.background`, `colors.surface`, `colors.border`, `colors.accent`).

- [x] **Step 2: Typecheck verification**
Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 3: Sacred Verse Card Generator Modal (`src/components/library/VerseCardShareModal.tsx`)

**Files:**
- Create: `src/components/library/VerseCardShareModal.tsx`
- Consumes:
  - `SCROLL_BACKGROUNDS` from `assets/scroll-backgrounds/index.ts`
  - `Bookmark` from `src/lib/mmkv.ts`
  - `useTheme` from `src/lib/themeContext`
  - `captureRef` from `react-native-view-shot`
  - `Share` from `react-native`

**Interfaces:**
- Produces: `<VerseCardShareModal />` component.
  - Props:
    - `visible: boolean`
    - `bookmark: Bookmark | null`
    - `onClose: () => void`

- [x] **Step 1: Implement `VerseCardShareModal.tsx` with Godin Dignified Attribution**

1. Card preview anchor (4:5 social aspect ratio):
   - Full-bleed background image with selectable background from `SCROLL_BACKGROUNDS`.
   - 4-stop translucent dark overlay for high text contrast.
   - Classical typography: `EBGaramond_400Regular_Italic` Scripture quote, responsive font sizing.
   - Citation badge: `[ Romans 8:28 • WEB ]` in monospace uppercase.
   - **Godin Organic Attribution:** Subtle, non-commercial footer watermark: `BIBLE UNLOCK • bibleunlock.app` (10px uppercase, letterSpacing: 1.2).
2. Background thumbnail selector allowing 1-tap switching between bundled sacred backgrounds (Sunrise Cross, Starry Night, Calm Sea, Mountain Dawn).
3. "Share Card" button invoking `captureRef(cardRef, { format: 'png', quality: 0.95 })` and triggering `Share.share` with fallback to plain text share.

- [x] **Step 2: Typecheck verification**
Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 4: Library Screen Refactor: Telemetry Header, Resume Hero & 3 Pillars

**Files:**
- Modify: `src/app/(tabs)/library.tsx`

**Interfaces:**
- Consumes:
  - `PersonalPrayerModal` from `src/components/library/PersonalPrayerModal.tsx`
  - `VerseCardShareModal` from `src/components/library/VerseCardShareModal.tsx`
  - `PrayerMeditationModal` from `src/components/PrayerMeditationModal.tsx`
  - `BookmarkPickerSheet` from `src/components/BookmarkPickerSheet.tsx`
  - `getUserPrayers`, `deleteUserPrayer`, `markPrayerAnswered` from `src/lib/mmkv.ts`
  - `useTheme` from `src/lib/themeContext`
  - `useFeatureGate` from `src/lib/useFeatureGate`

- [x] **Step 1: Clean up Navigation Header & Add Calibrated Sanctuary Vault Tag**
- Remove `<Menu />` (to `/settings`) and `<RotateCw />` manual refresh icon.
- Add header: `[ SANCTUARY VAULT ]` tag with `Library & Treasury` title.
- Render active telemetry strip:
  - `SAVED: ${bookmarks.length}`
  - `COLLECTIONS: ${collections.length}`
  - `PRAYERS: ${activePrayers.length}`
  - `ANSWERED: ${answeredPrayers.length}`

- [x] **Step 2: Implement Unconditional "Resume Reading" Telemetry Hero Card**
- Pull `lastRead` out of the collection list.
- Positioned above all 3 tabs (Byron Sharp usability directive for light category buyers):
  - Left: BookOpen icon, Book chapter:verse, relative time (`formatRelativeTime(lastRead.updatedAt)`).
  - Right: Tactical button `[ RESUME READING → ]` with `colors.accent` border that deep-links directly to `/reader` with params.

- [x] **Step 3: Restructure into 3 Semantic Tabs**
Replace the 4 tabs with:
1. `01 SCRIPTURE`
2. `02 PRAYERS`
3. `03 JOURNAL`

- [x] **Step 4: Build Pillar 01 (`Scripture Vault`)**
- Sub-segment switch: `[ Collections (${collections.length}) | All Verses (${bookmarks.length}) ]`.
- In `Collections` sub-view:
  - Render collection cards with color dots, verse counts, relative timestamps, and edit options.
  - Prominent `+ New Collection` CTA.
  - Full-screen collection takeover preserved with back navigation, expand/collapse, sort options, and verse options.
- In `All Verses` sub-view (replaces legacy "Pins"):
  - Search bar.
  - Filter chips: `All`, `Old Testament`, `New Testament`, `Has Notes`.
  - List of verses with per-verse options button.

- [x] **Step 5: Build Pillar 02 (`Prayer Treasury`)**
- Sub-segment switch: `[ My Prayers (${userPrayers.length}) | Liturgies (${allPrayers.length}) ]`.
- In `My Prayers` sub-view:
  - Top action button: `+ New Prayer Request`.
  - Active Petitions list: Title, request, date added, `[ Edit ]` button, and `[ Mark Answered ✨ ]` CTA.
  - Answered Prayers Archive: Golden-themed collapsible section showing answered badge, original request, date answered, and user praise note.
- In `Liturgies` sub-view:
  - Retain existing 27 curated prayers with category filters (`All`, `Daily`, `Foundations`, `Traditional`), Sanctuary locks for traditional liturgies, and launch of `PrayerMeditationModal`.

- [x] **Step 6: Build Pillar 03 (`Spiritual Journal`)**
- Filter bookmarks that have notes (`bookmarks.filter(b => b.note && b.note.trim())`).
- Render chronological timeline of reflections.
- Show Book chapter:verse, italic verse quote, user reflection text, and relative time.
- Include quick actions: Edit Note, Jump to Reader, and Copy Note.

- [x] **Step 7: Wire Verse Card Generator into Per-Verse Options Sheet**
- In `selectedVerseOptions` bottom sheet:
  - Add `"Share as Image Card"` button with `Sparkles` icon.
  - Sets `cardShareVerse = selectedVerseOptions` and opens `VerseCardShareModal`.

- [x] **Step 8: Typecheck verification**
Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 5: Hormozi Gating & Dual-Theme Verification

**Files:**
- Modify: `src/app/(tabs)/library.tsx`
- Reference: `src/lib/useFeatureGate.ts`
- Reference: `src/lib/themeContext.tsx`

- [x] **Step 1: Enforce Hormozi-Calibrated Freemium Gating Rules**
- Free Tier checks:
  - Collections limit: 1 collection max (additional triggers `requirePremium('Unlimited collections')`).
  - Bookmarks limit: **10 bookmarks max** *(raised from 5)* (additional triggers `requirePremium('Unlimited bookmarks')`).
  - Personal Prayers limit: **5 active prayers max** *(raised from 3)* (additional triggers `requirePremium('Unlimited personal prayers')`).
  - Answered Prayers Archive: View up to 3 answered on Free; unlimited history on Sanctuary.
  - Liturgies: Traditional liturgies locked behind Sanctuary with gold lock badges.
  - Image Card Sharing: Standard share is free, card share watermarked or Sanctuary gated.

- [x] **Step 2: Dual-Theme Contrast & Padding Polish**
- Verify contrast in Celestial Dark (`#0d120f`) and Parchment Light (`#f8f6f0`).
- Ensure no hardcoded dark hex colors; all surfaces use `colors.surface`, `colors.border`, `colors.accent`, `colors.textPrimary`, `colors.textSecondary`.

- [x] **Step 3: Verification & Compilation Test**
- Run `npx tsc --noEmit` across the entire project.
- Verify 0 TypeScript errors.

---

## Verification Plan

### Automated Type & Syntax Check
```bash
npx tsc --noEmit
```
Expected output: 0 errors.

### Manual / Feature Verification Walkthrough
1. **Header & Telemetry:** Open Library tab. Verify `[ SANCTUARY VAULT ]` header and live telemetry stats strip (`SAVED`, `COLLECTIONS`, `PRAYERS`, `ANSWERED`). Verify no `<Menu />` or `<RotateCw />` icon.
2. **Resume Reading Hero:** Verify "Resume Reading" hero renders last read book/chapter/verse with relative time above all tabs. Tap `[ RESUME READING → ]` and confirm immediate navigation to Reader.
3. **Pillar 01 (Scripture Vault):**
   - Toggle between `Collections` and `All Verses`.
   - Test `All Verses` filtering by Old Testament and New Testament.
   - Verify 10-bookmark free quota before triggering paywall.
4. **Pillar 02 (Prayer Treasury):**
   - Create a new personal prayer request (up to 5 on Free).
   - Tap `[ Mark Answered ✨ ]`, enter praise note, and verify it moves into the Answered Prayers Archive with celebratory golden styling.
   - Switch to Liturgies sub-tab and launch `PrayerMeditationModal`.
5. **Pillar 03 (Spiritual Journal):**
   - Verify all verses with notes appear in the Journal timeline with accurate timestamps and copy reflection actions.
6. **Social Verse Card Generator:**
   - Tap `...` on any verse in Collection or All Verses.
   - Tap `Share as Image Card`. Switch between backgrounds, verify subtle `BIBLE UNLOCK • bibleunlock.app` attribution, and trigger Share.
7. **Dual-Theme Verification:**
   - Toggle theme between Celestial Dark and Parchment Light in Settings. Confirm perfect readability across all cards and sheets.
