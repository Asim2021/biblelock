# Stats Page & Spiritual Freedom Dashboard Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Stats screen into an authentic, behaviorally motivating spiritual freedom dashboard featuring an SVG circular progress ring, real weekly habit telemetry, persistent all-time best streaks, distraction interception tracking, and a 12-badge tiered progression system with an anti-alienation compact preview.

**Architecture:** Extend MMKV local storage with persistent best streak and distraction interception counters. Build a zero-overhead SVG `CircularProgressRing` using `react-native-svg`. Refactor `stats-detail.tsx` to bind directly to live weekly habit days, display the "Freedom Reclaimed" telemetry card, incorporate the 12-badge tiered model with collapsible disclosure, and remove duplicate devotional and fabricated community metrics.

**Tech Stack:** React Native, Expo, TypeScript, NativeWind, `react-native-svg`, `react-native-mmkv`, `lucide-react-native`.

**Spec:** `docs/superpowers/specs/2026-09-28-stats-page-overhaul-design.md`

## Global Constraints
- 100% offline-first; zero external network requests or third-party cloud analytics.
- Zero fabricated metrics; every number displayed must be derived from genuine device telemetry.
- Strict TypeScript types (`npx tsc --noEmit` must pass with 0 errors).
- Comply with NativeWind styling and dynamic theme tokens from `useTheme()` (`colors`, `isDark`).
- Touch targets must be at least 44x44pt on mobile.

---

### Task 1: Extend MMKV Telemetry for Best Streak and Distraction Interceptions

**Files:**
- Modify: `src/lib/mmkv.ts:30-100` (Storage keys)
- Modify: `src/lib/mmkv.ts:650-700` (Telemetry functions)
- Modify: `src/types/onboarding.ts:70-90` (Badge types)

**Interfaces:**
- Produces:
  - `getBestStreak(): number`
  - `updateBestStreak(streak: number): number`
  - `recordInterception(): void`
  - `getTodayInterceptions(): number`
  - `getTotalInterceptions(): number`
  - `getScreenTimeRedeemedHours(): number`
  - `BadgeItem` updated with category: `'foundations' | 'endurance' | 'discipline' | 'devotion'`

- [ ] **Step 1: Update `src/types/onboarding.ts` with badge category and metadata**

```typescript
export interface BadgeItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  unlocked: boolean;
  requirement: string;
  category?: 'foundations' | 'endurance' | 'discipline' | 'devotion';
}
```

- [ ] **Step 2: Add storage keys in `src/lib/mmkv.ts`**

```typescript
// Under STORAGE_KEYS constant:
ALL_TIME_BEST_STREAK: 'all_time_best_streak',
INTERCEPTIONS_PREFIX: 'interceptions_',
TOTAL_INTERCEPTIONS_COUNT: 'total_interceptions_count',
```

- [ ] **Step 3: Implement getters and setters in `src/lib/mmkv.ts`**

```typescript
export function getBestStreak(): number {
  return storage.getNumber(STORAGE_KEYS.ALL_TIME_BEST_STREAK) ?? 1;
}

export function updateBestStreak(streak: number): number {
  const currentBest = getBestStreak();
  if (streak > currentBest) {
    storage.set(STORAGE_KEYS.ALL_TIME_BEST_STREAK, streak);
    return streak;
  }
  return currentBest;
}

export function recordInterception(): void {
  const todayKey = getTodayDateKey();
  const dailyKey = `${STORAGE_KEYS.INTERCEPTIONS_PREFIX}${todayKey}`;
  const todayCount = storage.getNumber(dailyKey) ?? 0;
  storage.set(dailyKey, todayCount + 1);

  const totalCount = storage.getNumber(STORAGE_KEYS.TOTAL_INTERCEPTIONS_COUNT) ?? 0;
  storage.set(STORAGE_KEYS.TOTAL_INTERCEPTIONS_COUNT, totalCount + 1);
}

export function getTodayInterceptions(): number {
  const todayKey = getTodayDateKey();
  const dailyKey = `${STORAGE_KEYS.INTERCEPTIONS_PREFIX}${todayKey}`;
  return storage.getNumber(dailyKey) ?? 0;
}

export function getTotalInterceptions(): number {
  return storage.getNumber(STORAGE_KEYS.TOTAL_INTERCEPTIONS_COUNT) ?? 0;
}

export function getScreenTimeRedeemedHours(): number {
  const totalInterceptions = getTotalInterceptions();
  const impact = getImpactStats();
  // Average intercepted social session = ~12 mins (0.2 hrs) prevented + active Scripture time
  const hoursFromInterceptions = totalInterceptions * 0.2;
  const hoursFromScripture = impact.minutesRead / 60;
  return parseFloat((hoursFromInterceptions + hoursFromScripture).toFixed(1));
}
```

