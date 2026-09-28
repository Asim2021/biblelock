import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react-native';
import { BadgeItem } from '../types/onboarding';
import { useTheme } from '../lib/themeContext';

interface BadgesGridProps {
  badges: BadgeItem[];
  onSelectBadge: (badge: BadgeItem) => void;
}

export const BadgesGrid: React.FC<BadgesGridProps> = ({ badges, onSelectBadge }) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const displayBadges = expanded || badges.length <= 6 ? badges : badges.slice(0, 6);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <View style={{ marginVertical: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }}>
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'Inter_700Bold',
            color: colors.textPrimary,
          }}
        >
          Spiritual Milestones
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'Inter_600SemiBold',
            color: colors.accent,
          }}
        >
          {unlockedCount}/{badges.length} Unlocked
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {displayBadges.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => onSelectBadge(b)}
            accessibilityRole="button"
            accessibilityLabel={`${b.title}, ${b.subtitle}. ${b.unlocked ? 'Unlocked' : 'Locked'}`}
            style={({ pressed }) => [
              {
                width: '31%',
                padding: 12,
                borderRadius: 16,
                marginBottom: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: b.unlocked ? colors.accent : colors.borderSubtle,
                backgroundColor: b.unlocked ? colors.accentBg : colors.surfaceSubtle,
                opacity: pressed ? 0.75 : b.unlocked ? 1 : 0.65,
                position: 'relative',
              },
            ]}
          >
            {!b.unlocked && (
              <View style={{ position: 'absolute', top: 8, right: 8 }}>
                <Lock size={10} color={colors.textMuted} />
              </View>
            )}
            <Text style={{ fontSize: 26, marginBottom: 6 }}>{b.icon}</Text>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 11,
                fontFamily: 'Inter_700Bold',
                textAlign: 'center',
                marginBottom: 2,
                color: b.unlocked ? colors.textPrimary : colors.textMuted,
              }}
            >
              {b.title}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 9,
                fontFamily: 'Inter_500Medium',
                color: b.unlocked ? colors.accent : colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {b.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Anti-Alienation Disclosure Button */}
      {badges.length > 6 && (
        <Pressable
          onPress={() => setExpanded(!expanded)}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show fewer badges' : 'View all milestones'}
          style={({ pressed }) => [
            {
              paddingVertical: 10,
              paddingHorizontal: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              marginTop: 4,
              borderRadius: 12,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.accent, marginRight: 6 }}>
            {expanded ? 'Show Fewer Milestones' : `View All ${badges.length} Milestones (${unlockedCount} Earned)`}
          </Text>
          {expanded ? (
            <ChevronUp size={14} color={colors.accent} />
          ) : (
            <ChevronDown size={14} color={colors.accent} />
          )}
        </Pressable>
      )}
    </View>
  );
};
