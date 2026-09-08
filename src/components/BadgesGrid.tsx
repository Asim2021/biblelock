import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BadgeItem } from '../types/onboarding';

interface BadgesGridProps {
  badges: BadgeItem[];
  onSelectBadge: (badge: BadgeItem) => void;
}

export const BadgesGrid: React.FC<BadgesGridProps> = ({ badges, onSelectBadge }) => {
  return (
    <View className="my-4">
      <Text className="text-base font-sans-bold text-[#faf9f5] mb-3 px-1">
        Badges
      </Text>

      <View className="flex-row flex-wrap justify-between">
        {badges.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => onSelectBadge(b)}
            className={`w-[31%] p-3.5 rounded-2xl mb-3 items-center justify-center border ${
              b.unlocked
                ? 'border-[#d4a359] bg-[#22251a]'
                : 'border-[#202721] bg-[#141a16]'
            } active:opacity-80`}
          >
            <Text className="text-3xl mb-2">{b.icon}</Text>
            <Text
              className={`text-xs font-sans-bold text-center mb-1 ${
                b.unlocked ? 'text-[#faf9f5]' : 'text-[#8e8b82]'
              }`}
              numberOfLines={2}
            >
              {b.title}
            </Text>
            <Text
              className="text-[10px] font-sans text-[#5c7a6e] text-center"
              numberOfLines={1}
            >
              {b.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
