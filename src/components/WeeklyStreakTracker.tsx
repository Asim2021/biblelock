import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import { HabitDay } from '../types/onboarding';
import { useTheme } from '../lib/themeContext';

interface WeeklyStreakTrackerProps {
  history: HabitDay[];
}

export const WeeklyStreakTracker: React.FC<WeeklyStreakTrackerProps> = ({ history }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const completedCount = history.filter((d) => d.completed).length;

  return (
    <View style={{ marginVertical: 12 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          paddingHorizontal: 4,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'EBGaramond_700Bold',
            color: colors.textPrimary,
          }}
        >
          This Week
        </Text>
        <Pressable
          onPress={() => router.push('/stats-detail' as any)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="View Weekly Streak Details and Badges"
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
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
        </Pressable>
      </View>

      {/* 7-Day Matrix Container */}
      <Pressable
        onPress={() => router.push('/stats-detail' as any)}
        accessibilityRole="button"
        accessibilityLabel="View Full Stats and Badges"
        style={({ pressed }) => ({
          paddingVertical: 16,
          paddingHorizontal: 12,
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        })}
      >
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
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    backgroundColor: isCompleted
                      ? colors.successBg || '#1a4a35'
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
                    <Check size={16} color={colors.success} strokeWidth={3} />
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
