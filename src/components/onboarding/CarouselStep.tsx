import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { ShieldCheck, BookOpen, Flame, Sparkles, ArrowRight } from 'lucide-react-native';
import { SCROLL_BACKGROUNDS } from '../../../assets/scroll-backgrounds';

interface CarouselStepProps {
  onComplete: () => void;
}

export const CarouselStep: React.FC<CarouselStepProps> = ({ onComplete }) => {
  return (
    <View style={styles.container}>
      {/* Sacred Full-Bleed Background Image */}
      <Image
        source={SCROLL_BACKGROUNDS[0]} // Sunrise Cross
        style={[StyleSheet.absoluteFill, styles.bgImage]}
        resizeMode="cover"
      />

      {/* Smooth Multi-Stop Gradient Overlay for High Contrast & Text Readability */}
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="heroOverlay" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0d1f19" stopOpacity="0.72" />
            <Stop offset="35%" stopColor="#0a1914" stopOpacity="0.82" />
            <Stop offset="70%" stopColor="#081410" stopOpacity="0.92" />
            <Stop offset="100%" stopColor="#06100d" stopOpacity="0.98" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#heroOverlay)" />
      </Svg>

      <View className="flex-1 justify-between px-6 pt-6 pb-6">
        {/* Top Sacred Badge & App Icon */}
        <View className="items-center mt-2">
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              backgroundColor: 'rgba(245, 184, 0, 0.15)',
              borderWidth: 1.5,
              borderColor: '#f5b800',
              shadowColor: '#f5b800',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 6,
              padding: 3,
            }}
          >
            <Image
              source={require('../../../assets/images/icon.png')}
              style={{ width: '100%', height: '100%', borderRadius: 16 }}
              resizeMode="cover"
            />
          </View>

          <View className="flex-row items-center mt-3 px-3 py-1 rounded-full bg-[#f5b800]/15 border border-[#f5b800]/30">
            <Sparkles size={12} color="#f5b800" />
            <Text className="text-[11px] font-sans-bold text-[#f5b800] uppercase tracking-widest ml-1.5">
              Daily Scripture Discipline
            </Text>
          </View>
        </View>

        {/* Center Headline & Subtitle */}
        <View className="items-center px-1">
          <Text
            style={{ fontFamily: 'EBGaramond_700Bold' }}
            className="text-[32px] text-center text-[#faf9f5] leading-[40px] tracking-tight"
          >
            Silence the noise.{'\n'}Meet God in Scripture.
          </Text>

          <Text className="text-sm text-center text-[#9bc4b6] mt-2 px-3 leading-relaxed font-sans">
            Lock distracting apps until you spend your chosen daily time in God's Word.
          </Text>
        </View>

        {/* 3 Authentic Value Pillars (Zero fake stats) */}
        <View className="space-y-2.5 my-2">
          <View className="flex-row items-center p-3 rounded-2xl bg-[#0e2a21]/80 border border-[#215444]/60">
            <View className="w-9 h-9 rounded-xl bg-[#f5b800]/15 items-center justify-center mr-3 border border-[#f5b800]/30">
              <ShieldCheck size={18} color="#f5b800" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-sans-bold text-[#faf9f5]">Shield Distractions</Text>
              <Text className="text-xs text-[#8cb8a8] font-sans">Silence addictive feeds until daily reading is done</Text>
            </View>
          </View>

          <View className="flex-row items-center p-3 rounded-2xl bg-[#0e2a21]/80 border border-[#215444]/60">
            <View className="w-9 h-9 rounded-xl bg-[#f5b800]/15 items-center justify-center mr-3 border border-[#f5b800]/30">
              <BookOpen size={18} color="#f5b800" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-sans-bold text-[#faf9f5]">Nourish Your Spirit</Text>
              <Text className="text-xs text-[#8cb8a8] font-sans">Full offline canonical Bible reader at your pace</Text>
            </View>
          </View>

          <View className="flex-row items-center p-3 rounded-2xl bg-[#0e2a21]/80 border border-[#215444]/60">
            <View className="w-9 h-9 rounded-xl bg-[#f5b800]/15 items-center justify-center mr-3 border border-[#f5b800]/30">
              <Flame size={18} color="#f5b800" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-sans-bold text-[#faf9f5]">Daily Devotional Habit</Text>
              <Text className="text-xs text-[#8cb8a8] font-sans">Build an unbreakable streak of sacred focus</Text>
            </View>
          </View>
        </View>

        {/* Primary Action Button */}
        <View className="pt-2">
          <Pressable
            onPress={onComplete}
            className="w-full py-4.5 rounded-2xl bg-[#f5b800] items-center justify-center active:opacity-90 shadow-lg flex-row"
          >
            <Text className="text-base font-sans-bold text-[#141413] mr-2">
              Begin My Walk with Jesus
            </Text>
            <ArrowRight size={18} color="#141413" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1e18',
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
});
