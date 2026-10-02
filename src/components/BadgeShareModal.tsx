import React from 'react';
import { View, Text, Pressable, Modal, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Share2 } from 'lucide-react-native';
import { BadgeItem } from '../types/onboarding';
import { useFeatureGate } from '../lib/useFeatureGate';
import { useTheme } from '../lib/themeContext';

interface BadgeShareModalProps {
  badge: BadgeItem | null;
  userName: string;
  streak: number;
  onClose: () => void;
}

export const BadgeShareModal: React.FC<BadgeShareModalProps> = ({
  badge,
  userName,
  streak,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { requirePremium } = useFeatureGate();
  if (!badge) return null;

  const handleShare = async () => {
    if (!requirePremium('Badge sharing')) {
      onClose();
      return;
    }
    try {
      await Share.share({
        message: `✝️ I just earned the "${badge.title}" badge on Bible Unlock with a ${streak}-day reading streak! Replace mindless scrolling with daily Scripture: https://bibleunlock.in`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <Modal visible={!!badge} transparent animationType="slide" onRequestClose={onClose}>
      <View
        className="flex-1 justify-center items-center px-6"
        style={{
          backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)',
          paddingBottom: Math.max(16, insets.bottom + 16),
          paddingTop: Math.max(16, insets.top + 16),
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.45 : 0.15,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Top Badge Icon */}
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.accentBg,
              borderWidth: 2,
              borderColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 44 }}>{badge.icon}</Text>
          </View>

          <Text
            style={{
              fontSize: 22,
              fontFamily: 'EBGaramond_700Bold',
              color: colors.textPrimary,
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            {badge.title}
          </Text>

          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Inter_600SemiBold',
              color: colors.accent,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginBottom: 12,
            }}
          >
            {badge.subtitle}
          </Text>

          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Inter_400Regular',
              color: colors.textSecondary,
              textAlign: 'center',
              paddingHorizontal: 16,
              lineHeight: 18,
              marginBottom: 20,
            }}
          >
            {badge.requirement}
          </Text>

          {/* Social Proof Card */}
          <View
            style={{
              width: '100%',
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.borderSubtle,
              borderWidth: 1,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                {streak} Days
              </Text>
              <Text style={{ fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 }}>
                Current Streak
              </Text>
            </View>
            <View style={{ width: 1, height: 32, backgroundColor: colors.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.accent }}>
                {userName}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 }}>
                Disciple
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <Pressable
            onPress={handleShare}
            style={{
              width: '100%',
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              marginBottom: 10,
            }}
          >
            <Share2 size={18} color={colors.accentText || '#141413'} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.accentText || '#141413' }}>
              Share with Friends
            </Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={{
              width: '100%',
              paddingVertical: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary }}>
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
