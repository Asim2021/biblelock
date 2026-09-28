import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BadgeItem } from '../types/onboarding';
import { useTheme } from '../lib/themeContext';

interface BadgesGridProps {
  badges: BadgeItem[];
  onSelectBadge: (badge: BadgeItem) => void;
}

export const BadgesGrid: React.FC<BadgesGridProps> = ({ badges, onSelectBadge }) => {
  const { colors } = useTheme();

  return (
    <View style={{ marginVertical: 16 }}>
      <Text
        style={{
          fontSize: 16,
          fontFamily: 'Inter_700Bold',
          color: colors.textPrimary,
          marginBottom: 12,
          paddingHorizontal: 4,
        }}
      >
        Badges
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {badges.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => onSelectBadge(b)}
            style={({ pressed }) => [
              {
                width: '31%',
                padding: 14,
                borderRadius: 16,
                marginBottom: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: b.unlocked ? colors.accent : colors.border,
                backgroundColor: b.unlocked ? colors.accentBg : colors.surfaceSubtle,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>{b.icon}</Text>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 12,
                fontFamily: 'Inter_700Bold',
                textAlign: 'center',
                marginBottom: 4,
                color: b.unlocked ? colors.textPrimary : colors.textMuted,
              }}
            >
              {b.title}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 10,
                fontFamily: 'Inter_400Regular',
                color: colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {b.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
