import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Share2, ExternalLink, RotateCcw, BookOpen } from 'lucide-react-native';
import { getDailyVerse, getRandomVerse, resolveVerseItem, useBibleTranslation } from '../lib/bible';
import { getTimeOfDayPrayer, getRandomPrayer, PrayerItem } from '../lib/prayers';
import { getDevotionalReflection } from '../data/devotionalReflections';
import { PrayerMeditationModal } from './PrayerMeditationModal';
import { useTheme } from '../lib/themeContext';
import { usePurchases } from '../lib/purchases';

interface DailyDevotionalCardProps {
  title?: string;
  showSubtitle?: boolean;
}

export function DailyDevotionalCard({
  title = 'Daily Devotional',
  showSubtitle = true,
}: DailyDevotionalCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isPremium } = usePurchases();
  const [translation] = useBibleTranslation();

  const [mode, setMode] = useState<'scripture' | 'prayer'>('scripture');
  const [verseIndex, setVerseIndex] = useState<number>(() => getDailyVerse(translation).index);
  const [isRotating, setIsRotating] = useState(false);

  // Prayer state
  const [prayer, setPrayer] = useState<PrayerItem>(() => getTimeOfDayPrayer());
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);

  const verse = useMemo(() => resolveVerseItem(translation, verseIndex), [translation, verseIndex]);
  const devotional = useMemo(() => getDevotionalReflection(verseIndex), [verseIndex]);

  const handleRefreshVerse = () => {
    setIsRotating(true);
    const next = getRandomVerse(translation, verseIndex);
    setVerseIndex(next.index);
    setTimeout(() => setIsRotating(false), 300);
  };

  const handleRefreshPrayer = () => {
    setIsRotating(true);
    const next = getRandomPrayer(prayer.id, !isPremium);
    setPrayer(next);
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

  const handleShareVerse = async () => {
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

  const handleSharePrayer = async () => {
    try {
      const shareMessage = `"${prayer.title}"\n\n${prayer.prayerText}\n\nPrayed with Bible Unlock:\nhttps://bibleunlock.app`;
      await Share.share({
        message: shareMessage,
        title: prayer.title,
      });
    } catch {
      // Ignored if dismissed
    }
  };

  const getPrayerBadge = () => {
    if (prayer.timeOfDay === 'morning') return '🌅 MORNING PRAYER';
    if (prayer.timeOfDay === 'afternoon') return '☀️ AFTERNOON PRAYER';
    if (prayer.timeOfDay === 'evening') return '🌙 EVENING PRAYER';
    if (prayer.category === 'daily') return '🌿 DAILY RHYTHM';
    if (prayer.category === 'foundations') return '✝️ FOUNDATIONS';
    return '🕊️ SACRED PRAYER';
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
      {/* Mode Switcher Segmented Control */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surfaceSubtle,
          padding: 3,
          borderRadius: 14,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <Pressable
          onPress={() => setMode('scripture')}
          accessibilityRole="tab"
          accessibilityLabel="Daily Scripture"
          style={{
            flex: 1,
            paddingVertical: 7,
            borderRadius: 11,
            backgroundColor: mode === 'scripture' ? colors.surface : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: mode === 'scripture' ? 1 : 0,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: mode === 'scripture' ? 'Inter_700Bold' : 'Inter_500Medium',
              color: mode === 'scripture' ? colors.accent : colors.textSecondary,
              letterSpacing: 0.3,
            }}
          >
            📖 Daily Scripture
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode('prayer')}
          accessibilityRole="tab"
          accessibilityLabel="Daily Prayer"
          style={{
            flex: 1,
            paddingVertical: 7,
            borderRadius: 11,
            backgroundColor: mode === 'prayer' ? colors.surface : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: mode === 'prayer' ? 1 : 0,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: mode === 'prayer' ? 'Inter_700Bold' : 'Inter_500Medium',
              color: mode === 'prayer' ? colors.accent : colors.textSecondary,
              letterSpacing: 0.3,
            }}
          >
            🙏 Daily Prayer
          </Text>
        </Pressable>
      </View>

      {mode === 'scripture' ? (
        /* SCRIPTURE MODE */
        <View>
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Sparkles size={14} color={colors.accent} style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Inter_700Bold',
                  color: colors.accent,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {title}
              </Text>
            </View>

            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Inter_700Bold',
                  color: colors.accent,
                  letterSpacing: 0.5,
                }}
              >
                {translation}
              </Text>
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
              marginBottom: 14,
              fontStyle: 'italic',
            }}
          >
            "{verse.text}"
          </Text>

          {/* Practical Devotional Reflection Box */}
          <View
            style={{
              padding: 12,
              borderRadius: 14,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Sparkles size={11} color={colors.accent} style={{ marginRight: 5 }} />
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Inter_700Bold',
                  color: colors.accent,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                Daily Reflection
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
              {devotional.reflection}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'EBGaramond_400Regular_Italic',
                color: colors.textMuted,
                marginTop: 6,
                fontStyle: 'italic',
              }}
            >
              "{devotional.prayerPrompt}"
            </Text>
          </View>

          {/* Action Row */}
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
              <Pressable
                onPress={handleShareVerse}
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

              <Pressable
                onPress={handleRefreshVerse}
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
      ) : (
        /* PRAYER MODE */
        <View>
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-2">
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: colors.accentBg,
                borderWidth: 1,
                borderColor: colors.accent,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Inter_700Bold',
                  color: colors.accent,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {getPrayerBadge()}
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textMuted }}>
              Counts to Goal
            </Text>
          </View>

          {/* Prayer Title */}
          <Text
            style={{
              fontFamily: 'EBGaramond_700Bold',
              fontSize: 18,
              color: colors.textPrimary,
              lineHeight: 24,
              marginBottom: 8,
            }}
          >
            {prayer.title}
          </Text>

          {/* Prayer Excerpt Text */}
          <Text
            numberOfLines={4}
            style={{
              fontFamily: 'EBGaramond_400Regular',
              fontSize: 15,
              color: colors.textSecondary,
              lineHeight: 22,
              marginBottom: 16,
            }}
          >
            {prayer.prayerText}
          </Text>

          {/* Bottom Action Row */}
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
            {/* Pray & Meditate Primary Pill */}
            <Pressable
              onPress={() => setIsPrayerModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Pray and Meditate"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 12,
                backgroundColor: colors.accent,
              }}
            >
              <BookOpen size={14} color="#141413" style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Inter_700Bold',
                  color: '#141413',
                  letterSpacing: 0.2,
                }}
              >
                Pray & Meditate
              </Text>
            </Pressable>

            <View className="flex-row items-center">
              <Pressable
                onPress={handleSharePrayer}
                accessibilityLabel="Share Prayer"
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

              <Pressable
                onPress={handleRefreshPrayer}
                accessibilityLabel="Next Prayer"
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
      )}

      {/* Prayer Meditation Modal */}
      <PrayerMeditationModal
        visible={isPrayerModalOpen}
        prayer={prayer}
        onClose={() => setIsPrayerModalOpen(false)}
      />
    </View>
  );
}
