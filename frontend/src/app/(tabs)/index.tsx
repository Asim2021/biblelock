import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useReadingTimer } from '../../lib/readingTimer';
import { AppBlocker } from '../../lib/appBlocker';
import { getDailyVerse } from '../../lib/bible';
import { getBibleTranslation } from '../../lib/mmkv';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ProgressRing } from '../../components/ProgressRing';
import { ShieldBadge } from '../../components/ShieldBadge';

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isShielded, setIsShielded] = useState(true);

  // Track progress (timer not actively ticking on home screen, just reading state)
  const timer = useReadingTimer(false);

  // Load Daily Scripture
  const translation = getBibleTranslation();
  const dailyVerse = getDailyVerse(translation);

  useEffect(() => {
    AppBlocker.getStatus().then((st) => {
      setIsShielded(st.isShielded);
    });
  }, [timer.isGoalMet]);

  const onRefresh = async () => {
    setRefreshing(true);
    const st = await AppBlocker.getStatus();
    setIsShielded(st.isShielded);
    setRefreshing(false);
  };

  const handleToggleShield = async () => {
    if (isShielded) {
      await AppBlocker.unshieldApps();
      setIsShielded(false);
      Alert.alert('Shield Deactivated', 'Distracting apps are temporarily unshielded.');
    } else {
      await AppBlocker.shieldApps();
      setIsShielded(true);
      Alert.alert('Shield Active', 'Distracting apps are locked until reading goal is met.');
    }
  };

  const displayName = profile?.display_name || user?.user_metadata?.full_name || 'Disciple';

  return (
    <SafeAreaView className="flex-1 bg-surface-dark">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 36 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#cc785c"
          />
        }
      >
        {/* Top Header */}
        <View className="flex-row items-center justify-between pt-4 pb-2">
          <View>
            <Text className="text-xs font-sans-medium text-on-dark-soft uppercase tracking-wider">
              Welcome back
            </Text>
            <Text className="text-xl font-sans-bold text-on-dark">
              {displayName}
            </Text>
          </View>
          <ShieldBadge isShielded={isShielded} onPress={handleToggleShield} />
        </View>

        {/* Hero Progress Ring Card */}
        <Card variant="dark" className="items-center py-7 my-4 border border-surface-dark-elevated">
          <ProgressRing
            progress={timer.progress}
            timeText={timer.formattedTime}
            goalText={`Goal: ${timer.goalMinutes}m`}
            isGoalMet={timer.isGoalMet}
            size={230}
            strokeWidth={14}
          />

          <Text className="text-sm font-sans text-on-dark-soft text-center mt-5 mb-5 px-6 leading-relaxed">
            {timer.isGoalMet
              ? '🎉 Excellent! You have completed your Bible reading for today. Your apps are unlocked.'
              : `${Math.max(0, timer.goalMinutes - Math.floor(timer.secondsRead / 60))} minutes left to unshield your social apps.`}
          </Text>

          <Button
            title={timer.isGoalMet ? 'Continue Reading' : 'Start Reading Now'}
            variant="primary"
            size="lg"
            className="w-11/12 shadow-sm"
            onPress={() => router.push('/reader' as any)}
          />
        </Card>

        {/* Stats Row */}
        <View className="flex-row justify-between mb-4">
          <Card variant="dark" className="flex-1 mr-2 p-4 items-center">
            <Text className="text-2xl mb-1">🔥</Text>
            <Text className="text-xl font-sans-bold text-on-dark">
              {timer.streak} {timer.streak === 1 ? 'Day' : 'Days'}
            </Text>
            <Text className="text-xs font-sans text-on-dark-soft mt-0.5">
              Current Streak
            </Text>
          </Card>

          <Card variant="dark" className="flex-1 mx-1 p-4 items-center">
            <Text className="text-2xl mb-1">⏱️</Text>
            <Text className="text-xl font-sans-bold text-on-dark">
              {Math.floor(timer.secondsRead / 60)}m
            </Text>
            <Text className="text-xs font-sans text-on-dark-soft mt-0.5">
              Read Today
            </Text>
          </Card>

          <Card variant="dark" className="flex-1 ml-2 p-4 items-center">
            <Text className="text-2xl mb-1">🎯</Text>
            <Text className="text-xl font-sans-bold text-on-dark">
              {timer.goalMinutes}m
            </Text>
            <Text className="text-xs font-sans text-on-dark-soft mt-0.5">
              Daily Target
            </Text>
          </Card>
        </View>

        {/* Daily Scripture Card */}
        <Card variant="dark" className="p-5 mb-4 border border-hairline/20">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Text className="text-lg mr-2">✝️</Text>
              <Text className="text-xs font-sans-semibold uppercase tracking-wider text-accent-amber">
                Daily Verse
              </Text>
            </View>
            <Text className="text-xs font-mono text-on-dark-soft">
              {translation}
            </Text>
          </View>

          <Text
            className="text-lg text-on-dark leading-relaxed mb-3 italic"
            style={{ fontFamily: 'EBGaramond_400Regular_Italic' }}
          >
            "{dailyVerse.text}"
          </Text>

          <View className="flex-row items-center justify-between pt-2 border-t border-hairline/10">
            <Text className="text-sm font-sans-semibold text-primary">
              {dailyVerse.bookName} {dailyVerse.chapter}:{dailyVerse.verseNum}
            </Text>
            <Button
              title="Read Chapter →"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/reader' as any)}
            />
          </View>
        </Card>

        {/* Shield Status Summary Card */}
        <Card variant="dark" className="p-5 mb-6 border border-hairline/10">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-sans-bold text-on-dark">
              Distraction Guard
            </Text>
            <Text className="text-xs font-sans-medium text-on-dark-soft">
              5 Presets Active
            </Text>
          </View>

          <Text className="text-xs text-on-dark-soft leading-relaxed mb-4">
            Instagram, TikTok, YouTube, X, and Reddit are monitored. Fulfill your daily spiritual habit to earn unrestricted access.
          </Text>

          <Button
            title={isShielded ? 'Unlock Manually (Dev Override)' : 'Activate App Shield'}
            variant="outline"
            size="sm"
            onPress={handleToggleShield}
            textClassName="text-xs"
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
