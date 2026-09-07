import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { HabitDay } from '../types/onboarding';

interface Last30DaysTrackerProps {
  history: HabitDay[];
}

export const Last30DaysTracker: React.FC<Last30DaysTrackerProps> = ({ history }) => {
  const completedCount = history.filter((d) => d.completed).length;

  return (
    <View className="my-3">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3 px-1">
        <Text className="text-base font-sans-bold text-[#faf9f5]">
          Last 30 Days
        </Text>
        <Text className="text-xs font-sans-bold text-[#f5b800]">
          {completedCount}/30 days
        </Text>
      </View>

      {/* Horizontal Day Badges */}
      <View className="p-4 rounded-3xl bg-[#141a16] border border-[#232f27]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {history.map((day) => {
            return (
              <View key={day.date} className="items-center mx-2.5">
                <Text className="text-[11px] font-sans text-[#78a898] mb-2">
                  {day.dayLabel}
                </Text>

                <View
                  className={`w-11 h-11 rounded-full items-center justify-center border-2 ${
                    day.completed
                      ? 'border-[#5db872] bg-[#1a4a35]'
                      : day.isToday
                      ? 'border-[#f5b800] bg-[#22251a]'
                      : 'border-[#2d3b32] bg-[#17201a]'
                  }`}
                >
                  {day.completed ? (
                    <Check size={16} color="#5db872" strokeWidth={3} />
                  ) : day.isToday ? (
                    <View className="w-2.5 h-2.5 rounded-full bg-[#f5b800]" />
                  ) : null}
                </View>

                <Text
                  className={`text-[11px] font-sans mt-2 ${
                    day.isToday ? 'font-sans-bold text-[#f5b800]' : 'text-[#8e8b82]'
                  }`}
                >
                  {day.dayNumber}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <Text className="text-[10px] font-sans text-[#5c7a6e] text-center mt-3">
          Scroll right to see older days →
        </Text>
      </View>
    </View>
  );
};
