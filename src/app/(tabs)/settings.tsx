import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Crown,
  Shield,
  Clock,
  BookOpen,
  Smartphone,
  Bell,
  User,
  LogOut,
  Check,
  Lock,
  Plus,
  Trash2,
  Search,
  Moon,
  Sun,
  X,
  RotateCcw,
  Minus,
  Sparkles,
  BarChart2,
  ChevronRight,
} from 'lucide-react-native';
import { usePurchases } from '../../lib/purchases';
import { useFeatureGate } from '../../lib/useFeatureGate';
import { AppBlocker, InstalledApp } from '../../lib/appBlocker';
import {
  getUserName,
  getDailyGoalMinutes,
  setDailyGoalMinutes,
  getBlockedApps,
  setBlockedApps,
  DEFAULT_BLOCKED_APPS,
  getReadingProgress,
  setReadingProgress,
  getThemeMode,
  setThemeMode as saveThemeMode,
  ThemeMode,
  getScheduledReadingTimes,
  setScheduledReadingTimes,
  getDailyVerseNotificationsEnabled,
  setDailyVerseNotificationsEnabled,
  getDailyVerseNotificationCount,
  setDailyVerseNotificationCount,
} from '../../lib/mmkv';
import { useBibleTranslation } from '../../lib/bible';
import { ScriptureShield, calculateDaytimeHours } from '../../lib/scriptureShield';
import { AppIcon } from '../../components/AppIcon';
import { useTheme } from '../../lib/themeContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { TimePickerModal } from '../../components/TimePickerModal';

const GOAL_OPTIONS = [5, 10, 15, 30];

