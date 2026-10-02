import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Share2, Sparkles, Clock, Check } from 'lucide-react-native';
import { PrayerItem } from '../lib/prayers';
import { useTheme } from '../lib/themeContext';
import { getReadingProgress, setReadingProgress } from '../lib/mmkv';
import { formatSeconds } from '../lib/readingTimer';

export interface PrayerMeditationModalProps {
  visible: boolean;
  prayer: PrayerItem | null;
  onClose: () => void;
}

export const PrayerMeditationModal: React.FC<PrayerMeditationModalProps> = ({
  visible,
  prayer,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [sessionSeconds, setSessionSeconds] = useState(0);
  const activeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible && prayer) {
      setSessionSeconds(0);
      activeIntervalRef.current = setInterval(() => {
        setSessionSeconds((prev) => {
          const next = prev + 1;
          // Synchronize directly with MMKV reading progress so prayer counts toward daily goal
          const currentTotal = getReadingProgress();
          setReadingProgress(currentTotal + 1);
          return next;
        });
      }, 1000);
    } else {
      if (activeIntervalRef.current) {
        clearInterval(activeIntervalRef.current);
        activeIntervalRef.current = null;
      }
    }

    return () => {
      if (activeIntervalRef.current) {
        clearInterval(activeIntervalRef.current);
        activeIntervalRef.current = null;
      }
    };
  }, [visible, prayer]);

  if (!prayer) return null;

  const handleShare = async () => {
    try {
      const message = `"${prayer.title}"\n\n${prayer.prayerText}\n\nPrayed with Bible Unlock:\nhttps://bibleunlock.in`;
      await Share.share({
        title: prayer.title,
        message,
      });
    } catch {
      // Ignored if dismissed
    }
  };

  const handleComplete = () => {
    const prayedMins = Math.max(1, Math.round(sessionSeconds / 60));
    Alert.alert(
      'Amen 🙏',
      sessionSeconds >= 30
        ? `Added ~${prayedMins} min of prayer reflection to your daily habit goal.`
        : 'May the peace of Christ remain with you throughout this day.'
    );
    onClose();
  };

  const getCategoryBadge = () => {
    if (prayer.timeOfDay === 'morning') return '🌅 MORNING PRAYER';
    if (prayer.timeOfDay === 'afternoon') return '☀️ AFTERNOON PRAYER';
    if (prayer.timeOfDay === 'evening') return '🌙 EVENING PRAYER';
    if (prayer.category === 'daily') return '🌿 DAILY RHYTHM';
    if (prayer.category === 'foundations') return '✝️ BIBLICAL FOUNDATIONS';
    return '🕊️ SACRED TRADITION';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['top', 'left', 'right', 'bottom']}
      >
        {/* Top Header Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          {/* Close button with 44x44pt touch target */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close Prayer"
            hitSlop={8}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color={colors.textPrimary} />
          </Pressable>

          {/* Active Goal Timer Pill */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: colors.accentBg,
              borderWidth: 1,
              borderColor: colors.accent,
            }}
          >
            <Clock size={12} color={colors.accent} style={{ marginRight: 6 }} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter_700Bold',
                color: colors.accent,
                letterSpacing: 0.5,
              }}
            >
              {formatSeconds(sessionSeconds)} • Goal Active
            </Text>
          </View>

          {/* Share button with 44x44pt touch target */}
          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share Prayer"
            hitSlop={8}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Share2 size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Scrollable Prayer Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 100 + insets.bottom,
          }}
        >
          {/* Category Pill */}
          <View style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Inter_700Bold',
                  color: colors.accent,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {getCategoryBadge()}
              </Text>
            </View>
          </View>

          {/* Prayer Title */}
          <Text
            style={{
              fontSize: 26,
              fontFamily: 'EBGaramond_700Bold',
              color: colors.textPrimary,
              lineHeight: 32,
              marginBottom: 16,
            }}
          >
            {prayer.title}
          </Text>

          {/* Subtle Dividing Line */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.borderSubtle,
              marginBottom: 24,
            }}
          />

          {/* Prayer Body Text */}
          <Text
            style={{
              fontSize: 19,
              fontFamily: 'EBGaramond_400Regular',
              color: colors.textPrimary,
              lineHeight: 30,
              letterSpacing: 0.2,
            }}
          >
            {prayer.prayerText}
          </Text>
        </ScrollView>

        {/* Fixed Footer Bar */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={handleComplete}
            accessibilityRole="button"
            accessibilityLabel="Complete Prayer"
            style={{
              flex: 1,
              height: 52,
              borderRadius: 16,
              backgroundColor: colors.accent,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Sparkles size={18} color="#141413" style={{ marginRight: 8 }} />
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Inter_700Bold',
                color: '#141413',
                letterSpacing: 0.3,
              }}
            >
              Amen • Complete Prayer
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