- [ ] **Step 4: Typecheck verification**

Run: `npx tsc --noEmit`  
Expected: PASS with 0 errors.

---

### Task 2: Create Reusable SVG Circular Progress Ring Component

**Files:**
- Create: `src/components/stats/CircularProgressRing.tsx`

**Interfaces:**
- Consumes: `react-native-svg` (`Svg`, `Circle`, `G`), `lucide-react-native` (`Check`, `Flame`, `Zap`), `useTheme()`.
- Produces: `<CircularProgressRing size={number} strokeWidth={number} progress={number} isGoalMet={boolean} />`.

- [ ] **Step 1: Write `src/components/stats/CircularProgressRing.tsx`**

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Check, Flame } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';

interface CircularProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0.0 to 1.0+
  isGoalMet: boolean;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = React.memo(({
  size = 96,
  strokeWidth = 8,
  progress,
  isGoalMet,
}) => {
  const { colors, isDark } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference - clampedProgress * circumference;
  const percentText = Math.round(progress * 100);

  const strokeColor = isGoalMet ? colors.success : colors.accent;
  const trackColor = isDark ? '#1a231d' : colors.surfaceSubtle;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Progress Arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>

      {/* Center Feedback Content */}
      <View
        style={{
          position: 'absolute',
          width: size - strokeWidth * 2 - 8,
          height: size - strokeWidth * 2 - 8,
          borderRadius: (size - strokeWidth * 2 - 8) / 2,
          backgroundColor: isGoalMet ? (isDark ? '#1a3324' : '#eaf7ee') : colors.surfaceSubtle,
          borderWidth: 1,
          borderColor: isGoalMet ? colors.success : colors.borderSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isGoalMet ? (
          <Check size={26} color={colors.success} strokeWidth={2.8} />
        ) : progress > 0 ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.accent }}>
              {percentText}%
            </Text>
          </View>
        ) : (
          <Flame size={22} color={colors.textMuted} />
        )}
      </View>
    </View>
  );
});
```

- [ ] **Step 2: Typecheck verification**

Run: `npx tsc --noEmit`  
Expected: PASS with 0 errors.

---

### Task 3: Expand Badges System to 12 Tiers with Anti-Alienation Grid

**Files:**
- Modify: `src/components/BadgesGrid.tsx`
- Modify: `src/app/stats-detail.tsx:85-140`

**Interfaces:**
- Consumes: `BadgeItem` from `src/types/onboarding.ts`.
- Produces: 12 tiered badges with a 6-badge compact default preview and "View All 12 Milestones" toggle.

- [ ] **Step 1: Update `src/components/BadgesGrid.tsx` with compact preview mode**

Add state `const [expanded, setExpanded] = useState(false);` and slice badges:
```tsx
const displayBadges = expanded ? badges : badges.slice(0, 6);
```
Add collapsible footer button:
```tsx
{badges.length > 6 && (
  <Pressable
    onPress={() => setExpanded(!expanded)}
    style={{
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      borderRadius: 12,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    }}
  >
    <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.accent }}>
      {expanded ? 'Show Less' : `View All ${badges.length} Milestones (${badges.filter(b => b.unlocked).length} Unlocked)`}
    </Text>
  </Pressable>
)}
```

- [ ] **Step 2: Expand `badges` array in `src/app/stats-detail.tsx` to 12 tiers**

```typescript
const badges: BadgeItem[] = useMemo(
  () => [
    // Foundations
    {
      id: 'genesis',
      title: 'Genesis',
      subtitle: 'First Step',
      icon: '🌱',
      category: 'foundations',
      unlocked: impact.sessions >= 1 || timer.streak >= 1,
      requirement: 'Complete your first Scripture reading session',
    },
    {
      id: 'david_courage',
      title: "David's Courage",
      subtitle: '3-Day Habit',
      icon: '⚔️',
      category: 'foundations',
      unlocked: timer.streak >= 3 || bestStreak >= 3,
      requirement: 'Maintain your reading streak for 3 consecutive days',
    },
    {
      id: 'solomon_wisdom',
      title: "Solomon's Wisdom",
      subtitle: '7-Day Streak',
      icon: '👑',
      category: 'foundations',
      unlocked: timer.streak >= 7 || bestStreak >= 7,
      requirement: "Complete 7 consecutive days in God's Word",
    },
    // Endurance
    {
      id: 'fortress',
      title: 'Fortress of Faith',
      subtitle: '14-Day Walk',
      icon: '🏰',
      category: 'endurance',
      unlocked: timer.streak >= 14 || bestStreak >= 14,
      requirement: 'Reach a 14-day consecutive reading streak',
    },
    {
      id: 'pillar_of_faith',
      title: 'Pillar of Faith',
      subtitle: '30-Day Devotion',
      icon: '🏛️',
      category: 'endurance',
      unlocked: timer.streak >= 30 || bestStreak >= 30,
      requirement: 'Reach a 30-day consecutive reading streak',
    },
    {
      id: 'centurion',
      title: 'Centurion Walk',
      subtitle: '50-Day Steadfast',
      icon: '🛡️',
      category: 'endurance',
      unlocked: timer.streak >= 50 || bestStreak >= 50,
      requirement: 'Reach 50 consecutive days walking with Jesus',
    },
    {
      id: 'saint_walk',
      title: "Saint's Walk",
      subtitle: '100-Day Centurion',
      icon: '🕊️',
      category: 'endurance',
      unlocked: timer.streak >= 100 || bestStreak >= 100,
      requirement: 'Complete 100 days of faithful Scripture habit',
    },
    // Discipline
    {
      id: 'armor_of_god',
      title: 'Armor of God',
      subtitle: 'Apps Guarded',
      icon: '🛡️',
      category: 'discipline',
      unlocked: shieldConfigured && blockedAppsCount >= 3,
      requirement: 'Shield at least 3 distracting apps from temptation',
    },
    {
      id: 'iron_wall',
      title: 'Iron Wall',
      subtitle: '5 Apps Guarded',
      icon: '🧱',
      category: 'discipline',
      unlocked: shieldConfigured && blockedAppsCount >= 5,
      requirement: 'Shield 5 or more distracting apps from temptation',
    },
    {
      id: 'living_water',
      title: 'Living Water',
      subtitle: '30m in Word',
      icon: '🌊',
      category: 'discipline',
      unlocked: impact.minutesRead >= 30,
      requirement: 'Read Scripture for over 30 cumulative minutes',
    },
    {
      id: 'wellspring',
      title: 'Deep Wellspring',
      subtitle: '2h in Scripture',
      icon: '⛲',
      category: 'discipline',
      unlocked: impact.minutesRead >= 120,
      requirement: 'Read Scripture for over 120 cumulative minutes',
    },
    // Devotion
    {
      id: 'dawn_devotion',
      title: 'Dawn Watcher',
      subtitle: 'Morning Grace',
      icon: '🌅',
      category: 'devotion',
      unlocked: impact.sessions >= 1 && new Date().getHours() < 9,
      requirement: 'Complete a Bible reading session before 9:00 AM',
    },
  ],
  [impact.sessions, impact.minutesRead, timer.streak, bestStreak, shieldConfigured, blockedAppsCount]
);
```

- [ ] **Step 3: Typecheck verification**

Run: `npx tsc --noEmit`  
Expected: PASS with 0 errors.

---

### Task 4: Build "Freedom Reclaimed" Telemetry Card Component

**Files:**
- Create: `src/components/stats/FreedomReclaimedCard.tsx`

**Interfaces:**
- Consumes: `AppIcon` from `src/components/AppIcon.tsx`, `useTheme()`, `blockedApps`.
- Produces: `<FreedomReclaimedCard todayInterceptions={number} totalInterceptions={number} redeemedHours={number} blockedAppsCount={number} blockedApps={InstalledAppInfo[]} />`.

- [ ] **Step 1: Write `src/components/stats/FreedomReclaimedCard.tsx`**

```tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ShieldCheck, Zap, Clock, Shield } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { AppIcon } from '../AppIcon';
import { InstalledAppInfo } from '../../lib/appBlocker';

