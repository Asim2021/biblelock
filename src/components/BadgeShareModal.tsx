import React from 'react';
import { View, Text, Pressable, Modal, Share, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Share2 } from 'lucide-react-native';
import { BadgeItem } from '../types/onboarding';

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
  if (!badge) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `✝️ I just earned the "${badge.title}" badge on Bible Unlock with a ${streak}-day reading streak! Replace mindless scrolling with daily Scripture: https://bibleunlock.app`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <Modal visible={!!badge} transparent animationType="slide">
      <View
        className="flex-1 bg-black/85 justify-center items-center px-6"
        style={{ paddingBottom: Math.max(16, insets.bottom + 16), paddingTop: Math.max(16, insets.top + 16) }}
      >
        <View className="w-full bg-[#141e18] border border-[#2b4434] rounded-3xl p-6 shadow-2xl items-center">
          {/* Top Badge Icon */}
          <View className="w-24 h-24 rounded-full bg-[#203126] border-2 border-[#f5b800] items-center justify-center mb-4 shadow-lg">
            <Text className="text-5xl">{badge.icon}</Text>
          </View>

          <Text
            className="text-2xl font-serif-bold text-[#faf9f5] text-center mb-1"
            style={{ fontFamily: 'EBGaramond_700Bold' }}
          >
            {badge.title}
          </Text>

          <Text className="text-xs font-sans text-[#f5b800] uppercase tracking-widest mb-3">
            {badge.subtitle}
          </Text>

          <Text className="text-sm font-sans text-[#aee2d1] text-center px-4 leading-relaxed mb-6">
            {badge.requirement}
          </Text>

          {/* Social Proof Card */}
          <View className="w-full p-4 rounded-2xl bg-[#1a2920] border border-[#2a4735] mb-6 flex-row items-center justify-around">
            <View className="items-center">
              <Text className="text-xl font-sans-bold text-[#faf9f5]">
                {streak} Days
              </Text>
              <Text className="text-[10px] font-sans text-[#78a898]">
                Current Streak
              </Text>
            </View>
            <View className="w-[1px] h-8 bg-[#2a4735]" />
            <View className="items-center">
              <Text className="text-xl font-sans-bold text-[#f5b800]">
                {userName}
              </Text>
              <Text className="text-[10px] font-sans text-[#78a898]">
                Disciple
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <Pressable
            onPress={handleShare}
            className="w-full py-4 rounded-2xl bg-[#f5b800] items-center justify-center active:opacity-90 shadow-lg mb-3 flex-row"
          >
            <Share2 size={18} color="#141413" style={{ marginRight: 8 }} />
            <Text className="text-base font-sans-bold text-[#141413]">
              Share with Friends
            </Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            className="w-full py-2.5 items-center justify-center"
          >
            <Text className="text-xs font-sans-medium text-[#78a898]">
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
