# Settings Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Settings page into a clean, 4-cluster grouped hub featuring store compliance (Restore Purchases, Manage Subscription, Legal links), Android background battery optimization protection, local-first data backup/restore portability, and community growth loops.

**Architecture:** Decompose modal dialogs into focused components (`BatteryOptimizationModal.tsx`, `DataBackupModal.tsx`), extract data portability into a dedicated utility (`src/lib/backup.ts`), and reorganize `src/app/(tabs)/settings.tsx` into 4 semantic sections with dynamic dual-theme tokens.

**Tech Stack:** React Native, Expo Router, MMKV v4, Lucide Vector Icons, Native Share, React Native Linking.

**Spec:** [`docs/superpowers/specs/2026-09-28-settings-redesign.md`](file:///d:/My%20Projects/bibleunlock.app/docs/superpowers/specs/2026-09-28-settings-redesign.md)

**UI Skills** Use [ui-ux-pro-max](slashCommand;ui-ux-pro-max) [industrial-brutalist-ui](slashCommand;industrial-brutalist-ui) with existing design of application.

## Global Constraints
- Preserve all existing MMKV keys and methods in `src/lib/mmkv.ts`.
- Zero new third-party npm packages; utilize built-in `Share`, `Linking`, and existing project modules.
- Ensure strict dynamic theme support for both Celestial Dark (`#0d120f`) and Parchment Light (`#f8f6f0`).
- Satisfy 44x44pt minimum touch targets for all interactive buttons.
- Fully compatible with Android edge-to-edge system navigation.

---

### Task 1: Local Data Portability Engine (`src/lib/backup.ts`)

**Files:**
- Create: `src/lib/backup.ts`
- Reference: `src/lib/mmkv.ts`

**Interfaces:**
- Consumes: `getBookmarks`, `setBookmarks`, `getCollections`, `setCollections`, `getUserName`, `setUserName`, `getDailyGoalMinutes`, `setDailyGoalMinutes`, `getBlockedApps`, `setBlockedApps`, `getScheduledReadingTimes`, `setScheduledReadingTimes`, `getReadingHistoryYear`, `setReadingHistoryYear` from `src/lib/mmkv.ts`.
- Produces:
  - `exportBackupJSON(): string`
  - `importBackupJSON(jsonString: string): { success: boolean; stats?: { bookmarks: number; collections: number; historyDays: number }; error?: string }`
  - `shareBackup(): Promise<boolean>`

- [ ] **Step 1: Implement `src/lib/backup.ts` with validation and error handling**

```typescript
import { Share, Platform } from 'react-native';
import {
  getBookmarks,
  setBookmarks,
  getCollections,
  setCollections,
  getUserName,
  setUserName,
  getDailyGoalMinutes,
  setDailyGoalMinutes,
  getBlockedApps,
  setBlockedApps,
  getScheduledReadingTimes,
  setScheduledReadingTimes,
  getReadingHistoryYear,
  setReadingHistoryYear,
  Bookmark,
  VerseCollection,
  YearMonthData,
} from './mmkv';

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
}

export function exportBackupJSON(): string {
  const currentYear = new Date().getFullYear();
  const backup: AppBackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    userName: getUserName(),
    dailyGoalMinutes: getDailyGoalMinutes(),
    blockedApps: getBlockedApps(),
    scheduledTimes: getScheduledReadingTimes(),
    bookmarks: getBookmarks(),
    collections: getCollections(),
    readingHistory: getReadingHistoryYear(currentYear),
  };
  return JSON.stringify(backup, null, 2);
}

export async function shareBackup(): Promise<boolean> {
  try {
    const json = exportBackupJSON();
    const dateStr = new Date().toISOString().split('T')[0];
    const result = await Share.share({
      title: `Bible Unlock Backup (${dateStr})`,
      message: json,
    });
    return result.action === Share.sharedAction;
  } catch (e) {
    console.warn('[Backup] Share failed:', e);
    return false;
  }
}

export function importBackupJSON(jsonString: string): {
  success: boolean;
  stats?: { bookmarks: number; collections: number; historyDays: number };
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid backup format: Not a JSON object.' };
    }
    if (data.version !== 1) {
      return { success: false, error: `Unsupported backup version: ${data.version}. Expected version 1.` };
    }
    if (!Array.isArray(data.bookmarks) || !Array.isArray(data.collections)) {
      return { success: false, error: 'Corrupted backup file: Missing bookmarks or collections data.' };
    }

    if (typeof data.userName === 'string' && data.userName.trim().length > 0) {
      setUserName(data.userName.trim().slice(0, 30));
    }
    if (typeof data.dailyGoalMinutes === 'number' && data.dailyGoalMinutes >= 1 && data.dailyGoalMinutes <= 120) {
      setDailyGoalMinutes(data.dailyGoalMinutes);
    }
    if (Array.isArray(data.blockedApps)) {
      setBlockedApps(data.blockedApps);
    }
    if (Array.isArray(data.scheduledTimes)) {
      setScheduledReadingTimes(data.scheduledTimes);
    }

    setBookmarks(data.bookmarks);
    setCollections(data.collections);

    let historyDaysCount = 0;
    if (Array.isArray(data.readingHistory)) {
      const currentYear = new Date().getFullYear();
      setReadingHistoryYear(currentYear, data.readingHistory);
      for (const ym of data.readingHistory) {
        if (Array.isArray(ym.days)) {
          historyDaysCount += ym.days.filter((d: any) => d.completed).length;
        }
      }
    }

    return {
      success: true,
      stats: {
        bookmarks: data.bookmarks.length,
        collections: data.collections.length,
        historyDays: historyDaysCount,
      },
    };
  } catch (err: any) {
    return { success: false, error: `JSON Parse error: ${err.message || 'Invalid syntax'}` };
  }
}
```

- [ ] **Step 2: Typecheck `src/lib/backup.ts`**

Run: `npx tsc --noEmit`  
Expected: 0 errors in `src/lib/backup.ts`.

- [ ] **Step 3: Commit Task 1**

```bash
git add src/lib/backup.ts
git commit -m "feat: implement local-first data backup and restore engine"
```

---

### Task 2: Android Battery Optimization Guide Modal (`src/components/settings/BatteryOptimizationModal.tsx`)

**Files:**
- Create: `src/components/settings/BatteryOptimizationModal.tsx`
- Reference: `src/lib/themeContext.tsx`, `src/components/Button.tsx`

**Interfaces:**
- Consumes: `useTheme` for dynamic colors, `Linking` for opening Android system app details.
- Produces: `<BatteryOptimizationModal visible={boolean} onClose={() => void} />`

- [ ] **Step 1: Implement `BatteryOptimizationModal.tsx`**

```tsx
import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { ShieldCheck, BatteryCharging, X, ExternalLink, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { Button } from '../Button';

interface BatteryOptimizationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BatteryOptimizationModal({ visible, onClose }: BatteryOptimizationModalProps) {
  const { colors, isDark } = useTheme();

  const handleOpenBatterySettings = async () => {
    try {
      await Linking.openSettings();
    } catch (e) {
      console.warn('[BatteryModal] Failed to open system settings:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.75)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Pressable style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} onPress={onClose} />
        <View
          style={{
            width: '100%',
            maxWidth: 400,
            maxHeight: '85%',
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
            borderWidth: 1,
            borderRadius: 20,
            padding: 20,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.accentBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BatteryCharging size={20} color={colors.accent} />
              </View>
              <Text style={{ fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                Keep Shield Active
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.borderSubtle,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 }}>
              Certain phone manufacturers (Samsung, Xiaomi, Pixel, Oppo) put background apps to sleep to save battery, which can stop Bible Unlock from shielding distractions.
            </Text>

            {/* Instruction Steps */}
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                marginBottom: 16,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.accent }}>1.</Text>
                <Text style={{ fontSize: 13, color: colors.textPrimary, flex: 1, lineHeight: 18 }}>
                  Tap <Text style={{ fontFamily: 'Inter_700Bold' }}>"Open App Settings"</Text> below.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.accent }}>2.</Text>
                <Text style={{ fontSize: 13, color: colors.textPrimary, flex: 1, lineHeight: 18 }}>
                  Tap on <Text style={{ fontFamily: 'Inter_700Bold' }}>"Battery"</Text> or <Text style={{ fontFamily: 'Inter_700Bold' }}>"App Battery Usage"</Text>.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.accent }}>3.</Text>
                <Text style={{ fontSize: 13, color: colors.textPrimary, flex: 1, lineHeight: 18 }}>
                  Select <Text style={{ fontFamily: 'Inter_700Bold', color: colors.accent }}>"Unrestricted"</Text> or <Text style={{ fontFamily: 'Inter_700Bold', color: colors.accent }}>"Don't Optimize"</Text>.
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                padding: 10,
                borderRadius: 10,
                marginBottom: 16,
                gap: 8,
              }}
            >
              <ShieldCheck size={16} color="#10b981" />
              <Text style={{ fontSize: 12, color: '#10b981', fontFamily: 'Inter_600SemiBold', flex: 1 }}>
                Ensures 100% reliable protection with negligible battery impact.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <Button
              title="Close"
              variant="ghost"
              size="md"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title="Open App Settings"
              variant="primary"
              size="md"
              onPress={handleOpenBatterySettings}
              style={{ flex: 1.5 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 2: Verify `BatteryOptimizationModal.tsx` builds with 0 type errors**

Run: `npx tsc --noEmit`  
Expected: PASS.

- [ ] **Step 3: Commit Task 2**

```bash
git add src/components/settings/BatteryOptimizationModal.tsx
git commit -m "feat: add battery optimization troubleshooting modal for Android"
```

---

### Task 3: Data Backup & Restore Modal (`src/components/settings/DataBackupModal.tsx`)

**Files:**
- Create: `src/components/settings/DataBackupModal.tsx`
- Reference: `src/lib/backup.ts`, `src/lib/themeContext.tsx`

**Interfaces:**
- Consumes: `shareBackup`, `importBackupJSON` from `src/lib/backup.ts`.
- Produces: `<DataBackupModal visible={boolean} onClose={() => void} onRestoreSuccess={() => void} />`

- [ ] **Step 1: Implement `DataBackupModal.tsx`**

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { DownloadCloud, UploadCloud, X, CheckCircle, AlertTriangle, Share2 } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { Button } from '../Button';
import { shareBackup, importBackupJSON } from '../../lib/backup';

interface DataBackupModalProps {
  visible: boolean;
  onClose: () => void;
  onRestoreSuccess: () => void;
}

export function DataBackupModal({ visible, onClose, onRestoreSuccess }: DataBackupModalProps) {
  const { colors, isDark } = useTheme();
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const shared = await shareBackup();
    setIsExporting(false);
    if (shared) {
      Alert.alert('Backup Shared', 'Your Bible Unlock backup data has been exported successfully.');
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      Alert.alert('Empty Data', 'Please paste your valid Bible Unlock backup JSON text.');
      return;
    }

    Alert.alert(
      'Confirm Data Restore',
      'This will restore your bookmarks, collections, reading goals, and habit streak history from the backup. Current data will be replaced.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Now',
          style: 'destructive',
          onPress: () => {
            const res = importBackupJSON(importText.trim());
            if (res.success && res.stats) {
              Alert.alert(
                'Restore Complete',
                `Successfully restored:\n• ${res.stats.bookmarks} Bookmarks\n• ${res.stats.collections} Collections\n• ${res.stats.historyDays} Active Streak Days`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setImportText('');
                      onRestoreSuccess();
                      onClose();
                    },
                  },
                ],
              );
            } else {
              Alert.alert('Restore Failed', res.error || 'Invalid backup data format.');
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <Pressable style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} onPress={onClose} />
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: '90%',
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              borderWidth: 1,
              borderRadius: 20,
              padding: 20,
              elevation: 8,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.accentBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DownloadCloud size={20} color={colors.accent} />
                </View>
                <Text style={{ fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                  Data Portability & Backup
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Segmented Tab */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.surfaceSubtle,
                borderRadius: 10,
                padding: 4,
                marginBottom: 16,
              }}
            >
              <Pressable
                onPress={() => setTab('export')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: tab === 'export' ? colors.accent : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Inter_700Bold',
                    color: tab === 'export' ? '#141413' : colors.textSecondary,
                  }}
                >
                  Export Backup
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTab('import')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: tab === 'import' ? colors.accent : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Inter_700Bold',
                    color: tab === 'import' ? '#141413' : colors.textSecondary,
                  }}
                >
                  Restore Data
                </Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {tab === 'export' ? (
                <View>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 }}>
                    Save a private copy of your Scripture journey. Exporting includes your reading streaks, custom collections, bookmarks, verse notes, and settings.
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 12,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      marginBottom: 16,
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={15} color={colors.accent} />
                      <Text style={{ fontSize: 12, color: colors.textPrimary, fontFamily: 'Inter_500Medium' }}>
                        100% Offline & Private (zero cloud storage)
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={15} color={colors.accent} />
                      <Text style={{ fontSize: 12, color: colors.textPrimary, fontFamily: 'Inter_500Medium' }}>
                        Standard JSON format for safe transfer between phones
                      </Text>
                    </View>
                  </View>
                  <Button
                    title={isExporting ? 'Exporting...' : 'Export & Share Backup File'}
                    variant="primary"
                    size="md"
                    onPress={handleExport}
                    disabled={isExporting}
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </View>
              ) : (
                <View>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 12 }}>
                    Paste your Bible Unlock backup JSON text below to restore your bookmarks and progress.
                  </Text>
                  <TextInput
                    value={importText}
                    onChangeText={setImportText}
                    multiline
                    numberOfLines={6}
                    placeholder="Paste backup JSON data here..."
                    placeholderTextColor={colors.textMuted}
                    style={{
                      width: '100%',
                      height: 120,
                      backgroundColor: colors.background,
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      color: colors.textPrimary,
                      fontFamily: 'Inter_400Regular',
                      fontSize: 12,
                      textAlignVertical: 'top',
                      marginBottom: 14,
                    }}
                  />
                  <Button
                    title="Validate & Restore Data"
                    variant="primary"
                    size="md"
                    onPress={handleImport}
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
```

- [ ] **Step 2: Verify `DataBackupModal.tsx` typecheck**

Run: `npx tsc --noEmit`  
Expected: PASS.

- [ ] **Step 3: Commit Task 3**

```bash
git add src/components/settings/DataBackupModal.tsx
git commit -m "feat: add local data backup and restore modal component"
```

---

### Task 4: Reorganize `src/app/(tabs)/settings.tsx` into 4 Grouped Semantic Clusters

**Files:**
- Modify: `src/app/(tabs)/settings.tsx`
- Integrate: `BatteryOptimizationModal.tsx`, `DataBackupModal.tsx`, `usePurchases().restorePurchases()`, Store links, App version.

**Interfaces:**
- Consumes: `BatteryOptimizationModal`, `DataBackupModal`, `restorePurchases` from `usePurchases`, `Share`, `Linking`.
- Produces: Polished 4-cluster grouped Settings screen.

- [ ] **Step 1: Wire up new state and handlers in `settings.tsx`**

Add state variables:
```typescript
const [showBatteryModal, setShowBatteryModal] = useState(false);
const [showBackupModal, setShowBackupModal] = useState(false);
const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
```

Add handler functions:
```typescript
const handleRestorePurchases = async () => {
  setIsRestoringPurchases(true);
  try {
    const res = await usePurchases().restorePurchases();
    if (res?.isPremium) {
      Alert.alert('Sanctuary Restored', 'Your Sanctuary membership is active. All disciplines are unlocked.');
    } else {
      Alert.alert('Restore Complete', 'No active Sanctuary subscription found on this store account.');
    }
  } catch (e: any) {
    Alert.alert('Restore Error', e.message || 'Unable to restore purchases at this time.');
  } finally {
    setIsRestoringPurchases(false);
  }
};

const handleManageSubscription = () => {
  const url = Platform.OS === 'android'
    ? 'https://play.google.com/store/account/subscriptions?package=com.bibleunlock.app'
    : 'https://apps.apple.com/account/subscriptions';
  Linking.openURL(url).catch(() => {
    Alert.alert('Error', 'Unable to open subscription management.');
  });
};

const handleShareApp = async () => {
  try {
    await Share.share({
      title: 'Bible Unlock: Guard Your Peace',
      message: 'Conquer screen distraction and grow closer to God with Bible Unlock: https://bibleunlock.app',
    });
  } catch {}
};

const handleRateApp = () => {
  const url = Platform.OS === 'android'
    ? 'market://details?id=com.bibleunlock.app'
    : 'https://apps.apple.com/app/id6470000000';
  Linking.openURL(url).catch(() => {
    Linking.openURL('https://bibleunlock.app');
  });
};

const handleContactSupport = () => {
  Linking.openURL('mailto:support@bibleunlock.app?subject=Bible Unlock Support & Feedback');
};
```

- [ ] **Step 2: Render 4 Semantic Section Headers & Grouped Content**

Structure JSX into 4 clearly demarcated sections:
1. `Section Header: "Spiritual Habit & Shield"`
   - Sanctuary Banner
   - My Stats Navigation Card
   - Shield Permission & Background Battery Guard Card (with "Keep Shield Active" button)
   - Daily Scripture Goal Card
   - Shielded Applications Card
2. `Section Header: "Reading Experience & Content"`
   - Appearance & Theme Card
   - Bible Translations & Languages Card
   - Bible Scroll Sacred Artwork Card
3. `Section Header: "Reminders & Quiet Hours"`
   - Daily Reading Reminders Card
   - Evening Reflection Card
   - Daily Devotional Verse Notifications Card
4. `Section Header: "Account, Data & Support"`
   - Reader Profile Card
   - Data Portability & Backup Card (triggers `setShowBackupModal(true)`)
   - Subscription & Purchases Card (Restore Purchases, Manage Subscription)
   - Community & Feedback Card (Share with Friends, Rate App, Contact Support)
   - Legal, Terms & Version Card (Privacy, Terms, `Bible Unlock v1.0.0 (Build 1)`)
   - Developer Controls (if `__DEV__`)

- [ ] **Step 3: Test and Typecheck**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 4: Commit Task 4**

```bash
git add src/app/\(tabs\)/settings.tsx
git commit -m "feat: restructure settings into 4 semantic clusters with store compliance and backup tools"
```

---

### Task 5: End-to-End Verification & Protocol Closeout

**Files:**
- Verify: `src/app/(tabs)/settings.tsx`, `src/lib/backup.ts`, `src/components/settings/BatteryOptimizationModal.tsx`, `src/components/settings/DataBackupModal.tsx`
- Documentation: `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`

- [ ] **Step 1: Run TypeScript full workspace validation**

Run: `npx tsc --noEmit`  
Expected: 0 type errors across the entire codebase.

- [ ] **Step 2: Update `docs/DECISIONS.md`**

Record `[DEC-039]` for Settings Page Architectural Redesign.

- [ ] **Step 3: Update `docs/STATUS.md` and `docs/CHANGELOG.md`**

Record consolidated entry for `TASK-055`.

- [ ] **Step 4: Run code-review-graph update**

Run: `npx code-review-graph update`
