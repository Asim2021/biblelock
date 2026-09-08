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
import { useTheme } from '../../lib/themeContext';

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { colors, isDark } = useTheme();

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
          <Text
            style={{
              fontSize: 24,
              fontFamily: 'EBGaramond_700Bold',
              color: colors.textPrimary,
            }}
          >
            Stats
          </Text>

          <Pressable
            onPress={onRefresh}
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
            <RotateCw size={17} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* User Profile Row */}
        <View className="flex-row items-center my-3">
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.accent }}>
              {getInitials(name)}
            </Text>
          </View>
          <View className="flex-1">
            <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
              {name}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Spiritual Walk Tracker
            </Text>
          </View>
        </View>

        {/* Section Header: Bible Reading */}
        <View className="flex-row items-center justify-between mt-4 mb-2">
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Inter_700Bold',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Bible Reading
          </Text>
          <MoreHorizontal size={16} color={colors.textMuted} />
        </View>

        {/* Card 1: Read Today & Streak with Circular Gauge */}
        <View
          style={{
            padding: 20,
            borderRadius: 24,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View className="flex-1 pr-3">
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
              Read Today
            </Text>
            <View className="flex-row items-baseline mb-3">
              <Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                {minutesToday} min{' '}
              </Text>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>
                /{timer.goalMinutes} min
              </Text>
            </View>

            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
              Current Streak
            </Text>
            <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
              {timer.streak} {timer.streak === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {/* Circular Gauge */}
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 4,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                backgroundColor: timer.isGoalMet ? (isDark ? '#293d25' : '#edf8f0') : colors.surfaceSubtle,
                borderColor: timer.isGoalMet ? colors.success : colors.accent,
              }}
            >
              <Zap
                size={24}
                color={timer.isGoalMet ? colors.success : colors.accent}
                fill={timer.isGoalMet ? colors.success : colors.accent}
              />
            </View>
          </View>
        </View>

        {/* Card 2: This Week 7-Day Tracker */}
        <View
          style={{
            padding: 20,
            borderRadius: 24,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
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
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      marginBottom: 6,
                      backgroundColor: isToday
                        ? colors.accentBg
                        : isPastOrToday
                        ? colors.surfaceSubtle
                        : colors.surface,
                      borderColor: isToday
                        ? colors.accent
                        : isPastOrToday
                        ? colors.border
                        : colors.borderSubtle,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Inter_700Bold',
                        color: isToday
                          ? colors.accent
                          : isPastOrToday
                          ? colors.textPrimary
                          : colors.textMuted,
                      }}
                    >
                      {wd.label}
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

                  {/* Active day underline marker */}
                  {isToday ? (
                    <View style={{ width: 20, height: 2, backgroundColor: colors.accent, borderRadius: 1, marginTop: 6 }} />
                  ) : (
                    <View style={{ width: 20, height: 2, backgroundColor: 'transparent', marginTop: 6 }} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Card 3: Milestone Progress Bar */}
        <View
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 16,
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                {timer.streak}d
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                Current Streak
              </Text>
            </View>

            <View className="items-end">
              <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.accent }}>
                {nextMilestone}d
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                Next Milestone
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View
            style={{
              width: '100%',
              height: 8,
              backgroundColor: colors.surfaceSubtle,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                backgroundColor: colors.accent,
                borderRadius: 4,
                width: `${Math.round(milestoneProgress * 100)}%`,
              }}
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
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Inter_700Bold',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 12,
              paddingHorizontal: 4,
            }}
          >
            Lifetime Activity
          </Text>

          <View className="flex-row justify-between">
            {/* Verses Read */}
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
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Zap size={18} color={colors.accent} />
              </View>
              <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                {totalVersesRead}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
                Verses Read
              </Text>
            </View>

            {/* Time Spent */}
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
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Clock size={18} color={colors.accent} />
              </View>
              <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                {impact.minutesRead}m
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
                Time Spent
              </Text>
            </View>

            {/* Best Streak */}
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
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Award size={18} color={colors.accent} />
              </View>
              <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                {Math.max(timer.streak, 1)}d
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
                Best Streak
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Our Week in Review / Community Impact */}
        <View
          style={{
            marginTop: 20,
            padding: 20,
            borderRadius: 24,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Inter_500Medium',
              color: colors.textSecondary,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 16,
            }}
          >
            Our Week in Review
          </Text>

          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.success }}>
              145.9M
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              Total Verses Read
            </Text>
          </View>

          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color: '#4fa6e8' }}>
              434.1M minutes
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              Time Spent in Scripture
            </Text>
          </View>

          <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 16, paddingHorizontal: 8 }}>
            See the impact from disciples worldwide! Keep the momentum alive — share Bible Unlock today.
          </Text>

          <Pressable
            onPress={handleShareApp}
            style={{
              width: '100%',
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Share2 size={16} color="#141413" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: '#141413' }}>
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
