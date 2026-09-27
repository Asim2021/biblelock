# Implementation Plan: Home Screen Stats Access & Multi-Language Bible Download Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 
1. Provide intuitive, high-visibility entry points to "My Stats & Badges" (`/stats-detail`) directly from the Home screen.
2. Build an offline-first Multi-Language Bible Download and Management Engine that keeps KJV & WEB bundled as instant offline defaults, while allowing users worldwide (e.g. Turkey, Latin America, Europe, Asia) to browse, download, persist, and read in any language.

**Architecture:**
- **Home Navigation:** Direct Expo Router pushes to `/stats-detail` from 3 strategic touchpoints on Home: Top Header bar action button, "Your Impact" section header link, and Weekly Streak card.
- **Bible Download & Storage:** `expo-file-system` document directory persistence (`${FileSystem.documentDirectory}bibles/${code}.json`), backed by MMKV installation tracking (`installed_translations`) and an in-memory `BIBLE_CACHE` with asynchronous loading and synchronous fallback.
- **Translation Hub Modal:** Shared, dual-themed bottom sheet (`BibleTranslationModal.tsx`) with "Installed" management (switch & delete) and "Download Languages" search & 1-tap progress download.

**Tech Stack:**
- React Native / Expo SDK 57
- `expo-file-system` (v57.0.6)
- `react-native-mmkv` (v4.3.2 Nitro)
- `lucide-react-native`
- Expo Router (`useRouter`)
- Theme Context (`useTheme`)

---

## User Review Required

> [!IMPORTANT]
> - **Pre-loaded Translations:** KJV and WEB remain 100% pre-loaded and bundled in the app binary (`assets/bible/`). They require 0 network access and 0 download time.
> - **Download Storage:** Downloaded Bibles are saved into the app's persistent documents directory (`expo-file-system`). They remain available completely offline once downloaded.
> - **Catalog Source:** A static catalog of public-domain international Bible translations (Turkish, Spanish, French, German, Tagalog, Portuguese, Russian, Chinese, Hindi, Arabic, Italian, Dutch, etc.) structured to match the app's `BibleData` schema.

---

## Proposed Changes

### Component 1: Home Screen Entry Points to Stats & Badges

#### [MODIFY] `src/app/(tabs)/index.tsx`
- Add `Trophy` button in the top header bar next to the Settings gear button:
  - Minimum 44x44pt touch target.
  - Navigates directly to `/stats-detail`.
  - Accessible label `"My Stats & Badges"`.
- Upgrade "Your Impact" header from static text to an interactive row with `"View All Stats & Badges →"` linking to `/stats-detail`.
- Add chevron icon and visual hover/press styling matching the theme accent.

#### [MODIFY] `src/components/WeeklyStreakTracker.tsx`
- Wrap the tracker container in a `<Pressable>` (or add an action link) that routes to `/stats-detail` so users inspecting their weekly habits can jump straight to monthly/yearly analytics and unlocked badges.

---

### Component 2: Multi-Language Bible Storage & Download Engine

#### [MODIFY] `package.json`
- Add `"expo-file-system": "~57.0.6"` to dependencies (already present in `node_modules` under Expo SDK 57).

#### [NEW] `src/data/bibleCatalog.ts`
- Static catalog defining available international Bible translations:
  - `code`: unique key (e.g. `'KJV'`, `'WEB'`, `'TUR'`, `'RVR09'`, `'LSG'`, `'LUTH1545'`, `'TLG'`, `'CUV'`, `'ALMEIDA'`, `'SYNOD'`, `'HIN'`, `'ARA'`).
  - `name`: English name (e.g. "Turkish Bible", "Reina-Valera 1909", "Louis Segond 1910").
  - `nativeName`: Endonym (e.g. "Türkçe Kutsal Kitap", "Español", "Français").
  - `language`: Language name and ISO code.
  - `isPreloaded`: `true` for KJV & WEB, `false` for downloadable translations.
  - `downloadUrl`: Direct CDN / raw JSON endpoint.
  - `sizeBytes`: Estimated size (~1.8 MB – 3.5 MB).

