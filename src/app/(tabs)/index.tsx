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
import { useRouter } from 'expo-router';
import {
  Settings,
  ShieldCheck,
  ShieldAlert,
  Clock,
  BookOpen,
  Sparkles,
  Flame,
  Pause,
  Trophy,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { useReadingTimer } from '../../lib/readingTimer';
import { AppBlocker } from '../../lib/appBlocker';
import { getDailyVerse } from '../../lib/bible';
import {
  getBibleTranslation,
  getUserName,
  getReadingHistory30Days,
  getImpactStats,
  isBlockingPaused,
  getPauseBlockingUntil,
  setPauseBlockingUntil,
  getBlockedApps,
} from '../../lib/mmkv';
import { Last30DaysTracker } from '../../components/Last30DaysTracker';
import { BadgesGrid } from '../../components/BadgesGrid';
import { PauseBlockingModal } from '../../components/PauseBlockingModal';
import { BadgeShareModal } from '../../components/BadgeShareModal';
import { BadgeItem, HabitDay, ImpactStats } from '../../types/onboarding';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [isShielded, setIsShielded] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseUntil, setPauseUntil] = useState<number | null>(null);

  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const [history, setHistory] = useState<HabitDay[]>([]);
  const [impact, setImpact] = useState<ImpactStats>({ minutesRead: 0, hoursSaved: 0, sessions: 0 });
  const [name, setName] = useState('Disciple');

  // Track progress (home screen progress state)
  const timer = useReadingTimer(false);

  // Daily Scripture
  const translation = getBibleTranslation();
  const dailyVerse = getDailyVerse(translation);

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
    setHistory(getReadingHistory30Days());
    setImpact(getImpactStats());

    const storedName = getUserName();
    const fallbackName = profile?.display_name || user?.user_metadata?.full_name || 'Disciple';
    setName(storedName !== 'Disciple' ? storedName : fallbackName);
  }, [profile, user]);

  useEffect(() => {
    loadData();
  }, [loadData, timer.secondsRead, timer.isGoalMet]);

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

  // Compute unlockable badges dynamically
  const blockedApps = getBlockedApps();
  const badges: BadgeItem[] = [
    {
      id: 'genesis',
      title: 'Genesis',
      subtitle: 'First Step',
      icon: '🌱',
      unlocked: impact.sessions >= 1 || timer.streak >= 1,
      requirement: 'Complete your first Scripture reading session',
    },
    {
      id: 'david_courage',
      title: "David's Courage",
      subtitle: '3-Day Habit',
      icon: '⚔️',
      unlocked: timer.streak >= 3,
      requirement: 'Maintain your reading streak for 3 consecutive days',
    },
    {
      id: 'solomon_wisdom',
      title: "Solomon's Wisdom",
      subtitle: '7-Day Streak',
      icon: '👑',
      unlocked: timer.streak >= 7,
      requirement: "Complete 7 consecutive days in God's Word",
    },
    {
      id: 'armor_of_god',
      title: 'Armor of God',
      subtitle: 'Apps Guarded',
      icon: '🛡️',
      unlocked: blockedApps.length >= 3,
      requirement: 'Shield at least 3 distracting apps from temptation',
    },
    {
      id: 'living_water',
      title: 'Living Water',
      subtitle: '30m in Word',
      icon: '🌊',
      unlocked: impact.minutesRead >= 30,
      requirement: 'Read Scripture for over 30 cumulative minutes',
    },
    {
      id: 'morning_light',
      title: 'Morning Light',
      subtitle: 'Devotion',
      icon: '🕊️',
      unlocked: impact.sessions >= 3,
      requirement: 'Complete 3 Bible reading sessions with consistency',
    },
  ];

  const remainingMins = pauseUntil
    ? Math.max(0, Math.ceil((pauseUntil - Date.now()) / 60000))
    : 0;

  const minutesRemainingToGoal = Math.max(
    0,
    timer.goalMinutes - Math.floor(timer.secondsRead / 60)
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#0d120f' }}
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
            tintColor="#f5b800"
          />
        }
      >
        {/* Top Header Bar */}
        <View className="flex-row items-center justify-between pt-4 pb-2">
          <View className="flex-1 pr-3">
            <Text className="text-[11px] font-sans-medium text-[#78a898] uppercase tracking-widest">
              Grace and peace to you,
            </Text>
            <Text
              className="text-2xl font-serif-bold text-[#faf9f5]"
              style={{ fontFamily: 'EBGaramond_700Bold' }}
            >
              {name}
            </Text>
          </View>

          {/* Quick Settings & Status Badge */}
          <View className="flex-row items-center">
            {isPaused ? (
              <View className="flex-row items-center px-2.5 py-1 rounded-full bg-[#342e18] border border-[#f5b800] mr-2">
                <Pause size={12} color="#f5b800" style={{ marginRight: 4 }} />
                <Text className="text-[10px] font-sans-bold text-[#f5b800]">
                  Paused ({remainingMins}m)
                </Text>
              </View>
            ) : (
              <View
                className={`flex-row items-center px-2.5 py-1 rounded-full border mr-2 ${
                  isShielded
                    ? 'bg-[#18261e] border-[#385e48]'
                    : 'bg-[#291b1b] border-[#5e3838]'
                }`}
              >
                {isShielded ? (
                  <ShieldCheck size={12} color="#5db872" style={{ marginRight: 4 }} />
                ) : (
                  <ShieldAlert size={12} color="#ff7b72" style={{ marginRight: 4 }} />
                )}
                <Text
                  className={`text-[10px] font-sans-bold ${
                    isShielded ? 'text-[#5db872]' : 'text-[#ff7b72]'
                  }`}
                >
                  {isShielded ? 'Shielded' : 'Unshielded'}
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => router.push('/settings' as any)}
              className="w-10 h-10 rounded-full bg-[#18231c] border border-[#273d30] items-center justify-center active:opacity-80"
            >
              <Settings size={18} color="#f5b800" />
            </Pressable>
          </View>
        </View>

        {/* Hero Card: "Time to Read" */}
        <View className="my-4 p-5 rounded-3xl bg-[#141d18] border border-[#24372a] shadow-xl">
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Clock size={14} color="#f5b800" style={{ marginRight: 6 }} />
              <Text className="text-xs font-sans-bold text-[#f5b800] uppercase tracking-widest">
                Time to Read
              </Text>
            </View>
            <View className="px-2.5 py-0.5 rounded-full bg-[#202e24] border border-[#2e4635]">
              <Text className="text-[11px] font-sans-medium text-[#78a898]">
                {timer.goalMinutes} min target
              </Text>
            </View>
          </View>

          {/* Motivational Message */}
          <Text
            className="text-lg font-serif text-[#faf9f5] leading-snug mb-2"
            style={{ fontFamily: 'EBGaramond_700Bold' }}
          >
            {timer.isGoalMet
              ? 'Amen! Daily reading goal completed'
              : 'Feed your spirit before feeding the scroll'}
          </Text>

          <Text className="text-xs font-sans text-[#78a898] leading-relaxed mb-4">
            {timer.isGoalMet
              ? 'Praise God! You have fulfilled your reading target today. All apps are unshielded.'
              : `${minutesRemainingToGoal} min remaining to unlock your guarded apps today.`}
          </Text>

          {/* Progress Bar */}
          <View className="w-full h-2.5 bg-[#1f2b23] rounded-full overflow-hidden mb-5">
            <View
              className="h-full bg-[#f5b800] rounded-full"
              style={{ width: `${Math.round(timer.progress * 100)}%` }}
            />
          </View>

          {/* Golden Radiant Button */}
          <Pressable
            onPress={() => router.push('/reader' as any)}
            className="w-full py-4 rounded-2xl bg-[#f5b800] items-center justify-center active:opacity-90 shadow-lg flex-row"
          >
            <BookOpen size={18} color="#141413" style={{ marginRight: 8 }} />
            <Text className="text-base font-sans-bold text-[#141413]">
              {timer.isGoalMet ? 'Continue in Scripture' : "Amen, Let's Read"}
            </Text>
          </Pressable>
        </View>

        {/* Daily Devotional Card */}
        <View className="mb-4 p-5 rounded-3xl bg-[#141b17] border border-[#202e25]">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Sparkles size={15} color="#d4a359" style={{ marginRight: 6 }} />
              <Text className="text-xs font-sans-bold text-[#d4a359] uppercase tracking-wider">
                Daily Devotional
              </Text>
            </View>
            <Text className="text-[11px] font-sans text-[#5c7a6e]">
              {translation}
            </Text>
          </View>

          <Text className="text-xs font-sans text-[#78a898] mb-3">
            Build steady spiritual consistency with today's verse
          </Text>

          <Text
            className="text-base text-[#faf9f5] leading-relaxed mb-3 italic"
            style={{ fontFamily: 'EBGaramond_400Regular_Italic' }}
          >
            "{dailyVerse.text}"
          </Text>

          <View className="flex-row items-center justify-between pt-2 border-t border-[#202e25]">
            <Text className="text-xs font-sans-bold text-[#f5b800]">
              {dailyVerse.bookName} {dailyVerse.chapter}:{dailyVerse.verseNum}
            </Text>
            <Pressable
              onPress={() => router.push('/reader' as any)}
              className="py-1 px-2.5 rounded-lg active:opacity-75 flex-row items-center"
            >
              <Text className="text-xs font-sans-bold text-[#78a898] mr-1">
                Read Chapter
              </Text>
              <ChevronRight size={14} color="#78a898" />
            </Pressable>
          </View>
        </View>

        {/* Streak & Pause Blocking Card */}
        <View className="mb-4 p-5 rounded-3xl bg-[#151e18] border border-[#223328] flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center mb-1">
              <Flame size={22} color="#ff7b42" style={{ marginRight: 8 }} />
              <Text className="text-xl font-sans-bold text-[#faf9f5]">
                {timer.streak} {timer.streak === 1 ? 'Day' : 'Days'} Streak
              </Text>
            </View>
            <Text className="text-xs font-sans text-[#78a898]">
              Keep your daily spiritual flame burning
            </Text>
          </View>

          <Pressable
            onPress={() => setIsPauseModalVisible(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#223126] border border-[#354f3c] active:opacity-80 flex-row items-center"
          >
            <Pause size={13} color="#f5b800" style={{ marginRight: 6 }} />
            <Text className="text-xs font-sans-bold text-[#f5b800]">
              {isPaused ? `Paused (${remainingMins}m)` : 'Pause Blocking'}
            </Text>
          </Pressable>
        </View>

        {/* Horizontal 30-Day Activity Tracker */}
        <Last30DaysTracker history={history} />

        {/* Your Impact Section */}
        <View className="my-3">
          <Text className="text-base font-sans-bold text-[#faf9f5] mb-3 px-1">
            Your Impact
          </Text>

          <View className="flex-row justify-between">
            {/* Minutes Read */}
            <View className="flex-1 mr-2 p-4 rounded-2xl bg-[#141a16] border border-[#202a22] items-center">
              <View className="w-10 h-10 rounded-xl bg-[#1c2921] items-center justify-center mb-2">
                <BookOpen size={20} color="#f5b800" />
              </View>
              <Text className="text-lg font-sans-bold text-[#faf9f5]">
                {impact.minutesRead}m
              </Text>
              <Text className="text-[10px] font-sans text-[#78a898] mt-0.5 text-center">
                Minutes in Word
              </Text>
            </View>

            {/* Screen Time Saved */}
            <View className="flex-1 mx-1 p-4 rounded-2xl bg-[#141a16] border border-[#202a22] items-center">
              <View className="w-10 h-10 rounded-xl bg-[#1c2921] items-center justify-center mb-2">
                <Clock size={20} color="#f5b800" />
              </View>
              <Text className="text-lg font-sans-bold text-[#f5b800]">
                {impact.hoursSaved}h
              </Text>
              <Text className="text-[10px] font-sans text-[#78a898] mt-0.5 text-center">
                Scroll Saved
              </Text>
            </View>

            {/* Total Sessions */}
            <View className="flex-1 ml-2 p-4 rounded-2xl bg-[#141a16] border border-[#202a22] items-center">
              <View className="w-10 h-10 rounded-xl bg-[#1c2921] items-center justify-center mb-2">
                <Trophy size={20} color="#f5b800" />
              </View>
              <Text className="text-lg font-sans-bold text-[#faf9f5]">
                {impact.sessions}
              </Text>
              <Text className="text-[10px] font-sans text-[#78a898] mt-0.5 text-center">
                Devotions
              </Text>
            </View>
          </View>
        </View>

        {/* Badges & Achievements Section */}
        <BadgesGrid badges={badges} onSelectBadge={setSelectedBadge} />
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

      <BadgeShareModal
        badge={selectedBadge}
        userName={name}
        streak={timer.streak}
        onClose={() => setSelectedBadge(null)}
      />
    </SafeAreaView>
  );
}
