import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { usePurchases } from '../../lib/purchases';
import { AppBlocker } from '../../lib/appBlocker';
import {
  getDailyGoalMinutes,
  setDailyGoalMinutes,
  getBibleTranslation,
  setBibleTranslation,
  getBlockedApps,
  setBlockedApps,
  setReadingProgress,
} from '../../lib/mmkv';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

const GOAL_OPTIONS = [5, 10, 15, 20, 30];

const PRESET_APP_LABELS: Record<string, { name: string; icon: string }> = {
  'com.instagram.android': { name: 'Instagram', icon: '📸' },
  'com.zhiliaoapp.musically': { name: 'TikTok', icon: '🎵' },
  'com.google.android.youtube': { name: 'YouTube', icon: '▶️' },
  'com.twitter.android': { name: 'X / Twitter', icon: '🐦' },
  'com.reddit.frontpage': { name: 'Reddit', icon: '🤖' },
};

export default function SettingsScreen() {
  const router = useRouter();
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

  useEffect(() => {
    AppBlocker.hasPermissions().then(setHasPermission);
  }, []);

  const handleSelectGoal = (minutes: number) => {
    setDailyGoal(minutes);
    setDailyGoalMinutes(minutes);
  };

  const handleSelectTranslation = (tr: 'WEB' | 'KJV') => {
    setTranslationState(tr);
    setBibleTranslation(tr);
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
    const granted = await AppBlocker.requestPermissions();
    setHasPermission(granted);
    if (granted) {
      Alert.alert('Permission Granted', 'Bible Unlock is ready to shield apps.');
    }
  };

  const handleCustomApps = () => {
    if (!isPremium) {
      router.push('/paywall' as any);
    } else {
      Alert.alert(
        'Custom App Selection',
        'Custom app picker is unlocked for Premium members. Selecting apps from device...'
      );
    }
  };

  const handleResetProgress = () => {
    setReadingProgress(0);
    AppBlocker.shieldApps();
    Alert.alert('Reset Complete', "Today's reading progress has been reset to 00:00.");
  };

  const userEmail = profile?.email || user?.email || 'Guest Disciple';

  return (
    <SafeAreaView className="flex-1 bg-surface-dark">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 48 }}
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
              <Text className="text-2xl mr-2.5">👑</Text>
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
              Shielded Applications
            </Text>
            <Pressable onPress={handleCustomApps}>
              <Text className="text-xs text-primary font-sans-semibold">
                + Custom Apps {!isPremium && '🔒'}
              </Text>
            </Pressable>
          </View>

          <Card variant="dark" className="p-2 border border-hairline/20">
            {Object.entries(PRESET_APP_LABELS).map(([pkg, info], idx) => {
              const isChecked = blockedList.includes(pkg);
              return (
                <View
                  key={pkg}
                  className={`flex-row items-center justify-between p-3 ${
                    idx !== 0 ? 'border-t border-hairline/10' : ''
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-xl mr-3">{info.icon}</Text>
                    <Text className="text-sm font-sans-medium text-on-dark">
                      {info.name}
                    </Text>
                  </View>
                  <Switch
                    value={isChecked}
                    onValueChange={() => handleToggleApp(pkg)}
                    trackColor={{ false: '#3d3d3a', true: '#cc785c' }}
                    thumbColor={isChecked ? '#ffffff' : '#8e8b82'}
                  />
                </View>
              );
            })}
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
    </SafeAreaView>
  );
}