function formatSlotTime(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  const displayMin = m < 10 ? `0${m}` : `${m}`;
  return `${displayHour}:${displayMin} ${period}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium, toggleDevPremium } = usePurchases();
  const { requirePremium } = useFeatureGate();
  const { themeMode, setThemeMode, colors, isDark } = useTheme();

  const [dailyGoal, setDailyGoal] = useState(() => getDailyGoalMinutes());
  const [showCustomGoalInput, setShowCustomGoalInput] = useState(false);
  const [customGoalText, setCustomGoalText] = useState('');
  const [translation, setTranslationState] = useBibleTranslation();
  const [verseNotifsEnabled, setVerseNotifsEnabled] = useState(() =>
    getDailyVerseNotificationsEnabled()
  );
  const [verseNotifCount, setVerseNotifCount] = useState(() =>
    getDailyVerseNotificationCount()
  );
  const [blockedList, setBlockedListState] = useState<string[]>(() =>
    getBlockedApps()
  );
  const [hasPermission, setHasPermission] = useState(false);
  const [eveningReminder, setEveningReminder] = useState(true);
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(() =>
    getScheduledReadingTimes()
  );
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);

  const handleAddReminderTime = (time: string) => {
    if (scheduledTimes.includes(time)) {
      return;
    }
    const updated = [...scheduledTimes, time];
    setScheduledTimes(updated);
    setScheduledReadingTimes(updated);
  };

  const handleOpenTimePicker = () => {
    if (!isPremium && scheduledTimes.length >= 1) {
      if (!requirePremium('Multiple daily reminders')) {
        return;
      }
    }
    setShowTimePickerModal(true);
  };

  const handleRemoveReminderTime = (timeToRemove: string) => {
    const updated = scheduledTimes.filter((t) => t !== timeToRemove);
    setScheduledTimes(updated);
    setScheduledReadingTimes(updated);
  };

  const [showAppPickerModal, setShowAppPickerModal] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');

  const refreshPermissions = useCallback(async () => {
    const granted = await AppBlocker.hasPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  useEffect(() => {
    refreshPermissions();
    AppBlocker.getInstalledApps().then(setInstalledApps);

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        refreshPermissions();
        setTimeout(refreshPermissions, 500);
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, [refreshPermissions]);

  useFocusEffect(
    useCallback(() => {
      refreshPermissions();
    }, [refreshPermissions])
  );

  useEffect(() => {
    if (!isPremium && dailyGoal > 15) {
      setDailyGoal(15);
      setDailyGoalMinutes(15);
    }
  }, [isPremium, dailyGoal]);

  const handleSelectGoal = (minutes: number) => {
    if (minutes > 15 && !requirePremium('Extended reading goals')) {
      return;
    }
    setDailyGoal(minutes);
    setDailyGoalMinutes(minutes);
    setShowCustomGoalInput(false);
  };

  const handleCustomGoalPress = () => {
    if (!requirePremium('Custom reading goals')) {
      return;
    }
    setShowCustomGoalInput((prev) => !prev);
    setCustomGoalText(String(dailyGoal));
  };

  const handleSaveCustomGoal = () => {
    const mins = parseInt(customGoalText.trim(), 10);
    if (isNaN(mins) || mins < 1 || mins > 120) {
      Alert.alert('Invalid Duration', 'Please enter a reading duration between 1 and 120 minutes.');
      return;
    }
    setDailyGoal(mins);
    setDailyGoalMinutes(mins);
    setShowCustomGoalInput(false);
  };

  const handleSelectTranslation = async (tr: 'WEB' | 'KJV') => {
    setTranslationState(tr);
    if (verseNotifsEnabled) {
      await ScriptureShield.scheduleDailyVerseNotifications(verseNotifCount, tr);
    }
  };

  const handleToggleVerseNotifications = async (val: boolean) => {
    setVerseNotifsEnabled(val);
    setDailyVerseNotificationsEnabled(val);
    if (val) {
      const success = await ScriptureShield.scheduleDailyVerseNotifications(
        verseNotifCount,
        translation
      );
      if (!success) {
        Alert.alert(
          'Permission Needed',
          'Please enable notifications so Bible Unlock can deliver your daily devotional verses.'
        );
      }
    } else {
      await ScriptureShield.cancelDailyVerseNotifications();
    }
  };

  const handleUpdateVerseNotifCount = async (count: number) => {
    if (count > 6 && !isPremium) {
      if (!requirePremium('Receive up to 24 daily verses')) {
        return;
      }
    }
    const clamped = Math.max(1, Math.min(count, 24));
    setVerseNotifCount(clamped);
    setDailyVerseNotificationCount(clamped);
    if (verseNotifsEnabled) {
      await ScriptureShield.scheduleDailyVerseNotifications(clamped, translation);
    }
  };

  const handleToggleApp = (pkgName: string) => {
    let next: string[];
    if (blockedList.includes(pkgName)) {
      next = blockedList.filter((p) => p !== pkgName);
    } else {
      next = [...blockedList, pkgName];
    }
    setBlockedListState(next);
    setBlockedApps(next);
    AppBlocker.shieldApps(next);
  };

  const handleRequestPermissions = async () => {
    await AppBlocker.requestPermissions();
  };

  const handleCheckPermission = async () => {
    const granted = await refreshPermissions();
    if (granted) {
      Alert.alert(
        'Shield Active',
        'Accessibility Shield permission is active. Your distracting apps are protected.'
      );
    } else {
      Alert.alert(
        'Permission Needed',
        'Accessibility Shield permission is not granted. Tap "Open Settings" to enable Bible Unlock in system settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: handleRequestPermissions },
        ]
      );
    }
  };

  const handleToggleSimulatePlan = () => {
    const nextWillBeFree = isPremium;
    toggleDevPremium();
    Alert.alert(
      'Developer Simulation',
      nextWillBeFree
        ? 'Switched to Free Tier. Free limits and upgrade triggers are now active.'
        : 'Switched to Pro Tier (Sanctuary Member). All features unlocked.'
    );
  };

  const handleResetDefaultApps = () => {
    Alert.alert(
      'Reset Default Apps',
      'Restore the default 5 distraction apps (Instagram, TikTok, YouTube, X, Reddit)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Defaults',
          onPress: () => {
            setBlockedListState(DEFAULT_BLOCKED_APPS);
            setBlockedApps(DEFAULT_BLOCKED_APPS);
            AppBlocker.shieldApps(DEFAULT_BLOCKED_APPS);
            Alert.alert('Reset Complete', 'Default 5 shielded apps restored.');
          },
        },
      ]
    );
  };

  const handleCustomApps = async () => {
    if (!isPremium) {
      Alert.alert(
        'Custom App Selection',
        'Custom app selection requires Premium. Free plan includes the 5 default distraction apps.\n\nWould you like to restore the default 5 apps or upgrade to Premium?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset Defaults',
            onPress: () => {
              setBlockedListState(DEFAULT_BLOCKED_APPS);
              setBlockedApps(DEFAULT_BLOCKED_APPS);
              AppBlocker.shieldApps(DEFAULT_BLOCKED_APPS);
              Alert.alert('Reset Complete', 'Default 5 shielded apps restored.');
            },
          },
          {
            text: 'Upgrade',
            onPress: () => router.push('/paywall'),
          },
        ]
      );
      return;
    }
    setShowAppPickerModal(true);
    setLoadingApps(true);
    try {
      const list = await AppBlocker.getInstalledApps();
      if (list && list.length > 0) {
        setInstalledApps(list);
      }
    } catch {
      // fallback
    } finally {
      setLoadingApps(false);
    }
  };

  const KNOWN_LABELS: Record<string, string> = {
    'com.instagram.android': 'Instagram',
    'com.zhiliaoapp.musically': 'TikTok',
    'com.google.android.youtube': 'YouTube',
    'com.twitter.android': 'X (Twitter)',
    'com.reddit.frontpage': 'Reddit',
    'com.facebook.katana': 'Facebook',
    'com.snapchat.android': 'Snapchat',
    'com.netflix.mediaclient': 'Netflix',
    'com.discord': 'Discord',
    'com.whatsapp': 'WhatsApp',
  };

  const getAppInfo = (pkg: string): { label: string; icon?: string } => {
    const found = installedApps.find((a) => a.packageName === pkg);
    if (found) return { label: found.label, icon: found.icon };
    if (KNOWN_LABELS[pkg]) return { label: KNOWN_LABELS[pkg] };
    const parts = pkg.split('.');
    const fallbackName = parts[parts.length - 1] || pkg;
    return {
      label: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
    };
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const handleResetProgress = () => {
    setReadingProgress(0);
    AppBlocker.shieldApps();
    Alert.alert('Reset Complete', "Today's reading progress has been reset to 00:00.");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={{ flex: 1 }}
        className="px-5"
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
      >
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'EBGaramond_700Bold',
            color: colors.textPrimary,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          Settings & Blocking
        </Text>

        {/* Premium Banner */}
        <Card
          variant="dark"
          style={{
            padding: 16,
            marginBottom: 20,
            borderColor: colors.accent,
            backgroundColor: colors.accentBg,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View style={{ marginRight: 12 }}>
                <Crown size={26} color={colors.accent} />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Inter_700Bold',
                    color: colors.textPrimary,
                  }}
                >
                  {isPremium ? 'Sanctuary Member' : 'Enter the Sanctuary'}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_500Medium',
                    color: colors.accent,
                    marginTop: 2,
                  }}
                >
                  {isPremium ? 'All Spiritual Disciplines Unlocked' : 'Custom Apps, Protection & All Translations'}
                </Text>
              </View>
            </View>
            {!isPremium && (
              <Button
                title="Upgrade"
                variant="primary"
                size="sm"
                onPress={() => router.push('/paywall' as any)}
              />
            )}
          </View>
        </Card>

        {/* My Stats Navigation Card */}
        <Card
          variant="dark"
          style={{
            padding: 16,
            marginBottom: 20,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Pressable
            onPress={() => router.push('/stats-detail' as any)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: 'rgba(245, 184, 0, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart2 size={22} color={colors.accent} />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Inter_700Bold',
                    color: colors.textPrimary,
                  }}
                >
                  My Stats & Badges
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_400Regular',
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  Streaks, milestones & lifetime impact
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </Pressable>
        </Card>

        {/* System Permission Guard Status */}
        <Card variant="dark" style={{ padding: 16, marginBottom: 20 }}>
          <View className="flex-row items-center justify-between mb-3">
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Inter_700Bold',
                  color: colors.textPrimary,
                }}
              >
                Shield Protection Permission
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {hasPermission
                  ? 'Active & guarding distraction apps'
                  : 'Requires device permission to block apps'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: hasPermission ? colors.success : '#f59e0b',
                  marginRight: 6,
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                  color: hasPermission ? colors.success : '#f59e0b',
                }}
              >
                {hasPermission ? 'Active' : 'Disabled'}
              </Text>
            </View>
          </View>
          <View className="flex-row space-x-2 mt-1">
            <Button
              title={hasPermission ? 'Manage in Settings' : 'Grant Blocker Permission'}
              variant={hasPermission ? 'outline' : 'primary'}
              size="sm"
              onPress={handleRequestPermissions}
              className="flex-1 mr-2"
            />
            <Button
              title="Verify Status"
              variant="ghost"
              size="sm"
              onPress={handleCheckPermission}
            />
          </View>
        </Card>

        {/* Daily Goal Configuration */}
        <View className="mb-5">
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Inter_600SemiBold',
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: colors.textSecondary,
              marginBottom: 10,
              paddingHorizontal: 4,
            }}
          >
            Daily Scripture Goal
          </Text>
          <Card variant="dark" style={{ padding: 16 }}>
            <Text
              style={{
                fontSize: 14,
                color: colors.textPrimary,
                marginBottom: 12,
              }}
            >
              How many minutes of reading to unlock your apps each day?
            </Text>
            <View className="flex-row justify-between">
              {GOAL_OPTIONS.map((mins) => {
                const isSelected = dailyGoal === mins;
                const isLocked = !isPremium && mins > 15;
                return (
                  <Pressable
                    key={mins}
                    onPress={() => handleSelectGoal(mins)}
                    style={{
                      flex: 1,
                      marginHorizontal: 2,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: isSelected ? colors.accent : colors.border,
                      backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                    }}
                  >
                    <View className="flex-row items-center justify-center">
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Inter_700Bold',
                          color: isSelected ? '#141413' : colors.textPrimary,
                        }}
                      >
                        {mins}m
                      </Text>
                      {isLocked && (
                        <Lock size={10} color={colors.textMuted} style={{ marginLeft: 3 }} />
                      )}
                    </View>
                  </Pressable>
                );
              })}

              {/* Custom Goal Option */}
              {(() => {
                const isCustomSelected = !GOAL_OPTIONS.includes(dailyGoal);
                return (
                  <Pressable
                    onPress={handleCustomGoalPress}
                    style={{
                      flex: 1.2,
                      marginHorizontal: 2,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: isCustomSelected
                        ? colors.accent
                        : showCustomGoalInput
                        ? colors.accent
                        : colors.border,
                      backgroundColor: isCustomSelected ? colors.accent : colors.surfaceSubtle,
                    }}
                  >
                    <View className="flex-row items-center justify-center">
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Inter_700Bold',
                          color: isCustomSelected ? '#141413' : colors.textPrimary,
                        }}
                        numberOfLines={1}
                      >
                        {isCustomSelected ? `${dailyGoal}m` : 'Custom'}
                      </Text>
                      {!isPremium && (
                        <Lock size={10} color={colors.textMuted} style={{ marginLeft: 3 }} />
                      )}
                    </View>
                  </Pressable>
                );
              })()}
            </View>

            {/* Inline Custom Goal Input (Premium) */}
            {showCustomGoalInput && (
              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_500Medium',
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Enter custom duration (1–120 minutes):
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={{
                      flex: 1,
                      height: 40,
                      backgroundColor: colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontFamily: 'Inter_600SemiBold',
                    }}
                    placeholder="Minutes (e.g. 45)"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={customGoalText}
                    onChangeText={setCustomGoalText}
                    maxLength={3}
                    autoFocus
                  />
                  <Pressable
                    onPress={handleSaveCustomGoal}
                    style={{
                      marginLeft: 8,
                      backgroundColor: colors.accent,
                      paddingHorizontal: 14,
                      height: 40,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Inter_700Bold',
                        color: '#141413',
                      }}
                    >
                      Set
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowCustomGoalInput(false)}
                    style={{
                      marginLeft: 6,
                      padding: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <X size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            )}
          </Card>
        </View>

        {/* Blocked Apps Management */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2.5 px-1">
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter_600SemiBold',
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: colors.textSecondary,
              }}
            >
              Shielded Applications ({blockedList.length}{!isPremium ? '/5' : ''})
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {!isPremium && (
                <Pressable
                  onPress={handleResetDefaultApps}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surfaceSubtle,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    marginRight: 8,
                  }}
                >
                  <RotateCcw size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      fontFamily: 'Inter_600SemiBold',
                    }}
                  >
                    Reset
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleCustomApps}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.accentBg,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Plus size={13} color={colors.accent} style={{ marginRight: 4 }} />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.accent,
                    fontFamily: 'Inter_600SemiBold',
                  }}
                >
                  Add Apps
                </Text>
              </Pressable>
            </View>
          </View>

          <Card variant="dark" style={{ padding: 8 }}>
            {blockedList.length === 0 ? (
              <View className="items-center py-6 px-4">
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.accentBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Shield size={24} color={colors.accent} />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Inter_700Bold',
                    color: colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  No Apps Shielded
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginBottom: 14,
                    lineHeight: 18,
                  }}
                >
                  Shield distracting apps like social media or games so they stay locked until your Bible goal is met.
                </Text>
                <Pressable
                  onPress={isPremium ? handleCustomApps : handleResetDefaultApps}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: colors.accent,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  {isPremium ? (
                    <>
                      <Plus size={14} color="#141413" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#141413' }}>
                        Select Apps to Shield
                      </Text>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} color="#141413" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#141413' }}>
                        Restore 5 Default Apps
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : (
              blockedList.map((pkg, idx) => {
                const info = getAppInfo(pkg);
                const isInstalled =
                  installedApps.length === 0 ||
                  installedApps.some((a) => a.packageName === pkg);
                return (
                  <View
                    key={pkg}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      borderTopWidth: idx !== 0 ? 1 : 0,
                      borderTopColor: colors.borderSubtle,
                      opacity: isInstalled ? 1 : 0.55,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                      <View style={{ marginRight: 12 }}>
                        <AppIcon
                          packageName={pkg}
                          label={info.label}
                          iconUri={info.icon}
                          size={36}
                          borderRadius={8}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: 'Inter_500Medium',
                              color: colors.textPrimary,
                              marginRight: 6,
                            }}
                            numberOfLines={1}
                          >
                            {info.label}
                          </Text>
                          {!isInstalled && (
                            <View
                              style={{
                                backgroundColor: colors.surfaceSubtle,
                                paddingHorizontal: 6,
                                paddingVertical: 1.5,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: colors.borderSubtle,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontFamily: 'Inter_600SemiBold',
                                  color: colors.textMuted,
                                }}
                              >
                                Not installed
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}
                          numberOfLines={1}
                        >
                          {pkg}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleToggleApp(pkg)}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: colors.surfaceSubtle,
                      }}
                      hitSlop={8}
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                );
              })
            )}
          </Card>
        </View>

        {/* Appearance & Theme Setting */}
        <View className="mb-5">
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Inter_600SemiBold',
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: colors.textSecondary,
              marginBottom: 10,
              paddingHorizontal: 4,
            }}
          >
            Appearance & Theme
          </Text>
          <Card variant="dark" style={{ padding: 12 }}>
            <View className="flex-row justify-between">
              <Pressable
                onPress={() => handleSelectTheme('dark')}
                style={{
                  flex: 1,
                  marginRight: 6,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  alignItems: 'center',
                  backgroundColor: themeMode === 'dark' ? colors.accentBg : colors.surfaceSubtle,
                  borderColor: themeMode === 'dark' ? colors.accent : colors.border,
                }}
              >
                <Moon
                  size={20}
                  color={themeMode === 'dark' ? colors.accent : colors.textSecondary}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_700Bold',
                    color: themeMode === 'dark' ? colors.accent : colors.textPrimary,
                  }}
                >
                  Dark
                </Text>
                <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
                  Celestial
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleSelectTheme('light')}
                style={{
                  flex: 1,
                  marginHorizontal: 6,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  alignItems: 'center',
                  backgroundColor: themeMode === 'light' ? colors.accentBg : colors.surfaceSubtle,
                  borderColor: themeMode === 'light' ? colors.accent : colors.border,
                }}
              >
                <Sun
                  size={20}
                  color={themeMode === 'light' ? colors.accent : colors.textSecondary}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_700Bold',
                    color: themeMode === 'light' ? colors.accent : colors.textPrimary,
                  }}
                >
                  Light
                </Text>
                <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
                  Parchment
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleSelectTheme('system')}
                style={{
                  flex: 1,
                  marginLeft: 6,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  alignItems: 'center',
                  backgroundColor: themeMode === 'system' ? colors.accentBg : colors.surfaceSubtle,
                  borderColor: themeMode === 'system' ? colors.accent : colors.border,
                }}
              >
                <Smartphone
                  size={20}
                  color={themeMode === 'system' ? colors.accent : colors.textSecondary}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_700Bold',
                    color: themeMode === 'system' ? colors.accent : colors.textPrimary,
                  }}
                >
                  System
                </Text>
                <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
                  Auto
                </Text>
              </Pressable>
            </View>
          </Card>
        </View>

        {/* Translation Preference */}
        <View className="mb-5">
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Inter_600SemiBold',
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: colors.textSecondary,
              marginBottom: 10,
              paddingHorizontal: 4,
            }}
          >
            Default Bible Translation
          </Text>
          <Card variant="dark" style={{ padding: 12 }}>
            <View className="flex-row justify-between">
              <Pressable
                onPress={() => handleSelectTranslation('WEB')}
                style={{
                  flex: 1,
                  marginRight: 8,
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  alignItems: 'center',
                  backgroundColor: translation === 'WEB' ? colors.accentBg : colors.surfaceSubtle,
                  borderColor: translation === 'WEB' ? colors.accent : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Inter_700Bold',
                    color: colors.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  WEB
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center' }}>
                  World English Bible (Easy Modern)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleSelectTranslation('KJV')}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  alignItems: 'center',
                  backgroundColor: translation === 'KJV' ? colors.accentBg : colors.surfaceSubtle,
                  borderColor: translation === 'KJV' ? colors.accent : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Inter_700Bold',
                    color: colors.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  KJV
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center' }}>
                  King James (Classical Serif)
                </Text>
              </Pressable>
            </View>
          </Card>
        </View>

        {/* Scripture Shield Reminders Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2.5 px-1">
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter_600SemiBold',
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: colors.textSecondary,
              }}
            >
              Daily Reading Reminders
            </Text>
            <Pressable
              onPress={handleOpenTimePicker}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Add reading reminder time"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.accentBg,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              {!isPremium && scheduledTimes.length >= 1 ? (
                <Lock size={12} color={colors.accent} style={{ marginRight: 4 }} />
              ) : (
                <Plus size={13} color={colors.accent} style={{ marginRight: 4 }} />
              )}
              <Text
                style={{
                  fontSize: 12,
                  color: colors.accent,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                Add Time
              </Text>
            </Pressable>
          </View>

          <Card variant="dark" style={{ padding: 16 }}>
            {/* Scheduled Times List */}
            <View className="mb-4">
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Inter_600SemiBold',
                  color: colors.textPrimary,
                  marginBottom: 2,
                }}
              >
                Scheduled Times
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
                Notifications sent to keep you consistent with your daily goal.
              </Text>

              {scheduledTimes.length === 0 ? (
                <View
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceSubtle,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    No reminder times set. Tap "+ Add Time" above.
                  </Text>
                </View>
              ) : (
                <View>
                  {scheduledTimes.map((timeStr) => (
                    <View
                      key={timeStr}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: colors.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                        marginBottom: 6,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: colors.accentBg,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10,
                          }}
                        >
                          <Clock size={14} color={colors.accent} />
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily: 'Inter_600SemiBold',
                            color: colors.textPrimary,
                          }}
                        >
                          {timeStr}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => handleRemoveReminderTime(timeStr)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete reminder ${timeStr}`}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: '#331a1a',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={14} color="#f26666" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {!isPremium && scheduledTimes.length >= 1 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 6,
                    paddingHorizontal: 2,
                  }}
                >
                  <Lock size={11} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, color: colors.accent, fontFamily: 'Inter_500Medium' }}>
                    Sanctuary unlocks unlimited reminder times.
                  </Text>
                </View>
              )}
            </View>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.borderSubtle,
                marginBottom: 14,
              }}
            />

            {/* Evening Reflection Prompt Toggle */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Inter_500Medium',
                    color: colors.textPrimary,
                  }}
                >
                  Evening Reflection Prompt
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Sends a gentle reminder at 8:00 PM if today's reading goal is unmet.
                </Text>
              </View>
              <Switch
                value={eveningReminder}
                onValueChange={setEveningReminder}
                trackColor={{ false: colors.surfaceSubtle, true: colors.accent }}
                thumbColor={eveningReminder ? '#ffffff' : colors.textMuted}
              />
            </View>
          </Card>
        </View>

        {/* Daily Devotional Verse Notifications */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter_600SemiBold',
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: colors.textSecondary,
              }}
            >
              Daily Verse Notifications
            </Text>
            {isPremium && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.accentBg,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Crown size={10} color={colors.accent} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.accent }}>
                  SANCTUARY
                </Text>
              </View>
            )}
          </View>

          <Card variant="dark" style={{ padding: 16 }}>
            {/* Master Toggle */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center">
                  <Sparkles size={16} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Inter_600SemiBold',
                      color: colors.textPrimary,
                    }}
                  >
                    Devotional Verses to Phone
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 }}>
                  Receive inspiring Scripture notifications spaced through your day. Tap any notification to read in context.
                </Text>
              </View>
              <Switch
                value={verseNotifsEnabled}
                onValueChange={handleToggleVerseNotifications}
                trackColor={{ false: colors.surfaceSubtle, true: colors.accent }}
                thumbColor={verseNotifsEnabled ? '#ffffff' : colors.textMuted}
              />
            </View>

            {/* Quiet Hours Guarantee Banner */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceSubtle,
                padding: 10,
                borderRadius: 10,
                marginTop: 14,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Moon size={14} color={colors.accent} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary }}>
                  Daytime Delivery Only (7:00 AM – 10:00 PM)
                </Text>
                <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>
                  Automatically adapts to your local timezone. 10:00 PM to 7:00 AM is 100% quiet.
                </Text>
              </View>
            </View>

            {verseNotifsEnabled && (
              <View style={{ marginTop: 16 }}>
                {/* Frequency Header & Stepper */}
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Inter_600SemiBold',
                        color: colors.textPrimary,
                      }}
                    >
                      Verses Per Day
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      {!isPremium ? '1 to 6 on Free • Up to 24 on Sanctuary' : 'Up to 24 on Sanctuary'}
                    </Text>
                  </View>

                  {/* Stepper Controls */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.surfaceSubtle,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 2,
                    }}
                  >
                    <Pressable
                      onPress={() => handleUpdateVerseNotifCount(verseNotifCount - 1)}
                      disabled={verseNotifCount <= 1}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease verse notifications"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: verseNotifCount <= 1 ? 0.3 : 1,
                      }}
                    >
                      <Minus size={15} color={colors.textPrimary} />
                    </Pressable>

                    <View style={{ minWidth: 36, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: 'Inter_700Bold',
                          color: colors.accent,
                        }}
                      >
                        {verseNotifCount}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => handleUpdateVerseNotifCount(verseNotifCount + 1)}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel="Increase verse notifications"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!isPremium && verseNotifCount >= 6 ? (
                        <Lock size={13} color={colors.accent} />
                      ) : (
                        <Plus size={15} color={colors.textPrimary} />
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* Quick Presets Chips */}
                <View className="flex-row justify-between mb-3">
                  {[1, 2, 3, 6, 12, 24].map((n) => {
                    const isLocked = !isPremium && n > 6;
                    const isSelected = verseNotifCount === n;
                    return (
                      <Pressable
                        key={n}
                        onPress={() => handleUpdateVerseNotifCount(n)}
                        style={{
                          flex: 1,
                          marginHorizontal: 2,
                          paddingVertical: 8,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isSelected ? colors.accentBg : colors.surfaceSubtle,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.accent : colors.borderSubtle,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: isSelected ? 'Inter_700Bold' : 'Inter_500Medium',
                              color: isSelected ? colors.accent : colors.textPrimary,
                            }}
                          >
                            {n}x
                          </Text>
                          {isLocked && (
                            <Lock size={9} color={colors.accent} style={{ marginLeft: 2 }} />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Schedule Preview */}
                <View
                  style={{
                    backgroundColor: colors.surfaceSubtle,
                    borderRadius: 10,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginBottom: 4 }}>
                    Today's Daytime Schedule ({translation}):
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textPrimary, fontFamily: 'Inter_500Medium', lineHeight: 18 }}>
                    {calculateDaytimeHours(verseNotifCount)
                      .map((s) => formatSlotTime(s.hour, s.minute))
                      .join(' • ')}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        </View>

        {/* Storage & Profile Section */}
        <View className="mb-6">
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Inter_600SemiBold',
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: colors.textSecondary,
              marginBottom: 10,
              paddingHorizontal: 4,
            }}
          >
            Local Storage & Profile
          </Text>
          <Card variant="dark" style={{ padding: 16 }}>
            <View className="mb-4">
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Storage Mode</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Inter_500Medium',
                  color: colors.textPrimary,
                  marginTop: 2,
                }}
              >
                100% Offline (Local MMKV Storage)
              </Text>
            </View>

            <View className="mb-4">
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Reader Profile</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Inter_500Medium',
                  color: colors.textPrimary,
                  marginTop: 2,
                }}
              >
                {getUserName()}
              </Text>
            </View>

            <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Inter_600SemiBold',
                  textTransform: 'uppercase',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Developer Controls
              </Text>
              <View className="flex-row space-x-2">
                <Button
                  title="Reset Reading Progress"
                  variant="ghost"
                  size="sm"
                  onPress={handleResetProgress}
                  className="flex-1 mr-2"
                />
                <Button
                  title={isPremium ? 'Simulate Free' : 'Simulate Pro'}
                  variant="ghost"
                  size="sm"
                  onPress={handleToggleSimulatePlan}
                  className="flex-1 ml-2"
                />
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Interactive App Picker Modal */}
      <Modal
        visible={showAppPickerModal}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        onRequestClose={() => setShowAppPickerModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <SafeAreaView
            style={{ flex: 1, backgroundColor: colors.background }}
            edges={['top', 'left', 'right']}
          >
            <View
              style={{
                flex: 1,
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: Math.max(20, insets.bottom + 12),
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  marginBottom: 12,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 22,
                      fontFamily: 'EBGaramond_700Bold',
                      color: colors.textPrimary,
                    }}
                  >
                    Select Apps to Shield
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {blockedList.length} apps selected for distraction shielding
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowAppPickerModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.surfaceSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={16} color={colors.textPrimary} />
                </Pressable>
              </View>

              {/* Search Bar */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 12,
                }}
              >
                <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  value={appSearchQuery}
                  onChangeText={setAppSearchQuery}
                  placeholder="Search installed applications..."
                  placeholderTextColor={colors.textMuted}
                  style={{
                    flex: 1,
                    color: colors.textPrimary,
                    fontSize: 14,
                    padding: 0,
                  }}
                />
              </View>

              {loadingApps ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={colors.accent} size="large" />
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 12 }}>
                    Scanning device applications...
                  </Text>
                </View>
              ) : (
                <ScrollView style={{ flex: 1, marginBottom: 12 }} showsVerticalScrollIndicator={false}>
                  {installedApps
                    .filter(
                      (a) =>
                        a.label.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
                        a.packageName.toLowerCase().includes(appSearchQuery.toLowerCase())
                    )
                    .map((app) => {
                      const isSelected = blockedList.includes(app.packageName);
                      return (
                        <Pressable
                          key={app.packageName}
                          onPress={() => handleToggleApp(app.packageName)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 14,
                            borderRadius: 12,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.accent : colors.border,
                            backgroundColor: isSelected ? colors.accentBg : colors.surface,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                            <View style={{ marginRight: 12 }}>
                              <AppIcon
                                packageName={app.packageName}
                                label={app.label}
                                iconUri={app.icon}
                                size={40}
                                borderRadius={10}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                numberOfLines={1}
                                style={{
                                  fontSize: 14,
                                  fontFamily: 'Inter_600SemiBold',
                                  color: colors.textPrimary,
                                }}
                              >
                                {app.label}
                              </Text>
                              <Text
                                numberOfLines={1}
                                style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}
                              >
                                {app.packageName}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: isSelected ? colors.accent : colors.border,
                              backgroundColor: isSelected ? colors.accent : 'transparent',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSelected && (
                              <Check size={14} color="#141413" strokeWidth={3} />
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                </ScrollView>
              )}

              {/* Bottom Done Action Button */}
              <Pressable
                onPress={() => setShowAppPickerModal(false)}
                style={{
                  width: '100%',
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#141413' }}>
                  Done ({blockedList.length} Apps Shielded)
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Reusable Time Picker Modal for Reminders */}
      <TimePickerModal
        visible={showTimePickerModal}
        onClose={() => setShowTimePickerModal(false)}
        onSave={handleAddReminderTime}
        title="Add Reminder Time"
      />
    </SafeAreaView>
  );
}