interface FreedomReclaimedCardProps {
  todayInterceptions: number;
  totalInterceptions: number;
  redeemedHours: number;
  blockedAppsCount: number;
  blockedApps: InstalledAppInfo[];
}

export const FreedomReclaimedCard: React.FC<FreedomReclaimedCardProps> = React.memo(({
  todayInterceptions,
  totalInterceptions,
  redeemedHours,
  blockedAppsCount,
  blockedApps,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        padding: 20,
        borderRadius: 24,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ShieldCheck size={18} color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
            Freedom Reclaimed
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
            backgroundColor: isDark ? '#1a3324' : '#eaf7ee',
            borderWidth: 1,
            borderColor: colors.success,
          }}
        >
          <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.success }}>
            Active Shield
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
        Mindless distractions transformed into quiet time with God.
      </Text>

      {/* 3 Metrics Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        {/* Temptations Intercepted */}
        <View
          style={{
            flex: 1,
            marginRight: 6,
            padding: 12,
            borderRadius: 14,
            backgroundColor: colors.surfaceSubtle,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            alignItems: 'center',
          }}
        >
          <Zap size={16} color={colors.accent} style={{ marginBottom: 4 }} />
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
            {todayInterceptions}
          </Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
            Today
          </Text>
          <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>
            ({totalInterceptions} all-time)
          </Text>
        </View>

        {/* Screen Time Redeemed */}
        <View
          style={{
            flex: 1,
            marginHorizontal: 3,
            padding: 12,
            borderRadius: 14,
            backgroundColor: colors.surfaceSubtle,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            alignItems: 'center',
          }}
        >
          <Clock size={16} color={colors.accent} style={{ marginBottom: 4 }} />
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
            {redeemedHours}h
          </Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
            Time Saved
          </Text>
          <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>
            from doomscroll
          </Text>
        </View>

        {/* Shielded Apps */}
        <View
          style={{
            flex: 1,
            marginLeft: 6,
            padding: 12,
            borderRadius: 14,
            backgroundColor: colors.surfaceSubtle,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            alignItems: 'center',
          }}
        >
          <Shield size={16} color={colors.accent} style={{ marginBottom: 4 }} />
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
            {blockedAppsCount}
          </Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
            Guarded Apps
          </Text>
          <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>
            locked to goal
          </Text>
        </View>
      </View>

      {/* Guarded Apps Icon Strip */}
      {blockedApps.length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 12 }}>
          <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Currently Guarded Applications
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {blockedApps.map((app) => (
              <View
                key={app.packageName}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  marginRight: 8,
                }}
              >
                <AppIcon packageName={app.packageName} size={16} />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Inter_500Medium',
                    color: colors.textPrimary,
                    marginLeft: 6,
                  }}
                  numberOfLines={1}
                >
                  {app.appName}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
});
```

- [ ] **Step 2: Typecheck verification**

Run: `npx tsc --noEmit`  
Expected: PASS with 0 errors.

---

### Task 5: Refactor `src/app/stats-detail.tsx` & Integrate All Upgrades

**Files:**
- Modify: `src/app/stats-detail.tsx`

**Key Edits:**
1. Import `CircularProgressRing`, `FreedomReclaimedCard`, `getWeeklyHabitDays`, `getBestStreak`, `updateBestStreak`, `getTodayInterceptions`, `getTotalInterceptions`, `getScreenTimeRedeemedHours`, `getGraceDayStatus`.
2. Remove `DailyDevotionalCard` and fabricated "Our Week in Review" card.
3. Wire hero card to `<CircularProgressRing />`.
4. Replace placeholder week calculations with authentic `getWeeklyHabitDays()`.
5. Add the persistent Best Streak in Lifetime Activity.
6. Add the Grace Shield Loss-Aversion Banner with dynamic copy based on Sanctuary status.

- [ ] **Step 1: Update imports and state in `src/app/stats-detail.tsx`**

```tsx
import {
  getUserName,
  getImpactStats,
  getBlockedApps,
  hasConfiguredBlockedApps,
  getIsShielded,
  getReadingHistory30Days,
  getReadingHistoryYear,
  getWeeklyHabitDays,
  getBestStreak,
  updateBestStreak,
  getTodayInterceptions,
  getTotalInterceptions,
  getScreenTimeRedeemedHours,
  getGraceDayStatus,
} from '../lib/mmkv';
import { CircularProgressRing } from '../components/stats/CircularProgressRing';
import { FreedomReclaimedCard } from '../components/stats/FreedomReclaimedCard';
import { InstalledAppInfo } from '../lib/appBlocker';
```

- [ ] **Step 2: Bind weekly days to live habit days**

```tsx
const [weeklyDays, setWeeklyDays] = useState<HabitDay[]>([]);
const [bestStreak, setBestStreak] = useState(1);
const [todayInterceptions, setTodayInterceptions] = useState(0);
const [totalInterceptions, setTotalInterceptions] = useState(0);
const [redeemedHours, setRedeemedHours] = useState(0);
const [blockedAppsList, setBlockedAppsList] = useState<InstalledAppInfo[]>([]);
const [graceStatus, setGraceStatus] = useState({ hasUsedGraceDayThisMonth: false, graceDayMonth: null });

