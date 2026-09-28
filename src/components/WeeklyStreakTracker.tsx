import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, Flame, Shield } from 'lucide-react-native';
import { HabitDay } from '../types/onboarding';
import { useTheme } from '../lib/themeContext';
import { getGraceDayStatus } from '../lib/mmkv';

interface WeeklyStreakTrackerProps {
  history: HabitDay[];
  streak?: number;
  isPremium?: boolean;
}

export const WeeklyStreakTracker: React.FC<WeeklyStreakTrackerProps> = ({
  history,
  streak = 0,
  isPremium = false,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const completedCount = history.filter((d) => d.completed).length;
  const { hasGraceDayAvailable } = getGraceDayStatus();

  return (
    <View style={{ marginVertical: 12 }}>
      {/* 7-Day Matrix Container with Consolidated Streak Header */}
      <Pressable
        onPress={() => router.push('/stats-detail' as any)}
        accessibilityRole="button"
        accessibilityLabel="View Full Stats and Badges"
        style={({ pressed }) => ({
          padding: 18,
          borderRadius: 22,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.95 : 1,
        })}
      >
        {/* Header Row: Flame & Streak on Left, Grace & Days Count on Right */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          }}
        >
          {/* Left: Flame & Streak Count */}
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Flame size={20} color="#ff7b42" style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'Inter_700Bold',
                  color: colors.textPrimary,
                }}
              >
                {streak} {streak === 1 ? 'Day' : 'Days'} Streak
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              Keep your spiritual flame burning
            </Text>
          </View>

          {/* Right: Sanctuary Grace Badge & Weekly Progress Link */}
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              {isPremium && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 10,
                    backgroundColor: colors.accentBg,
                    borderWidth: 1,
                    borderColor: colors.accent,
                    marginRight: 6,
                  }}
                >
                  <Shield size={10} color={colors.accent} style={{ marginRight: 3 }} />
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: 'Inter_700Bold',
                      color: colors.accent,
                      letterSpacing: 0.3,
                    }}
                  >
                    {hasGraceDayAvailable ? 'Grace Active' : 'Grace Used'}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_700Bold',
                    color: colors.accent,
                    letterSpacing: 0.5,
                    marginRight: 2,
                  }}
                >
                  {completedCount}/7 days
                </Text>
                <ChevronRight size={13} color={colors.accent} />
              </View>
            </View>

            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Inter_500Medium',
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              This Week
            </Text>
          </View>
        </View>

        {/* 7-Day Matrix Row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {history.map((day) => {
            const isCompleted = day.completed;
            const isToday = day.isToday;

            return (
              <View key={day.date} style={{ alignItems: 'center', flex: 1 }}>
                {/* Day of Week Label */}
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: isToday ? 'Inter_700Bold' : 'Inter_500Medium',
                    color: isToday ? colors.accent : colors.textSecondary,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  {day.dayLabel ? day.dayLabel.slice(0, 3) : ''}
                </Text>

                {/* Status Indicator Circle */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    backgroundColor: isCompleted
                      ? colors.successBg || (isDark ? '#1a4a35' : '#e6f7ee')
                      : isToday
                      ? colors.accentBg
                      : colors.surfaceSubtle,
                    borderColor: isCompleted
                      ? colors.success
                      : isToday
                      ? colors.accent
                      : colors.borderSubtle,
                  }}
                >
                  {isCompleted ? (
                    <Check size={15} color={colors.success} strokeWidth={3} />
                  ) : isToday ? (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.accent,
                      }}
                    />
                  ) : null}
                </View>

                {/* Day of Month Number */}
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: isToday ? 'Inter_700Bold' : 'Inter_400Regular',
                    color: isToday ? colors.accent : colors.textMuted,
                    marginTop: 8,
                  }}
                >
                  {day.dayNumber}
                </Text>
              </View>
            );
          })}
        </View>
      </Pressable>
    </View>
  );
};
