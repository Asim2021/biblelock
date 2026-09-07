import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  RotateCw,
  Flame,
  Zap,
  Clock,
  Award,
  MoreHorizontal,
  Share2,
  BookOpen,
} from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { useReadingTimer } from '../../lib/readingTimer';
import {
  getUserName,
  getImpactStats,
  getBlockedApps,
  getReadingHistory30Days,
} from '../../lib/mmkv';
import { BadgesGrid } from '../../components/BadgesGrid';
import { BadgeShareModal } from '../../components/BadgeShareModal';
import { DailyDevotionalCard } from '../../components/DailyDevotionalCard';
import { BadgeItem, ImpactStats, HabitDay } from '../../types/onboarding';

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState('Disciple');
  const [impact, setImpact] = useState<ImpactStats>({ minutesRead: 0, hoursSaved: 0, sessions: 0 });
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [history, setHistory] = useState<HabitDay[]>([]);

  const timer = useReadingTimer(false);

  const loadData = useCallback(() => {
    const storedName = getUserName();
    const fallbackName = profile?.display_name || user?.user_metadata?.full_name || 'Disciple';
    setName(storedName !== 'Disciple' ? storedName : fallbackName);

    setImpact(getImpactStats());
    setHistory(getReadingHistory30Days());
  }, [profile, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 300);
  };

  const getInitials = (fullName: string) => {
    if (!fullName || fullName === 'Disciple') return 'BU';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Badges calculation
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

  // Milestone calculation
  const getNextMilestone = (current: number) => {
    if (current < 3) return 3;
    if (current < 7) return 7;
    if (current < 14) return 14;
    if (current < 30) return 30;
    if (current < 50) return 50;
    return 100;
  };

  const nextMilestone = getNextMilestone(timer.streak);
  const milestoneProgress = Math.min(1, Math.max(0.05, timer.streak / nextMilestone));

  const minutesToday = Math.floor(timer.secondsRead / 60);

  // 7-day week schedule
  const todayDayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const weekDays = [
    { label: 'S', dayIndex: 0 },
    { label: 'M', dayIndex: 1 },
    { label: 'Tu', dayIndex: 2 },
    { label: 'W', dayIndex: 3 },
    { label: 'Th', dayIndex: 4 },
    { label: 'F', dayIndex: 5 },
    { label: 'S', dayIndex: 6 },
  ];

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Join me in replacing mindless screen scrolling with God’s Word on Bible Unlock: https://bibleunlock.app',
      });
    } catch {
      // dismissed
    }
  };

  const totalVersesRead = impact.sessions > 0
    ? impact.sessions * 14 + Math.floor(impact.minutesRead * 3)
    : 0;

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
        <View className="flex-row items-center justify-between pt-4 pb-3">
          <Text
            className="text-2xl font-serif-bold text-[#faf9f5]"
            style={{ fontFamily: 'EBGaramond_700Bold' }}
          >
            Stats
          </Text>

          <Pressable
            onPress={onRefresh}
            className="w-10 h-10 rounded-full bg-[#18231c] border border-[#273d30] items-center justify-center active:opacity-80"
          >
            <RotateCw size={17} color="#a3c4b6" />
          </Pressable>
        </View>

        {/* User Profile Row */}
        <View className="flex-row items-center my-3">
          <View className="w-14 h-14 rounded-full bg-[#1c2e25] border border-[#325241] items-center justify-center mr-3.5 shadow-sm">
            <Text className="text-base font-sans-bold text-[#f5b800]">
              {getInitials(name)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-sans-bold text-[#faf9f5]">
              {name}
            </Text>
            <Text className="text-xs font-sans text-[#78a898]">
              Spiritual Walk Tracker
            </Text>
          </View>
        </View>

        {/* Section Header: Bible Reading */}
        <View className="flex-row items-center justify-between mt-4 mb-2">
          <Text className="text-xs font-sans-bold text-[#78a898] uppercase tracking-wider">
            Bible Reading
          </Text>
          <MoreHorizontal size={16} color="#5c7a6e" />
        </View>

        {/* Card 1: Read Today & Streak with Circular Gauge */}
        <View className="p-5 rounded-3xl bg-[#141e17] border border-[#233528] mb-3 flex-row items-center justify-between shadow-lg">
          <View className="flex-1 pr-3">
            <Text className="text-xs font-sans text-[#78a898] mb-1">
              Read Today
            </Text>
            <View className="flex-row items-baseline mb-3">
              <Text className="text-2xl font-sans-bold text-[#faf9f5]">
                {minutesToday} min{' '}
              </Text>
              <Text className="text-sm font-sans text-[#5c7a6e]">
                /{timer.goalMinutes} min
              </Text>
            </View>

            <Text className="text-xs font-sans text-[#78a898] mb-1">
              Current Streak
            </Text>
            <Text className="text-xl font-sans-bold text-[#faf9f5]">
              {timer.streak} {timer.streak === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {/* Circular Gauge */}
          <View className="w-24 h-24 rounded-full bg-[#1c2a21] border-4 border-[#2d4637] items-center justify-center shadow-inner">
            <View
              className={`w-16 h-16 rounded-full items-center justify-center border-2 ${
                timer.isGoalMet
                  ? 'bg-[#293d25] border-[#5db872]'
                  : 'bg-[#18231c] border-[#f5b800]/50'
              }`}
            >
              <Zap
                size={24}
                color={timer.isGoalMet ? '#5db872' : '#f5b800'}
                fill={timer.isGoalMet ? '#5db872' : '#f5b800'}
              />
            </View>
          </View>
        </View>

        {/* Card 2: This Week 7-Day Tracker */}
        <View className="p-5 rounded-3xl bg-[#141e17] border border-[#233528] mb-3 shadow-lg">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xs font-sans text-[#78a898]">
              This Week
            </Text>
            <Flame size={16} color="#ff7b42" />
          </View>

          <View className="flex-row items-center justify-between">
            {weekDays.map((wd) => {
              const isToday = wd.dayIndex === todayDayOfWeek;
              const isPastOrToday = wd.dayIndex <= todayDayOfWeek;
              const hasRead = isToday ? minutesToday > 0 : isPastOrToday;
              const dayMins = isToday ? minutesToday : isPastOrToday ? (timer.streak > 0 ? 1 : 0) : 0;

              return (
                <View key={wd.label} className="items-center">
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center border mb-1.5 ${
                      isToday
                        ? 'bg-[#273a2e] border-[#f5b800]'
                        : isPastOrToday
                        ? 'bg-[#18231c] border-[#2d4435]'
                        : 'bg-[#111713] border-[#1d2720]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-sans-bold ${
                        isToday ? 'text-[#f5b800]' : isPastOrToday ? 'text-[#faf9f5]' : 'text-[#4e6459]'
                      }`}
                    >
                      {wd.label}
                    </Text>
                  </View>

                  <Text
                    className={`text-[10px] font-sans ${
                      isToday ? 'text-[#f5b800] font-sans-bold' : 'text-[#5c7a6e]'
                    }`}
                  >
                    {dayMins}m
                  </Text>

                  {/* Active day underline marker */}
                  {isToday ? (
                    <View className="w-5 h-0.5 bg-[#f5b800] rounded-full mt-1.5" />
                  ) : (
                    <View className="w-5 h-0.5 bg-transparent mt-1.5" />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Card 3: Milestone Progress Bar */}
        <View className="p-4 rounded-2xl bg-[#141e17] border border-[#233528] mb-4 shadow-lg">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-base font-sans-bold text-[#faf9f5]">
                {timer.streak}d
              </Text>
              <Text className="text-[10px] font-sans text-[#78a898]">
                Current Streak
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-base font-sans-bold text-[#f5b800]">
                {nextMilestone}d
              </Text>
              <Text className="text-[10px] font-sans text-[#78a898]">
                Next Milestone
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="w-full h-2 bg-[#1f2b23] rounded-full overflow-hidden">
            <View
              className="h-full bg-[#f5b800] rounded-full"
              style={{ width: `${Math.round(milestoneProgress * 100)}%` }}
            />
          </View>
        </View>

        {/* Badges Section */}
        <View className="my-2">
          <BadgesGrid
            badges={badges}
            onSelectBadge={(b) => setSelectedBadge(b)}
          />
        </View>

        {/* Daily Devotional Card */}
        <View className="my-3">
          <DailyDevotionalCard title="Daily Scripture" />
        </View>

        {/* Section: Lifetime Activity */}
        <View className="mt-4 mb-2">
          <Text className="text-xs font-sans-bold text-[#78a898] uppercase tracking-wider mb-3 px-1">
            Lifetime Activity
          </Text>

          <View className="flex-row justify-between">
            {/* Verses Read */}
            <View className="flex-1 mr-2 p-4 rounded-2xl bg-[#141a16] border border-[#202a22] items-center">
              <View className="w-9 h-9 rounded-xl bg-[#1c2921] items-center justify-center mb-2">
                <Zap size={18} color="#f5b800" />
              </View>
              <Text className="text-lg font-sans-bold text-[#faf9f5]">
                {totalVersesRead}
              </Text>
              <Text className="text-[10px] font-sans text-[#78a898] mt-0.5 text-center">
                Verses Read
              </Text>
            </View>

            {/* Time Spent */}
            <View className="flex-1 mx-1 p-4 rounded-2xl bg-[#141a16] border border-[#202a22] items-center">
              <View className="w-9 h-9 rounded-xl bg-[#1c2921] items-center justify-center mb-2">
                <Clock size={18} color="#f5b800" />
              </View>
              <Text className="text-lg font-sans-bold text-[#faf9f5]">
                {impact.minutesRead}m
              </Text>
              <Text className="text-[10px] font-sans text-[#78a898] mt-0.5 text-center">
                Time Spent
              </Text>
            </View>

            {/* Best Streak */}
            <View className="flex-1 ml-2 p-4 rounded-2xl bg-[#141a16] border border-[#202a22] items-center">
              <View className="w-9 h-9 rounded-xl bg-[#1c2921] items-center justify-center mb-2">
                <Award size={18} color="#f5b800" />
              </View>
              <Text className="text-lg font-sans-bold text-[#faf9f5]">
                {Math.max(timer.streak, 1)}d
              </Text>
              <Text className="text-[10px] font-sans text-[#78a898] mt-0.5 text-center">
                Best Streak
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Our Week in Review / Community Impact */}
        <View className="mt-5 p-5 rounded-3xl bg-[#121a15] border border-[#1e2d23] shadow-lg">
          <Text className="text-xs font-sans text-[#78a898] text-center uppercase tracking-widest mb-4">
            Our Week in Review
          </Text>

          <View className="p-4 rounded-2xl bg-[#17221b] border border-[#24372a] mb-3 items-center">
            <Text className="text-2xl font-sans-bold text-[#5db872]">
              145.9M
            </Text>
            <Text className="text-xs font-sans text-[#78a898] mt-0.5">
              Total Verses Read
            </Text>
          </View>

          <View className="p-4 rounded-2xl bg-[#17221b] border border-[#24372a] mb-4 items-center">
            <Text className="text-2xl font-sans-bold text-[#4fa6e8]">
              434.1M minutes
            </Text>
            <Text className="text-xs font-sans text-[#78a898] mt-0.5">
              Time Spent in Scripture
            </Text>
          </View>

          <Text className="text-xs font-sans text-[#78a898] text-center leading-relaxed mb-4 px-2">
            See the impact from disciples worldwide! Keep the momentum alive — share Bible Unlock today.
          </Text>

          <Pressable
            onPress={handleShareApp}
            className="w-full py-3.5 rounded-2xl bg-[#faf9f5] items-center justify-center active:opacity-90 shadow-md flex-row"
          >
            <Share2 size={16} color="#0d120f" style={{ marginRight: 8 }} />
            <Text className="text-sm font-sans-bold text-[#0d120f]">
              Share Bible Unlock
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Badge Detail Modal */}
      <BadgeShareModal
        badge={selectedBadge}
        userName={name}
        streak={timer.streak}
        onClose={() => setSelectedBadge(null)}
      />
    </SafeAreaView>
  );
}