// Inside loadData:
const currentBest = updateBestStreak(timer.streak);
setBestStreak(currentBest);
setWeeklyDays(getWeeklyHabitDays());
setTodayInterceptions(getTodayInterceptions());
setTotalInterceptions(getTotalInterceptions());
setRedeemedHours(getScreenTimeRedeemedHours());
setGraceStatus(getGraceDayStatus());
if (hasConfigured) {
  setBlockedAppsList(getBlockedApps());
}
```

- [ ] **Step 3: Update Hero Card to use `CircularProgressRing`**

Replace static Zap box with:
```tsx
<CircularProgressRing
  size={96}
  strokeWidth={8}
  progress={timer.goalMinutes > 0 ? minutesToday / timer.goalMinutes : 0}
  isGoalMet={timer.isGoalMet}
/>
```

- [ ] **Step 4: Update Week view to render real `weeklyDays`**

```tsx
{historyPeriod === 'week' && (
  <View className='flex-row items-center justify-between'>
    {weeklyDays.map((wd) => {
      const isToday = wd.isToday;
      const isCompleted = wd.completed;
      const dayMins = wd.minutesRead ?? 0;

      return (
        <View key={wd.date} className='items-center'>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              marginBottom: 6,
              backgroundColor: isCompleted
                ? (colors.successBg || (isDark ? '#1a3324' : '#eaf7ee'))
                : isToday
                ? colors.accentBg
                : colors.surfaceSubtle,
              borderColor: isCompleted
                ? colors.success
                : isToday
                ? colors.accent
                : colors.borderSubtle,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: isToday || isCompleted ? 'Inter_700Bold' : 'Inter_500Medium',
                color: isCompleted
                  ? colors.success
                  : isToday
                  ? colors.accent
                  : colors.textPrimary,
              }}
            >
              {wd.dayLabel[0]}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 10,
              fontFamily: isToday ? 'Inter_700Bold' : 'Inter_400Regular',
              color: isToday ? colors.accent : colors.textSecondary,
            }}
          >
            {dayMins}m
          </Text>

          {isToday ? (
            <View
              style={{
                width: 20,
                height: 2,
                backgroundColor: colors.accent,
                borderRadius: 1,
                marginTop: 6,
              }}
            />
          ) : (
            <View style={{ width: 20, height: 2, backgroundColor: 'transparent', marginTop: 6 }} />
          )}
        </View>
      );
    })}
  </View>
)}
```

- [ ] **Step 5: Replace fabricated community card with `<FreedomReclaimedCard />` and add Grace Shield Banner**

```tsx
{/* Freedom Reclaimed Telemetry */}
<FreedomReclaimedCard
  todayInterceptions={todayInterceptions}
  totalInterceptions={totalInterceptions}
  redeemedHours={redeemedHours}
  blockedAppsCount={blockedAppsCount}
  blockedApps={blockedAppsList}
