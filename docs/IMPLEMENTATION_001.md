# Bible Unlock — Full Implementation Plan

Build a Bible-based app blocker modeled on [QuranUnlock](https://quranunlock.app). Users block distracting apps; they unlock only after completing daily Bible reading. Expo Router + NativeWind v5 + Supabase + RevenueCat.

## QuranUnlock Feature Parity Mapping

Based on research of QuranUnlock's website, FAQ, App Store, and Play Store listings:

| QuranUnlock Feature                          | Bible Unlock Equivalent               | Notes                                         |
| -------------------------------------------- | ------------------------------------- | --------------------------------------------- |
| Smart App Blocker                            | Smart App Blocker                     | Block apps until reading goal met             |
| Dhikr Shield                                 | Scripture Shield                      | Notification when doomscrolling >30min        |
| Ramadan Block (1 min read = 1 min access)    | Lent Mode (seasonal)                  | Premium-only                                  |
| Prayer Windows (Fajr/Dhuhr/Asr/Maghrib/Isha) | Daily Goal Window                     | Single daily goal (simpler for Christian use) |
| Reels Mode (vertical verse feed)             | —                                     | Skip for MVP                                  |
| Mushaf Reader (604-page canonical)           | Bible Reader (book/chapter)           | WEB + KJV                                     |
| Beautiful Arabic typography                  | Beautiful English serif (EB Garamond) |                                               |
| Streaks + badges                             | Streaks + progress                    |                                               |
| Offline mode                                 | Offline mode (bundled JSON)           |                                               |
| Freemium (limited blocking → premium)        | Same model                            | RevenueCat                                    |

## Resolved Design Decisions

| Decision             | Choice                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Fonts                | EB Garamond (serif/scripture), Inter (sans/UI), JetBrains Mono (code)                                      |
| Color palette        | Keep DESIGN.md (cream/coral/dark navy)                                                                     |
| Tailwind             | v4 `@theme` in `global.css` — no config file                                                               |
| Auth                 | Supabase built-in OAuth (Google + Apple)                                                                   |
| Bible data           | Bundle WEB + KJV JSON in assets                                                                            |
| **iOS blocking**     | **`react-native-device-activity`** — wraps FamilyControls/ManagedSettings/DeviceActivity                   |
| **Android blocking** | **AccessibilityService** (same as QuranUnlock) — listens for `TYPE_WINDOW_STATE_CHANGED`, redirects to app |
| Reading timer        | Simple foreground counter in MMKV, reset at midnight                                                       |
| Scripture Shield     | Local notification via `expo-notifications` with deep link                                                 |
| Navigation           | Tabs: Home, Reader, Settings. Auth group. Modal paywall.                                                   |
| Dark mode            | Default dark, light toggle                                                                                 |
| Bible translations   | WEB + KJV, user selects                                                                                    |
| Monetization         | RevenueCat: free (preset block list, 1 goal) vs premium (custom list, unlimited goals, Lent mode)          |
| App identity         | "Bible Unlock", scheme `bibleunlock`, bundle `com.bibleunlock.app`                                         |

---

## User Review Required

> [!IMPORTANT]
> **How QuranUnlock's blocking actually works (from research):**
>
> - **iOS**: Uses Apple's **Screen Time API** — `FamilyControls` for auth, `FamilyActivityPicker` for app selection, `ManagedSettingsStore` to shield apps, `DeviceActivityMonitor` for schedules. All on-device, privacy-preserving.
> - **Android**: Uses **AccessibilityService** (`BIND_ACCESSIBILITY_SERVICE`). Listens for `TYPE_WINDOW_STATE_CHANGED` to detect when a blocked app opens, then immediately launches a redirect activity forcing the user back to the reader. **Not** UsageStatsManager + overlay.
> - Both work **fully offline**.

> [!IMPORTANT]
> **iOS requires Apple's FamilyControls entitlement** — you must apply via Apple Developer Portal. Without approval, the Screen Time APIs won't function in production. Use "Development Only" capability in Xcode for testing.

> [!WARNING]
> **Android AccessibilityService** — Google Play has tightened policies. Your Play Store listing must justify the accessibility permission as a "Digital Wellbeing" / "Parental Controls" app. QuranUnlock has this approved, so the precedent exists.

> [!WARNING]
> **Ponytail decision**: Instead of building a custom Expo Module from scratch, we use **`react-native-device-activity`** (iOS) — an existing community package that wraps all the Screen Time APIs with Expo config plugin support. For Android, we write a minimal AccessibilityService module since no mature Expo-compatible package exists for this specific pattern.

---

## Proposed Changes

### Phase 1: Theme & Design Tokens

#### [MODIFY] [global.css](file:///d:/My%20Projects/bibleunlock.app/frontend/global.css)

Add `@theme` block with all DESIGN.md tokens: colors (cream/coral/dark navy), spacing, border-radius. Define `--font-serif`, `--font-sans`, `--font-mono`. Add dark mode via `@media (prefers-color-scheme: dark)` and `.dark` class.

#### [MODIFY] [theme.ts](file:///d:/My%20Projects/bibleunlock.app/frontend/src/theme.ts)

Swap Lora → EB Garamond in `fontNames`. Keep all existing color/spacing/radii/shadows (already correct).

#### [MODIFY] [app.json](file:///d:/My%20Projects/bibleunlock.app/frontend/app.json)

- `name` → "Bible Unlock", `slug` → "bible-unlock", `scheme` → "bibleunlock"
- Update splash/icon colors to cream (#faf9f5) / coral (#cc785c)
- Add plugins: `react-native-device-activity` config plugin, `expo-notifications`

---

### Phase 2: Install Packages

```bash
npx expo install \
  @supabase/supabase-js \
  react-native-mmkv \
  react-native-purchases \
  expo-notifications \
  react-native-device-activity \
  @expo-google-fonts/eb-garamond \
  @expo-google-fonts/inter \
  @expo-google-fonts/jetbrains-mono
```

> `react-native-reanimated`, `expo-font`, `react-native-gesture-handler` already installed.

---

### Phase 3: Supabase + MMKV + Auth

#### [NEW] `src/lib/supabase.ts`

Supabase client with MMKV-backed `StorageAdapter`. Placeholder `SUPABASE_URL` + `SUPABASE_ANON_KEY`.

#### [NEW] `src/lib/mmkv.ts`

MMKV instance + typed helpers: `getReadingProgress(date)`, `setReadingProgress(date, seconds)`, `getDailyGoal()`, `getBlockedApps()`, `getTranslation()`, `getStreak()`.

#### [NEW] `src/lib/auth.tsx`

`AuthProvider` context + `useAuth()` hook. `signInWithGoogle()`, `signInWithApple()`, `signOut()`. Session listener. Auto-upsert to `profiles` table.

#### Supabase SQL (user runs separately):

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  daily_goal_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_profile_update" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

### Phase 4: Navigation & Auth Screens

#### [MODIFY] `src/app/_layout.tsx`

Root layout: load fonts via `useFonts`, splash screen while loading. Wrap in `AuthProvider`. Conditional routing: no session → `(auth)`, session → `(tabs)`. Register `paywall` as modal.

#### [NEW] `src/app/(auth)/_layout.tsx`

Stack for auth group.

#### [NEW] `src/app/(auth)/login.tsx`

- Cream canvas background
- App logo + "Bible Unlock" in EB Garamond display
- "Unlock your apps by reading Scripture" tagline
- "Sign in with Google" button (coral primary)
- "Sign in with Apple" button (dark surface)

#### [NEW] `src/app/(tabs)/_layout.tsx`

Bottom tabs: Home (📊), Reader (📖), Settings (⚙️). Dark tab bar, coral active tint.

#### [NEW] `src/app/(tabs)/index.tsx` — Home

- Circular progress ring (Reanimated) showing today's reading vs goal
- Shield status badge (🔒/🔓)
- "Start Reading" coral CTA → navigates to Reader tab
- Current streak count
- Quick stats row (minutes read, days streak)

#### [NEW] `src/app/(tabs)/reader.tsx` — Bible Reader

- Book/chapter picker (horizontal scroll)
- Translation toggle (WEB / KJV pill tabs)
- Bible text in EB Garamond, generous line height (30px), warm text on dark bg
- Active reading timer display (counts up)
- Auto-call `unshieldApps()` when goal met → toast notification
- FlatList with `getItemLayout` for smooth scroll

#### [NEW] `src/app/(tabs)/settings.tsx` — Settings

- Daily goal slider (1–60 min)
- Blocked apps section:
    - Free: preset list (Instagram, TikTok, YouTube, X/Twitter, Reddit)
    - Premium: `FamilyActivityPicker` (iOS) / app list selector (Android)
- Translation preference
- Dark/light toggle
- Account (email, sign out)
- "Upgrade to Premium" → paywall modal

---

### Phase 5: Bible Data

#### [NEW] `assets/bible/web.json` + `assets/bible/kjv.json`

Download from public domain sources. Structure:

```json
{
	"books": [
		{
			"name": "Genesis",
			"abbrev": "Gen",
			"chapters": [{ "chapter": 1, "verses": [{ "verse": 1, "text": "..." }] }]
		}
	]
}
```

#### [NEW] `src/lib/bible.ts`

Types: `Book`, `Chapter`, `Verse`. Functions: `getBooks(translation)`, `getChapter(translation, book, chapter)`, `getChapterCount(translation, book)`.

---

### Phase 6: Reading Timer + Unlock Logic

#### [NEW] `src/lib/readingTimer.ts`

`useReadingTimer()` hook:

- Uses `useIsFocused()` from `@react-navigation/native` — only counts while Reader screen is focused
- Increments counter every 1s via `setInterval`
- Stores in MMKV: `reading_YYYY-MM-DD` → cumulative seconds
- Returns `{ secondsRead, goalSeconds, isGoalMet, formatted }`
- On `isGoalMet` transition → calls `DeviceActivityModule.unshieldApps()` + haptic feedback

---

### Phase 7: App Blocker — iOS (react-native-device-activity)

Uses the existing `react-native-device-activity` package, which provides:

#### Config Plugin (auto-configured via `app.json` plugins):

- Adds `FamilyControls` entitlement
- Creates `DeviceActivityMonitor` extension target
- Sets up App Group for shared data between app + extension
- Adds `NSFamilyControlsUsageDescription` to Info.plist

#### JS API (from package):

```typescript
import DeviceActivity from 'react-native-device-activity';

// Request Screen Time authorization
await DeviceActivity.requestAuthorization(); // → .individual

// Show system app picker (FamilyActivityPicker)
const selection = await DeviceActivity.selectApps();

// Shield selected apps
await DeviceActivity.shieldApps(selection);

// Remove shields (when reading goal met)
await DeviceActivity.unshieldApps();

// Check shield status
const status = await DeviceActivity.getShieldStatus();
```

#### [NEW] `src/lib/appBlocker.ts`

Thin wrapper around `react-native-device-activity` (iOS) and custom Android module. Platform-switching:

```typescript
import { Platform } from 'react-native';

export const AppBlocker = {
  requestPermissions: () => Platform.OS === 'ios'
    ? DeviceActivity.requestAuthorization()
    : AndroidBlocker.requestAccessibilityPermission(),
  shieldApps: (apps?) => ...,
  unshieldApps: () => ...,
  getStatus: () => ...,
};
```

---

### Phase 8: App Blocker — Android (AccessibilityService)

> QuranUnlock uses AccessibilityService, not UsageStatsManager. This is the proven pattern for Play Store approval as a "Digital Wellbeing" app.

#### [NEW] `modules/android-blocker/` — Expo Module (Android only)

```
modules/android-blocker/
├── expo-module.config.json
├── index.ts
├── android/
│   ├── build.gradle.kts
│   └── src/main/
│       ├── java/com/bibleunlock/blocker/
│       │   ├── AndroidBlockerModule.kt      # Expo Module bridge
│       │   ├── BlockerAccessibilityService.kt  # Core service
│       │   └── BlockerActivity.kt           # Redirect screen
│       ├── res/
│       │   └── xml/
│       │       └── accessibility_service_config.xml
│       └── AndroidManifest.xml              # Service + permission declarations
```

**`BlockerAccessibilityService.kt`** — Core Android logic (matching QuranUnlock's approach):

```kotlin
class BlockerAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return
            val blockedApps = getBlockedAppsFromMMKV()
            val isGoalMet = getGoalStatusFromMMKV()

            if (packageName in blockedApps && !isGoalMet) {
                // Redirect to Bible Unlock's blocking screen
                val intent = Intent(this, BlockerActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    putExtra("blocked_package", packageName)
                }
                startActivity(intent)
            }
        }
    }
}
```

**`BlockerActivity.kt`** — Full-screen blocking overlay:

- Shows "Read your Bible to unlock [App Name]"
- "Open Reader" button → deep-links to `bibleunlock://reader`
- Cannot be dismissed without going to reader

**JS API**:

```typescript
export function requestAccessibilityPermission(): Promise<boolean>;
export function isAccessibilityEnabled(): Promise<boolean>;
export function setBlockedApps(packageNames: string[]): Promise<void>;
export function setGoalMet(met: boolean): Promise<void>;
```

**Permissions in `AndroidManifest.xml`**:

```xml
<service
    android:name=".BlockerAccessibilityService"
    android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
    android:exported="false">
    <intent-filter>
        <action android:name="android.accessibilityservice.AccessibilityService" />
    </intent-filter>
    <meta-data
        android:name="android.accessibilityservice"
        android:resource="@xml/accessibility_service_config" />
</service>
```

---

### Phase 9: Scripture Shield (Notification)

#### [NEW] `src/lib/scriptureShield.ts`

- On app foreground: check MMKV for today's reading status
- If no reading session today AND total device screen time > 30 min → schedule local notification
- Notification: "Time for Scripture! You've been on your phone for a while. Take a moment to read."
- Deep-links to `bibleunlock://reader`
- Uses `expo-notifications` with `scheduleNotificationAsync`

---

### Phase 10: RevenueCat Paywall

#### [NEW] `src/lib/purchases.ts`

RevenueCat init with placeholder API key. `usePurchases()` hook → `{ isPremium, offerings, purchase(), restore() }`.

#### [NEW] `src/app/paywall.tsx` — Modal

- "Unlock Premium" headline (EB Garamond serif)
- Feature comparison list (free vs premium with checkmarks)
- Pricing cards: Monthly ($X.99/mo) + Lifetime ($XX.99)
- Coral CTA "Subscribe" button
- "Restore Purchases" text link
- Close button (X top-right)

#### Gating logic:

- **Free**: Preset block list (5 apps hardcoded), 1 daily goal, basic stats
- **Premium**: Custom block list via system picker, unlimited goals, Lent Mode, full stats

---

### Phase 11: Setup Documentation

#### [NEW] `SETUP.md`

1. **Supabase**: Create project, run SQL migration, get URL + anon key, enable Google + Apple OAuth providers
2. **RevenueCat**: Create project, add iOS/Android apps, create entitlement "premium", create offerings, get API keys
3. **iOS Entitlements**: Apply for FamilyControls entitlement in Apple Developer Portal. Add to Xcode capabilities. Set deployment target iOS 16+.
4. **Android Permissions**: Accessibility Service declaration. Play Store "Digital Wellbeing" app category.
5. **Environment**: Create `.env` with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `REVENUECAT_API_KEY`
6. **Build**: `npx expo prebuild --clean`, then Xcode (iOS) or Android Studio (Android)
7. **Testing**: Physical devices only. iOS needs Screen Time enabled. Android needs Accessibility permission granted.

---

## File Tree

```
frontend/
├── app.json                          # Updated name/scheme/plugins
├── global.css                        # Tailwind v4 @theme tokens
├── metro.config.js
├── postcss.config.mjs
├── tsconfig.json
├── .env                              # SUPABASE_URL, SUPABASE_ANON_KEY, REVENUECAT_API_KEY
├── assets/
│   ├── bible/
│   │   ├── web.json                  # World English Bible (bundled)
│   │   └── kjv.json                  # King James Version (bundled)
│   └── images/
├── modules/
│   └── android-blocker/              # Android-only Expo Module
│       ├── expo-module.config.json
│       ├── index.ts
│       └── android/
│           ├── build.gradle.kts
│           └── src/main/
│               ├── java/com/bibleunlock/blocker/
│               │   ├── AndroidBlockerModule.kt
│               │   ├── BlockerAccessibilityService.kt
│               │   └── BlockerActivity.kt
│               ├── res/xml/accessibility_service_config.xml
│               └── AndroidManifest.xml
├── src/
│   ├── theme.ts                      # RN theme (EB Garamond, colors, spacing)
│   ├── app/
│   │   ├── _layout.tsx               # Root: fonts, auth guard, providers
│   │   ├── paywall.tsx               # Modal paywall
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   └── login.tsx             # Google + Apple SSO
│   │   └── (tabs)/
│   │       ├── _layout.tsx           # Bottom tabs
│   │       ├── index.tsx             # Home: progress ring, shield status
│   │       ├── reader.tsx            # Bible reader + timer
│   │       └── settings.tsx          # Goals, blocked apps, account
│   ├── components/
│   │   ├── SafeAreaView.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ProgressRing.tsx          # Animated ring (Reanimated)
│   │   └── ShieldBadge.tsx
│   └── lib/
│       ├── supabase.ts               # Client + MMKV adapter
│       ├── mmkv.ts                   # Storage instance + helpers
│       ├── auth.tsx                  # AuthProvider + useAuth
│       ├── bible.ts                  # Data loader + types
│       ├── readingTimer.ts           # useReadingTimer hook
│       ├── appBlocker.ts             # Cross-platform blocker wrapper
│       ├── scriptureShield.ts        # Doomscroll notification
│       └── purchases.ts             # RevenueCat wrapper
├── SETUP.md                          # Full setup guide
```

---

## Verification Plan

### Build

- `npx tsc --noEmit` — strict TypeScript passes
- `npx expo prebuild --clean` — native projects generate
- Metro starts without module resolution errors

### Functional (Physical Devices)

1. Auth: Google/Apple login → profile in Supabase
2. Reader: EB Garamond renders, smooth scroll, timer increments
3. Timer → Unlock: Goal met → `unshieldApps()` called → shield badge updates to 🔓
4. iOS Shield: `FamilyActivityPicker` shows, apps shield/unshield correctly
5. Android Block: AccessibilityService detects blocked app → redirects to BlockerActivity
6. Scripture Shield: After 30min+ screen time with no reading → notification fires
7. Paywall: RevenueCat renders offerings, sandbox purchase works
8. Dark/light toggle works everywhere
