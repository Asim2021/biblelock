import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
} from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { usePurchases } from '../../lib/purchases';
import { AppBlocker, InstalledApp } from '../../lib/appBlocker';
import {
  getDailyGoalMinutes,
  setDailyGoalMinutes,
  getBibleTranslation,
  setBibleTranslation,
  getBlockedApps,
  setBlockedApps,
  setReadingProgress,
  getThemeMode,
  setThemeMode as saveThemeMode,
  ThemeMode,
} from '../../lib/mmkv';
import { SyncService } from '../../lib/sync';
import { useTheme } from '../../lib/themeContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

const GOAL_OPTIONS = [5, 10, 15, 20, 30];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const { isPremium, toggleDevPremium } = usePurchases();
  const { themeMode, setThemeMode, colors, isDark } = useTheme();

  const [dailyGoal, setDailyGoal] = useState(() => getDailyGoalMinutes());
  const [translation, setTranslationState] = useState<'WEB' | 'KJV'>(() =>
    getBibleTranslation()
  );
  const [blockedList, setBlockedListState] = useState<string[]>(() =>
    getBlockedApps()
  );
  const [hasPermission, setHasPermission] = useState(false);
  const [eveningReminder, setEveningReminder] = useState(true);

  const [showAppPickerModal, setShowAppPickerModal] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');

  useEffect(() => {
    AppBlocker.hasPermissions().then(setHasPermission);
    AppBlocker.getInstalledApps().then(setInstalledApps);
  }, []);

  const handleSelectGoal = (minutes: number) => {
    setDailyGoal(minutes);
    setDailyGoalMinutes(minutes);
    if (user?.id) {
      SyncService.syncSettings(user.id, { daily_goal_minutes: minutes });
    }
  };

  const handleSelectTranslation = (tr: 'WEB' | 'KJV') => {
    setTranslationState(tr);
    setBibleTranslation(tr);
    if (user?.id) {
      SyncService.syncSettings(user.id, { translation: tr });
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
    if (user?.id) {
      SyncService.syncSettings(user.id, { blocked_apps: next });
    }
  };

  const handleRequestPermissions = async () => {
    const granted = await AppBlocker.requestPermissions();
    setHasPermission(granted);
    if (granted) {
      Alert.alert('Permission Granted', 'Bible Unlock is ready to shield apps.');
    }
  };

  const handleCustomApps = async () => {
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

  const userEmail = profile?.email || user?.email || 'Guest Disciple';

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
                  {isPremium ? 'Bible Unlock Pro' : 'Unlock Pro Access'}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_500Medium',
                    color: colors.accent,
                    marginTop: 2,
                  }}
                >
                  {isPremium ? 'All Features Unlocked' : 'Custom App Blocklist & Lent Mode'}
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
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: hasPermission ? colors.success : '#f59e0b',
              }}
            />
          </View>
          {!hasPermission && (
            <Button
              title="Grant Blocker Permission"
              variant="outline"
              size="sm"
              onPress={handleRequestPermissions}
              className="mt-1"
            />
          )}
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
                return (
                  <Pressable
                    key={mins}
                    onPress={() => handleSelectGoal(mins)}
                    style={{
                      flex: 1,
                      marginHorizontal: 4,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: isSelected ? colors.accent : colors.border,
                      backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Inter_700Bold',
                        color: isSelected ? '#141413' : colors.textPrimary,
                      }}
                    >
                      {mins}m
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
              Shielded Applications ({blockedList.length})
            </Text>
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
                  onPress={handleCustomApps}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: colors.accent,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Plus size={14} color="#141413" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#141413' }}>
                    Select Apps to Shield
                  </Text>
                </Pressable>
              </View>
            ) : (
              blockedList.map((pkg, idx) => {
                const info = getAppInfo(pkg);
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
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                      {info.icon ? (
                        <Image
                          source={{ uri: info.icon }}
                          style={{ width: 36, height: 36, borderRadius: 8, marginRight: 12 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            backgroundColor: colors.surfaceSubtle,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.accent }}>
                            {info.label.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily: 'Inter_500Medium',
                            color: colors.textPrimary,
                          }}
                          numberOfLines={1}
                        >
                          {info.label}
                        </Text>
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

        {/* Notification Settings */}
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
            Scripture Shield Reminders
          </Text>
          <Card variant="dark" style={{ padding: 16 }}>
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

        {/* Account & Developer Section */}
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
            Account & Diagnostics
          </Text>
          <Card variant="dark" style={{ padding: 16 }}>
            <View className="mb-4">
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Signed in as</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Inter_500Medium',
                  color: colors.textPrimary,
                  marginTop: 2,
                }}
              >
                {userEmail}
              </Text>
            </View>

            <Button
              title="Sign Out"
              variant="outline"
              size="sm"
              onPress={signOut}
              className="mb-4"
            />

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
                  onPress={toggleDevPremium}
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
                            {app.icon ? (
                              <Image
                                source={{ uri: app.icon }}
                                style={{ width: 40, height: 40, borderRadius: 10, marginRight: 12 }}
                                resizeMode="contain"
                              />
                            ) : (
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 10,
                                  backgroundColor: colors.surfaceSubtle,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: 12,
                                }}
                              >
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.accent }}>
                                  {app.label.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
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
    </SafeAreaView>
  );
}
