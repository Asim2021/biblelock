# Bible Scroll Performance & Feature Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for Inline Execution. Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.

**Goal:** Transform Bible Scroll from a static paywalled viewer into an ultra-fast, 30-artwork Reels-style devotional experience with zero black-screen lag, tactile interactions, direct Reader deep-linking, quick copy, and a high-converting "Taste & See" freemium trial hook.

**Architecture:** 
- Performance: Eliminated Android bitmap thrashing by tuning FlatList windowing, disabling clipped subview drops, setting `fadeDuration={0}`, converting bundled images to WebP, and pre-warming adjacent cards.
- Background Pool: Hybrid 10 bundled offline WebPs + dynamic expansion up to 30 images downloaded from GitHub repository CDN via `expo-file-system` and managed in Settings.
- UX & Study: Reactive bookmark state (`#f5b800`), differentiated 1-tap Save vs Note, "Read in Context" navigation, live daily reading timer pill, and branded social image export.
- Conversion: "Taste & See" 3-scroll daily teaser for free users leading to an in-feed Sanctuary card.

**Tech Stack:** React Native 0.86, Expo SDK 57, Expo Router, `react-native-view-shot`, `react-native-mmkv`, `expo-file-system`, `lucide-react-native`.

**Spec:** Architectural design and performance audit in `docs/DECISIONS.md` (`DEC-038`).

## Global Constraints

- 100% TypeScript with zero compiler errors (`npx tsc --noEmit`).
- No extraneous dependencies (use React Native built-in `Vibration` for haptic feedback).
- Zero regression on existing 100% offline functionality (bundled 10 WebP images remain primary offline fallback).
- Adhere strictly to the repository documentation protocol (`docs/STATUS.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`).

---

### Task 1: Eliminate Black Screen Latency & Tune FlatList Windowing

**Status:** Completed (`aac8f29`)

**Files:**
- Modified: `src/app/(tabs)/scroll.tsx`
- Modified: `src/components/ScrollVerseCard.tsx`
- Modified: `assets/scroll-backgrounds/` (WebP conversion)

- [x] **Step 1: Disable clipped subview dropping and increase FlatList buffer window**
  - Set `removeClippedSubviews={false}` in `scroll.tsx`.
  - Increased `windowSize={5}`, `maxToRenderPerBatch={3}`, `initialNumToRender={2}`.
  - Set `extraData={currentIndex}` in `scroll.tsx`.
- [x] **Step 2: Add placeholder tint and zero fade duration to prevent black flash**
  - In `ScrollVerseCard.tsx`: added `fadeDuration={0}` to `<Image />` and `#0d120f` background.
- [x] **Step 3: Convert 10 bundled JPEGs to hardware-accelerated WebPs**
  - Converted `bg-01` to `bg-10` from 8.8MB JPEGs to 1.7MB WebPs (80% reduction, <5ms decode).
- [x] **Step 4: Verify TypeScript compilation** (`npx tsc --noEmit` passed with 0 errors).

---

### Task 2: Remote 30-Background Pool Engine (10 Bundled + 20 Downloadable)

**Status:** Completed (`aac8f29`)

**Files:**
- Created: `src/lib/scrollImageCache.ts`
- Modified: `src/app/(tabs)/scroll.tsx`
- Modified: `src/app/(tabs)/settings.tsx`
- Created: `assets/scroll-backgrounds/remote/`

- [x] **Step 1: Create background cache and download manager**
  - Implemented `downloadArtworkPack()`, `isArtworkPackDownloaded()`, `getAvailableBackgroundCount()`, and `prewarmAdjacentBackgrounds()`.
- [x] **Step 2: Upgrade `scrollImageCache.ts` to seamlessly unify bundled and downloaded images**
  - Unifies 10 bundled WebP assets with up to 20 local filesystem URIs (`bg-11` to `bg-30`).
- [x] **Step 3: Add Artwork Download Card in Settings**
  - Added "Bible Scroll Artwork (10/30)" download card in `src/app/(tabs)/settings.tsx` with live progress bar.
- [x] **Step 4: Verify TypeScript compilation** (`npx tsc --noEmit` passed with 0 errors).

---

### Task 3: Fix View Capture Ref & Implement Reactive Gold Bookmark Indicator

**Status:** Completed (`aac8f29`)

**Files:**
- Modified: `src/app/(tabs)/scroll.tsx`
- Modified: `src/components/ScrollVerseCard.tsx`

- [x] **Step 1: Fix stale `activeCardRef` assignment in FlatList**
  - Bound `activeCardRef` dynamically and passed `extraData={currentIndex}` to FlatList.
- [x] **Step 2: Reactive bookmark state query**
  - Added `isCurrentVerseSaved` checking `getBookmarkByVerse()`.
  - Turns Save icon to solid gold `#f5b800` (`fill="#f5b800"`) with label "Saved".
- [x] **Step 3: Verify TypeScript compilation** (`npx tsc --noEmit` passed with 0 errors).

---

### Task 4: Differentiate Save (1-Tap Bookmark) vs Note & Add "Read in Context" Deep Link

**Status:** Completed (`aac8f29`)