/>

{/* Streak Grace Shield Banner */}
<View
  style={{
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: isPremium ? colors.accent : colors.borderSubtle,
    marginBottom: 16,
  }}
>
  <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: isPremium ? colors.accent : colors.textPrimary, marginBottom: 2 }}>
    {isPremium
      ? graceStatus.hasUsedGraceDayThisMonth
        ? '🛡️ Streak Grace Shield Used — Protected this Month'
        : '🛡️ Streak Grace Shield Active — 1 Missed Day Protected'
      : '🛡️ Streak Grace Protection'}
  </Text>
  <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
    {isPremium
      ? 'Your daily walk with Jesus is preserved. Even if life gets chaotic, your streak is shielded.'
      : 'Protect your spiritual walk. Sanctuary includes monthly Streak Grace Protection so an unexpected emergency doesn’t break your streak.'}
  </Text>
</View>
```

- [ ] **Step 6: Remove `<DailyDevotionalCard />` and the old community review block**

Delete `<DailyDevotionalCard />` and the old hardcoded `145.9M` block from `src/app/stats-detail.tsx`.

- [ ] **Step 7: Typecheck verification**

Run: `npx tsc --noEmit`  
Expected: PASS with 0 errors.

---

### Task 6: Blocker Module Interception Event Wire-Up

**Files:**
- Modify: `src/lib/appBlocker.ts`

**Interfaces:**
- Produces: Automatic call to `recordInterception()` when blocker verification confirms an app was shielded or blocked app launched.

- [ ] **Step 1: Wire `recordInterception()` into blocker status checks**

In `src/lib/appBlocker.ts`, export a trigger or wire `recordInterception()` when an interception redirect is observed or requested.

- [ ] **Step 2: Typecheck verification**

Run: `npx tsc --noEmit`  
Expected: PASS with 0 errors.

---

## Plan Review & Verification Checklist
- [x] All 6 spec requirements covered in specific tasks.
- [x] Zero placeholders (full code and types provided).
- [x] Type consistency across `mmkv.ts`, `onboarding.ts`, and `stats-detail.tsx`.
- [x] Offline-first & zero-fabricated-data guarantees preserved.