#### [NEW] `src/lib/bibleDownloader.ts`
- Core download and file management service:
  - `getInstalledTranslations(): BibleCatalogItem[]` (reads MMKV + checks local file existence).
  - `downloadBible(item: BibleCatalogItem, onProgress: (pct: number) => void): Promise<boolean>`:
    - Downloads file to `${FileSystem.documentDirectory}bibles/${item.code}.json`.
    - Validates JSON format (presence of `translation`, `books` array with 66 books).
    - Adds `item.code` to MMKV `installed_translations`.
  - `deleteBible(code: string): Promise<boolean>`:
    - Removes `${FileSystem.documentDirectory}bibles/${code}.json`.
    - Prevents deleting preloaded KJV or WEB.
    - If active translation was deleted, resets active translation to `'WEB'`.
    - Removes code from MMKV `installed_translations`.

#### [MODIFY] `src/lib/mmkv.ts`
- Add storage keys and helpers:
  - `getInstalledTranslationsList(): string[]` (defaults to `['KJV', 'WEB']`).
  - `setInstalledTranslationsList(codes: string[]): void`.
  - Update `getBibleTranslation()` / `setBibleTranslation()` to accept dynamic translation codes beyond just `'KJV' | 'WEB'`.

#### [MODIFY] `src/lib/bible.ts`
- Decouple `BIBLE_MAP` from hardcoded static keys:
  - Maintain in-memory `BIBLE_CACHE = new Map<string, BibleData>()`.
  - `initBible(translation: string)` loads bundled KJV/WEB synchronously, or reads downloaded JSON asynchronously from `FileSystem.documentDirectory`.
  - Export `loadBibleAsync(translation: string): Promise<BibleData>`.
  - Keep `getBible()` synchronous by returning from `BIBLE_CACHE` with automatic fallback to `WEB`.
  - Dynamically populate `BOOKS_CACHE` for downloaded translations.

---

### Component 3: Translation Hub UI & Modal

#### [NEW] `src/components/BibleTranslationModal.tsx`
- Dual-themed bottom sheet / modal providing:
  - **Tab 1: Installed Bibles:**
    - List of installed versions (`WEB`, `KJV`, and downloaded translations).
    - Radio checkmark for active translation.
    - 1-tap translation switch.
    - Delete button (with confirmation) for downloaded Bibles (protected KJV/WEB).
  - **Tab 2: Download Languages:**
    - Search bar (by language name, country, or translation title).
    - Quick language badges (e.g. "Turkish", "Spanish", "French", "German", "Chinese", etc.).
    - Download card showing translation name, native name, file size.
    - Download button with interactive percentage/spinner indicator.
    - Auto-activate on completion.

#### [MODIFY] `src/app/(tabs)/reader.tsx`
- Replace 2-way toggle pill `[ WEB | KJV ]` with a translation picker button showing current code e.g. `[ 📖 WEB ▾ ]` or `[ 📖 TUR ▾ ]`.
- Tapping opens `BibleTranslationModal`.

#### [MODIFY] `src/app/(tabs)/settings.tsx`
- Add "Bible Translations & Languages" settings card:
  - Displays currently selected translation.
  - Displays count of installed translations.
  - "Manage & Download Bibles" button opening `BibleTranslationModal`.

---

## Verification Plan

### Automated Tests & Type Checks
```bash
# Verify TypeScript typing across all files
npx tsc --noEmit
```

### Manual Verification
1. **Home Screen Entry Points:**
   - Tap top header Trophy icon → Verify `/stats-detail` opens smoothly.
   - Tap "View All Stats & Badges →" in "Your Impact" section → Verify `/stats-detail` opens.
   - Tap Weekly Streak card → Verify `/stats-detail` opens.
2. **Pre-loaded Translations:**
   - Open Reader → Verify KJV and WEB load instantly offline with 0 delay.
3. **Bible Download Flow:**
   - Open Translation Modal → Switch to "Download Languages" tab.
   - Search "Turkish" → Tap Download on "Türkçe Kutsal Kitap".
   - Verify progress indicator finishes and Bible is saved to disk.
   - Switch active translation to Turkish → Open Reader → Verify Turkish Scripture renders correctly with correct chapters and verses.
4. **Offline Persistence & Deletion:**
   - Restart the app / disconnect Wi-Fi → Verify Turkish translation is still installed and readable offline.
   - In Settings/Modal, delete the downloaded translation → Verify file is deleted and app resets active translation to WEB without crash.
