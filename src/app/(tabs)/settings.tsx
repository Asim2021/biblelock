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
  setThemeMode,
  ThemeMode,
} from '../../lib/mmkv';
import { SyncService } from '../../lib/sync';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

const GOAL_OPTIONS = [5, 10, 15, 20, 30];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const { isPremium, toggleDevPremium } = usePurchases();

  const [dailyGoal, setDailyGoal] = useState(() => getDailyGoalMinutes());
  const [translation, setTranslationState] = useState<'WEB' | 'KJV'>(() =>
    getBibleTranslation()
  );
  const [blockedList, setBlockedListState] = useState<string[]>(() =>
    getBlockedApps()
  );
  const [hasPermission, setHasPermission] = useState(false);
  const [eveningReminder, setEveningReminder] = useState(true);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getThemeMode());

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
    if (installedApps.length === 0) {
      setLoadingApps(true);
      try {
        const list = await AppBlocker.getInstalledApps();
        setInstalledApps(list);
      } finally {
        setLoadingApps(false);
      }
    }
  };

  const getAppInfo = (pkg: string): { label: string; icon?: string } => {
    const found = installedApps.find((a) => a.packageName === pkg);
    if (found) return { label: found.label, icon: found.icon };
    const parts = pkg.split('.');
    const fallbackName = parts[parts.length - 1] || pkg;
    return {
      label: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
    };
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    setThemeModeState(mode);
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
      style={{ flex: 1, backgroundColor: '#0d120f' }}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={{ flex: 1 }}
        className="px-5"
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
      >
        <Text className="text-2xl font-sans-bold text-on-dark pt-4 pb-4">
          Settings & Blocking
        </Text>

        {/* Premium Banner */}
        <Card
          variant="dark"
          className="p-5 mb-5 border border-primary/40 bg-primary/10"
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="mr-3">
                <Crown size={26} color="#f5b800" />
              </View>
              <View>
                <Text className="text-base font-sans-bold text-on-dark">
                  {isPremium ? 'Bible Unlock Pro' : 'Unlock Pro Access'}
                </Text>
                <Text className="text-xs text-primary font-sans-medium">
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
        <Card variant="dark" className="p-4 mb-5 border border-hairline/20">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-sm font-sans-bold text-on-dark">
                Shield Protection Permission
              </Text>
              <Text className="text-xs text-on-dark-soft mt-0.5">
                {hasPermission
                  ? 'Active & guarding distraction apps'
                  : 'Requires device permission to block apps'}
              </Text>
            </View>
            <View
              className={`w-3 h-3 rounded-full ${
                hasPermission ? 'bg-success' : 'bg-warning'
              }`}
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
          <Text className="text-xs font-sans-semibold uppercase tracking-wider text-on-dark-soft mb-2.5 px-1">
            Daily Scripture Goal
          </Text>
          <Card variant="dark" className="p-4 border border-hairline/20">
            <Text className="text-sm text-on-dark mb-3">
              How many minutes of reading to unlock your apps each day?
            </Text>
            <View className="flex-row justify-between">
              {GOAL_OPTIONS.map((mins) => {
                const isSelected = dailyGoal === mins;
                return (
                  <Pressable
                    key={mins}
                    onPress={() => handleSelectGoal(mins)}
                    className={`flex-1 mx-1 py-2.5 rounded-md items-center justify-center border ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-surface-dark-soft border-hairline/20'
                    }`}
                  >
                    <Text
                      className={`text-sm font-sans-bold ${
                        isSelected ? 'text-white' : 'text-on-dark'
                      }`}
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
            <Text className="text-xs font-sans-semibold uppercase tracking-wider text-on-dark-soft">
              Shielded Applications ({blockedList.length})
            </Text>
            <Pressable
              onPress={handleCustomApps}
              className="flex-row items-center bg-primary/10 px-2.5 py-1.5 rounded-lg active:opacity-80"
            >
              <Plus size={13} color="#f5b800" style={{ marginRight: 4 }} />
              <Text className="text-xs text-primary font-sans-semibold">
                Add Apps
              </Text>
            </Pressable>
          </View>

          <Card variant="dark" className="p-2 border border-hairline/20">
            {blockedList.length === 0 ? (
              <View className="items-center py-6 px-4">
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-2">
                  <Shield size={24} color="#f5b800" />
                </View>
                <Text className="text-sm font-sans-bold text-on-dark mb-1">
                  No Apps Shielded
                </Text>
                <Text className="text-xs font-sans text-on-dark-soft text-center mb-3.5 leading-relaxed">
                  Shield distracting apps like social media or games so they stay locked until your Bible goal is met.
                </Text>
                <Pressable
                  onPress={handleCustomApps}
                  className="px-4 py-2.5 rounded-xl bg-primary active:opacity-90 flex-row items-center"
                >
                  <Plus size={14} color="#141413" style={{ marginRight: 6 }} />
                  <Text className="text-xs font-sans-bold text-[#141413]">
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
                    className={`flex-row items-center justify-between p-3 ${
                      idx !== 0 ? 'border-t border-hairline/10' : ''
                    }`}
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      {info.icon ? (
                        <Image
                          source={{ uri: info.icon }}
                          style={{ width: 36, height: 36, borderRadius: 8, marginRight: 12 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <View className="w-9 h-9 rounded-lg bg-[#1c2921] items-center justify-center mr-3">
                          <Text className="text-sm font-bold text-[#f5b800]">
                            {info.label.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-sm font-sans-medium text-on-dark" numberOfLines={1}>
                          {info.label}
                        </Text>
                        <Text className="text-[11px] font-sans text-on-dark-soft" numberOfLines={1}>
                          {pkg}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleToggleApp(pkg)}
                      className="p-2 rounded-lg bg-surface-dark-soft active:opacity-75"
                      hitSlop={8}
                    >
                      <Trash2 size={16} color="#e57373" />
                    </Pressable>
                  </View>
                );
              })
            )}
          </Card>
        </View>

        {/* Appearance & Theme Setting */}
        <View className="mb-5">
          <Text className="text-xs font-sans-semibold uppercase tracking-wider text-on-dark-soft mb-2.5 px-1">
            Appearance & Theme
          </Text>
          <Card variant="dark" className="p-3 border border-hairline/20">
            <View className="flex-row justify-between">
              <Pressable
                onPress={() => handleSelectTheme('dark')}
                className={`flex-1 mr-1.5 p-3 rounded-xl border items-center ${
                  themeMode === 'dark'
                    ? 'bg-primary/15 border-primary'
                    : 'bg-surface-dark-soft border-hairline/10'
                }`}
              >
                <Moon
                  size={20}
                  color={themeMode === 'dark' ? '#f5b800' : '#8e8b82'}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  className={`text-xs font-sans-bold ${
                    themeMode === 'dark' ? 'text-primary' : 'text-on-dark'
                  }`}
                >
                  Dark
                </Text>
                <Text className="text-[10px] font-sans text-on-dark-soft text-center mt-0.5">
                  Celestial
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleSelectTheme('light')}
                className={`flex-1 mx-1.5 p-3 rounded-xl border items-center ${
                  themeMode === 'light'
                    ? 'bg-primary/15 border-primary'
                    : 'bg-surface-dark-soft border-hairline/10'
                }`}
              >
                <Sun
                  size={20}
                  color={themeMode === 'light' ? '#f5b800' : '#8e8b82'}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  className={`text-xs font-sans-bold ${
                    themeMode === 'light' ? 'text-primary' : 'text-on-dark'
                  }`}
                >
                  Light
                </Text>
                <Text className="text-[10px] font-sans text-on-dark-soft text-center mt-0.5">
                  Parchment
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleSelectTheme('system')}
                className={`flex-1 ml-1.5 p-3 rounded-xl border items-center ${
                  themeMode === 'system'
                    ? 'bg-primary/15 border-primary'
                    : 'bg-surface-dark-soft border-hairline/10'
                }`}
              >
                <Smartphone
                  size={20}
                  color={themeMode === 'system' ? '#f5b800' : '#8e8b82'}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  className={`text-xs font-sans-bold ${
                    themeMode === 'system' ? 'text-primary' : 'text-on-dark'
                  }`}
                >
                  System
                </Text>
                <Text className="text-[10px] font-sans text-on-dark-soft text-center mt-0.5">
                  Auto
                </Text>
              </Pressable>
            </View>
          </Card>
        </View>

        {/* Translation Preference */}
        <View className="mb-5">
          <Text className="text-xs font-sans-semibold uppercase tracking-wider text-on-dark-soft mb-2.5 px-1">
            Default Bible Translation
          </Text>
          <Card variant="dark" className="p-3 border border-hairline/20">
            <View className="flex-row justify-between">
              <Pressable
                onPress={() => handleSelectTranslation('WEB')}
                className={`flex-1 mr-2 p-3 rounded-md border items-center ${
                  translation === 'WEB'
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface-dark-soft border-hairline/10'
                }`}
              >
                <Text className="text-sm font-sans-bold text-on-dark mb-0.5">
                  WEB
                </Text>
                <Text className="text-xs text-on-dark-soft text-center">
                  World English Bible (Easy Modern)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleSelectTranslation('KJV')}
                className={`flex-1 ml-2 p-3 rounded-md border items-center ${
                  translation === 'KJV'
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface-dark-soft border-hairline/10'
                }`}
              >
                <Text className="text-sm font-sans-bold text-on-dark mb-0.5">
                  KJV
                </Text>
                <Text className="text-xs text-on-dark-soft text-center">
                  King James (Classical Serif)
                </Text>
              </Pressable>
            </View>
          </Card>
        </View>

        {/* Notification Settings */}
        <View className="mb-5">
          <Text className="text-xs font-sans-semibold uppercase tracking-wider text-on-dark-soft mb-2.5 px-1">
            Scripture Shield Reminders
          </Text>
          <Card variant="dark" className="p-4 border border-hairline/20">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-sans-medium text-on-dark">
                  Evening Reflection Prompt
                </Text>
                <Text className="text-xs text-on-dark-soft mt-0.5">
                  Sends a gentle reminder at 8:00 PM if today's reading goal is unmet.
                </Text>
              </View>
              <Switch
                value={eveningReminder}
                onValueChange={setEveningReminder}
                trackColor={{ false: '#3d3d3a', true: '#cc785c' }}
                thumbColor={eveningReminder ? '#ffffff' : '#8e8b82'}
              />
            </View>
          </Card>
        </View>

        {/* Account & Developer Section */}
        <View className="mb-6">
          <Text className="text-xs font-sans-semibold uppercase tracking-wider text-on-dark-soft mb-2.5 px-1">
            Account & Diagnostics
          </Text>
          <Card variant="dark" className="p-4 border border-hairline/20">
            <View className="mb-4">
              <Text className="text-xs text-on-dark-soft">Signed in as</Text>
              <Text className="text-sm font-sans-medium text-on-dark mt-0.5">
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

            <View className="pt-4 border-t border-hairline/10">
              <Text className="text-xs font-mono text-on-dark-soft uppercase mb-2">
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
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAppPickerModal(false)}
      >
        <SafeAreaView className="flex-1 bg-[#0d120f]">
          <View
            className="flex-1 px-5 pt-3"
            style={{ paddingBottom: Math.max(20, insets.bottom + 12) }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between py-3 border-b border-hairline/10 mb-3">
              <View>
                <Text
                  className="text-2xl font-serif text-[#faf9f5]"
                  style={{ fontFamily: 'EBGaramond_700Bold' }}
                >
                  Select Apps to Shield
                </Text>
                <Text className="text-xs font-sans text-on-dark-soft">
                  {blockedList.length} apps selected for distraction shielding
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAppPickerModal(false)}
                className="w-8 h-8 rounded-full bg-surface-dark-elevated items-center justify-center"
              >
                <X size={16} color="#faf9f5" />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center px-3.5 py-2.5 rounded-xl bg-surface-dark-elevated border border-hairline/20 mb-3">
              <Search size={16} color="#8e8b82" style={{ marginRight: 8 }} />
              <TextInput
                value={appSearchQuery}
                onChangeText={setAppSearchQuery}
                placeholder="Search installed applications..."
                placeholderTextColor="#8e8b82"
                className="flex-1 text-[#faf9f5] font-sans text-sm p-0"
              />
            </View>

            {loadingApps ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#f5b800" size="large" />
                <Text className="text-xs font-sans text-on-dark-soft mt-3">
                  Scanning device applications...
                </Text>
              </View>
            ) : (
              <ScrollView className="flex-1 mb-3" showsVerticalScrollIndicator={false}>
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
                        className={`flex-row items-center justify-between p-3.5 rounded-xl mb-2 border ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-hairline/10 bg-surface-dark-elevated'
                        } active:opacity-85`}
                      >
                        <View className="flex-row items-center flex-1 mr-3">
                          {app.icon ? (
                            <Image
                              source={{ uri: app.icon }}
                              style={{ width: 40, height: 40, borderRadius: 10, marginRight: 12 }}
                              resizeMode="contain"
                            />
                          ) : (
                            <View className="w-10 h-10 rounded-xl bg-[#1c2921] items-center justify-center mr-3">
                              <Text className="text-sm font-bold text-[#f5b800]">
                                {app.label.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View className="flex-1">
                            <Text
                              className="text-sm font-sans-bold text-[#faf9f5]"
                              numberOfLines={1}
                            >
                              {app.label}
                            </Text>
                            <Text
                              className="text-[11px] font-sans text-on-dark-soft"
                              numberOfLines={1}
                            >
                              {app.packageName}
                            </Text>
                          </View>
                        </View>

                        <View
                          className={`w-6 h-6 rounded-md border items-center justify-center ${
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-hairline/40'
                          }`}
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
              className="w-full py-4 rounded-2xl bg-primary items-center justify-center active:opacity-90 shadow-lg"
            >
              <Text className="text-base font-sans-bold text-[#141413]">
                Done ({blockedList.length} Apps Shielded)
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
