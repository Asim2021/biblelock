import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Settings,
  Clock,
  BookOpen,
  Sparkles,
  Flame,
  Trophy,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { useReadingTimer } from '../../lib/readingTimer';
import { usePurchases } from '../../lib/purchases';
import { AppBlocker } from '../../lib/appBlocker';
import {
  getUserName,
  getWeeklyHabitDays,
  getImpactStats,
  isBlockingPaused,
  getPauseBlockingUntil,
  setPauseBlockingUntil,
  getLastReadPosition,
  getBlockedApps,
} from '../../lib/mmkv';
import { ShieldedAppsStrip } from '../../components/ShieldedAppsStrip';
import { WeeklyStreakTracker } from '../../components/WeeklyStreakTracker';
import { DailyDevotionalCard } from '../../components/DailyDevotionalCard';
import { PauseBlockingModal } from '../../components/PauseBlockingModal';
import { HabitDay, ImpactStats } from '../../types/onboarding';
import { useTheme } from '../../lib/themeContext';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isPremium } = usePurchases();

  const [refreshing, setRefreshing] = useState(false);
  const [isShielded, setIsShielded] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseUntil, setPauseUntil] = useState<number | null>(null);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);

  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
  const [history, setHistory] = useState<HabitDay[]>([]);
  const [impact, setImpact] = useState<ImpactStats>({ minutesRead: 0, hoursSaved: 0, sessions: 0 });
  const [name, setName] = useState('Disciple');
  const [sanctuaryPromptDismissed, setSanctuaryPromptDismissed] = useState(false);

  // Track progress (home screen progress state)
  const timer = useReadingTimer(false);

  const loadData = useCallback(async () => {
    try {
      const st = await AppBlocker.getStatus();
      setIsShielded(st.isShielded);
    } catch {
      // fallback
    }

    const paused = isBlockingPaused();
    setIsPaused(paused);
    setPauseUntil(getPauseBlockingUntil());
    setHistory(getWeeklyHabitDays());
    setImpact(getImpactStats());
    setBlockedApps(getBlockedApps());

    const storedName = getUserName();
    setName(storedName);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData, timer.isGoalMet]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePauseBlocking = async (minutes: number) => {
    const until = Date.now() + minutes * 60 * 1000;
    setPauseBlockingUntil(until);
    await AppBlocker.unshieldApps();
    setIsPaused(true);
    setPauseUntil(until);
    setIsShielded(false);
    setIsPauseModalVisible(false);
    Alert.alert('Blocking Paused', `App blocking paused for ${minutes === 60 ? '1 hour' : `${minutes} minutes`}.`);
  };

  const handleResumeBlocking = async () => {
    setPauseBlockingUntil(null);
    await AppBlocker.shieldApps();
    setIsPaused(false);
    setPauseUntil(null);
    setIsShielded(true);
    setIsPauseModalVisible(false);
    Alert.alert('Blocking Resumed', 'Distracting apps are shielded until your reading goal is met.');
  };

  const remainingMins = pauseUntil
    ? Math.max(0, Math.ceil((pauseUntil - Date.now()) / 60000))
    : 0;

  const minutesRemainingToGoal = Math.max(
    0,
    timer.goalMinutes - Math.floor(timer.secondsRead / 60)
  );

  const lastPos = getLastReadPosition();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={{ flex: 1 }}
        className="px-5"
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Top Header Bar */}
        <View className="flex-row items-center justify-between pt-4 pb-3">
          <View className="flex-1 pr-3">
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter_500Medium',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              Grace and peace to you,
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontFamily: 'EBGaramond_700Bold',
                color: colors.textPrimary,
              }}
            >
              {name}
            </Text>
          </View>

          {/* Quick Header Actions: Stats & Settings */}
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.push('/stats-detail' as any)}
              accessibilityRole="button"
              accessibilityLabel="My Stats and Badges"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <Trophy size={18} color={colors.accent} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/settings' as any)}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={18} color={colors.accent} />
            </Pressable>
          </View>
        </View>

        {/* Shielded Apps Status Strip with Authentic App Icons */}
        <ShieldedAppsStrip
          isShielded={isShielded}
          isPaused={isPaused}
          remainingMins={remainingMins}
          blockedApps={blockedApps}
          onPressPause={() => {
            if (isPaused) {
              handleResumeBlocking();
            } else {
              setIsPauseModalVisible(true);
            }
          }}
          onPressManage={() => router.push('/settings' as any)}
        />

        {/* Soft Sanctuary Prompt for 3+ day streak */}
        {!isPremium && timer.streak >= 3 && !sanctuaryPromptDismissed && (
          <View
            style={{
              marginBottom: 12,
              padding: 16,
              borderRadius: 20,
              backgroundColor: colors.accentBg,
              borderWidth: 1,
              borderColor: colors.accent,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <View className="flex-row items-center mb-1">
                <Flame size={14} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                  {timer.streak}-Day Streak Active
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>
                Sanctuary protects your faithfulness with streak recovery, custom blocking & all translations.
              </Text>
              <Pressable
                onPress={() => router.push('/paywall' as any)}
                className="mt-2.5 flex-row items-center"
              >
                <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.accent }}>
                  Explore Sanctuary →
                </Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => setSanctuaryPromptDismissed(true)}
              hitSlop={12}
              style={{ alignSelf: 'flex-start', padding: 4 }}
            >
              <X size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* Smart Resume Hero Card: "Time to Read" */}
        <View
          style={{
            marginBottom: 16,
            padding: 20,
            borderRadius: 24,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.05,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Clock size={14} color={colors.accent} style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_700Bold',
                  color: colors.accent,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Time to Read
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 2,
                borderRadius: 20,
                backgroundColor: colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary }}>
                {timer.goalMinutes} min target
              </Text>
            </View>
          </View>

          {/* Motivational Message */}
          <Text
            style={{
              fontFamily: 'EBGaramond_700Bold',
              fontSize: 18,
              color: colors.textPrimary,
              lineHeight: 24,
              marginBottom: 6,
            }}
          >
            {timer.isGoalMet
              ? 'Amen! Daily reading goal completed'
              : 'Feed your spirit before feeding the scroll'}
          </Text>

          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 12 }}>
            {timer.isGoalMet
              ? 'Praise God! You have fulfilled your reading target today. All apps are unshielded.'
              : `${minutesRemainingToGoal} min remaining to unlock your guarded apps today.`}
          </Text>

          {/* Context Reading Location Chip */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <BookOpen size={12} color={colors.accent} style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Inter_700Bold',
                  color: colors.textPrimary,
                  letterSpacing: 0.3,
                }}
              >
                {lastPos.bookName} {lastPos.chapterNumber}:{lastPos.verseNumber || 1}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View
            style={{
              width: '100%',
              height: 10,
              backgroundColor: colors.surfaceSubtle,
              borderRadius: 5,
              overflow: 'hidden',
              marginBottom: 18,
            }}
          >
            <View
              style={{
                height: '100%',
                backgroundColor: colors.accent,
                borderRadius: 5,
                width: `${Math.round(timer.progress * 100)}%`,
              }}
            />
          </View>

          {/* Dual Action Buttons: Read Chapter vs Visual Scroll */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Primary Action: Read Chapter */}
            <Pressable
              onPress={() => {
                router.push({
                  pathname: '/reader',
                  params: {
                    book: lastPos.bookName,
                    chapter: lastPos.chapterNumber.toString(),
                    verse: (lastPos.verseNumber || 1).toString(),
                  },
                } as any);
              }}
              accessibilityRole="button"
              accessibilityLabel="Read Chapter"
              style={{
                flex: 1.4,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                marginRight: 8,
              }}
            >
              <BookOpen size={16} color="#141413" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#141413' }}>
                {timer.isGoalMet ? 'Continue Word' : 'Read Chapter'}
              </Text>
            </Pressable>

            {/* Secondary Action: Visual Scroll */}
            <Pressable
              onPress={() => router.push('/scroll' as any)}
              accessibilityRole="button"
              accessibilityLabel="Visual Scroll"
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}
            >
              <Sparkles size={16} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                Visual Scroll
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Daily Devotional Card with Dual Scripture / Daily Prayer Modes */}
        <View className="mb-2">
          <DailyDevotionalCard />
        </View>

        {/* Unified Weekly Activity & Streak Tracker with Sanctuary Grace Day Status */}
        <WeeklyStreakTracker
          history={history}
          streak={timer.streak}
          isPremium={isPremium}
        />

        {/* Your Impact Section */}
        <View className="my-3">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Inter_700Bold',
                color: colors.textPrimary,
              }}
            >
              Your Impact
            </Text>
            <Pressable
              onPress={() => router.push('/stats-detail' as any)}
              hitSlop={8}
              className="flex-row items-center"
              accessibilityRole="button"
              accessibilityLabel="View All Stats and Badges"
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                  color: colors.accent,
                  marginRight: 2,
                }}
              >
                View All Stats
              </Text>
              <ChevronRight size={14} color={colors.accent} />
            </Pressable>
          </View>

          <View className="flex-row justify-between">
            {/* Minutes Read */}
            <View
              style={{
                flex: 1,
                marginRight: 6,
                padding: 16,
                borderRadius: 16,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <BookOpen size={20} color={colors.accent} />
              </View>
              <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                {impact.minutesRead}m
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
                Minutes in Word
              </Text>
            </View>

            {/* Screen Time Saved */}
            <View
              style={{
                flex: 1,
                marginHorizontal: 4,
                padding: 16,
                borderRadius: 16,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Clock size={20} color={colors.accent} />
              </View>
              <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.accent }}>
                {impact.hoursSaved}h
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
                Scroll Saved
              </Text>
            </View>

            {/* Total Sessions */}
            <View
              style={{
                flex: 1,
                marginLeft: 6,
                padding: 16,
                borderRadius: 16,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Trophy size={20} color={colors.accent} />
              </View>
              <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                {impact.sessions}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
                Devotions
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <PauseBlockingModal
        visible={isPauseModalVisible}
        isCurrentlyPaused={isPaused}
        pauseUntilMs={pauseUntil}
        onClose={() => setIsPauseModalVisible(false)}
        onPause={handlePauseBlocking}
        onResume={handleResumeBlocking}
      />
    </SafeAreaView>
  );
}
