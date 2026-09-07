import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Lock,
  Shield,
  Sun,
  Flame,
  Rocket,
} from 'lucide-react-native';

interface PaywallStepProps {
  onBack: () => void;
  onNext: () => void;
}

const PRO_FEATURES = [
  { Icon: Lock, text: 'Unlimited App Blocking' },
  { Icon: Shield, text: 'Strict Devotional Mode' },
  { Icon: Sparkles, text: 'Premium Audio & Scripture Commentary' },
  { Icon: Sun, text: 'Morning & Evening Watch Targets' },
  { Icon: Flame, text: 'Pause Streak (Streak Freeze Protection)' },
  { Icon: Rocket, text: 'And much more...' },
];

export const PaywallStep: React.FC<PaywallStepProps> = ({ onBack, onNext }) => {
  const router = useRouter();

  const handleTryPro = () => {
    // Open paywall modal or continue to next step with pro intention
    router.push('/paywall' as any);
    onNext();
  };

  return (
    <View className="flex-1 justify-between px-6 py-6 bg-[#0d2e24]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}>
        {/* Top 5-segment Progress Bar */}
        <View className="flex-row space-x-1.5 pt-4 mb-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <View
              key={idx}
              className={`flex-1 h-1 rounded-full mr-1.5 ${
                idx <= 4 ? 'bg-[#f5b800]' : 'bg-[#1b4a3c]'
              }`}
            />
          ))}
        </View>

        <Text className="text-xs font-sans-bold text-[#f5b800] mb-3">
          4 of 5
        </Text>

        <View className="items-center my-4">
          <View className="w-14 h-14 rounded-full bg-[#f5b800]/15 border border-[#f5b800]/30 items-center justify-center mb-3">
            <Sparkles size={28} color="#f5b800" strokeWidth={2} />
          </View>
          <Text
            className="text-3xl font-serif-bold text-[#faf9f5] text-center mb-2 tracking-tight"
            style={{ fontFamily: 'EBGaramond_700Bold' }}
          >
            Start your journey with full focus
          </Text>
          <Text className="text-sm font-sans text-[#78a898] text-center px-4 leading-relaxed">
            Join thousands who found peace and purpose with Bible Unlock Pro
          </Text>
        </View>

        {/* Feature List Card */}
        <View className="p-6 rounded-3xl bg-[#143e32] border border-[#265e4d] my-4 space-y-4">
          {PRO_FEATURES.map((item, idx) => {
            const IconComp = item.Icon;
            return (
              <View key={idx} className="flex-row items-center mb-3.5">
                <View className="w-8 h-8 rounded-lg bg-[#1a4a3c] items-center justify-center mr-3.5">
                  <IconComp size={16} color="#f5b800" strokeWidth={2} />
                </View>
                <Text className="text-sm font-sans-medium text-[#faf9f5] flex-1">
                  {item.text}
                </Text>
              </View>
            );
          })}
        </View>

        {/* CTAs */}
        <View className="space-y-3 mt-4">
          <Pressable
            onPress={handleTryPro}
            className="w-full py-4 rounded-2xl bg-[#f5b800] items-center justify-center active:opacity-90 shadow-lg mb-3"
          >
            <Text className="text-base font-sans-bold text-[#141413]">
              Try Bible Unlock Pro for Free
            </Text>
          </Pressable>

          <Pressable
            onPress={onNext}
            className="w-full py-4 rounded-2xl bg-[#163f33] border border-[#2b6955] items-center justify-center active:opacity-80"
          >
            <Text className="text-sm font-sans-semibold text-[#8eb8a8]">
              Continue with Limited Version
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Back Button */}
      <View className="pt-2">
        <Pressable
          onPress={onBack}
          className="w-full py-3.5 rounded-2xl bg-[#13382d] items-center justify-center active:opacity-80"
        >
          <Text className="text-sm font-sans-bold text-[#78a898]">Back</Text>
        </Pressable>
      </View>
    </View>
  );
};