**Files:**
- Modified: `src/app/(tabs)/scroll.tsx`
- Modified: `src/components/BookmarkPickerSheet.tsx`
- Modified: `src/components/ScrollVerseCard.tsx`

- [x] **Step 1: Implement 1-tap quick bookmark on Save button**
  - Tapping Save instantly bookmarks to primary collection with `Vibration.vibrate(25)` and gold burst.
  - Long-press on Save opens full `BookmarkPickerSheet`.
- [x] **Step 2: Differentiate Note button to force expanded note field**
  - Added `initialNoteExpanded` prop to `BookmarkPickerSheet.tsx`.
  - Tapping "Note" in Scroll opens the sheet with note input pre-expanded.
- [x] **Step 3: Add "Read in Context" CTA on verse card**
  - Added interactive citation badge with `BookOpen` icon and "Read in Context →".
  - Navigates to `/(tabs)/reader` at `book`, `chapter`, `verse`.
- [x] **Step 4: Verify TypeScript compilation** (`npx tsc --noEmit` passed with 0 errors).

---

### Task 5: Active Translation Badge & Switcher Modal Integration

**Status:** Completed (`aac8f29`)

**Files:**
- Modified: `src/app/(tabs)/scroll.tsx`
- Integrated: `src/components/BibleTranslationModal.tsx`

- [x] **Step 1: Render translation badge in top header**
  - Floating pill with `Globe` icon and `getTranslationBadge(translation)` in `scroll.tsx`.
- [x] **Step 2: Wire `BibleTranslationModal` on badge tap**
  - Tapping badge opens `<BibleTranslationModal />` allowing instant switching across 35 languages.
- [x] **Step 3: Verify TypeScript compilation** (`npx tsc --noEmit` passed with 0 errors).

---

### Task 6: Reels Ergonomics: Double-Tap Like/Save, Vibrations, Timer Pill & Copy Verse

**Status:** In Progress (Double-Tap, Vibrations & Timer Pill Done; Copy Verse remaining)

**Files:**
- Modified: `src/app/(tabs)/scroll.tsx`
- Modified: `src/components/ScrollVerseCard.tsx`

- [x] **Step 1: Add double-tap gesture handler to `ScrollVerseCard`**
  - Double-tap triggers `handleQuickSave()` with gold bookmark burst animation and vibration.
- [x] **Step 2: Add live Daily Reading Goal timer pill**
  - Floating top badge: `⏱ 4m / 10m` or `🛡️ Goal Met` updating in real-time.
- [x] **Step 3: Add "Copy Verse" quick action to Floating Controls**
  - Added Copy button (`Copy` icon from `lucide-react-native`) in the right floating action bar.
  - Copies formatted text: `"${verse.text}" — ${verse.bookName} ${verse.chapter}:${verse.verse} (${translation})`.
  - Shows subtle animated toast confirmation: "Copied [Citation] to clipboard".
  - Triggers light tactile vibration (`Vibration.vibrate(20)`).

---

### Task 7: Branded Sacred Art Social Sharing Card

**Status:** Completed (`aac8f29`)

**Files:**
- Modified: `src/components/ScrollVerseCard.tsx`
- Modified: `src/lib/shareVerseImage.ts`

- [x] **Step 1: Add watermark branding to card footer**
  - Rendered `BIBLE UNLOCK • BIBLEUNLOCK.APP` at bottom of `ScrollVerseCard.tsx`.
- [x] **Step 2: Optimize image capture resolution**
  - Captures 0.95 quality PNG with active card ref and native share dialog.
- [x] **Step 3: Verify TypeScript compilation** (`npx tsc --noEmit` passed with 0 errors).

---

### Task 8: Freemium "Taste & See" 3-Scroll Model & In-Feed Sanctuary Conversion Card (`/offers`)

**Status:** Completed (`aac8f29`)

**Files:**
- Modified: `src/app/(tabs)/scroll.tsx`
- Modified: `src/lib/mmkv.ts`

- [x] **Step 1: Add daily scroll counter in MMKV**
  - `getScrollDailyFreeCount()`, `incrementScrollDailyFreeCount()`, `FREE_DAILY_SCROLL_LIMIT = 3`.
- [x] **Step 2: Create in-feed soft paywall card**
  - Rendered after card #3 for free users with headline, value prop, and "Start 7-Day Free Trial" CTA.
- [x] **Step 3: Verify TypeScript compilation** (`npx tsc --noEmit` passed with 0 errors).

---

### Task 9: Final Polish, Copy Action Execution & Verification

**Files:**
- Modify: `src/app/(tabs)/scroll.tsx`
- Modify: `docs/STATUS.md`
- Modify: `docs/CHANGELOG.md`

- [x] **Step 1: Implement Copy Verse Action in `src/app/(tabs)/scroll.tsx`**
  - Imported `Copy` icon from `lucide-react-native` and wired `handleCopyVerse`.
  - Added floating bottom toast notification (`Copied [Citation] to clipboard`).
- [x] **Step 2: Full codebase type check**
  - Ran: `npx tsc --noEmit` (0 errors).
- [x] **Step 3: Update documentation and commit**
  - Updated `docs/STATUS.md`, `docs/CHANGELOG.md`, and plan.
