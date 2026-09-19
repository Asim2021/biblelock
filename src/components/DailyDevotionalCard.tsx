import React, { useState } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Share2, ExternalLink, RotateCcw } from 'lucide-react-native';
import { getDailyVerse, getRandomVerse, resolveVerseItem, useBibleTranslation } from '../lib/bible';
import { useTheme } from '../lib/themeContext';

interface DailyDevotionalCardProps {
  title?: string;
  showSubtitle?: boolean;
}

export function DailyDevotionalCard({
  title = 'Daily Devotional',
  showSubtitle = true,
}: DailyDevotionalCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const [translation, setTranslation] = useBibleTranslation();
  const [verseIndex, setVerseIndex] = useState<number>(() => getDailyVerse(translation).index);
  const [isRotating, setIsRotating] = useState(false);

  const verse = resolveVerseItem(translation, verseIndex);

  const handleRefresh = () => {
    setIsRotating(true);
    const next = getRandomVerse(translation, verseIndex);
    setVerseIndex(next.index);
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
    <View
      style={{
        padding: 20,
        borderRadius: 24,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Top Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Sparkles size={15} color={colors.accent} style={{ marginRight: 6 }} />
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Inter_700Bold',
              color: colors.accent,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {title}
          </Text>
        </View>

        {/* Translation Toggle Pill */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surfaceSubtle,
            borderRadius: 8,
            padding: 2,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => setTranslation('WEB')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Switch to WEB translation"
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              backgroundColor: translation === 'WEB' ? colors.accent : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter_700Bold',
                color: translation === 'WEB' ? '#141413' : colors.textSecondary,
              }}
            >
              WEB
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTranslation('KJV')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Switch to KJV translation"
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              backgroundColor: translation === 'KJV' ? colors.accent : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter_700Bold',
                color: translation === 'KJV' ? '#141413' : colors.textSecondary,
              }}
            >
              KJV
            </Text>
          </Pressable>
        </View>
      </View>

      {showSubtitle && (
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
          Build steady spiritual consistency with God's Word
        </Text>
      )}

      {/* Scripture Verse Text */}
      <Text
        style={{
          fontFamily: 'EBGaramond_400Regular_Italic',
          fontSize: 16,
          color: colors.textPrimary,
          lineHeight: 24,
          marginBottom: 16,
          fontStyle: 'italic',
        }}
      >
        "{verse.text}"
      </Text>

      {/* Bottom Row: Citation & 3 Action Buttons */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}
      >
        <Pressable onPress={handleGoto} className="active:opacity-80">
          <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.accent }}>
            {verse.bookName} {verse.chapter}:{verse.verseNum}
          </Text>
        </Pressable>

        <View className="flex-row items-center">
          {/* Share Button */}
          <Pressable
            onPress={handleShare}
            accessibilityLabel="Share Verse"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Share2 size={15} color={colors.textSecondary} />
          </Pressable>

          {/* Goto Verse Button */}
          <Pressable
            onPress={handleGoto}
            accessibilityLabel="Go to Verse"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}
          >
            <ExternalLink size={15} color={colors.textSecondary} />
          </Pressable>

          {/* Refresh Random Verse Button */}
          <Pressable
            onPress={handleRefresh}
            accessibilityLabel="Refresh Verse"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}
          >
            <RotateCcw
              size={15}
              color={isRotating ? colors.accent : colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
