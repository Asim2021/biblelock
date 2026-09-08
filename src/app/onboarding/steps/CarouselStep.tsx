import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

interface CarouselStepProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    prefix: 'Social media\naddiction is taking\nyou away from\n',
    highlight: 'God.',
    highlightColor: '#f5b800',
  },
  {
    prefix: 'Bible Unlock can\nhelp you get back\non your\n',
    highlight: 'spiritual\njourney!',
    highlightColor: '#f5b800',
  },
  {
    intro: "It's simple.",
    body: 'Once a day, you read Bible to unlock your apps.',
  },
];

export const CarouselStep: React.FC<CarouselStepProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View className="flex-1 justify-between px-7 py-8 bg-[#0d1e18]">
      {/* Top Progress Bar (3 segments) */}
      <View className="flex-row space-x-2 pt-6 mb-12">
        {[0, 1, 2].map((idx) => (
          <View
            key={idx}
            className={`flex-1 h-1 rounded-full mr-2 ${
              idx <= currentIndex ? 'bg-[#f5b800]' : 'bg-[#1b3d32]'
            }`}
          />
        ))}
      </View>

      {/* Main Slide Content */}
      <View className="flex-1 justify-center pb-16">
        {currentIndex === 0 && (
          <Text
            className="text-4xl font-serif-semibold text-[#faf9f5] leading-[50px] tracking-tight"
            style={{ fontFamily: 'EBGaramond_600SemiBold' }}
          >
            Social media{'\n'}addiction is taking{'\n'}you away from{' '}
            <Text className="text-[#f5b800]">God.</Text>
          </Text>
        )}

        {currentIndex === 1 && (
          <Text
            className="text-4xl font-serif-semibold text-[#faf9f5] leading-[50px] tracking-tight"
            style={{ fontFamily: 'EBGaramond_600SemiBold' }}
          >
            Bible Unlock can{'\n'}help you get back{'\n'}on your{' '}
            <Text className="text-[#f5b800]">
              spiritual{'\n'}journey!
            </Text>
          </Text>
        )}

        {currentIndex === 2 && (
          <View>
            <Text
              className="text-4xl font-serif-semibold text-[#faf9f5] leading-[52px] tracking-tight mb-4"
              style={{ fontFamily: 'EBGaramond_600SemiBold' }}
            >
              It's <Text className="text-[#f5b800]">simple.</Text>
            </Text>
            <Text
              className="text-4xl font-serif-semibold text-[#faf9f5] leading-[52px] tracking-tight"
              style={{ fontFamily: 'EBGaramond_600SemiBold' }}
            >
              Once a day, you read Scripture to unlock your apps.
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Actions */}
      <View className="items-end pb-4">
        {currentIndex < 2 ? (
          <Pressable
            onPress={handleNext}
            className="w-16 h-16 rounded-2xl bg-[#1b3e32] items-center justify-center active:opacity-80"
          >
            <Text className="text-2xl text-[#f5b800] font-bold">→</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            className="w-full py-4 rounded-2xl bg-[#235846] border border-[#2f755e] active:opacity-90 items-center justify-center shadow-lg"
          >
            <Text className="text-base font-sans-bold text-[#f5b800]">
              Get Started
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
