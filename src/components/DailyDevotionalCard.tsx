import React, { useState } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Share2, ExternalLink, RotateCcw } from 'lucide-react-native';
import { getBibleTranslation } from '../lib/mmkv';
import { getDailyVerse, getRandomVerse, DailyVerseItem } from '../lib/bible';

interface DailyDevotionalCardProps {
  title?: string;
  showSubtitle?: boolean;
}

export function DailyDevotionalCard({
  title = 'Daily Devotional',
  showSubtitle = true,
}: DailyDevotionalCardProps) {
  const router = useRouter();
  const translation = getBibleTranslation();
  const [verse, setVerse] = useState<DailyVerseItem>(() => getDailyVerse(translation));
  const [isRotating, setIsRotating] = useState(false);

  const handleRefresh = () => {
    setIsRotating(true);
    const next = getRandomVerse(translation, verse.index);
    setVerse(next);
    setTimeout(() => setIsRotating(false), 300);
  };

  const handleGoto = () => {
    router.push({
      pathname: '/reader',
      params: {
        book: verse.bookName,
        chapter: verse.chapter.toString(),
        verse: verse.verseNum.toString(),
      },
    } as any);
  };

  const handleShare = async () => {
    try {
      const shareMessage = `"${verse.text}"\n\n— ${verse.bookName} ${verse.chapter}:${verse.verseNum} (${translation})\n\nBuild your daily habit with Bible Unlock:\nhttps://bibleunlock.app`;
      await Share.share({
        message: shareMessage,
        title: `${verse.bookName} ${verse.chapter}:${verse.verseNum}`,
      });
    } catch {
      // Ignored if dismissed
    }
  };

  return (
    <View className="p-5 rounded-3xl bg-[#141b17] border border-[#202e25]">
      {/* Top Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Sparkles size={15} color="#d4a359" style={{ marginRight: 6 }} />
          <Text className="text-xs font-sans-bold text-[#d4a359] uppercase tracking-wider">
            {title}
          </Text>
        </View>
        <Text className="text-[11px] font-sans text-[#5c7a6e]">
          {translation}
        </Text>
      </View>

      {showSubtitle && (
        <Text className="text-xs font-sans text-[#78a898] mb-3">
          Build steady spiritual consistency with God's Word
        </Text>
      )}

      {/* Scripture Verse Text */}
      <Text
        className="text-base text-[#faf9f5] leading-relaxed mb-4 italic"
        style={{ fontFamily: 'EBGaramond_400Regular_Italic' }}
      >
        "{verse.text}"
      </Text>

      {/* Bottom Row: Citation & 3 Action Buttons */}
      <View className="flex-row items-center justify-between pt-2 border-t border-[#202e25]">
        <Pressable onPress={handleGoto} className="active:opacity-80">
          <Text className="text-xs font-sans-bold text-[#f5b800]">
            {verse.bookName} {verse.chapter}:{verse.verseNum}
          </Text>
        </Pressable>

        <View className="flex-row items-center space-x-2">
          {/* Share Button */}
          <Pressable
            onPress={handleShare}
            accessibilityLabel="Share Verse"
            className="w-9 h-9 rounded-xl bg-[#1a261f] border border-[#273d30] items-center justify-center active:opacity-75"
          >
            <Share2 size={15} color="#a3c4b6" />
          </Pressable>

          {/* Goto Verse Button */}
          <Pressable
            onPress={handleGoto}
            accessibilityLabel="Go to Verse"
            className="w-9 h-9 rounded-xl bg-[#1a261f] border border-[#273d30] items-center justify-center active:opacity-75 ml-2"
          >
            <ExternalLink size={15} color="#a3c4b6" />
          </Pressable>

          {/* Refresh Random Verse Button */}
          <Pressable
            onPress={handleRefresh}
            accessibilityLabel="Refresh Verse"
            className="w-9 h-9 rounded-xl bg-[#1a261f] border border-[#273d30] items-center justify-center active:opacity-75 ml-2"
          >
            <RotateCcw
              size={15}
              color={isRotating ? '#f5b800' : '#a3c4b6'}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
